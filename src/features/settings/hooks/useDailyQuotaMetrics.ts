import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useSettings } from "@/features/settings/context/SettingsContext";
import { useProviderQuota } from "@/features/settings/context/ProviderQuotaContext";
import { supabase } from "@/integrations/supabase/client";

export const DAILY_FREE_LIMIT = 25;

export interface DailyUsageStats {
  total: number;
  chat: number;
  notes: number;
  derivatives: number;
}

export function useDailyQuotaMetrics() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const { quota: providerQuota, refreshQuota } = useProviderQuota();

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
  const { data: usageStats = { total: 0, chat: 0, notes: 0, derivatives: 0 } } = useQuery<DailyUsageStats>({
    queryKey: ["daily_ai_actions_usage", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      if (user?.id === "guest-user-01") {
        return { total: 0, chat: 0, notes: 0, derivatives: 0 };
      }

      const todayUtc = new Date();
      todayUtc.setUTCHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from("ai_usage_logs")
        .select("feature")
        .eq("user_id", user!.id)
        .gte("created_at", todayUtc.toISOString())
        .neq("status", "failed");

      if (error || !data) {
        return { total: 0, chat: 0, notes: 0, derivatives: 0 };
      }

      let chat = 0;
      let notes = 0;
      let derivatives = 0;

      for (const row of data) {
        if (row.feature === "chat") chat++;
        else if (row.feature === "notes") notes++;
        else if (row.feature === "derivatives") derivatives++;
      }

      return {
        total: data.length,
        chat,
        notes,
        derivatives,
      };
    },
    refetchInterval: 15_000,
  });

  const activeByokProvider = useMemo(() => {
    if (settings?.apiKeys?.groq?.trim()) return "Groq";
    if (settings?.apiKeys?.gemini?.trim()) return "Google Gemini";
    if (settings?.apiKeys?.openai?.trim()) return "OpenAI";
    return null;
  }, [settings?.apiKeys]);

  const hasByok = Boolean(activeByokProvider);
  const usageCount = usageStats.total;
  const remaining = Math.max(0, DAILY_FREE_LIMIT - usageCount);
  const percentUsed = Math.min(100, Math.round((usageCount / DAILY_FREE_LIMIT) * 100));
  const percentAllowanceRemaining = Math.max(0, 100 - percentUsed);

  const displayPercentage = useMemo(() => {
    if (hasByok && providerQuota.percentRemaining != null) {
      return providerQuota.percentRemaining;
    }
    return percentAllowanceRemaining;
  }, [hasByok, providerQuota.percentRemaining, percentAllowanceRemaining]);

  const pillText = useMemo(() => {
    if (hasByok) {
      if (providerQuota.percentRemaining != null) {
        return `${activeByokProvider} ${providerQuota.percentRemaining}% limit left`;
      }
      if (providerQuota.remainingTokens != null && providerQuota.limitTokens != null) {
        const remK = Math.round(providerQuota.remainingTokens / 1000);
        const limK = Math.round(providerQuota.limitTokens / 1000);
        return `${remK}k/${limK}k tokens left`;
      }
      return `${activeByokProvider} Connected`;
    }
    return `${displayPercentage}% limit left`;
  }, [hasByok, providerQuota, activeByokProvider, displayPercentage]);

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
    remaining,
    percentAllowanceRemaining,
    displayPercentage,
    pillText,
    glowClasses,
    hasByok,
    activeByokProvider,
    providerQuota,
    refreshQuota,
    timeUntilReset,
  };
}
