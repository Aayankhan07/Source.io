// Lemon Squeezy billing webhook. Authenticated by HMAC-SHA256 (X-Signature), not by JWT:
// config.toml sets verify_jwt = false for this function.
//
// Every verified event is written once to public.billing_events (idempotent by event id).
// Events whose data is a subscription upsert public.subscriptions (out-of-order deliveries
// older than the stored state are ignored) and set the profile tier/limits derived from the
// subscription state, all in one transaction (apply_billing_event RPC).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { verifyHmacSha256Hex } from "../_shared/webhookSignature.ts";
import { billingEventId, parseLemonSqueezyEvent } from "../_shared/billing.ts";
import { createLogger } from "../_shared/log.ts";

const WEBHOOK_SECRET = Deno.env.get("LEMONSQUEEZY_WEBHOOK_SECRET") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function json(data: unknown, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed", code: "METHOD_NOT_ALLOWED" }, 405);
  const log = createLogger("billing-webhook");

  // Fail closed: without a secret no event can be authenticated. 500 makes Lemon Squeezy retry
  // once the secret has been configured.
  if (!WEBHOOK_SECRET) {
    log.error("LEMONSQUEEZY_WEBHOOK_SECRET not set; refusing webhook");
    return json({ error: "Webhook not configured", code: "NOT_CONFIGURED" }, 500);
  }

  const signature = req.headers.get("x-signature") ?? "";
  const rawBody = await req.text();
  if (!(await verifyHmacSha256Hex(WEBHOOK_SECRET, signature, rawBody))) {
    return json({ error: "Invalid signature", code: "INVALID_SIGNATURE" }, 401);
  }

  // deno-lint-ignore no-explicit-any
  let payload: Record<string, any>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return json({ error: "Invalid JSON", code: "INVALID_JSON" }, 400);
  }

  const event = parseLemonSqueezyEvent(payload);
  const eventId = await billingEventId(rawBody);

  // The checkout link always passes checkout[custom][user_id] (PlanBillingSettings.tsx).
  // Without it a subscription cannot be attributed; reject so it shows up as failed in the
  // Lemon Squeezy dashboard instead of silently granting nothing.
  if (event.action.kind === "subscription" && !event.userId) {
    log.warn("subscription event without a valid custom_data.user_id", { event: event.eventName, eventId });
    return json({ error: "Missing or invalid user_id in payload metadata", code: "MISSING_USER_ID" }, 400);
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const { data: outcome, error } = await admin.rpc("apply_billing_event", {
    p_event_id: eventId,
    p_event_name: event.eventName,
    p_user_id: event.userId,
    p_webhook_id: event.webhookId,
    p_payload: payload,
    p_subscription: event.action.kind === "subscription" ? event.action.subscription : null,
    p_entitlement: event.action.kind === "subscription" ? event.action.entitlement : null,
  });
  if (error) {
    // 500 => Lemon Squeezy retries; the transaction rolled back, so the retry is not a duplicate.
    log.error("apply_billing_event failed", { err: error, event: event.eventName, eventId });
    return json({ error: "Database update failed", code: "DB_ERROR" }, 500);
  }

  log.info("billing event processed", {
    event: event.eventName,
    eventId,
    userId: event.userId,
    outcome,
    tier: event.action.kind === "subscription" ? event.action.entitlement.tier : null,
    note: event.action.kind === "record_only" ? event.action.reason : undefined,
  });
  return json({ received: true, event: event.eventName, outcome }, 200);
});
