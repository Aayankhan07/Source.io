// Shared CORS headers for browser-facing edge functions.
// ALLOWED_ORIGIN may be unset/"*" (any origin, never echoed) or a comma-separated allow-list.

const ALLOW_HEADERS =
  "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version";

export function buildCorsHeaders(
  requestOrigin: string | null,
  allowedOriginEnv: string | undefined,
): Record<string, string> {
  const list = (allowedOriginEnv ?? "*")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  let allowOrigin = "*";
  if (list.length > 0 && !list.includes("*")) {
    allowOrigin = requestOrigin && list.includes(requestOrigin) ? requestOrigin : list[0];
  }
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": ALLOW_HEADERS,
    Vary: "Origin",
  };
}

export function corsHeadersFor(req: Request): Record<string, string> {
  // deno-lint-ignore no-explicit-any
  const env = (globalThis as any).Deno?.env?.get?.("ALLOWED_ORIGIN") as string | undefined;
  return buildCorsHeaders(req.headers.get("Origin"), env);
}
