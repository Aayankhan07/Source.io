import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

/**
 * Result of an atomic quota consumption.
 * `unavailable` is set when the quota could not be checked (DB/RPC error). Quotas
 * fail CLOSED: an unavailable check never grants an action, because an outage here
 * would otherwise mean unlimited AI spend.
 */
export interface QuotaResult {
  allowed: boolean;
  unavailable?: true;
}

async function consumeViaRpc(
  admin: SupabaseClient,
  rpcName: "consume_daily_quota" | "consume_daily_tts_quota",
  userId: string,
  cost: number,
): Promise<QuotaResult> {
  try {
    const { data: allowed, error } = await admin.rpc(rpcName, {
      p_user_id: userId,
      p_cost: cost,
    });
    if (error) {
      console.error(`${rpcName} RPC failed; denying (fail closed):`, error.message);
      return { allowed: false, unavailable: true };
    }
    return allowed ? { allowed: true } : { allowed: false };
  } catch (err) {
    console.error(`${rpcName} threw; denying (fail closed):`, err);
    return { allowed: false, unavailable: true };
  }
}

/** Atomically consumes daily AI actions via the row-locked `consume_daily_quota` RPC. */
export function consumeDailyQuota(admin: SupabaseClient, userId: string, cost: number = 1): Promise<QuotaResult> {
  return consumeViaRpc(admin, "consume_daily_quota", userId, cost);
}

/** Atomically consumes daily TTS renders via the row-locked `consume_daily_tts_quota` RPC. */
export function consumeDailyTtsQuota(admin: SupabaseClient, userId: string, cost: number = 1): Promise<QuotaResult> {
  return consumeViaRpc(admin, "consume_daily_tts_quota", userId, cost);
}

/**
 * Skips the quota for genuine BYOK requests (decided server-side), otherwise consumes 1 action.
 * Returns null if allowed, 429 if the quota is exceeded, 503 if the quota check is unavailable.
 */
export async function enforceDailyQuota(
  admin: SupabaseClient,
  userId: string,
  corsHeaders: Record<string, string>,
  options: {
    isByok: boolean;
    errorMessage?: string;
  },
): Promise<Response | null> {
  if (options.isByok) return null;

  const quota = await consumeDailyQuota(admin, userId, 1);
  if (quota.allowed) return null;

  if (quota.unavailable) {
    return new Response(
      JSON.stringify({
        error: "Usage limits are temporarily unavailable. Please retry in a minute.",
        code: "QUOTA_UNAVAILABLE",
        retryable: true,
      }),
      { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  return new Response(
    JSON.stringify({
      error:
        options.errorMessage ||
        "Daily free generation limit reached. Upgrade to Scholar Pass or add your own Groq API key in Settings.",
      quotaExceeded: true,
      code: "QUOTA_EXCEEDED",
    }),
    { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}

/**
 * Read-only check of how many logged actions a user has made today for a feature.
 * Fails closed (allowed: false) if the usage log cannot be read.
 */
export async function checkDailyQuota(
  admin: SupabaseClient,
  userId: string,
  feature: string = "chat",
  maxDaily: number = 25,
): Promise<{ allowed: boolean; used: number; remaining: number }> {
  try {
    const todayUtc = new Date();
    todayUtc.setUTCHours(0, 0, 0, 0);

    const { count, error } = await admin
      .from("ai_usage_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("feature", feature)
      .gte("created_at", todayUtc.toISOString())
      .neq("status", "failed");

    if (error) {
      console.error("Quota check error; denying (fail closed):", error);
      return { allowed: false, used: 0, remaining: 0 };
    }

    const used = count ?? 0;
    return { allowed: used < maxDaily, used, remaining: Math.max(0, maxDaily - used) };
  } catch (err) {
    console.error("checkDailyQuota threw; denying (fail closed):", err);
    return { allowed: false, used: 0, remaining: 0 };
  }
}
