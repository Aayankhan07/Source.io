import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/integrations/supabase/server";
import { safeNextPath } from "@/features/auth/lib/safeNextPath";

/**
 * PKCE callback for OAuth sign-in and email confirmation links. Exchanges the
 * ?code for a session (written to cookies), then redirects to ?next.
 * Must be listed in Supabase Auth > URL Configuration > Redirect URLs.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  if (code) {
    try {
      const supabase = await createSupabaseServerClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(new URL(next, origin));
    } catch {
      /* fall through to the error redirect */
    }
  }

  const failure = new URL("/auth", origin);
  failure.searchParams.set("error", "callback");
  if (next !== "/app") failure.searchParams.set("next", next);
  return NextResponse.redirect(failure);
}
