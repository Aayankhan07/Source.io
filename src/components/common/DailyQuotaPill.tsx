"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useSettings } from "@/features/settings/context/SettingsContext";
import { useAppShell } from "@/features/documents/context/AppShellContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Key, Clock, Zap, AlertTriangle, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const DAILY_FREE_LIMIT = 25;

export function DailyQuotaPill() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { settings } = useSettings();
  const { copilotOpen } = useAppShell();
  const [popoverOpen, setPopoverOpen] = useState(false);

  const isDocWorkspace = pathname.startsWith("/app/doc/");

  // Calculate live countdown to midnight UTC
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
      setTimeUntilReset(`${hours}h ${minutes}m`);
    }

    updateCountdown();
    const interval = setInterval(updateCountdown, 15_000);
    return () => clearInterval(interval);
  }, []);

  // Fetch count of today's chat queries from ai_usage_logs
  const { data: usageCount = 0 } = useQuery({
    queryKey: ["daily_ai_chat_usage", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const todayUtc = new Date();
      todayUtc.setUTCHours(0, 0, 0, 0);

      const { count, error } = await supabase
        .from("ai_usage_logs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("feature", "chat")
        .gte("created_at", todayUtc.toISOString())
        .neq("status", "failed");

      if (error) {
        console.warn("Failed to fetch daily quota usage:", error);
        return 0;
      }
      return count ?? 0;
    },
    refetchInterval: 15_000,
  });

  const hasByok = Boolean(
    settings?.apiKeys?.groq?.trim() ||
    settings?.apiKeys?.gemini?.trim() ||
    settings?.apiKeys?.openai?.trim()
  );

  const remaining = Math.max(0, DAILY_FREE_LIMIT - usageCount);
  const percentUsed = Math.min(100, Math.round((usageCount / DAILY_FREE_LIMIT) * 100));

  // Dynamic collision avoidance:
  // When inside a document workspace AND copilot is open, shift to bottom-5 left-28
  // (safely clear of both the left dock at left-20 and the chat input on the right rail).
  // Everywhere else, float at bottom-5 right-6.
  const positionClasses = useMemo(() => {
    if (isDocWorkspace && copilotOpen) {
      return "bottom-5 left-[110px] md:left-[116px]";
    }
    return "bottom-5 right-6";
  }, [isDocWorkspace, copilotOpen]);

  // Alert glowing state styles
  const glowClasses = useMemo(() => {
    if (hasByok) {
      return "border-emerald-500/30 text-emerald-950 dark:text-emerald-100 hover:border-emerald-500/50";
    }
    if (remaining === 0) {
      return "border-rose-500/60 shadow-[0_0_16px_rgba(244,63,94,0.3)] text-rose-900 dark:text-rose-200 animate-pulse";
    }
    if (remaining <= 3) {
      return "border-amber-400/60 shadow-[0_0_14px_rgba(251,191,36,0.3)] text-amber-900 dark:text-amber-200";
    }
    return "border-black/[0.08] dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-black/20 dark:hover:border-white/20";
  }, [hasByok, remaining]);

  return (
    <div
      className={cn(
        "fixed z-40 transition-all duration-300 ease-out select-none",
        positionClasses
      )}
    >
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "group h-8 px-3 rounded-full flex items-center gap-2 cursor-pointer",
              "bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-tactile-pill",
              "hover:scale-105 active:scale-95 transition-all text-xs font-semibold",
              glowClasses
            )}
            title="Daily AI Copilot Quota"
          >
            {hasByok ? (
              <>
                <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Unlimited (BYOK)</span>
              </>
            ) : remaining === 0 ? (
              <>
                <AlertTriangle className="size-3.5 text-rose-500" />
                <span className="font-bold">0 / {DAILY_FREE_LIMIT} left</span>
              </>
            ) : (
              <>
                <Sparkles
                  className={cn(
                    "size-3.5",
                    remaining <= 3 ? "text-amber-500" : "text-purple-600 dark:text-purple-400"
                  )}
                />
                <span className="tabular-nums font-medium">
                  {remaining} / {DAILY_FREE_LIMIT} left
                </span>
                {/* Micro Progress Bar */}
                <div className="w-10 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden ml-0.5">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-300",
                      remaining <= 3
                        ? "bg-amber-500"
                        : "bg-purple-600 dark:bg-purple-400"
                    )}
                    style={{ width: `${Math.max(6, 100 - percentUsed)}%` }}
                  />
                </div>
              </>
            )}
          </button>
        </PopoverTrigger>

        <PopoverContent
          side="top"
          align={isDocWorkspace && copilotOpen ? "start" : "end"}
          sideOffset={8}
          className="w-72 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-black/[0.08] dark:border-white/10 shadow-tactile-card backdrop-blur-md text-foreground"
        >
          <div className="space-y-3.5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Zap className="size-4 text-purple-600 dark:text-purple-400" />
                <h4 className="font-bold text-xs font-display">Daily AI Copilot Quota</h4>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                {hasByok ? "BYOK Active" : "Free Plan"}
              </span>
            </div>

            {hasByok ? (
              <div className="space-y-2">
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Your custom API key is active. You have unrestricted, zero-limit questions to Ask Copilot.
                </p>
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-[11px] text-emerald-800 dark:text-emerald-300 font-medium flex items-center gap-2">
                  <ShieldCheck className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>Unlimited requests enabled</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Used today:</span>
                  <span className="font-bold tabular-nums">
                    {usageCount} of {DAILY_FREE_LIMIT} questions
                  </span>
                </div>

                <Progress value={percentUsed} className="h-2 rounded-full" />

                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="size-3 text-slate-400" />
                    <span>Resets in {timeUntilReset || "midnight UTC"}</span>
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">00:00 UTC</span>
                </div>

                {remaining === 0 && (
                  <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-[11px] text-rose-800 dark:text-rose-300 font-medium">
                    Daily free questions used up. Add your free Groq or Gemini API key to keep asking without limits.
                  </div>
                )}
              </div>
            )}

            {/* BYOK Shortcut button */}
            <button
              onClick={() => {
                setPopoverOpen(false);
                router.push("/app/settings");
              }}
              className="w-full h-8 px-3 rounded-full text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Key className="size-3 text-slate-500" />
              <span>{hasByok ? "Manage API Keys" : "Add Free API Key for Unlimited"}</span>
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default DailyQuotaPill;
