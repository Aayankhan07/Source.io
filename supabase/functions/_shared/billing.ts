// Lemon Squeezy webhook -> subscription state -> plan entitlement. Pure (no Deno/Supabase
// globals) so vitest covers every branch (billing.test.ts).
import { isUuid } from "./webhookSignature.ts";
import { TIER_LIMITS, type ServerTier } from "./planLimits.ts";

/** Lemon Squeezy subscription statuses (data.attributes.status on `subscriptions` objects). */
export type LsSubscriptionStatus =
  | "on_trial"
  | "active"
  | "paused"
  | "past_due"
  | "unpaid"
  | "cancelled"
  | "expired";

/**
 * Tier granted by a subscription state at `now`.
 * - active, on_trial, past_due (payment retry grace period) -> pro
 * - cancelled -> pro until ends_at, then free (missing/invalid ends_at -> free)
 * - paused, unpaid, expired, unknown -> free
 */
export function tierForSubscription(
  status: string | null | undefined,
  endsAt: string | null | undefined,
  now: Date = new Date(),
): ServerTier {
  switch (status) {
    case "active":
    case "on_trial":
    case "past_due":
      return "pro";
    case "cancelled": {
      const end = endsAt ? Date.parse(endsAt) : NaN;
      return Number.isFinite(end) && end > now.getTime() ? "pro" : "free";
    }
    default:
      return "free";
  }
}

/** Columns written to public.profiles for a tier (Phase 0 makes these server-only). */
export interface ProfileEntitlement {
  tier: ServerTier;
  daily_quota_limit: number;
  daily_tts_quota_limit: number;
  active_docs_limit: number;
}

export function entitlementForTier(tier: ServerTier): ProfileEntitlement {
  const l = TIER_LIMITS[tier];
  return {
    tier,
    daily_quota_limit: l.dailyQuotaLimit,
    daily_tts_quota_limit: l.dailyTtsQuotaLimit,
    active_docs_limit: l.activeDocsLimit,
  };
}

/** Row shape for public.subscriptions (matches apply_billing_event's p_subscription). */
export interface SubscriptionSnapshot {
  provider_subscription_id: string;
  provider_customer_id: string | null;
  status: string;
  variant_id: string | null;
  plan: string | null;
  renews_at: string | null;
  ends_at: string | null;
  trial_ends_at: string | null;
  /** Provider-side updated_at; used to drop out-of-order deliveries. */
  updated_at: string;
}

export type BillingAction =
  | { kind: "subscription"; subscription: SubscriptionSnapshot; entitlement: ProfileEntitlement }
  | { kind: "record_only"; reason: string };

export interface ParsedBillingEvent {
  eventName: string;
  userId: string | null;
  webhookId: string | null;
  action: BillingAction;
}

// deno-lint-ignore no-explicit-any
type Json = Record<string, any>;

function str(v: unknown): string | null {
  if (typeof v === "string" && v.trim()) return v;
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return null;
}

function isoOrNull(v: unknown): string | null {
  const s = str(v);
  if (!s) return null;
  const t = Date.parse(s);
  return Number.isFinite(t) ? new Date(t).toISOString() : null;
}

/**
 * Turns a verified Lemon Squeezy webhook payload into what the webhook should do.
 * Only events whose `data` is a `subscriptions` object change entitlement; orders (including
 * `order_created`), subscription invoices (`subscription_payment_*`) and anything unknown are
 * recorded in the ledger and otherwise ignored. A one-off order never grants pro.
 */
export function parseLemonSqueezyEvent(payload: Json, now: Date = new Date()): ParsedBillingEvent {
  const meta = (payload?.meta ?? {}) as Json;
  const eventName = str(meta.event_name) ?? "unknown";
  const rawUser = meta.custom_data?.user_id;
  const userId = isUuid(rawUser) ? rawUser : null;
  const webhookId = str(meta.webhook_id);

  const data = (payload?.data ?? {}) as Json;
  const attrs = (data.attributes ?? {}) as Json;

  if (data.type !== "subscriptions") {
    const reason = eventName === "order_created"
      ? "order_created carries no subscription state; entitlement comes from subscription_* events"
      : `event data type "${String(data.type ?? "none")}" does not change entitlement`;
    return { eventName, userId, webhookId, action: { kind: "record_only", reason } };
  }

  const subId = str(data.id);
  const status = str(attrs.status);
  if (!subId || !status) {
    return { eventName, userId, webhookId, action: { kind: "record_only", reason: "subscription without id/status" } };
  }

  const endsAt = isoOrNull(attrs.ends_at);
  const subscription: SubscriptionSnapshot = {
    provider_subscription_id: subId,
    provider_customer_id: str(attrs.customer_id),
    status,
    variant_id: str(attrs.variant_id),
    plan: str(attrs.variant_name) ?? str(attrs.product_name),
    renews_at: isoOrNull(attrs.renews_at),
    ends_at: endsAt,
    trial_ends_at: isoOrNull(attrs.trial_ends_at),
    updated_at: isoOrNull(attrs.updated_at) ?? now.toISOString(),
  };
  const entitlement = entitlementForTier(tierForSubscription(status, endsAt, now));
  return { eventName, userId, webhookId, action: { kind: "subscription", subscription, entitlement } };
}

/** Hex SHA-256 of a string (WebCrypto; works in Deno and Node 20+). */
export async function sha256Hex(input: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Ledger idempotency key. Lemon Squeezy does not document a per-delivery event id
 * (meta.webhook_id may identify the webhook configuration rather than the event), so the key
 * is the hash of the signed raw body: a retried delivery of the same event is byte-identical.
 */
export async function billingEventId(rawBody: string): Promise<string> {
  return `sha256:${await sha256Hex(rawBody)}`;
}
