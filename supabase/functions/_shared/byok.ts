/**
 * The server decides whether a request is BYOK: true only when the caller's own
 * Groq key will actually be used upstream. Request headers are never trusted, and
 * keys for other providers are never forwarded to Groq.
 */
export function resolveGroqKey(
  bodyKey: string | undefined | null,
  platformKey: string | undefined,
): { apiKey: string | undefined; isByok: boolean } {
  const user = bodyKey?.trim();
  if (user && user.startsWith("gsk_")) return { apiKey: user, isByok: true };
  return { apiKey: platformKey || undefined, isByok: false };
}
