// Lemon Squeezy billing webhook. Authenticated by HMAC-SHA256 (X-Signature), not by JWT:
// config.toml sets verify_jwt = false for this function.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { isUuid, verifyHmacSha256Hex } from "../_shared/webhookSignature.ts";

const WEBHOOK_SECRET = Deno.env.get("LEMONSQUEEZY_WEBHOOK_SECRET") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const UPGRADE_EVENTS = new Set(["subscription_created", "subscription_resumed", "order_created"]);
const DOWNGRADE_EVENTS = new Set(["subscription_cancelled", "subscription_expired"]);

function json(data: unknown, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  // Fail closed: without a secret no event can be authenticated. 500 makes Lemon Squeezy retry
  // once the secret has been configured.
  if (!WEBHOOK_SECRET) {
    console.error("LEMONSQUEEZY_WEBHOOK_SECRET not set; refusing webhook");
    return json({ error: "Webhook not configured" }, 500);
  }

  const signature = req.headers.get("x-signature") ?? "";
  const rawBody = await req.text();
  if (!(await verifyHmacSha256Hex(WEBHOOK_SECRET, signature, rawBody))) {
    return json({ error: "Invalid signature" }, 401);
  }

  // deno-lint-ignore no-explicit-any
  let payload: Record<string, any>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const eventName = payload.meta?.event_name as string | undefined;
  // The checkout link always passes checkout[custom][user_id] (PlanBillingSettings.tsx).
  const userId = payload.meta?.custom_data?.user_id;
  if (!isUuid(userId)) {
    console.warn("Webhook without a valid custom_data.user_id:", eventName);
    return json({ error: "Missing or invalid user_id in payload metadata" }, 400);
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  let update: Record<string, unknown> | null = null;
  if (eventName && UPGRADE_EVENTS.has(eventName)) {
    update = { tier: "pro", daily_quota_limit: 200, daily_tts_quota_limit: 50 };
  } else if (eventName && DOWNGRADE_EVENTS.has(eventName)) {
    update = { tier: "free", daily_quota_limit: 25, daily_tts_quota_limit: 2 };
  }

  if (update) {
    const { error } = await admin
      .from("profiles")
      .update({ ...update, updated_at: new Date().toISOString() })
      .eq("user_id", userId);
    if (error) {
      console.error(`Failed to apply ${eventName} for ${userId}:`, error);
      return json({ error: "Database update failed" }, 500);
    }
    console.log(`Applied ${eventName} for user ${userId}: tier=${update.tier}`);
  }

  return json({ received: true, event: eventName }, 200);
});
