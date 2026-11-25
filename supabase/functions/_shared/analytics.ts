// Server-side product analytics (PostHog capture API). Mirrors src/lib/analytics/track.ts:
// users are identified by their Supabase user id only, never email or other PII, and
// properties stay coarse. Everything is a no-op unless POSTHOG_PROJECT_KEY is set, and
// captureServerEvent never throws: analytics must never fail a webhook.
import { fetchWithTimeout } from "./http.ts";
import { isUuid } from "./webhookSignature.ts";

export const POSTHOG_DEFAULT_HOST = "https://us.i.posthog.com";
export const POSTHOG_TIMEOUT_MS = 3_000;

/** Server-emitted events. Names match the client funnel in src/lib/analytics/track.ts. */
export type ServerEventName = "upgrade_completed" | "subscription_ended";

export type ServerEventProps = Record<string, string | number | boolean | null>;

export interface CaptureRequest {
  url: string;
  body: {
    api_key: string;
    event: ServerEventName;
    distinct_id: string;
    properties: ServerEventProps & { $lib: string };
    timestamp: string;
  };
}

/**
 * Builds the PostHog public capture request (POST {host}/capture/). Pure; returns null when
 * the event cannot or must not be sent (no key, distinct id is not a Supabase user id).
 */
export function buildCaptureRequest(
  apiKey: string | undefined | null,
  host: string | undefined | null,
  distinctId: string,
  event: ServerEventName,
  props: ServerEventProps = {},
  now: Date = new Date(),
): CaptureRequest | null {
  if (!apiKey || !apiKey.trim()) return null;
  // Only Supabase user ids are allowed as distinct ids (no emails or customer ids).
  if (!isUuid(distinctId)) return null;
  const base = (host && host.trim() ? host.trim() : POSTHOG_DEFAULT_HOST).replace(/\/+$/, "");
  return {
    url: `${base}/capture/`,
    body: {
      api_key: apiKey.trim(),
      event,
      distinct_id: distinctId.toLowerCase(),
      properties: { ...props, $lib: "source-io-edge" },
      timestamp: now.toISOString(),
    },
  };
}

/**
 * Analytics event for a profile tier change caused by a billing event, or null when the tier
 * did not change. A missing previous tier counts as free.
 */
export function tierTransitionEvent(
  previousTier: string | null | undefined,
  nextTier: string,
): { event: ServerEventName; props: ServerEventProps } | null {
  const before = previousTier === "pro" ? "pro" : "free";
  const after = nextTier === "pro" ? "pro" : "free";
  if (before === after) return null;
  return after === "pro"
    ? { event: "upgrade_completed", props: { plan: "scholar" } }
    : { event: "subscription_ended", props: { plan: "scholar" } };
}

/** Sends one event to PostHog. No-op when POSTHOG_PROJECT_KEY is unset. Never throws. */
export async function captureServerEvent(
  distinctId: string,
  event: ServerEventName,
  props: ServerEventProps = {},
): Promise<boolean> {
  try {
    const request = buildCaptureRequest(
      Deno.env.get("POSTHOG_PROJECT_KEY"),
      Deno.env.get("POSTHOG_HOST"),
      distinctId,
      event,
      props,
    );
    if (!request) return false;
    const res = await fetchWithTimeout(
      request.url,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request.body),
      },
      POSTHOG_TIMEOUT_MS,
    );
    // Drain the body so the connection is released.
    await res.body?.cancel().catch(() => {});
    return res.ok;
  } catch {
    return false;
  }
}
