import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

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
