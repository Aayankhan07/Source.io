// Shared helpers for calling Supabase Edge Functions.
import { supabase, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/integrations/supabase/client";

/** Absolute URL of an edge function. Uses the same base URL as the Supabase client. */
export const functionUrl = (name: string) => `${SUPABASE_URL}/functions/v1/${name}`;

/**
 * POST a JSON body to an edge function with the current user's access token and project apikey.
 * Throws "Not authenticated" when there is no session; does not inspect the response.
 */
export async function callFunction(
  name: string,
  body: unknown,
  init: { signal?: AbortSignal } = {},
): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error("Not authenticated");

  return await fetch(functionUrl(name), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      apikey: SUPABASE_PUBLISHABLE_KEY,
    },
    body: JSON.stringify(body),
    signal: init.signal,
  });
}

/**
 * Turn a failed edge-function response into an Error with a student-friendly message.
 * Strictly adheres to Source.io student-first error guidelines (no raw stack traces).
 */
export async function functionError(resp: Response, fallback: string): Promise<Error> {
  const status = resp.status;
  let errorText = "";
  try {
    const raw = await resp.text();
    try {
      const parsed = JSON.parse(raw);
      errorText = parsed.error || parsed.message || raw;
    } catch {
      errorText = raw;
    }
  } catch {
    errorText = "";
  }

  // 1. Invalid key / Document limit (401 / 403)
  if (errorText.includes("DOCUMENT_LIMIT_REACHED") || errorText.includes("limit of 3 saved documents")) {
    return new Error("You have reached the free limit of 3 saved documents. Delete a document to add another one.");
  }
  if (status === 401 || (status === 403 && !errorText.includes("DOCUMENT_LIMIT")) || errorText.toLowerCase().includes("invalid api key") || errorText.toLowerCase().includes("unauthorized")) {
    return new Error("This API key is invalid. Check it or create a new one.");
  }

  // 2. Rate limited / Quota exhausted (429)
  if (status === 429 || errorText.toLowerCase().includes("rate limit") || errorText.toLowerCase().includes("tpm") || errorText.toLowerCase().includes("rpd")) {
    if (errorText.toLowerCase().includes("daily quota") || errorText.toLowerCase().includes("allowance")) {
      return new Error("This provider’s allowance is currently used up. Try again after the reset time.");
    }
    return new Error("Too many requests were sent recently. Please wait 30 seconds.");
  }

  // 3. File too large (413 or size limit)
  if (status === 413 || errorText.toLowerCase().includes("too large") || errorText.toLowerCase().includes("max_bytes")) {
    return new Error("This document is too large for the current free limit.");
  }

  // 4. Provider / Server unavailable (502, 503, 504)
  if (status === 502 || status === 503 || status === 504 || errorText.toLowerCase().includes("overloaded") || errorText.toLowerCase().includes("unavailable")) {
    return new Error("The AI provider is temporarily unavailable. Your saved notes are safe.");
  }

  // 5. Active job lock
  if (errorText.includes("ACTIVE_JOB_RUNNING")) {
    return new Error("A study task is already running for this document. Please wait a moment.");
  }

  // 6. Failed before processing
  if (errorText.includes("MISSING_RAW_TEXT") || errorText.includes("EMPTY_OR_TOO_SHORT")) {
    return new Error("No AI usage was charged because processing did not start.");
  }

  return new Error(errorText && errorText.length < 120 ? errorText : fallback);
}

