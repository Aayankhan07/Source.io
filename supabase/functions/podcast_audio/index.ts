// Browser-rendered podcast audio: the user's browser synthesizes the two-host script with
// Kokoro-82M (kokoro-js) and uploads the file. This function only meters renders, hands out
// signed upload/read URLs, and records the storage path on the podcast row.
//
//   { action: "start",  document_id, ext? }  -> consumes 1 daily audio render, returns a signed upload URL
//   { action: "finish", document_id, path }  -> verifies the upload, stores audio_path, deletes older files
//   { action: "url",    document_id }        -> 1-hour signed read URL (or null) + renders left today
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { consumeDailyTtsQuota, refundDailyTtsQuota } from "../_shared/quotas.ts";
import { corsHeadersFor } from "../_shared/cors.ts";
import { createLogger } from "../_shared/log.ts";
import { logAiUsage } from "../_shared/telemetry.ts";
import {
  AUDIO_EXTENSIONS,
  buildAudioPath,
  isAudioExtension,
  isOwnedAudioPath,
  PODCAST_BUCKET,
  removeDocumentAudio,
} from "./storage.ts";

const READ_URL_TTL_SECONDS = 60 * 60;

type Action = "start" | "finish" | "url";

/** Renders left today, or null when the profile can't be read. Mirrors the RPC's lazy UTC reset. */
async function rendersRemaining(admin: SupabaseClient, userId: string): Promise<number | null> {
  try {
    const { data } = await admin
      .from("profiles")
      .select("daily_tts_quota_used,daily_tts_quota_limit,quota_reset_date")
      .eq("user_id", userId)
      .maybeSingle();
    if (!data) return null;
    const limit = Number(data.daily_tts_quota_limit ?? 2);
    const today = new Date().toISOString().slice(0, 10);
    const used = data.quota_reset_date === today ? Number(data.daily_tts_quota_used ?? 0) : 0;
    return Math.max(0, limit - used);
  } catch {
    return null;
  }
}

export async function handler(req: Request): Promise<Response> {
  const corsHeaders = corsHeadersFor(req);
  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const log = createLogger("podcast_audio");
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const userClient = createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: authHeader } },
  });
  const admin = createClient(SUPABASE_URL, SERVICE);

  const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(
    authHeader.replace("Bearer ", ""),
  );
  if (claimsErr || !claimsData?.claims) return json({ error: "Unauthorized" }, 401);
  const userId = claimsData.claims.sub as string;
  log.userId = userId;

  let body: { action?: Action; document_id?: string; path?: string; ext?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }
  const action = body.action;
  const documentId = body.document_id?.trim();
  if (!documentId) return json({ error: "document_id required" }, 400);
  if (action !== "start" && action !== "finish" && action !== "url") {
    return json({ error: "action must be start, finish or url" }, 400);
  }

  // Ownership check BEFORE any quota or storage work.
  const { data: doc } = await admin
    .from("documents")
    .select("id,user_id")
    .eq("id", documentId)
    .maybeSingle();
  if (!doc || doc.user_id !== userId) return json({ error: "Document not found" }, 404);

  const { data: podcast } = await admin
    .from("podcasts")
    .select("id,script,audio_path,audio_url,status")
    .eq("document_id", documentId)
    .eq("user_id", userId)
    .maybeSingle();

  if (action === "url") {
    const remaining = await rendersRemaining(admin, userId);
    if (podcast?.audio_path) {
      const { data: signed, error } = await admin.storage
        .from(PODCAST_BUCKET)
        .createSignedUrl(podcast.audio_path, READ_URL_TTL_SECONDS);
      if (error || !signed) {
        log.warn("sign read url failed", { err: error });
        return json({ url: null, renders_remaining: remaining });
      }
      return json({ url: signed.signedUrl, expires_in: READ_URL_TTL_SECONDS, renders_remaining: remaining });
    }
    // Legacy rows rendered server-side still carry a long-lived signed URL.
    return json({ url: podcast?.audio_url ?? null, renders_remaining: remaining });
  }

  if (!podcast?.script) {
    return json({ error: "Generate the podcast script first.", code: "NO_SCRIPT" }, 409);
  }

  if (action === "start") {
    const ext = body.ext ?? "wav";
    if (!isAudioExtension(ext)) return json({ error: "Unsupported audio format" }, 400);

    const quota = await consumeDailyTtsQuota(admin, userId, 1);
    if (!quota.allowed) {
      if (quota.unavailable) {
        return json({
          error: "Usage limits are temporarily unavailable. Please retry in a minute.",
          code: "QUOTA_UNAVAILABLE",
          retryable: true,
        }, 503);
      }
      return json({
        error: "You've used today's audio renders. They reset at 00:00 UTC, or play the script with device voices.",
        code: "AUDIO_QUOTA_EXCEEDED",
      }, 429);
    }

    const path = buildAudioPath(userId, documentId, ext);
    const { data: upload, error: uploadErr } = await admin.storage
      .from(PODCAST_BUCKET)
      .createSignedUploadUrl(path);
    if (uploadErr || !upload) {
      log.error("create signed upload url failed", { err: uploadErr });
      const refunded = await refundDailyTtsQuota(admin, userId, 1);
      log.info("tts quota refund", { reason: "signed_upload_failed", refunded });
      return json({ error: "Could not prepare the audio upload. Nothing was charged." }, 500);
    }

    return json({
      path: upload.path ?? path,
      token: upload.token,
      upload_url: upload.signedUrl,
      content_type: AUDIO_EXTENSIONS[ext],
      renders_remaining: await rendersRemaining(admin, userId),
    });
  }

  // action === "finish"
  const path = body.path;
  if (!isOwnedAudioPath(path, userId, documentId)) return json({ error: "Invalid audio path" }, 400);

  const slash = path.lastIndexOf("/");
  const folder = path.slice(0, slash);
  const fileName = path.slice(slash + 1);
  const { data: listed, error: listErr } = await admin.storage
    .from(PODCAST_BUCKET)
    .list(folder, { search: fileName, limit: 10 });
  const object = listed?.find((f: { name: string }) => f.name === fileName);
  if (listErr || !object) return json({ error: "Audio upload not found" }, 404);
  const size = Number((object as { metadata?: { size?: number } }).metadata?.size ?? 0);
  if (size <= 0) return json({ error: "Audio upload is empty" }, 400);

  const { error: updErr } = await admin
    .from("podcasts")
    .update({ audio_path: path, audio_url: null, status: "ready" })
    .eq("id", podcast.id);
  if (updErr) {
    log.error("podcast audio_path update failed", { err: updErr });
    return json({ error: "Could not save the audio" }, 500);
  }

  const removed = await removeDocumentAudio(admin, userId, documentId, path);
  await logAiUsage(admin, {
    userId,
    documentId,
    requestId: log.requestId,
    feature: "tts",
    provider: "local",
    model: "kokoro-82m-browser",
    estimatedCostUsd: 0,
    status: "succeeded",
  });
  log.info("podcast audio saved", { size, removed });

  const { data: signed } = await admin.storage
    .from(PODCAST_BUCKET)
    .createSignedUrl(path, READ_URL_TTL_SECONDS);
  return json({ ok: true, path, url: signed?.signedUrl ?? null, expires_in: READ_URL_TTL_SECONDS });
}

if (import.meta.main) {
  Deno.serve(handler);
}
