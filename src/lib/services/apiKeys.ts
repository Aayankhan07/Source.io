// Client wrapper for the `api_keys` edge function (roadmap §6.0, task 2.11).
// Keys are sent once over HTTPS to be validated and encrypted server-side; the browser never
// stores them and the server only ever returns the provider and last 4 characters.
import { callFunction, functionError } from "@/lib/services/functions";

export type ApiKeyProvider = "groq" | "gemini" | "openai";

export interface SavedApiKey {
  provider: ApiKeyProvider;
  last4: string;
  updated_at?: string;
}

async function post<T>(body: Record<string, unknown>, fallback: string): Promise<T> {
  const resp = await callFunction("api_keys", body);
  if (!resp.ok) throw await functionError(resp, fallback);
  return (await resp.json()) as T;
}

/** Providers the user has saved keys for, with the last 4 characters only. */
export async function listApiKeys(): Promise<SavedApiKey[]> {
  const data = await post<{ keys?: SavedApiKey[] }>({ action: "list" }, "Could not load your saved keys");
  return data.keys ?? [];
}

/** Validates the key with the provider, then stores it encrypted. Returns provider + last4. */
export async function saveApiKey(provider: ApiKeyProvider, key: string): Promise<SavedApiKey> {
  return await post<SavedApiKey>({ action: "save", provider, key: key.trim() }, "Could not save the key");
}

/** Re-checks the stored key against the provider. Throws with a friendly message when it fails. */
export async function testApiKey(provider: ApiKeyProvider): Promise<SavedApiKey> {
  return await post<SavedApiKey>({ action: "test", provider }, "The key test failed");
}

export async function deleteApiKey(provider: ApiKeyProvider): Promise<void> {
  await post<{ ok: boolean }>({ action: "delete", provider }, "Could not delete the key");
}
