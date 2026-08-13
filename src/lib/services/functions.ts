// Shared helpers for calling Supabase Edge Functions.
import { supabase, SUPABASE_URL } from "@/integrations/supabase/client";

/** Absolute URL of an edge function. Uses the same base URL as the Supabase client. */
export const functionUrl = (name: string) => `${SUPABASE_URL}/functions/v1/${name}`;

/**
 * POST a JSON body to an edge function with the current user's access token.
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
    },
    body: JSON.stringify(body),
    signal: init.signal,
  });
}

/**
 * Turn a failed edge-function response into an Error with a useful message.
 * Handles the shared rate-limit / credit statuses; `fallback` names the operation.
 */
export async function functionError(resp: Response, fallback: string): Promise<Error> {
  if (resp.status === 429) return new Error("Rate limit reached — please wait a moment and try again.");
  if (resp.status === 402) return new Error("Hit the free-tier rate limit — please wait a moment and retry.");
  const text = await resp.text();
  return new Error(text || `${fallback} (${resp.status})`);
}
