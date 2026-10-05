import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

/**
 * Checks an emergency circuit breaker before executing costly operations.
 * Fails open if an unexpected database error occurs so routine telemetry outages don't brick the app.
 */
export async function checkCircuitBreaker(
  admin: SupabaseClient,
  key: "ai_requests_enabled" | "uploads_enabled" | "podcasts_enabled"
): Promise<{ allowed: boolean; message?: string }> {
  try {
    const { data } = await admin
      .from("system_circuit_breakers")
      .select("enabled")
      .eq("key", key)
      .maybeSingle();

    if (data && data.enabled === false) {
      if (key === "podcasts_enabled") {
        return {
          allowed: false,
          message: "Podcast generation is temporarily limited on the free student plan. Your saved notes are safe.",
        };
      }
      if (key === "uploads_enabled") {
        return {
          allowed: false,
          message: "New uploads are temporarily paused for routine system maintenance. Please try again shortly.",
        };
      }
      return {
        allowed: false,
        message: "AI processing is temporarily paused for routine system maintenance. Your saved notes are safe.",
      };
    }
    return { allowed: true };
  } catch (err) {
    console.warn("Circuit breaker check failed, failing open:", err);
    return { allowed: true };
  }
}
