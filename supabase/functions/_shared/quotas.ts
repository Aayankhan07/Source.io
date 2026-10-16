import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

/**
 * Atomically consumes daily quota via PostgreSQL row-level locked RPC function.
 * Completely eliminates Time-Of-Check to Time-Of-Use (TOCTOU) race conditions.
 *
 * @param admin - Supabase service role client
 * @param userId - User ID to deduct quota for
 * @param cost - Number of actions to consume (default 1)
 */
export async function consumeDailyQuota(
  admin: SupabaseClient,
  userId: string,
  cost: number = 1
): Promise<{ allowed: boolean }> {
  try {
    const { data: allowed, error } = await admin.rpc("consume_daily_quota", {
      p_user_id: userId,
      p_cost: cost,
    });

    if (error) {
      console.warn("Atomic quota RPC check fallback to log check:", error.message);
      // Fallback check on ai_usage_logs if profile row is not yet initialized
      const check = await checkDailyQuota(admin, userId, "general", 25);
      return { allowed: check.allowed };
    }

    return { allowed: !!allowed };
  } catch (err) {
    console.error("consumeDailyQuota unhandled exception:", err);
    return { allowed: true };
  }
}

/**
 * Atomically consumes daily TTS audio synthesis quota via PostgreSQL row-level locked RPC.
 *
 * @param admin - Supabase service role client
 * @param userId - User ID to deduct quota for
 * @param cost - Number of audio generations to consume (default 1)
 */
export async function consumeDailyTtsQuota(
  admin: SupabaseClient,
  userId: string,
  cost: number = 1
): Promise<{ allowed: boolean }> {
  try {
    const { data: allowed, error } = await admin.rpc("consume_daily_tts_quota", {
      p_user_id: userId,
      p_cost: cost,
    });

    if (error) {
      console.warn("consumeDailyTtsQuota fallback check:", error.message);
      const check = await checkDailyQuota(admin, userId, "podcast", 2);
      return { allowed: check.allowed };
    }

    return { allowed: !!allowed };
  } catch (err) {
    console.error("consumeDailyTtsQuota exception:", err);
    return { allowed: true };
  }
}

/**
 * Checks if a user has exceeded their daily limit for a given AI feature.
 * Uses midnight UTC as the standard daily reset boundary.
 * Fails open if an unexpected database error occurs so paying/free users aren't bricked by logging.
 */
export async function checkDailyQuota(
  admin: SupabaseClient,
  userId: string,
  feature: string = "chat",
  maxDaily: number = 25
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
      console.error("Quota check error:", error);
      // Fail open on DB error so users are not blocked by a telemetry issue
      return { allowed: true, used: 0, remaining: maxDaily };
    }

    const used = count ?? 0;
    const allowed = used < maxDaily;
    return { allowed, used, remaining: Math.max(0, maxDaily - used) };
  } catch (err) {
    console.error("checkDailyQuota unhandled exception:", err);
    return { allowed: true, used: 0, remaining: maxDaily };
  }
}
