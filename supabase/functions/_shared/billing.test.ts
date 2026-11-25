import { describe, it, expect } from "vitest";
import {
  billingEventId,
  entitlementForTier,
  parseLemonSqueezyEvent,
  tierForSubscription,
} from "./billing";

const USER = "11111111-1111-4111-8111-111111111111";
const NOW = new Date("2026-11-26T12:00:00Z");

function subEvent(eventName: string, attrs: Record<string, unknown>, extraMeta: Record<string, unknown> = {}) {
  return {
    meta: { event_name: eventName, custom_data: { user_id: USER }, ...extraMeta },
    data: {
      type: "subscriptions",
      id: "12345",
      attributes: {
        customer_id: 99,
        variant_id: 7,
        variant_name: "Scholar Pass",
        renews_at: "2026-12-26T12:00:00Z",
        ends_at: null,
        trial_ends_at: null,
        updated_at: "2026-11-26T11:00:00.000000Z",
        ...attrs,
      },
    },
  };
}

describe("tierForSubscription", () => {
  it.each(["active", "on_trial", "past_due"])("%s grants pro", (status) => {
    expect(tierForSubscription(status, null, NOW)).toBe("pro");
  });

  it.each(["expired", "unpaid", "paused", "something_new", null, undefined])("%s is free", (status) => {
    expect(tierForSubscription(status as string, "2099-01-01T00:00:00Z", NOW)).toBe("free");
  });

  it("cancelled keeps pro until ends_at", () => {
    expect(tierForSubscription("cancelled", "2026-12-01T00:00:00Z", NOW)).toBe("pro");
    expect(tierForSubscription("cancelled", "2026-11-01T00:00:00Z", NOW)).toBe("free");
  });

  it("cancelled without a valid ends_at is free", () => {
    expect(tierForSubscription("cancelled", null, NOW)).toBe("free");
    expect(tierForSubscription("cancelled", "not a date", NOW)).toBe("free");
  });
});

describe("entitlementForTier", () => {
  it("matches the plan limits", () => {
    expect(entitlementForTier("pro")).toEqual({
      tier: "pro", daily_quota_limit: 200, daily_tts_quota_limit: 50, active_docs_limit: 100,
    });
    expect(entitlementForTier("free")).toEqual({
      tier: "free", daily_quota_limit: 25, daily_tts_quota_limit: 2, active_docs_limit: 3,
    });
  });
});

describe("parseLemonSqueezyEvent", () => {
  it("maps a subscription event to a snapshot and entitlement", () => {
    const e = parseLemonSqueezyEvent(subEvent("subscription_created", { status: "active" }, { webhook_id: "wh_1" }), NOW);
    expect(e.eventName).toBe("subscription_created");
    expect(e.userId).toBe(USER);
    expect(e.webhookId).toBe("wh_1");
    expect(e.action.kind).toBe("subscription");
    if (e.action.kind !== "subscription") return;
    expect(e.action.subscription).toMatchObject({
      provider_subscription_id: "12345",
      provider_customer_id: "99",
      status: "active",
      variant_id: "7",
      plan: "Scholar Pass",
      renews_at: "2026-12-26T12:00:00.000Z",
      ends_at: null,
      updated_at: "2026-11-26T11:00:00.000Z",
    });
    expect(e.action.entitlement.tier).toBe("pro");
  });

  it("subscription_cancelled keeps pro until ends_at, expired downgrades", () => {
    const cancelled = parseLemonSqueezyEvent(
      subEvent("subscription_cancelled", { status: "cancelled", ends_at: "2026-12-26T12:00:00Z" }), NOW);
    expect(cancelled.action.kind === "subscription" && cancelled.action.entitlement.tier).toBe("pro");

    const expired = parseLemonSqueezyEvent(
      subEvent("subscription_expired", { status: "expired", ends_at: "2026-11-25T12:00:00Z" }), NOW);
    expect(expired.action.kind === "subscription" && expired.action.entitlement.tier).toBe("free");
  });

  it("order_created never grants pro (record only)", () => {
    const e = parseLemonSqueezyEvent({
      meta: { event_name: "order_created", custom_data: { user_id: USER } },
      data: { type: "orders", id: "1", attributes: { status: "paid" } },
    }, NOW);
    expect(e.action.kind).toBe("record_only");
  });

  it("subscription invoices do not change entitlement", () => {
    const e = parseLemonSqueezyEvent({
      meta: { event_name: "subscription_payment_failed", custom_data: { user_id: USER } },
      data: { type: "subscription-invoices", id: "5", attributes: { status: "pending" } },
    }, NOW);
    expect(e.action.kind).toBe("record_only");
  });

  it("rejects a non-uuid user id", () => {
    const e = parseLemonSqueezyEvent({
      meta: { event_name: "subscription_created", custom_data: { user_id: "not-a-uuid" } },
      data: { type: "subscriptions", id: "1", attributes: { status: "active" } },
    }, NOW);
    expect(e.userId).toBeNull();
  });

  it("falls back to now when updated_at is missing", () => {
    const e = parseLemonSqueezyEvent(subEvent("subscription_updated", { status: "active", updated_at: undefined }), NOW);
    expect(e.action.kind === "subscription" && e.action.subscription.updated_at).toBe(NOW.toISOString());
  });

  it("subscription without status is record only", () => {
    const e = parseLemonSqueezyEvent(subEvent("subscription_updated", { status: undefined }), NOW);
    expect(e.action.kind).toBe("record_only");
  });

  it("tolerates garbage payloads", () => {
    expect(parseLemonSqueezyEvent({}, NOW)).toMatchObject({ eventName: "unknown", userId: null });
  });
});

describe("billingEventId", () => {
  it("is stable for the same body and differs for different bodies", async () => {
    const a = await billingEventId('{"a":1}');
    expect(a).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(await billingEventId('{"a":1}')).toBe(a);
    expect(await billingEventId('{"a":2}')).not.toBe(a);
  });
});
