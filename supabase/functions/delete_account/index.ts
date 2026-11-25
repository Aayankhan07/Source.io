// Deletes the caller's account: every storage object under `${userId}/` in the user buckets,
// then the auth user (all public.* rows owned by the user cascade from auth.users).
// Storage goes first and the function fails closed: if any file cannot be removed the account
// is kept, so a retry can finish the job instead of leaving orphaned files behind.
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { authenticateRequest } from "../_shared/auth.ts";
import { corsHeadersFor } from "../_shared/cors.ts";
import { createLogger } from "../_shared/log.ts";

// Path conventions: uploads `${userId}/${uuid}-${name}` (UploadDialog), podcasts
// `${userId}/${documentId}/${ts}.mp3` (generate_podcast), avatars `${userId}/...` (storage RLS).
const USER_BUCKETS = ["uploads", "podcasts", "avatars"] as const;
const PAGE = 1000;
const REMOVE_BATCH = 100;

/** Lists every object path below `prefix` (recursive; folders have a null id). */
async function listAllPaths(admin: SupabaseClient, bucket: string, prefix: string): Promise<string[]> {
  const paths: string[] = [];
  const folders = [prefix];
  while (folders.length > 0) {
    const folder = folders.pop()!;
    for (let offset = 0; ; offset += PAGE) {
      const { data, error } = await admin.storage.from(bucket).list(folder, { limit: PAGE, offset });
      if (error) {
        // A missing bucket means there is nothing to delete there.
        if (/not found/i.test(error.message)) return paths;
        throw new Error(`list ${bucket}/${folder} failed: ${error.message}`);
      }
      const entries = data ?? [];
      for (const e of entries) {
        const full = `${folder}/${e.name}`;
        if (e.id === null) folders.push(full);
        else paths.push(full);
      }
      if (entries.length < PAGE) break;
    }
  }
  return paths;
}

Deno.serve(async (req) => {
  const corsHeaders = corsHeadersFor(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  if (req.method !== "POST") return json({ error: "Method not allowed", code: "METHOD_NOT_ALLOWED" }, 405);

  const log = createLogger("delete_account");
  const auth = await authenticateRequest(req, corsHeaders);
  if (auth.errorResponse) return auth.errorResponse;
  const { admin, userId } = auth;
  log.userId = userId;

  let removed = 0;
  try {
    for (const bucket of USER_BUCKETS) {
      const paths = await listAllPaths(admin, bucket, userId);
      for (let i = 0; i < paths.length; i += REMOVE_BATCH) {
        const batch = paths.slice(i, i + REMOVE_BATCH);
        const { error } = await admin.storage.from(bucket).remove(batch);
        if (error) throw new Error(`remove from ${bucket} failed: ${error.message}`);
        removed += batch.length;
      }
    }
  } catch (e) {
    log.error("storage cleanup failed; account kept", { err: e, removed });
    return json({
      error: "We couldn't delete all of your files. Your account was not deleted; please try again.",
      code: "STORAGE_DELETE_FAILED",
      retryable: true,
    }, 500);
  }

  const { error: delErr } = await admin.auth.admin.deleteUser(userId);
  if (delErr) {
    log.error("auth deleteUser failed", { err: delErr, removed });
    return json({
      error: "We couldn't delete your account. Please try again.",
      code: "ACCOUNT_DELETE_FAILED",
      retryable: true,
    }, 500);
  }

  log.info("account deleted", { removed });
  return json({ ok: true });
});
