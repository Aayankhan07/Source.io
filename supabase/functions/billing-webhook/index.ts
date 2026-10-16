import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const WEBHOOK_SECRET = Deno.env.get("LEMONSQUEEZY_WEBHOOK_SECRET") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.trim();
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleanHex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

async function verifyHmacSignature(secret: string, signature: string, bodyText: string): Promise<boolean> {
  if (!secret) {
    console.warn("LEMONSQUEEZY_WEBHOOK_SECRET not set; rejecting unauthenticated webhook");
    return false;
  }
  if (!signature) return false;

  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    return await crypto.subtle.verify(
      "HMAC",
      key,
      hexToBytes(signature),
      new TextEncoder().encode(bodyText)
    );
  } catch (err) {
    console.error("Signature verification error:", err);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const signature = req.headers.get("x-signature") ?? "";
  const rawBody = await req.text();

  // If secret is set, strictly verify HMAC SHA-256 signature
  if (WEBHOOK_SECRET) {
    const isValid = await verifyHmacSignature(WEBHOOK_SECRET, signature, rawBody);
    if (!isValid) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  let payload: Record<string, any>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const eventName = payload.meta?.event_name as string | undefined;
  const customData = payload.meta?.custom_data ?? {};
  let userId = customData?.user_id as string | undefined;

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  // Fallback to customer email lookup if custom_data.user_id wasn't passed in checkout URL
  if (!userId) {
    const userEmail = payload.data?.attributes?.user_email as string | undefined;
    if (userEmail) {
      const { data: userRecord } = await admin
        .from("profiles")
        .select("id, user_id")
        .eq("display_name", userEmail)
        .maybeSingle();

      if (userRecord) {
        userId = userRecord.user_id || userRecord.id;
      }
    }
  }

  if (!userId) {
    console.warn("Webhook received without identifiable user_id:", eventName);
    return new Response(JSON.stringify({ error: "Missing user_id in payload metadata" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  console.log(`Processing billing webhook [${eventName}] for user ${userId}`);

  // Upgrade on new subscription or successful one-off pass order
  if (
    eventName === "subscription_created" ||
    eventName === "subscription_resumed" ||
    eventName === "order_created"
  ) {
    const { error: updateErr } = await admin
      .from("profiles")
      .update({
        tier: "pro",
        daily_quota_limit: 200,
        daily_tts_quota_limit: 50,
        updated_at: new Date().toISOString(),
      })
      .or(`id.eq.${userId},user_id.eq.${userId}`);

    if (updateErr) {
      console.error("Failed to upgrade profile:", updateErr);
      return new Response(JSON.stringify({ error: "Database update failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`User ${userId} upgraded to Pro / Scholar Pass`);
  } else if (
    eventName === "subscription_cancelled" ||
    eventName === "subscription_expired"
  ) {
    const { error: downgradeErr } = await admin
      .from("profiles")
      .update({
        tier: "free",
        daily_quota_limit: 25,
        daily_tts_quota_limit: 2,
        updated_at: new Date().toISOString(),
      })
      .or(`id.eq.${userId},user_id.eq.${userId}`);

    if (downgradeErr) {
      console.error("Failed to downgrade profile:", downgradeErr);
      return new Response(JSON.stringify({ error: "Database update failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`User ${userId} subscription expired/cancelled; reverted to Free`);
  }

  return new Response(JSON.stringify({ received: true, event: eventName }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
