import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { synthesize } from "./tts.ts";
import { parseScript } from "./script.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const HOST_1_VOICE = "en-US-ChristopherNeural";
const HOST_2_VOICE = "en-US-AriaNeural";
// Keep source under 30k chars to fit within Groq's 12k TPM limit
const MAX_SOURCE_CHARS = 30_000;
const SYSTEM_PROMPT = `You write concise, engaging study podcasts for a two-host learning app.

Return ONLY a script with alternating dialogue lines in this exact format:
Host 1: ...
Host 2: ...

Rules:
- Exactly 8-16 back-and-forth turns total.
- Keep each line natural and speakable.
- Be faithful to the source; never invent facts.
- Focus on teaching the core ideas clearly.
- No stage directions, titles, bullets, markdown, or narration labels other than Host 1 / Host 2.`;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function synthesizeSegment(text: string, voice: string): Promise<Uint8Array> {
  return await synthesize(text, voice);
}

function concatAudioChunks(chunks: Uint8Array[]): Uint8Array {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
  const merged = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return merged;
}

export async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ error: "Unauthorized" }, 401);
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
  if (!GROQ_API_KEY) return json({ error: "GROQ_API_KEY not configured" }, 500);

  const userClient = createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: authHeader } },
  });
  const admin = createClient(SUPABASE_URL, SERVICE);

  const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(
    authHeader.replace("Bearer ", ""),
  );
  if (claimsErr || !claimsData?.claims) return json({ error: "Unauthorized" }, 401);
  const userId = claimsData.claims.sub as string;

  let body: { document_id?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const documentId = body.document_id?.trim();
  if (!documentId) return json({ error: "document_id required" }, 400);

  const { data: doc } = await admin
    .from("documents")
    .select("id,user_id,title,raw_text")
    .eq("id", documentId)
    .maybeSingle();
  if (!doc || doc.user_id !== userId) return json({ error: "Document not found" }, 404);

  const { data: noteRow } = await admin
    .from("notes")
    .select("markdown")
    .eq("document_id", documentId)
    .maybeSingle();

  const source = (noteRow?.markdown && noteRow.markdown.trim().length > 80)
    ? noteRow.markdown.trim()
    : (doc.raw_text ?? "").trim();

  if (source.length < 80) return json({ error: "No source content yet" }, 400);

  const { data: existingPodcast } = await admin
    .from("podcasts")
    .select("id")
    .eq("document_id", documentId)
    .maybeSingle();

  let podcastId = existingPodcast?.id as string | undefined;
  if (podcastId) {
    await admin.from("podcasts").update({ status: "generating", audio_url: null }).eq("id", podcastId);
  } else {
    const { data: insertedPodcast, error: insertErr } = await admin
      .from("podcasts")
      .insert({ document_id: documentId, user_id: userId, status: "generating", audio_url: null, script: null })
      .select("id")
      .single();
    if (insertErr || !insertedPodcast) {
      console.error("podcast insert error", insertErr);
      return json({ error: "Failed to start podcast generation" }, 500);
    }
    podcastId = insertedPodcast.id;
  }

  try {
    const aiResp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0.6,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Document title: ${doc.title}\n\nSource:\n${source.slice(0, MAX_SOURCE_CHARS)}\n\nGenerate the podcast script now.`,
          },
        ],
      }),
    });

    if (!aiResp.ok) {
      const status = aiResp.status;
      const message = await aiResp.text().catch(() => "");
      console.error("Groq error", status, message);

      let isRateLimit = status === 429 || status === 413;
      let isTokenLimit = status === 413;

      if (message) {
        try {
          const parsed = JSON.parse(message);
          const code = parsed?.error?.code;
          const msg = parsed?.error?.message ?? "";
          if (code === "rate_limit_exceeded" || msg.includes("rate_limit_exceeded") || msg.includes("TPM") || msg.includes("Limit 12000")) {
            isRateLimit = true;
            if (msg.includes("too large") || msg.includes("TPM") || status === 413) {
              isTokenLimit = true;
            }
          }
        } catch {
          if (message.includes("rate_limit_exceeded") || message.includes("TPM")) {
            isRateLimit = true;
          }
        }
      }

      if (isRateLimit) {
        const errorMsg = isTokenLimit
          ? "Document too large for Groq free-tier rate limits (12,000 TPM limit). Please try a shorter document or upgrade your Groq plan."
          : "Rate limit reached on Groq's free tier — please wait a moment and try again.";
        return json({ error: errorMsg }, 429);
      }

      throw new Error(`AI_SCRIPT_FAILED:${message.slice(0, 200)}`);
    }

    const aiJson = await aiResp.json();
    const script = String(aiJson.choices?.[0]?.message?.content ?? "").trim();
    if (!script) throw new Error("EMPTY_SCRIPT");

    const segments = parseScript(script);
    const audioChunks: Uint8Array[] = [];
    for (const segment of segments) {
      const voice = segment.speaker === "host_1" ? HOST_1_VOICE : HOST_2_VOICE;
      audioChunks.push(await synthesizeSegment(segment.text, voice));
    }

    const mergedAudio = concatAudioChunks(audioChunks);
    const audioBuffer = new ArrayBuffer(mergedAudio.byteLength);
    new Uint8Array(audioBuffer).set(mergedAudio);
    const audioBlob = new Blob([audioBuffer], { type: "audio/mpeg" });
    const storagePath = `${userId}/${documentId}/${Date.now()}.mp3`;
    const { error: uploadErr } = await admin.storage
      .from("podcasts")
      .upload(storagePath, audioBlob, { contentType: "audio/mpeg", upsert: true });
    if (uploadErr) throw new Error(`UPLOAD_FAILED:${uploadErr.message}`);

    // Bucket is private — issue a long-lived signed URL (1 year)
    const { data: signedData, error: signedErr } = await admin.storage
      .from("podcasts")
      .createSignedUrl(storagePath, 60 * 60 * 24 * 365);
    if (signedErr || !signedData) throw new Error(`SIGN_URL_FAILED:${signedErr?.message ?? "unknown"}`);
    const audioUrl = signedData.signedUrl;

    await admin
      .from("podcasts")
      .update({ script, audio_url: audioUrl, status: "ready" })
      .eq("id", podcastId);

    return json({ ok: true, status: "ready", audio_url: audioUrl });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("generate_podcast error", message);
    await admin.from("podcasts").update({ status: "failed" }).eq("id", podcastId);
    return json({ error: message }, 500);
  }
}

if (import.meta.main) {
  Deno.serve(handler);
}