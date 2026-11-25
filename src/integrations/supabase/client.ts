// Browser Supabase client. The session lives in cookies (via @supabase/ssr) so
// proxy.ts and server code can see it; see ./server.ts for the server helper.
import { createBrowserClient } from "@supabase/ssr";
import { isAuthRetryableFetchError } from "@supabase/supabase-js";
import type { Database } from "./types";

const CONFIGURED_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const CONFIGURED_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Placeholders keep the module importable in test/build environments that have
// no credentials. Any real request against them will fail, so make the cause loud.
if (!CONFIGURED_URL || !CONFIGURED_KEY) {
  console.error(
    "[supabase] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are not set. " +
      "Copy .env.example to .env.local and fill them in - every request will fail until you do.",
  );
}

export const SUPABASE_URL = CONFIGURED_URL || "https://placeholder-project.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = CONFIGURED_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE1OTg4NzQ5OTIsImV4cCI6MTkxNDQzNDk5Mn0.placeholder";

const isBrowser = typeof window !== "undefined";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";
//
// In the browser this is the @supabase/ssr singleton backed by document.cookie.
// During server rendering of client components there is no request cookie
// store, so it gets an inert, session-less cookie adapter (server code that
// needs the user's session must use createSupabaseServerClient from ./server).
export const supabase = createBrowserClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  isBrowser
    ? undefined
    : {
        isSingleton: false,
        cookies: { getAll: () => [], setAll: () => {} },
      },
);

/** supabase-js's default storage key (also the @supabase/ssr cookie name). */
export const SUPABASE_AUTH_STORAGE_KEY = (() => {
  try {
    return `sb-${new URL(SUPABASE_URL).hostname.split(".")[0]}-auth-token`;
  } catch {
    return "sb-auth-token";
  }
})();

/**
 * One-time migration from the pre-SSR client, which kept the session in
 * localStorage under SUPABASE_AUTH_STORAGE_KEY. If a cookie session is absent
 * but a legacy one exists, re-establish it via setSession (which writes the
 * cookies and refreshes an expired access token), then delete the legacy keys.
 *
 * Returns "restored" when a legacy session was moved to cookies, "expired"
 * when one existed but could not be restored (e.g. a revoked refresh token;
 * the user must sign in once more), and "none" otherwise.
 */
export type LegacySessionMigration = "restored" | "expired" | "none";

export async function migrateLegacyLocalStorageSession(): Promise<LegacySessionMigration> {
  if (!isBrowser) return "none";
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(SUPABASE_AUTH_STORAGE_KEY);
  } catch {
    return "none";
  }
  if (!raw) return "none";

  const clearLegacy = () => {
    try {
      for (const suffix of ["", "-code-verifier", "-user"]) {
        window.localStorage.removeItem(`${SUPABASE_AUTH_STORAGE_KEY}${suffix}`);
      }
    } catch {
      /* ignore */
    }
  };

  try {
    const { data: existing } = await supabase.auth.getSession();
    if (existing.session) {
      clearLegacy();
      return "none";
    }
    const parsed = JSON.parse(raw) as { access_token?: unknown; refresh_token?: unknown } | null;
    const access_token = typeof parsed?.access_token === "string" ? parsed.access_token : null;
    const refresh_token = typeof parsed?.refresh_token === "string" ? parsed.refresh_token : null;
    if (!access_token || !refresh_token) {
      clearLegacy();
      return "none";
    }
    const { data, error } = await supabase.auth.setSession({ access_token, refresh_token });
    // Keep the legacy session for a later attempt if the auth server was unreachable.
    if (error && isAuthRetryableFetchError(error)) return "none";
    clearLegacy();
    return !error && data.session ? "restored" : "expired";
  } catch (e) {
    if (isAuthRetryableFetchError(e)) return "none";
    clearLegacy();
    return "expired";
  }
}
