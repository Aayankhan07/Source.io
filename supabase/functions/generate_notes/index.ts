// Streams structured study notes (Markdown) from Gemini 2.5 Pro for a given document.
// Frontend reads SSE deltas; this function also persists the final markdown to `notes`.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an elite study-notes generator for the "Source.io" learning platform.

Produce comprehensive, exam-ready notes in **GitHub-flavored Markdown** with this exact structure:

# {Concise Title}

> **TL;DR** — 2-3 sentence executive summary.

## Key Concepts
- Bulleted list of the 5-10 most important ideas (bold the term, then explain).

## Detailed Breakdown
Use ## subsections for each major theme. Inside each:
- Clear prose paragraphs (not just bullets)
- **Bold** key terms on first use
- Use \`inline code\` for technical tokens / formulas
- Use fenced code blocks with language hints when showing code
- Use $...$ for inline math and $$...$$ for block math (KaTeX)
- Add Markdown tables when comparing items

## Examples & Applications
Concrete examples that illustrate the concepts.

## Common Pitfalls
What learners frequently get wrong.

## Quick Review
A bulleted recap of the must-remember points.

Rules:
- Be faithful to the source — never invent facts not present in or directly implied by the source.
- If the source is short, scale the depth down proportionally but keep the structure.
- Output ONLY the Markdown — no preamble, no closing remarks, no code fences around the whole document.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
  if (!GROQ_API_KEY) {
    return new Response(JSON.stringify({ error: "GROQ_API_KEY not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
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
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const userId = claimsData.claims.sub as string;

  let body: { document_id?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const documentId = body.document_id;
  if (!documentId) {
    return new Response(JSON.stringify({ error: "document_id required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: doc } = await admin
    .from("documents")
    .select("id,user_id,title,raw_text,status")
    .eq("id", documentId)
    .maybeSingle();
  if (!doc || doc.user_id !== userId) {
    return new Response(JSON.stringify({ error: "Document not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (!doc.raw_text || doc.raw_text.trim().length < 20) {
    return new Response(JSON.stringify({ error: "Document not ready" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Groq llama-3.3-70b-versatile context: ~32k tokens; keep source under ~80k chars to be safe
  const MAX_CHARS = 80_000;
  const source = doc.raw_text.length > MAX_CHARS ? doc.raw_text.slice(0, MAX_CHARS) : doc.raw_text;

  const userPrompt =
    `Source title: ${doc.title}\n\n--- SOURCE START ---\n${source}\n--- SOURCE END ---\n\n` +
    `Generate the study notes now, following the required structure exactly.`;

  async function callGroq(): Promise<Response> {
    return await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        stream: true,
        temperature: 0.4,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
      }),
    });
  }

  // Retry on 429 with backoff (respect Retry-After if provided)
  let aiResp = await callGroq();
  let attempt = 0;
  while (aiResp.status === 429 && attempt < 3) {
    const retryAfter = Number(aiResp.headers.get("retry-after")) || 0;
    const waitMs = Math.min(
      15_000,
      retryAfter > 0 ? retryAfter * 1000 : 1500 * Math.pow(2, attempt),
    );
    console.warn(`Groq 429, retrying in ${waitMs}ms (attempt ${attempt + 1})`);
    try { aiResp.body?.cancel(); } catch { /* noop */ }
    await new Promise((r) => setTimeout(r, waitMs));
    aiResp = await callGroq();
    attempt++;
  }

  if (!aiResp.ok || !aiResp.body) {
    if (aiResp.status === 429) {
      try { aiResp.body?.cancel(); } catch { /* noop */ }
      return new Response(
        JSON.stringify({
          error: "Groq free-tier rate limit reached. Please wait ~30 seconds and try again.",
          retryable: true,
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const t = await aiResp.text();
    console.error("Groq error", aiResp.status, t);
    return new Response(JSON.stringify({ error: "Groq API error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let fullMarkdown = "";
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const stream = new ReadableStream({
    async start(controller) {
      const reader = aiResp.body!.getReader();
      let textBuffer = "";
      let closed = false;
      const safeClose = () => {
        if (closed) return;
        closed = true;
        try { controller.close(); } catch { /* noop */ }
      };
      const safeEnqueue = (chunk: Uint8Array) => {
        if (closed) return;
        try { controller.enqueue(chunk); } catch { closed = true; }
      };
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          safeEnqueue(value);
          if (closed) break;
          textBuffer += decoder.decode(value, { stream: true });
          let idx: number;
          while ((idx = textBuffer.indexOf("\n")) !== -1) {
            let line = textBuffer.slice(0, idx);
            textBuffer = textBuffer.slice(idx + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (!line.startsWith("data: ")) continue;
            const json = line.slice(6).trim();
            if (json === "[DONE]") continue;
            try {
              const parsed = JSON.parse(json);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) fullMarkdown += delta;
            } catch {
              textBuffer = line + "\n" + textBuffer;
              break;
            }
          }
        }
      } catch (e) {
        console.error("stream error", e);
      } finally {
        safeClose();
        try {
          if (fullMarkdown.trim().length > 0) {
            const { data: existing } = await admin
              .from("notes")
              .select("id")
              .eq("document_id", documentId)
              .maybeSingle();
            if (existing) {
              await admin
                .from("notes")
                .update({ markdown: fullMarkdown })
                .eq("id", existing.id);
            } else {
              await admin
                .from("notes")
                .insert({ document_id: documentId, user_id: userId, markdown: fullMarkdown });
            }
          }
        } catch (e) {
          console.error("note persist error", e);
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  });
});
