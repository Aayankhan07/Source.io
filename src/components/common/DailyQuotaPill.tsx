"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  Key, 
  Clock, 
  Zap, 
  AlertTriangle, 
  ShieldCheck, 
  Cpu, 
  ChevronDown, 
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDailyQuotaMetrics } from "@/features/settings/hooks/useDailyQuotaMetrics";

interface DailyQuotaPillProps {
  /** @deprecated The pill is always rendered inline now; kept so existing callers compile. */
  inline?: boolean;
}

export function DailyQuotaPill(_props: DailyQuotaPillProps = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [showAllowanceWhy, setShowAllowanceWhy] = useState(false);

  const {
    usageStats,
    usageCount,
    remaining,
    percentAllowanceRemaining,
    displayPercentage,
    pillText,
    glowClasses,
    hasByok,
    activeByokProvider,
    byokLast4,
    timeUntilReset,
    dailyLimit,
  } = useDailyQuotaMetrics();

  // Strictly guard: Only render inside the authenticated workspace (/app), never on the landing page
  const isAppRoute = pathname?.startsWith("/app");

  if (!isAppRoute) {
    return null;
  }

  const pillContent = (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`AI usage: ${pillText}. Show details`}
          className={cn(
            "group h-8 px-3 rounded-full flex items-center gap-1.5 cursor-pointer",
            "glass-tactile-pill",
            "hover:scale-105 active:scale-95 transition-all text-xs font-semibold",
            glowClasses
          )}
        >
          {hasByok ? (
            <ShieldCheck className="size-3.5 text-slate-900 dark:text-white" />
          ) : remaining === 0 ? (
            <AlertTriangle className="size-3.5 text-slate-900 dark:text-white" />
          ) : (
            <Zap className="size-3.5 text-slate-900 dark:text-white" />
          )}
          <span className="tabular-nums font-medium">
            {pillText}
          </span>
          {/* Live Progress Bar */}
          <div className="w-9 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden ml-0.5 border border-slate-300/40 dark:border-white/5">
            <div
              className="h-full rounded-full transition-all duration-300 bg-slate-900 dark:bg-white"
              style={{ width: `${Math.max(6, displayPercentage)}%` }}
            />
          </div>
        </button>
      </PopoverTrigger>

      <PopoverContent
        side="bottom"
        align="end"
        sideOffset={8}
        collisionPadding={12}
        className="w-[320px] p-4 rounded-[26px] bg-white/85 dark:bg-slate-900/85 backdrop-blur-2xl backdrop-saturate-150 border border-slate-200/80 dark:border-white/15 shadow-[0_20px_50px_rgba(15,23,42,0.12),inset_0_1px_1.5px_rgba(255,255,255,0.9)] dark:shadow-[0_24px_54px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.12)] text-foreground select-none"
      >
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between pb-0.5">
            <div className="flex items-center gap-1.5">
              <Zap className="size-4 text-slate-900 dark:text-white" />
              <h4 className="font-bold text-xs font-display text-slate-900 dark:text-white">API Quota</h4>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700">
                {hasByok ? `${activeByokProvider} Key` : "Free Tier"}
              </span>
            </div>
          </div>

          {/* Main Hero Allowance Card */}
          <div className="rounded-[20px] p-3.5 bg-white/45 dark:bg-white/[0.03] backdrop-blur-md border border-white/60 dark:border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.7)] dark:shadow-none space-y-2.5">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-2xl font-black font-display tracking-tight text-slate-900 dark:text-white">
                  {hasByok ? "Your key" : `${percentAllowanceRemaining}%`}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 ml-1.5 font-medium">
                  {hasByok ? `${activeByokProvider} limits apply` : `/ ${remaining} actions left`}
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                {hasByok ? (byokLast4 ? `••••${byokLast4}` : "Saved") : `${usageCount}/${dailyLimit} used`}
              </span>
            </div>

            {/* Progress Bar showing remaining allowance */}
            <div className="w-full h-2 rounded-full bg-slate-200/80 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 bg-slate-900 dark:bg-white"
                style={{ width: `${Math.max(4, displayPercentage)}%` }}
              />
            </div>

            {/* Reset Timer & Action Cost toggle */}
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-0.5">
              <span className="flex items-center gap-1">
                <Clock className="size-3 text-slate-400 shrink-0" />
                {hasByok
                  ? "Usage limits are set by your provider"
                  : `Resets in ${timeUntilReset || "midnight UTC"}`}
              </span>
              <button
                type="button"
                onClick={() => setShowAllowanceWhy(!showAllowanceWhy)}
                aria-expanded={showAllowanceWhy}
                className="text-xs text-slate-700 dark:text-slate-300 font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <span>Details</span>
                {showAllowanceWhy ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
              </button>
            </div>

            {showAllowanceWhy && (
              <div className="pt-2 border-t border-slate-200/60 dark:border-white/5 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                <p className="leading-snug text-slate-500 dark:text-slate-400">Compute weight per action:</p>
                <div className="grid grid-cols-3 gap-1 pt-0.5 font-mono text-xs">
                  <span className="p-1 rounded bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border border-white/50 dark:border-white/5 text-center font-bold text-slate-800 dark:text-slate-200">Chat: 1</span>
                  <span className="p-1 rounded bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border border-white/50 dark:border-white/5 text-center font-bold text-slate-800 dark:text-slate-200">Quiz: 4</span>
                  <span className="p-1 rounded bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border border-white/50 dark:border-white/5 text-center font-bold text-slate-800 dark:text-slate-200">Notes: 5</span>
                </div>
              </div>
            )}
          </div>

          {/* Today's Activity Summary (Compact 3 chips) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 px-0.5">
              <span>Today's Activity</span>
              <span className="font-mono text-xs text-slate-500">{usageStats.total} used today</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-center">
              <div className="p-2 rounded-xl bg-white/40 dark:bg-white/[0.02] backdrop-blur-sm border border-white/50 dark:border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.5)]">
                <span className="block text-xs font-bold font-mono text-slate-800 dark:text-slate-200">{usageStats.chat}</span>
                <span className="text-xs text-slate-400">Questions</span>
              </div>
              <div className="p-2 rounded-xl bg-white/40 dark:bg-white/[0.02] backdrop-blur-sm border border-white/50 dark:border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.5)]">
                <span className="block text-xs font-bold font-mono text-slate-800 dark:text-slate-200">{usageStats.notes}</span>
                <span className="text-xs text-slate-400">Notes</span>
              </div>
              <div className="p-2 rounded-xl bg-white/40 dark:bg-white/[0.02] backdrop-blur-sm border border-white/50 dark:border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.5)]">
                <span className="block text-xs font-bold font-mono text-slate-800 dark:text-slate-200">{usageStats.derivatives}</span>
                <span className="text-xs text-slate-400">Quizzes</span>
              </div>
            </div>
          </div>

          {/* AI Network Status Row (Clean single row) */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/40 dark:bg-white/[0.02] backdrop-blur-sm border border-white/50 dark:border-white/5 text-xs">
            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <Cpu className="size-3.5 text-slate-400 shrink-0" />
              <span className="text-xs font-medium">{hasByok ? `${activeByokProvider} Key` : "Groq AI Engine"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-slate-900 dark:bg-white animate-pulse" />
              <span className="text-xs font-semibold text-slate-900 dark:text-white">
                {hasByok ? "Connected" : "Operational"}
              </span>
            </div>
          </div>

          {/* Quota Exhausted Warning */}
          {remaining === 0 && !hasByok && (
            <div className="p-2.5 rounded-xl bg-rose-50/80 dark:bg-rose-950/40 backdrop-blur-sm border border-rose-200 dark:border-rose-800/60 text-xs text-rose-800 dark:text-rose-300 font-medium leading-relaxed">
              Daily free allowance exhausted. Add a personal free Groq or Gemini API key in Settings to continue without interruptions.
            </div>
          )}

          {/* BYOK Shortcut button */}
          <button
            onClick={() => {
              setPopoverOpen(false);
              router.push("/app/settings?tab=models");
            }}
            className="w-full h-8 px-3 rounded-xl text-xs font-semibold bg-white/60 hover:bg-white/85 dark:bg-white/10 dark:hover:bg-white/15 backdrop-blur-sm border border-white/50 dark:border-white/10 text-slate-800 dark:text-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.04),inset_0_1px_1px_rgba(255,255,255,0.7)] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Key className="size-3 text-slate-500" />
            <span>{hasByok ? "Manage Custom Provider Keys" : "Use Your Own API Key (BYOK)"}</span>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );

  return pillContent;
}
