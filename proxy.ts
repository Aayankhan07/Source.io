import type { NextRequest } from "next/server";
import { updateSession } from "@/integrations/supabase/proxy";

/**
 * Primary auth gate (Next 16 renamed middleware to proxy):
 * - refreshes the Supabase session cookie on /app and /auth requests;
 * - redirects signed-out requests for /app/** to /auth?next=<path>;
 * - redirects signed-in users away from /auth to /app (or ?next=).
 * RequireAuth remains as a client-side fallback.
 */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // /auth/callback (route handler) is deliberately excluded: it establishes the session itself.
  matcher: ["/app", "/app/:path*", "/auth"],
};
