// Session refresh + route gating used by the root proxy.ts (Next 16's renamed
// middleware). Kept here so the auth rules live next to the clients.
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isAuthRetryableFetchError } from "@supabase/supabase-js";
import type { Database } from "./types";
import { safeNextPath } from "@/features/auth/lib/safeNextPath";

export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // Without configuration there is nothing to check against; fall back to the
  // client-side RequireAuth gate rather than locking everyone out.
  if (!url || !key) return NextResponse.next({ request });

  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
        // Cache-Control etc. so a refreshed session cookie is never cached by a CDN.
        for (const [h, v] of Object.entries(headers ?? {})) response.headers.set(h, v);
      },
    },
  });

  // Do not put code between createServerClient and getClaims: getClaims
  // validates the JWT and refreshes an expired session (writing new cookies).
  const { data, error } = await supabase.auth.getClaims();
  const signedIn = !!data?.claims?.sub;
  // Auth server unreachable: don't misreport the user as signed out. Let the
  // request through; the client-side gate shows a retry state instead.
  const authUnavailable = !signedIn && !!error && isAuthRetryableFetchError(error);

  const { pathname, search } = request.nextUrl;
  const isAppRoute = pathname === "/app" || pathname.startsWith("/app/");
  const isAuthPage = pathname === "/auth";

  const redirectWithCookies = (target: URL) => {
    const redirect = NextResponse.redirect(target);
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    return redirect;
  };

  if (isAppRoute && !signedIn && !authUnavailable) {
    const target = request.nextUrl.clone();
    target.pathname = "/auth";
    target.search = "";
    target.searchParams.set("next", `${pathname}${search}`);
    return redirectWithCookies(target);
  }

  if (isAuthPage && signedIn) {
    const params = request.nextUrl.searchParams;
    const next = safeNextPath(params.get("next") ?? params.get("redirect"));
    return redirectWithCookies(new URL(next, request.url));
  }

  return response;
}
