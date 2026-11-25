// Product analytics (PostHog). Everything here is a no-op unless
// NEXT_PUBLIC_POSTHOG_KEY is set. posthog-js is loaded lazily, so builds and
// visitors without a key never download it.
//
// Privacy: no email or other PII is ever sent; users are identified by their
// Supabase user id only. Keep event properties to coarse, non-content values.
import type { PostHog } from "posthog-js";

/** Funnel events and their properties. Add new events here first. */
export type AnalyticsEvent =
  | { name: "signup_completed"; props?: { method?: "email" | "google" } }
  | { name: "onboarding_completed"; props?: Record<string, never> }
  | { name: "document_uploaded"; props: { source_type: string } }
  | { name: "notes_generated"; props: { sections: number } }
  | { name: "flashcards_reviewed"; props?: { count?: number } }
  | { name: "quiz_completed"; props: { score_pct: number } }
  | { name: "chat_question_asked"; props?: Record<string, never> }
  | { name: "podcast_audio_created"; props?: Record<string, never> }
  | { name: "upgrade_clicked"; props?: { location?: string } }
  | { name: "upgrade_completed"; props?: { plan?: string } }
  | { name: "due_review_opened"; props?: Record<string, never> }
  | { name: "browser_reminder_enabled"; props?: Record<string, never> };

export type AnalyticsEventName = AnalyticsEvent["name"];
type PropsFor<N extends AnalyticsEventName> = Extract<AnalyticsEvent, { name: N }>["props"];
type TrackArgs<N extends AnalyticsEventName> = undefined extends PropsFor<N>
  ? [props?: PropsFor<N>]
  : [props: PropsFor<N>];

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

export const analyticsEnabled = Boolean(POSTHOG_KEY);

let client: PostHog | null = null;
let loading: Promise<PostHog | null> | null = null;
// Calls made before posthog-js has loaded are replayed once it is ready.
const pending: Array<(ph: PostHog) => void> = [];
const MAX_PENDING = 50;

function withClient(fn: (ph: PostHog) => void) {
  if (!analyticsEnabled || typeof window === "undefined") return;
  if (client) {
    try {
      fn(client);
    } catch {
      /* analytics must never break the app */
    }
    return;
  }
  if (pending.length < MAX_PENDING) pending.push(fn);
  void initAnalytics();
}

/** Initialise PostHog once (browser only). Safe to call repeatedly. */
export function initAnalytics(): Promise<PostHog | null> {
  if (!analyticsEnabled || typeof window === "undefined") return Promise.resolve(null);
  if (loading) return loading;
  loading = import("posthog-js")
    .then(({ default: posthog }) => {
      posthog.init(POSTHOG_KEY as string, {
        api_host: POSTHOG_HOST,
        person_profiles: "identified_only",
        respect_dnt: true,
        // Click autocapture stays on for funnels, but no text or attribute
        // values leave the browser; input values are never captured by PostHog.
        autocapture: true,
        mask_all_text: true,
        mask_all_element_attributes: true,
        capture_pageview: "history_change",
        capture_pageleave: "if_capture_pageview",
        disable_session_recording: true,
        disable_surveys: true,
        capture_dead_clicks: false,
        capture_heatmaps: false,
        capture_exceptions: false,
        // Strip query strings (e.g. ?next=, ?code=) from captured URLs.
        before_send: (event) => {
          if (!event) return event;
          for (const key of ["$current_url", "$referrer", "$prev_pageview_pathname"]) {
            const value = event.properties?.[key];
            if (typeof value === "string") {
              try {
                const u = new URL(value, window.location.origin);
                event.properties[key] = `${u.origin}${u.pathname}`;
              } catch {
                /* leave as-is */
              }
            }
          }
          return event;
        },
      });
      client = posthog;
      for (const fn of pending.splice(0)) {
        try {
          fn(posthog);
        } catch {
          /* ignore */
        }
      }
      return posthog;
    })
    .catch(() => {
      pending.length = 0;
      return null;
    });
  return loading;
}

/** Capture a typed funnel event. No-op when analytics is disabled. */
export function track<N extends AnalyticsEventName>(name: N, ...args: TrackArgs<N>): void {
  const props = args[0] as Record<string, unknown> | undefined;
  withClient((ph) => ph.capture(name, props));
}

/** Associate subsequent events with a Supabase user id (never email). */
export function identifyUser(userId: string): void {
  withClient((ph) => {
    if (ph.get_distinct_id() !== userId) ph.identify(userId);
  });
}

/** Forget the identified user (call on sign-out). */
export function resetAnalytics(): void {
  if (!client) return;
  try {
    client.reset();
  } catch {
    /* ignore */
  }
}
