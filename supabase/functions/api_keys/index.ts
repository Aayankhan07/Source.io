// Stores, tests, lists and deletes a user's own provider API keys (roadmap §6.0, task 2.11).
// Keys are validated with a cheap models-list call, encrypted with AES-256-GCM using
// BYOK_ENCRYPTION_KEY (fails closed when unset), and never returned: list gives provider + last4.
//
// POST { action: "save", provider, key }   -> { ok, provider, last4 }
// POST { action: "test", provider }        -> { ok, provider, last4 }  (re-validates the stored key)
// POST { action: "delete", provider }      -> { ok, provider }
// POST { action: "list" }                  -> { keys: [{ provider, last4, updated_at }] }
import { authenticateRequest } from "../_shared/auth.ts";
import { corsHeadersFor } from "../_shared/cors.ts";
import { createLogger } from "../_shared/log.ts";
import { fetchWithTimeout, isUpstreamTimeout } from "../_shared/http.ts";
import { type ByokProvider, isByokProvider, keyAad, keyMatchesProvider, loadUserKey } from "../_shared/byok.ts";
import { EncryptionUnavailableError, importMasterKey, keyLast4, sealSecret } from "../_shared/secretBox.ts";
import { PROVIDER_MODELS_URL } from "../_shared/engine.ts";

const VALIDATE_TIMEOUT_MS = 10_000;

const PROVIDER_NAMES: Record<ByokProvider, string> = { groq: "Groq", gemini: "Gemini", openai: "OpenAI" };

type Validation = { ok: true } | { ok: false; status: number; code: string; error: string };

/** Lists models with the key: free, no tokens used, and proves the key works for that provider. */
async function validateKey(provider: ByokProvider, key: string): Promise<Validation> {
  let resp: Response;
  try {
    resp = await fetchWithTimeout(
      PROVIDER_MODELS_URL[provider],
      { method: "GET", headers: { Authorization: `Bearer ${key}` } },
      VALIDATE_TIMEOUT_MS,
    );
  } catch (e) {
    return {
      ok: false,
      status: 504,
      code: isUpstreamTimeout(e) ? "UPSTREAM_TIMEOUT" : "UPSTREAM_UNAVAILABLE",
      error: `${PROVIDER_NAMES[provider]} did not respond. Please try again.`,
    };
  }
  try { await resp.body?.cancel(); } catch { /* noop */ }
  if (resp.ok) return { ok: true };
  if (resp.status === 401 || resp.status === 403 || (provider === "gemini" && resp.status === 400)) {
    return {
      ok: false,
      status: 400,
      code: "BYOK_KEY_INVALID",
      error: `${PROVIDER_NAMES[provider]} rejected this key (invalid API key). Check it or create a new one.`,
    };
  }
  if (resp.status === 429) {
    return {
      ok: false,
      status: 429,
      code: "RATE_LIMITED",
      error: `${PROVIDER_NAMES[provider]} is rate-limiting this key right now. Try again in a minute.`,
    };
  }
  return {
    ok: false,
    status: 502,
    code: "UPSTREAM_UNAVAILABLE",
    error: `${PROVIDER_NAMES[provider]} is temporarily unavailable (status ${resp.status}). Please try again.`,
  };
}

Deno.serve(async (req) => {
  const corsHeaders = corsHeadersFor(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const log = createLogger("api_keys");
  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
    });

  if (req.method !== "POST") return json({ error: "Method not allowed", code: "METHOD_NOT_ALLOWED" }, 405);

  try {
    const auth = await authenticateRequest(req, corsHeaders);
    if (auth.errorResponse) return auth.errorResponse;
    const { admin, userId } = auth;
    log.userId = userId;

    let body: { action?: unknown; provider?: unknown; key?: unknown };
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid JSON", code: "BAD_REQUEST" }, 400);
    }

    const action = body.action;
    if (action === "list") {
      const { data, error } = await admin
        .from("user_api_keys")
        .select("provider,last4,updated_at")
        .eq("user_id", userId)
        .order("provider");
      if (error) {
        log.error("list failed", { err: error });
        return json({ error: "Could not load your saved keys.", code: "DB_ERROR", retryable: true }, 503);
      }
      return json({ keys: data ?? [] });
    }

    if (!isByokProvider(body.provider)) {
      return json({ error: "provider must be one of groq, gemini, openai", code: "BAD_REQUEST" }, 400);
    }
    const provider = body.provider;

    if (action === "delete") {
      const { error } = await admin.from("user_api_keys").delete().eq("user_id", userId).eq("provider", provider);
      if (error) {
        log.error("delete failed", { err: error, provider });
        return json({ error: "Could not delete the key. Please try again.", code: "DB_ERROR", retryable: true }, 503);
      }
      log.info("key deleted", { provider });
      return json({ ok: true, provider });
    }

    // save and test need encryption; fail closed when the master key is missing or invalid.
    let master: CryptoKey;
    try {
      master = await importMasterKey(Deno.env.get("BYOK_ENCRYPTION_KEY"));
    } catch (e) {
      log.error("BYOK encryption unavailable", { err: e });
      return json({
        error: "Saving your own API key is temporarily unavailable. Please try again later.",
        code: "BYOK_UNAVAILABLE",
      }, 503);
    }

    if (action === "test") {
      let key: string | null;
      try {
        key = await loadUserKey(admin, userId, provider);
      } catch (e) {
        log.error("load key failed", { err: e, provider });
        const code = e instanceof EncryptionUnavailableError ? "BYOK_UNAVAILABLE" : "BYOK_DECRYPT_FAILED";
        return json({ error: "Your saved key could not be read. Delete it and save it again.", code }, 503);
      }
      if (!key) return json({ error: `No ${PROVIDER_NAMES[provider]} key is saved.`, code: "NOT_FOUND" }, 404);
      const v = await validateKey(provider, key);
      if (!v.ok) return json({ error: v.error, code: v.code }, v.status);
      return json({ ok: true, provider, last4: keyLast4(key) });
    }

    if (action === "save") {
      const key = typeof body.key === "string" ? body.key.trim() : "";
      if (!keyMatchesProvider(provider, key)) {
        const hint = provider === "groq" ? "gsk_" : provider === "gemini" ? "AIza" : "sk-";
        return json({
          error: `That doesn't look like a ${PROVIDER_NAMES[provider]} key (it should start with "${hint}").`,
          code: "BYOK_KEY_INVALID",
        }, 400);
      }
      const v = await validateKey(provider, key);
      if (!v.ok) return json({ error: v.error, code: v.code }, v.status);

      const sealed = await sealSecret(master, key, keyAad(userId, provider));
      const last4 = keyLast4(key);
      const { error } = await admin.from("user_api_keys").upsert(
        { user_id: userId, provider, ciphertext: sealed.ciphertext, iv: sealed.iv, last4 },
        { onConflict: "user_id,provider" },
      );
      if (error) {
        log.error("save failed", { err: error, provider });
        return json({ error: "Could not save the key. Please try again.", code: "DB_ERROR", retryable: true }, 503);
      }
      log.info("key saved", { provider });
      return json({ ok: true, provider, last4 });
    }

    return json({ error: "action must be save, test, delete or list", code: "BAD_REQUEST" }, 400);
  } catch (err) {
    log.error("unhandled error", { err });
    return json({ error: "Internal Server Error", code: "INTERNAL" }, 500);
  }
});
