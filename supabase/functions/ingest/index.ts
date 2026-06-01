// Ingest edge function: extracts raw_text from a document and marks it ready.
// Supports: text/pdf/docx (raw_text already provided by client), youtube (timed-text),
// audio/video (Groq Whisper v3 transcription). PDF/DOCX parsing happens in the browser.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_BYTES = 25 * 1024 * 1024; // Groq Whisper free tier limit: 25MB

async function sha256Hex(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function parseYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1);
    if (u.searchParams.get("v")) return u.searchParams.get("v");
    const m = u.pathname.match(/\/(shorts|embed)\/([^/?]+)/);
    if (m) return m[2];
    return null;
  } catch {
    return null;
  }
}

async function fetchYouTubeTranscript(videoId: string): Promise<string> {
  const langs = ["en", "en-US", "en-GB"];
  for (const lang of langs) {
    const r = await fetch(`https://video.google.com/timedtext?lang=${lang}&v=${videoId}`);
    const xml = await r.text();
    if (xml && xml.includes("<text")) return parseTimedText(xml);
  }
  const list = await fetch(`https://video.google.com/timedtext?type=list&v=${videoId}`).then((r) => r.text());
  const langMatch = list.match(/lang_code="([^"]+)"/);
  if (langMatch) {
    const xml = await fetch(`https://video.google.com/timedtext?lang=${langMatch[1]}&v=${videoId}`).then((r) => r.text());
    if (xml && xml.includes("<text")) return parseTimedText(xml);
  }
  throw new Error("NO_TRANSCRIPT_AVAILABLE");
}

function parseTimedText(xml: string): string {
  return xml
    .replace(/<text[^>]*>/g, "")
    .replace(/<\/text>/g, "\n")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/<[^>]+>/g, "")
    .trim();
}

async function transcribeWithGroq(file: Blob, filename: string, apiKey: string): Promise<string> {
  const fd = new FormData();
  fd.append("file", file, filename);
  fd.append("model", "whisper-large-v3");
  fd.append("response_format", "json");
  fd.append("temperature", "0");

  const resp = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: fd,
  });
  if (!resp.ok) {
    const t = await resp.text().catch(() => "");
    if (resp.status === 429) throw new Error("RATE_LIMITED: Groq rate limit reached. Try again in a minute.");
    throw new Error(`GROQ_WHISPER_${resp.status}:${t.slice(0, 160)}`);
  }
  const j = await resp.json().catch(() => ({}));
  return String(j?.text ?? "").trim();
}

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

  const { data: doc, error: docErr } = await admin
    .from("documents")
    .select("id,user_id,source_type,source_url,raw_text,status,title")
    .eq("id", documentId)
    .maybeSingle();

  if (docErr || !doc || doc.user_id !== userId) {
    return new Response(JSON.stringify({ error: "Document not found" }), {
      status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: job } = await admin
    .from("jobs")
    .insert({ user_id: userId, document_id: documentId, kind: "ingest", status: "running", progress: 5 })
    .select("id")
    .single();
  const jobId = job?.id;

  const setStatus = async (
    status: "pending" | "processing" | "ready" | "failed",
    extra: Record<string, unknown> = {},
  ) => {
    await admin.from("documents").update({ status, ...extra }).eq("id", documentId);
  };
  const updateJob = async (patch: Record<string, unknown>) => {
    if (jobId) await admin.from("jobs").update(patch).eq("id", jobId);
  };

  await setStatus("processing");
  await updateJob({ progress: 15 });

  try {
    let rawText = (doc.raw_text ?? "").trim();

    if (!rawText) {
      if (doc.source_type === "youtube") {
        const id = parseYouTubeId(doc.source_url ?? "");
        if (!id) throw new Error("INVALID_YOUTUBE_URL");
        await updateJob({ progress: 30 });
        rawText = await fetchYouTubeTranscript(id);
      } else if (doc.source_type === "audio" || doc.source_type === "video") {
        if (!doc.source_url) throw new Error("MISSING_FILE_PATH");
        if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY_NOT_CONFIGURED");

        const { data: file, error: dlErr } = await admin.storage
          .from("uploads")
          .download(doc.source_url);
        if (dlErr || !file) throw new Error("FILE_DOWNLOAD_FAILED");
        const ab = await file.arrayBuffer();
        if (ab.byteLength > MAX_BYTES) {
          throw new Error("FILE_TOO_LARGE: Groq Whisper free tier supports files up to 25MB.");
        }
        await updateJob({ progress: 35 });

        const filename = doc.source_url.split("/").pop() ?? "audio";
        const blob = new Blob([ab], { type: file.type || "application/octet-stream" });
        rawText = await transcribeWithGroq(blob, filename, GROQ_API_KEY);
        if (!rawText) throw new Error("GROQ_WHISPER_EMPTY_TRANSCRIPT");
        await updateJob({ progress: 65 });
      } else {
        throw new Error("MISSING_RAW_TEXT");
      }
    }

    rawText = rawText.replace(/\u0000/g, "").trim();
    if (!rawText || rawText.length < 20) throw new Error("EMPTY_OR_TOO_SHORT");

    await updateJob({ progress: 70 });

    const hash = await sha256Hex(rawText);
    const { data: existing } = await admin
      .from("documents")
      .select("id")
      .eq("user_id", userId)
      .eq("content_hash", hash)
      .neq("id", documentId)
      .maybeSingle();

    if (existing) {
      await setStatus("failed", { error_code: "DUPLICATE_OF:" + existing.id });
      await updateJob({ status: "failed", progress: 100, error: "duplicate" });
      return new Response(
        JSON.stringify({ ok: false, duplicate_of: existing.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    await admin
      .from("documents")
      .update({ raw_text: rawText, content_hash: hash, status: "ready", error_code: null })
      .eq("id", documentId);
    await updateJob({ status: "succeeded", progress: 100 });

    return new Response(JSON.stringify({ ok: true, length: rawText.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("ingest error", msg);
    await setStatus("failed", { error_code: msg.slice(0, 80) });
    await updateJob({ status: "failed", progress: 100, error: msg.slice(0, 200) });
    const status = msg.startsWith("RATE_LIMITED") ? 429 : 500;
    return new Response(JSON.stringify({ error: msg }), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
