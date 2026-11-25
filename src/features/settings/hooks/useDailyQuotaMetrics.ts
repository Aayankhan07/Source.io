import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useProviderQuota } from "@/features/settings/context/ProviderQuotaContext";
import { supabase } from "@/integrations/supabase/client";
import { accountKeys } from "@/lib/queryKeys";

export const DAILY_FREE_LIMIT = 25;

/** Features that consume a daily AI action (see consume_daily_quota callers). */
const BILLABLE_FEATURES = new Set(["chat", "notes", "derivatives", "podcast"]);

export interface DailyUsageStats {
  /** Actions used today, from profiles.daily_quota_used (the number the server enforces). */
  total: number;
  /** Today's limit for this user's plan, from profiles.daily_quota_limit. */
  limit: number;
  chat: number;
  notes: number;
  derivatives: number;
}

export function useDailyQuotaMetrics() {
  const { user } = useAuth();
  const providerKey = useProviderQuota();

  // Live countdown to midnight UTC
  const [timeUntilReset, setTimeUntilReset] = useState<string>("");

  useEffect(() => {
    function updateCountdown() {
      const now = new Date();
      const tomorrowUtc = new Date();
      tomorrowUtc.setUTCHours(24, 0, 0, 0);
      const diffMs = tomorrowUtc.getTime() - now.getTime();

      if (diffMs <= 0) {
        setTimeUntilReset("0h 0m");
        return;
      }

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      setTimeUntilReset(`${hours} hours ${minutes} minutes`);
    }

    updateCountdown();
    const interval = setInterval(updateCountdown, 15_000);
    return () => clearInterval(interval);
  }, []);

  // Fetch count of today's user actions from ai_usage_logs
  const { data: usageStats = { total: 0, limit: DAILY_FREE_LIMIT, chat: 0, notes: 0, derivatives: 0 } } = useQuery<DailyUsageStats>({
    queryKey: accountKeys.dailyUsage(user?.id),
    enabled: !!user?.id,
    queryFn: async () => {
      const todayUtc = new Date();
      todayUtc.setUTCHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from("ai_usage_logs")
        .select("feature")
        .eq("user_id", user!.id)
        .gte("created_at", todayUtc.toISOString())
        .neq("status", "failed");

      const { data: profile } = await supabase
        .from("profiles")
        .select("daily_quota_used, daily_quota_limit, quota_reset_date")
        .eq("user_id", user!.id)
        .maybeSingle();
      const todayStr = todayUtc.toISOString().slice(0, 10);
      const limit = profile?.daily_quota_limit ?? DAILY_FREE_LIMIT;
      const enforcedUsed = profile?.quota_reset_date === todayStr ? (profile?.daily_quota_used ?? 0) : 0;

      if (error || !data) {
        return { total: enforcedUsed, limit, chat: 0, notes: 0, derivatives: 0 };
      }

      let chat = 0;
      let notes = 0;
      let derivatives = 0;

      for (const row of data) {
        if (!BILLABLE_FEATURES.has(row.feature)) continue;
        if (row.feature === "chat") chat++;
        else if (row.feature === "notes") notes++;
        else if (row.feature === "derivatives") derivatives++;
      }

      return {
        total: enforcedUsed,
        limit,
        chat,
        notes,
        derivatives,
      };
    },
    refetchInterval: 15_000,
  });

  const activeByokProvider = providerKey.providerLabel;
  const hasByok = providerKey.hasByok;
  const usageCount = usageStats.total;
  const dailyLimit = usageStats.limit || DAILY_FREE_LIMIT;
  const remaining = Math.max(0, dailyLimit - usageCount);
  const percentUsed = Math.min(100, Math.round((usageCount / dailyLimit) * 100));
  const percentAllowanceRemaining = Math.max(0, 100 - percentUsed);

  // With their own key the provider's limits apply, which the browser can't see: show the key, not a %.
  const displayPercentage = hasByok ? 100 : percentAllowanceRemaining;
  const pillText = hasByok ? `Your ${activeByokProvider} key` : `${percentAllowanceRemaining}% limit left`;

  const glowClasses = useMemo(() => {
    if (hasByok) {
      return "!border-slate-400 text-slate-900 dark:text-slate-100 hover:!border-slate-500 shadow-xs";
    }
    if (remaining === 0) {
      return "!border-slate-900/60 shadow-xs text-slate-900 dark:text-slate-100";
    }
    if (remaining <= 3) {
      return "!border-slate-400 shadow-xs text-slate-900 dark:text-slate-100";
    }
    return "text-slate-800 dark:text-slate-100";
  }, [hasByok, remaining]);

  return {
    usageStats,
    usageCount,
    dailyLimit,
    remaining,
    percentAllowanceRemaining,
    displayPercentage,
    pillText,
    glowClasses,
    hasByok,
    activeByokProvider,
    byokLast4: providerKey.last4,
    timeUntilReset,
  };
}
