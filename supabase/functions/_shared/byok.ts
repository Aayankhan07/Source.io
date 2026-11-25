import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { EncryptionUnavailableError, importMasterKey, openSecret } from "./secretBox.ts";

export type ByokProvider = "groq" | "gemini" | "openai";
export const BYOK_PROVIDERS: readonly ByokProvider[] = ["groq", "gemini", "openai"];

export function isByokProvider(v: unknown): v is ByokProvider {
  return typeof v === "string" && (BYOK_PROVIDERS as readonly string[]).includes(v);
}

/**
 * Cheap shape check so a key is never sent to a different provider's API.
 * Groq keys start with gsk_, Google AI Studio keys with AIza, OpenAI keys with sk-.
 */
export function keyMatchesProvider(provider: ByokProvider, key: string): boolean {
  const k = key.trim();
  if (k.length < 20 || k.length > 300 || /\s/.test(k)) return false;
  if (provider === "groq") return k.startsWith("gsk_");
  if (provider === "gemini") return k.startsWith("AIza");
  return k.startsWith("sk-");
}

/**
 * The server decides whether a request is BYOK: true only when the caller's own
 * Groq key will actually be used upstream. Request headers are never trusted, and
 * keys for other providers are never forwarded to Groq.
 * Kept for backward compatibility (legacy body `api_key`); prefer resolveProviderKeys.
 */
export function resolveGroqKey(
  bodyKey: string | undefined | null,
  platformKey: string | undefined,
): { apiKey: string | undefined; isByok: boolean } {
  const user = bodyKey?.trim();
  if (user && user.startsWith("gsk_")) return { apiKey: user, isByok: true };
  return { apiKey: platformKey || undefined, isByok: false };
}

/** Additional authenticated data that binds a ciphertext to its owner and provider. */
export function keyAad(userId: string, provider: ByokProvider): string {
  return `${userId}:${provider}`;
}

/**
 * Loads and decrypts the user's stored key for `provider` (service-role client only).
 * Returns null when no key is stored. Throws EncryptionUnavailableError when
 * BYOK_ENCRYPTION_KEY is missing, and any other error on DB or decryption failure, so
 * callers fail closed instead of silently using the platform key.
 */
export async function loadUserKey(
  admin: SupabaseClient,
  userId: string,
  provider: ByokProvider,
  masterKeyB64: string | undefined = getEnv("BYOK_ENCRYPTION_KEY"),
): Promise<string | null> {
  const { data, error } = await admin
    .from("user_api_keys")
    .select("ciphertext,iv")
    .eq("user_id", userId)
    .eq("provider", provider)
    .maybeSingle();
  if (error) throw new Error(`user_api_keys lookup failed: ${error.message}`);
  if (!data) return null;
  const key = await importMasterKey(masterKeyB64);
  return await openSecret(key, { ciphertext: data.ciphertext, iv: data.iv }, keyAad(userId, provider));
}

/** Which providers the user has stored keys for (no decryption). */
export async function listStoredProviders(admin: SupabaseClient, userId: string): Promise<ByokProvider[]> {
  const { data, error } = await admin.from("user_api_keys").select("provider").eq("user_id", userId);
  if (error) throw new Error(`user_api_keys lookup failed: ${error.message}`);
  return (data ?? []).map((r: { provider: string }) => r.provider).filter(isByokProvider);
}

export interface ProviderKey {
  provider: ByokProvider;
  apiKey: string;
  /** true when the key belongs to the user (stored or legacy body key). */
  userOwned: boolean;
}

export interface ResolvedKeys {
  /**
   * Keys usable for this request, in no particular order. In BYOK mode this holds ONLY the
   * user's keys; the platform keys are never mixed in, so every upstream call uses the user's key.
   */
  keys: Partial<Record<ByokProvider, ProviderKey>>;
  /** true when every upstream call of this request will use the user's own key. */
  isByok: boolean;
}

/**
 * Pure key-resolution rule (see resolveProviderKeys).
 * - Any user key (stored, or a legacy body `gsk_` key) => BYOK mode: only user keys are used
 *   and the quota is skipped. A stored Groq key wins over the body key.
 * - Otherwise platform keys (GROQ_API_KEY, GEMINI_API_KEY) and the quota applies.
 */
export function chooseKeys(
  stored: Partial<Record<ByokProvider, string>>,
  bodyKey: string | undefined | null,
  platform: { groq?: string; gemini?: string },
): ResolvedKeys {
  const user: Partial<Record<ByokProvider, ProviderKey>> = {};
  for (const p of BYOK_PROVIDERS) {
    const k = stored[p]?.trim();
    if (k && keyMatchesProvider(p, k)) user[p] = { provider: p, apiKey: k, userOwned: true };
  }
  const body = bodyKey?.trim();
  if (!user.groq && body && body.startsWith("gsk_")) {
    user.groq = { provider: "groq", apiKey: body, userOwned: true };
  }
  if (Object.keys(user).length > 0) return { keys: user, isByok: true };

  const keys: Partial<Record<ByokProvider, ProviderKey>> = {};
  if (platform.groq) keys.groq = { provider: "groq", apiKey: platform.groq, userOwned: false };
  if (platform.gemini) keys.gemini = { provider: "gemini", apiKey: platform.gemini, userOwned: false };
  return { keys, isByok: false };
}

/**
 * Resolves which provider keys a notes / derivatives request may use. Stored keys are
 * preferred; the legacy body `api_key` (Groq only) still works. Throws when stored keys
 * exist but cannot be decrypted (fail closed: never silently bill the platform instead).
 */
export async function resolveProviderKeys(
  admin: SupabaseClient,
  userId: string,
  bodyKey: string | undefined | null,
): Promise<ResolvedKeys> {
  const providers = await listStoredProviders(admin, userId);
  const stored: Partial<Record<ByokProvider, string>> = {};
  for (const p of providers) {
    const k = await loadUserKey(admin, userId, p);
    if (k) stored[p] = k;
  }
  return chooseKeys(stored, bodyKey, {
    groq: getEnv("GROQ_API_KEY"),
    gemini: getEnv("GEMINI_API_KEY"),
  });
}

export { EncryptionUnavailableError };

function getEnv(name: string): string | undefined {
  // deno-lint-ignore no-explicit-any
  const v = (globalThis as any).Deno?.env?.get?.(name) as string | undefined;
  return v?.trim() || undefined;
}
