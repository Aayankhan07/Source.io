// Generates flashcards + quiz from a document's notes (or raw_text fallback).
// Uses Groq API with structured JSON output.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an elite study-assets generator for the "Source.io" learning platform.
Given source study material, you produce:
1. **Flashcards** — atomic Q/A pairs covering the most important facts, definitions, and relationships. 8-20 cards depending on source depth. Front = a clear short question or term. Back = the precise answer (1-3 sentences).
2. **Quiz** — a mix of multiple-choice (mcq, exactly 4 plausible choices), true/false, and short-answer questions. 6-12 questions total. Include a brief explanation for each.

Rules:
- Be faithful to the source — never invent facts.
- For MCQ: \`correct\` must EXACTLY match one of the \`choices\` strings.
- For true/false: \`choices\` is null and \`correct\` is "True" or "False".
- For short_answer: \`choices\` is null and \`correct\` is the canonical short answer.
- Vary difficulty; cover different parts of the source.
- Output ONLY a valid JSON object matching this exact shape — no prose, no markdown fences, no XML tags:
{
  "quiz_title": "string",
  "flashcards": [{ "front": "string", "back": "string" }, ...],
  "questions": [
    {
      "question": "string",
      "type": "mcq" | "true_false" | "short_answer",
      "choices": ["string", ...] | null,
      "correct": "string",
      "explanation": "string"
    }, ...
  ]
}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
  if (!GROQ_API_KEY) {
    return new Response(JSON.stringify({ error: "GROQ_API_KEY not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userClient = createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: authHeader } },
  });
  const admin = createClient(SUPABASE_URL, SERVICE);

  const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(
    authHeader.replace("Bearer ", ""),
  );
  if (claimsErr || !claimsData?.claims) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const userId = claimsData.claims.sub as string;

  let body: { document_id?: string };
  try { body = await req.json(); } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const documentId = body.document_id;
  if (!documentId) {
    return new Response(JSON.stringify({ error: "document_id required" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: doc } = await admin
    .from("documents")
    .select("id,user_id,title,raw_text,status")
    .eq("id", documentId)
    .maybeSingle();
  if (!doc || doc.user_id !== userId) {
    return new Response(JSON.stringify({ error: "Document not found" }), {
      status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Prefer notes content, fall back to raw_text
  const { data: noteRow } = await admin
    .from("notes").select("markdown").eq("document_id", documentId).maybeSingle();
  const source = (noteRow?.markdown && noteRow.markdown.length > 200)
    ? noteRow.markdown
    : (doc.raw_text ?? "");
  if (!source || source.trim().length < 50) {
    return new Response(JSON.stringify({ error: "No source content yet" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  // Keep source under 35k chars to fit within Groq's 12k TPM limit
  const MAX = 35_000;
  const trimmed = source.length > MAX ? source.slice(0, MAX) : source;

  const callGroq = () => fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Source title: ${doc.title}\n\n--- SOURCE ---\n${trimmed}\n--- END ---\n\nReturn ONLY the JSON object described in the system prompt.` },
      ],
    }),
  });

  let aiResp = await callGroq();
  let attempt = 0;
  while (aiResp.status === 429 && attempt < 3) {
    const retryAfter = Number(aiResp.headers.get("retry-after")) || 0;
    const waitMs = Math.min(15_000, retryAfter > 0 ? retryAfter * 1000 : 1500 * Math.pow(2, attempt));
    await new Promise((r) => setTimeout(r, waitMs));
    aiResp = await callGroq();
    attempt++;
  }

  if (!aiResp.ok) {
    const status = aiResp.status;
    const t = await aiResp.text().catch(() => "");
    console.error("Groq error", status, t);

    let isRateLimit = status === 429 || status === 413;
    let isTokenLimit = status === 413;

    if (t) {
      try {
        const parsed = JSON.parse(t);
        const code = parsed?.error?.code;
        const msg = parsed?.error?.message ?? "";
        if (code === "rate_limit_exceeded" || msg.includes("rate_limit_exceeded") || msg.includes("TPM") || msg.includes("Limit 12000")) {
          isRateLimit = true;
          if (msg.includes("too large") || msg.includes("TPM") || status === 413) {
            isTokenLimit = true;
          }
        }
      } catch {
        if (t.includes("rate_limit_exceeded") || t.includes("TPM")) {
          isRateLimit = true;
        }
      }
    }

    if (isRateLimit) {
      const errorMsg = isTokenLimit
        ? "Document too large for Groq free-tier rate limits (12,000 TPM limit). Please try a shorter document or upgrade your Groq plan."
        : "Rate limit reached on Groq's free tier — please wait a moment and try again.";
      return new Response(JSON.stringify({ error: errorMsg }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Groq API error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const aiJson = await aiResp.json();
  const content: string | undefined = aiJson.choices?.[0]?.message?.content;
  if (!content) {
    console.error("No content in response", JSON.stringify(aiJson).slice(0, 500));
    return new Response(JSON.stringify({ error: "AI did not return output" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let parsed: {
    flashcards: { front: string; back: string }[];
    quiz_title: string;
    questions: {
      question: string;
      type: "mcq" | "true_false" | "short_answer";
      choices: string[] | null;
      correct: string;
      explanation: string;
    }[];
  };
  try {
    // Strip code fences or surrounding text if model added any
    const jsonText = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    const start = jsonText.indexOf("{");
    const end = jsonText.lastIndexOf("}");
    parsed = JSON.parse(start >= 0 && end > start ? jsonText.slice(start, end + 1) : jsonText);
  } catch (e) {
    console.error("JSON parse error", e, content.slice(0, 500));
    return new Response(JSON.stringify({ error: "Invalid AI output" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Validate + sanitize
  const flashcards = (parsed.flashcards ?? [])
    .filter((c) => c.front && c.back)
    .slice(0, 30)
    .map((c, i) => ({
      user_id: userId,
      document_id: documentId,
      front: String(c.front).trim(),
      back: String(c.back).trim(),
      order_index: i,
    }));

  const questions = (parsed.questions ?? [])
    .filter((q) => q.question && q.correct && q.type)
    .slice(0, 20)
    .map((q, i) => {
      let choices = q.choices;
      if (q.type !== "mcq") choices = null;
      if (q.type === "mcq") {
        if (!Array.isArray(choices) || choices.length < 2) return null;
        // Ensure correct is in choices
        if (!choices.includes(q.correct)) choices = [...choices.slice(0, 3), q.correct];
      }
      return {
        type: q.type,
        question: String(q.question).trim(),
        choices: choices as any,
        correct: String(q.correct).trim(),
        explanation: q.explanation ? String(q.explanation).trim() : null,
        order_index: i,
      };
    })
    .filter(Boolean) as Array<{
      type: "mcq" | "true_false" | "short_answer";
      question: string;
      choices: string[] | null;
      correct: string;
      explanation: string | null;
      order_index: number;
    }>;

  if (flashcards.length === 0 && questions.length === 0) {
    return new Response(JSON.stringify({ error: "AI returned empty output" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Replace existing assets for this document
  await admin.from("flashcards").delete().eq("document_id", documentId);
  // Quiz cascade: delete questions tied to existing quizzes for this doc, then quizzes
  const { data: oldQuizzes } = await admin
    .from("quizzes").select("id").eq("document_id", documentId);
  if (oldQuizzes && oldQuizzes.length) {
    const ids = oldQuizzes.map((q: any) => q.id);
    await admin.from("quiz_questions").delete().in("quiz_id", ids);
    await admin.from("quizzes").delete().in("id", ids);
  }

  if (flashcards.length) {
    const { error: fcErr } = await admin.from("flashcards").insert(flashcards);
    if (fcErr) console.error("flashcards insert", fcErr);
  }

  let quizId: string | null = null;
  if (questions.length) {
    const { data: quizRow, error: qErr } = await admin
      .from("quizzes")
      .insert({
        user_id: userId,
        document_id: documentId,
        title: parsed.quiz_title?.slice(0, 200) || "Quiz",
      })
      .select("id")
      .single();
    if (qErr || !quizRow) {
      console.error("quiz insert", qErr);
    } else {
      quizId = quizRow.id;
      const rows = questions.map((q) => ({
        user_id: userId,
        quiz_id: quizRow.id,
        question: q.question,
        type: q.type,
        choices: q.choices,
        correct: q.correct,
        explanation: q.explanation,
        order_index: q.order_index,
      }));
      const { error: qqErr } = await admin.from("quiz_questions").insert(rows);
      if (qqErr) console.error("quiz_questions insert", qqErr);
    }
  }

  return new Response(JSON.stringify({
    ok: true,
    flashcards_count: flashcards.length,
    questions_count: questions.length,
    quiz_id: quizId,
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
