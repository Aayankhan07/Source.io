// Ingest edge function: extracts raw_text from a document, enforces plan limits and marks it ready.
// Supports: text/pdf/docx (raw_text already provided by client), youtube (best-effort captions,
// Beta), audio/video (Groq Whisper v3 transcription, 1 daily action). PDF/DOCX parsing happens in
// the browser.
import { checkCircuitBreaker } from "../_shared/circuitBreakers.ts";
import { acquireJobLock, completeJob, startJobHeartbeat } from "../_shared/jobLock.ts";
import { fetchWithTimeout, isUpstreamTimeout, UPSTREAM_TIMEOUTS } from "../_shared/http.ts";
import { logAiUsage } from "../_shared/telemetry.ts";
import { createLogger } from "../_shared/log.ts";
import { authenticateRequest } from "../_shared/auth.ts";
import { corsHeadersFor } from "../_shared/cors.ts";
import { loadUserKey, resolveGroqKey } from "../_shared/byok.ts";
import { consumeDailyQuota, refundDailyQuota } from "../_shared/quotas.ts";
import {
  documentAllowance,
  documentTooLongMessage,
  normalizeTier,
  TIER_LIMITS,
  uploadTooLargeMessage,
} from "../_shared/planLimits.ts";

const WHISPER_MAX_BYTES = 25 * 1024 * 1024; // Groq Whisper limit: 25MB
const WHISPER_MODEL = "whisper-large-v3";
/** Total time allowed for all YouTube caption attempts. */
const YOUTUBE_BUDGET_MS = 20_000;

const YOUTUBE_UNAVAILABLE_MESSAGE =
  "We couldn't fetch captions for this video. Open it on YouTube, click …more → Show transcript, copy the text and paste it here.";

/** A failure with a stable machine code and a message safe to show the student. */
class IngestError extends Error {
  constructor(readonly code: string, message: string, readonly status: number) {
    super(message);
    this.name = "IngestError";
  }
}

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

/**
 * Best-effort captions via the legacy timedtext endpoint (deprecated by YouTube; often empty or
 * blocked). Any failure, timeout or empty result => YOUTUBE_TRANSCRIPT_UNAVAILABLE, and the
 * student is asked to paste the transcript. Never scrapes watch pages.
 */
async function fetchYouTubeTranscript(videoId: string): Promise<string> {
  const deadline = Date.now() + YOUTUBE_BUDGET_MS;
  const fetchTimedText = async (query: string): Promise<string> => {
    const remaining = deadline - Date.now();
    if (remaining <= 0) throw new Error("youtube budget exhausted");
    const r = await fetchWithTimeout(
      `https://video.google.com/timedtext?${query}`,
      {},
      Math.min(UPSTREAM_TIMEOUTS.youtube, remaining),
    );
    if (!r.ok) return "";
    return await r.text();
  };

  try {
    for (const lang of ["en", "en-US", "en-GB"]) {
      const xml = await fetchTimedText(`lang=${lang}&v=${encodeURIComponent(videoId)}`);
      if (xml && xml.includes("<text")) {
        const text = parseTimedText(xml);
        if (text) return text;
      }
    }
    const list = await fetchTimedText(`type=list&v=${encodeURIComponent(videoId)}`);
    const langMatch = list.match(/lang_code="([^"]+)"/);
    if (langMatch) {
      const xml = await fetchTimedText(`lang=${encodeURIComponent(langMatch[1])}&v=${encodeURIComponent(videoId)}`);
      if (xml && xml.includes("<text")) {
        const text = parseTimedText(xml);
        if (text) return text;
      }
    }
  } catch (err) {
    console.warn("youtube timedtext failed:", err instanceof Error ? err.message : String(err));
  }
  throw new IngestError("YOUTUBE_TRANSCRIPT_UNAVAILABLE", YOUTUBE_UNAVAILABLE_MESSAGE, 422);
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
  fd.append("model", WHISPER_MODEL);
  fd.append("response_format", "json");
  fd.append("temperature", "0");

  const resp = await fetchWithTimeout("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: fd,
  }, UPSTREAM_TIMEOUTS.whisper);
  if (!resp.ok) {
    const t = await resp.text().catch(() => "");
    if (resp.status === 429) throw new Error("RATE_LIMITED: Groq rate limit reached. Try again in a minute.");
    throw new Error(`GROQ_WHISPER_${resp.status}:${t.slice(0, 160)}`);
  }
  const j = await resp.json().catch(() => ({}));
  return String(j?.text ?? "").trim();
}

/** Size of a storage object from its listing metadata, or null when unknown. */
// deno-lint-ignore no-explicit-any
async function storageObjectSize(admin: any, bucket: string, path: string): Promise<number | null> {
  const slash = path.lastIndexOf("/");
  const folder = slash >= 0 ? path.slice(0, slash) : "";
  const name = slash >= 0 ? path.slice(slash + 1) : path;
  try {
    const { data, error } = await admin.storage.from(bucket).list(folder, { search: name, limit: 100 });
    if (error || !Array.isArray(data)) return null;
    const hit = data.find((o: { name: string }) => o.name === name);
    const size = Number(hit?.metadata?.size);
    return Number.isFinite(size) && size >= 0 ? size : null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  const corsHeaders = corsHeadersFor(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const log = createLogger("ingest");
  const auth = await authenticateRequest(req, corsHeaders);
  if (auth.errorResponse) return auth.errorResponse;
  const { admin, userId } = auth;
  log.userId = userId;

  // Emergency circuit breaker check
  const breaker = await checkCircuitBreaker(admin, "uploads_enabled");
  if (!breaker.allowed) return json({ error: breaker.message, code: "UPLOADS_DISABLED" }, 503);

  let body: { document_id?: string; api_key?: string };
  try { body = await req.json(); } catch {
    return json({ error: "Invalid JSON", code: "INVALID_JSON" }, 400);
  }
  const documentId = body.document_id;
  if (!documentId) return json({ error: "document_id required", code: "BAD_REQUEST" }, 400);

  const { data: doc, error: docErr } = await admin
    .from("documents")
    .select("id,user_id,source_type,source_url,raw_text,status,title")
    .eq("id", documentId)
    .maybeSingle();

  if (docErr || !doc || doc.user_id !== userId) {
    return json({ error: "Document not found", code: "NOT_FOUND" }, 404);
  }

  // Plan limits come from the server-owned profile (fail closed if it cannot be read).
  const { data: profile, error: profileErr } = await admin
    .from("profiles")
    .select("tier,active_docs_limit")
    .eq("user_id", userId)
    .maybeSingle();
  if (profileErr) {
    log.error("profile lookup failed", { err: profileErr });
    return json({
      error: "Usage limits are temporarily unavailable. Please retry in a minute.",
      code: "QUOTA_UNAVAILABLE",
      retryable: true,
    }, 503);
  }
  const tier = normalizeTier(profile?.tier);
  const docsLimit = Number.isInteger(profile?.active_docs_limit) && profile!.active_docs_limit > 0
    ? profile!.active_docs_limit as number
    : TIER_LIMITS.free.activeDocsLimit;

  // BYOK: the long-document allowance (and skipping the Whisper charge) applies only when the
  // user's own Groq key is used: a stored key, or a legacy body `gsk_` key.
  const platformKey = Deno.env.get("GROQ_API_KEY");
  let groq = resolveGroqKey(body.api_key, platformKey);
  try {
    const stored = await loadUserKey(admin, userId, "groq");
    if (stored && stored.trim().startsWith("gsk_")) groq = { apiKey: stored.trim(), isByok: true };
  } catch (e) {
    // Unreadable stored key: stay on the platform key, which keeps the stricter limits and quota.
    log.warn("stored groq key unavailable; using platform limits", { err: e });
  }
  const allowance = documentAllowance(tier, groq.isByok);

  // Same active-document limit as the DB trigger (check_user_active_document_limit).
  const { count: activeCount, error: countErr } = await admin
    .from("documents")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("status", ["ready", "processing", "pending"])
    .neq("id", documentId);
  if (countErr) {
    return json({
      error: "Usage limits are temporarily unavailable. Please retry in a minute.",
      code: "QUOTA_UNAVAILABLE",
      retryable: true,
    }, 503);
  }

  if ((activeCount ?? 0) >= docsLimit) {
    await admin.from("documents").update({ status: "failed", error_code: "DOCUMENT_LIMIT_REACHED" }).eq("id", documentId);
    return json({
      error: `You have reached your plan's limit of ${docsLimit} saved documents. Delete a document to add another one.`,
      code: "DOCUMENT_LIMIT_REACHED",
    }, 403);
  }

  // One ingest per document at a time (partial unique index on active jobs). Fails closed.
  const lock = await acquireJobLock(admin, { userId, documentId, kind: "ingest" });
  if (!lock.acquired) {
    return json({
      error: lock.message,
      code: lock.unavailable ? "JOB_LOCK_UNAVAILABLE" : "ACTIVE_JOB_RUNNING",
      retryable: true,
    }, lock.unavailable ? 503 : 409);
  }
  const jobId = lock.jobId;
  // Whisper can take up to two minutes; keep the lock fresh while we work.
  const stopHeartbeat = startJobHeartbeat(admin, jobId);

  const setStatus = async (
    status: "pending" | "processing" | "ready" | "failed",
    extra: Record<string, unknown> = {},
  ) => {
    await admin.from("documents").update({ status, ...extra }).eq("id", documentId);
  };
  const updateJob = async (patch: Record<string, unknown>) => {
    if (jobId) await admin.from("jobs").update(patch).eq("id", jobId);
  };

  // Whisper costs 1 daily action on the platform key; refunded if transcription fails.
  let quotaCharged = false;
  const refundOnce = async (reason: string) => {
    if (!quotaCharged) return;
    quotaCharged = false;
    const refunded = await refundDailyQuota(admin, userId, 1);
    log.info("quota refund", { reason, refunded });
  };

  await setStatus("processing");
  await updateJob({ progress: 15 });

  try {
    let rawText = (doc.raw_text ?? "").trim();

    if (!rawText) {
      if (doc.source_type === "youtube") {
        const id = parseYouTubeId(doc.source_url ?? "");
        if (!id) throw new IngestError("INVALID_YOUTUBE_URL", "This doesn't look like a YouTube video link.", 400);
        await updateJob({ progress: 30 });
        rawText = await fetchYouTubeTranscript(id);
      } else if (doc.source_type === "audio" || doc.source_type === "video") {
        if (!doc.source_url) throw new Error("MISSING_FILE_PATH");
        if (!groq.apiKey) throw new Error("GROQ_API_KEY_NOT_CONFIGURED");

        // Plan upload size, checked from storage metadata before downloading when possible.
        const knownSize = await storageObjectSize(admin, "uploads", doc.source_url);
        if (knownSize !== null && knownSize > allowance.uploadBytes) {
          throw new IngestError("UPLOAD_TOO_LARGE", uploadTooLargeMessage(knownSize, allowance.uploadBytes), 413);
        }

        const { data: file, error: dlErr } = await admin.storage
          .from("uploads")
          .download(doc.source_url);
        if (dlErr || !file) throw new Error("FILE_DOWNLOAD_FAILED");
        const ab = await file.arrayBuffer();
        if (ab.byteLength > allowance.uploadBytes) {
          throw new IngestError("UPLOAD_TOO_LARGE", uploadTooLargeMessage(ab.byteLength, allowance.uploadBytes), 413);
        }
        if (ab.byteLength > WHISPER_MAX_BYTES) {
          throw new IngestError(
            "FILE_TOO_LARGE",
            "Audio and video files can be transcribed up to 25 MB. Please trim or compress the file and try again.",
            413,
          );
        }

        if (!groq.isByok) {
          const quota = await consumeDailyQuota(admin, userId, 1);
          if (!quota.allowed) {
            throw quota.unavailable
              ? new IngestError("QUOTA_UNAVAILABLE", "Usage limits are temporarily unavailable. Please retry in a minute.", 503)
              : new IngestError(
                "QUOTA_EXCEEDED",
                "You've used today's AI actions. They reset at 00:00 UTC — or upgrade, or add your own API key in Settings.",
                429,
              );
          }
          quotaCharged = true;
        }
        await updateJob({ progress: 35 });

        const filename = doc.source_url.split("/").pop() ?? "audio";
        const blob = new Blob([ab], { type: file.type || "application/octet-stream" });
        const whisperStart = Date.now();
        try {
          rawText = await transcribeWithGroq(blob, filename, groq.apiKey);
        } catch (whisperErr) {
          const whisperMsg = whisperErr instanceof Error ? whisperErr.message : String(whisperErr);
          await refundOnce(isUpstreamTimeout(whisperErr) ? "whisper_timeout" : "whisper_failed");
          await logAiUsage(admin, {
            userId,
            documentId,
            requestId: log.requestId,
            feature: "transcribe",
            provider: "groq",
            model: WHISPER_MODEL,
            status: whisperMsg.startsWith("RATE_LIMITED") ? "rate_limited" : "failed",
            durationMs: Date.now() - whisperStart,
            errorMessage: whisperMsg,
          });
          throw whisperErr;
        }
        await logAiUsage(admin, {
          userId,
          documentId,
          requestId: log.requestId,
          feature: "transcribe",
          provider: "groq",
          model: WHISPER_MODEL,
          // Whisper bills per audio second (unknown here): input_tokens holds the audio size in
          // bytes, output_tokens the estimated transcript tokens.
          inputTokens: ab.byteLength,
          outputTokens: Math.round(rawText.length / 4),
          status: rawText ? "succeeded" : "failed",
          durationMs: Date.now() - whisperStart,
          errorMessage: rawText ? null : "GROQ_WHISPER_EMPTY_TRANSCRIPT",
        });
        if (!rawText) {
          await refundOnce("whisper_empty");
          throw new Error("GROQ_WHISPER_EMPTY_TRANSCRIPT");
        }
        quotaCharged = false; // the transcription happened; the action is spent
        await updateJob({ progress: 65 });
      } else {
        throw new Error("MISSING_RAW_TEXT");
      }
    }

    rawText = rawText.replace(/\u0000/g, "").trim();
    if (!rawText || rawText.length < 20) throw new Error("EMPTY_OR_TOO_SHORT");

    // Pages per document, measured in extracted characters (CHARS_PER_PAGE).
    if (rawText.length > allowance.maxChars) {
      throw new IngestError("DOCUMENT_TOO_LONG", documentTooLongMessage(rawText.length, allowance.maxPages), 413);
    }

    await updateJob({ progress: 70 });

    const hash = await sha256Hex(rawText);
    const { data: existing } = await admin
      .from("documents")
      .select("id")
      .eq("user_id", userId)
      .eq("content_hash", hash)
      .neq("id", documentId)
      .limit(1)
      .maybeSingle();

    if (existing) {
      await setStatus("failed", { error_code: "DUPLICATE_OF:" + existing.id });
      await completeJob(admin, jobId, false, "duplicate");
      return json({ ok: false, duplicate_of: existing.id, code: "DUPLICATE_DOCUMENT" });
    }

    await admin
      .from("documents")
      .update({ raw_text: rawText, content_hash: hash, status: "ready", error_code: null })
      .eq("id", documentId);
    await completeJob(admin, jobId, true);

    return json({ ok: true, length: rawText.length });
  } catch (e) {
    await refundOnce("ingest_failed");
    const msg = e instanceof Error ? e.message : String(e);
    log.error("ingest failed", { err: e, documentId });
    const code = e instanceof IngestError
      ? e.code
      : msg.startsWith("RATE_LIMITED") ? "RATE_LIMITED" : isUpstreamTimeout(e) ? "UPSTREAM_TIMEOUT" : "INGEST_FAILED";
    await setStatus("failed", { error_code: (e instanceof IngestError ? e.code : msg).slice(0, 80) });
    await completeJob(admin, jobId, false, msg.slice(0, 200));
    const status = e instanceof IngestError
      ? e.status
      : code === "RATE_LIMITED" ? 429 : code === "UPSTREAM_TIMEOUT" ? 504 : 500;
    return json({ error: msg, code, retryable: status === 429 || status >= 500 }, status);
  } finally {
    stopHeartbeat();
  }
});
