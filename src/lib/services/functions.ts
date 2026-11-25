// Shared helpers for calling Supabase Edge Functions.
import { supabase, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/integrations/supabase/client";

/** Absolute URL of an edge function. Uses the same base URL as the Supabase client. */
const functionUrl = (name: string) => `${SUPABASE_URL}/functions/v1/${name}`;

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
  let code = "";
  try {
    const raw = await resp.text();
    try {
      const parsed = JSON.parse(raw);
      errorText = parsed.error || parsed.message || raw;
      code = typeof parsed.code === "string" ? parsed.code : "";
    } catch {
      errorText = raw;
    }
  } catch {
    errorText = "";
  }
  const lower = errorText.toLowerCase();

  // Machine-readable codes from the edge functions take priority over status/text heuristics.
  switch (code) {
    case "QUOTA_EXCEEDED":
      return new Error("You've used today's AI actions. They reset at 00:00 UTC — or upgrade, or add your own API key in Settings.");
    case "QUOTA_UNAVAILABLE":
      return new Error("Usage limits are temporarily unavailable. Nothing was charged — please retry in a minute.");
    case "ACTIVE_JOB_RUNNING":
      return new Error("A study task is already running for this document. Please wait a moment.");
    case "JOB_LOCK_UNAVAILABLE":
      return new Error("We couldn't start this task safely. Nothing was charged — please retry in a minute.");
    case "UPSTREAM_TIMEOUT":
      return new Error("The AI provider took too long to respond. Nothing was charged — please try again.");
    case "DOCUMENT_LIMIT_REACHED":
      return new Error("You've reached your plan's document limit. Delete a document to add another one.");
    case "DOCUMENT_TOO_LONG":
      return new Error(errorText || "This document is longer than your plan allows.");
    case "UPLOAD_TOO_LARGE":
    case "FILE_TOO_LARGE":
      return new Error(errorText || "This file is larger than your plan allows.");
    case "YOUTUBE_TRANSCRIPT_UNAVAILABLE":
      return new Error(
        errorText ||
          "We couldn't fetch captions for this video. Open it on YouTube, click …more → Show transcript, copy the text and paste it here.",
      );
    case "DOCUMENT_INDEXING":
      return new Error("This document is still being indexed for chat. Try your question again in a few seconds.");
    case "INDEX_FAILED":
    case "EMBED_FAILED":
      return new Error("We couldn't index this document for chat. Nothing was charged — please try again.");
    case "BYOK_UNAVAILABLE":
      return new Error("Saved API keys are temporarily unavailable. Nothing was charged — please retry shortly.");
    case "BYOK_KEY_INVALID":
      return new Error("Your saved API key was rejected by the provider. Check or replace it in Settings → AI & Models.");
    case "RATE_LIMITED":
      return new Error("The AI provider is busy right now. Please wait about 30 seconds and try again.");
    case "NOTES_INCOMPLETE":
      return new Error("Notes were only partly generated. Your finished sections are saved — press Generate again to continue.");
    case "STORAGE_DELETE_FAILED":
    case "ACCOUNT_DELETE_FAILED":
      return new Error("We couldn't finish deleting your account. Nothing was removed — please try again or contact support.");
  }

  if (errorText.includes("DOCUMENT_LIMIT_REACHED")) {
    return new Error("You've reached your plan's document limit. Delete a document to add another one.");
  }
  if (errorText.includes("ACTIVE_JOB_RUNNING")) {
    return new Error("A study task is already running for this document. Please wait a moment.");
  }
  if (lower.includes("invalid api key")) {
    return new Error("This API key is invalid. Check it or create a new one in Settings.");
  }
  if (status === 401) {
    return new Error("Your session has expired. Please sign in again.");
  }
  if (status === 429 || lower.includes("rate limit") || lower.includes("tpm") || lower.includes("rpd")) {
    return new Error("Too many requests were sent recently. Please wait 30 seconds.");
  }
  if (status === 413 || lower.includes("too large") || lower.includes("max_bytes")) {
    return new Error("This document is too large for your plan.");
  }
  if (status === 502 || status === 503 || status === 504 || lower.includes("overloaded") || lower.includes("unavailable")) {
    return new Error("The AI provider is temporarily unavailable. Your saved notes are safe.");
  }
  if (errorText.includes("MISSING_RAW_TEXT") || errorText.includes("EMPTY_OR_TOO_SHORT")) {
    return new Error("No AI usage was charged because processing did not start.");
  }

  return new Error(errorText && errorText.length < 120 ? errorText : fallback);
}

/**
 * True when notes generation stopped part-way (server code NOTES_INCOMPLETE, or the
 * "paused" message streamNotes throws after its automatic resumes). Finished sections are
 * saved server-side, so the UI can offer "Continue generating" instead of a plain failure.
 */
export function isNotesIncompleteError(e: unknown): boolean {
  const message = e instanceof Error ? e.message : typeof e === "string" ? e : "";
  return /NOTES_INCOMPLETE|only partly generated|generation paused|^Paused after \d+ of \d+ sections/i.test(message);
}
