/**
 * Only same-origin relative paths are accepted as post-login destinations,
 * which prevents ?next=https://evil.example open redirects.
 */
export function safeNextPath(value: string | null | undefined, fallback = "/app"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value;
}
