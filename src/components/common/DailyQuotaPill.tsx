"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useSettings } from "@/features/settings/context/SettingsContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { 
  Sparkles, 
  Key, 
  Clock, 
  Zap, 
  AlertTriangle, 
  ShieldCheck, 
  Activity, 
  CheckCircle2, 
  HelpCircle,
  Cpu,
  ChevronDown,
  ChevronUp,
  Info,
  GripVertical,
  RotateCcw
} from "lucide-react";
import { cn } from "@/lib/utils";

import { useProviderQuota } from "@/features/settings/context/ProviderQuotaContext";

const DAILY_FREE_LIMIT = 25;

export function DailyQuotaPill() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { settings } = useSettings();
  const { quota: providerQuota, refreshQuota } = useProviderQuota();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [showAllowanceWhy, setShowAllowanceWhy] = useState(false);
  const [showActivityHistory, setShowActivityHistory] = useState(false);

  // Strictly guard: Only render inside the authenticated workspace (/app), never on the landing page
  const isAppRoute = pathname?.startsWith("/app");

  // Movable draggable position state (Default: top right x=0, y=0)
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const posRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // Restore saved position from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("source_quota_pill_pos");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === "number" && typeof parsed.y === "number") {
          const maxX = 20;
          const minX = -(window.innerWidth - 140);
          const minY = -10;
          const maxY = window.innerHeight - 60;
          const clampedX = Math.max(minX, Math.min(maxX, parsed.x));
          const clampedY = Math.max(minY, Math.min(maxY, parsed.y));
          setPos({ x: clampedX, y: clampedY });
          posRef.current = { x: clampedX, y: clampedY };
        }
      }
    } catch {
      // Ignore localStorage read error
    }
  }, []);

  const handleResetPosition = () => {
    setPos({ x: 0, y: 0 });
    posRef.current = { x: 0, y: 0 };
    try {
      localStorage.removeItem("source_quota_pill_pos");
    } catch {
      // Ignore localStorage remove error
    }
  };

  const handleDragEnd = (_: unknown, info: { offset: { x: number; y: number } }) => {
    const maxX = 20;
    const minX = -(window.innerWidth - 140);
    const minY = -10;
    const maxY = window.innerHeight - 60;
    const nextX = Math.max(minX, Math.min(maxX, posRef.current.x + info.offset.x));
    const nextY = Math.max(minY, Math.min(maxY, posRef.current.y + info.offset.y));
    const newPos = { x: nextX, y: nextY };
    setPos(newPos);
    posRef.current = newPos;
    try {
      localStorage.setItem("source_quota_pill_pos", JSON.stringify(newPos));
    } catch {
      // Ignore localStorage save error
    }
    setTimeout(() => setIsDragging(false), 120);
  };

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

  // 1. Fetch count of today's user actions from ai_usage_logs (Bar A: Source.io Allowance)
  const { data: usageStats = { total: 0, chat: 0, notes: 0, derivatives: 0 } } = useQuery({
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

  // Determine active displayed percentage and label
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

  // Alert glowing state styles
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

  if (!isAppRoute) {
    return null;
  }

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0.06}
      onDragStart={() => {
        setIsDragging(true);
        setPopoverOpen(false);
      }}
      onDragEnd={handleDragEnd}
      animate={{ x: pos.x, y: pos.y }}
      transition={{ type: "spring", damping: 30, stiffness: 450 }}
      className="fixed top-3.5 right-4 sm:right-6 z-50 select-none cursor-grab active:cursor-grabbing"
    >
      <Popover 
        open={popoverOpen} 
        onOpenChange={(open) => {
          if (isDragging) return;
          setPopoverOpen(open);
        }}
      >
        <PopoverTrigger asChild>
          <button
            onClick={(e) => {
              if (isDragging) {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
            className={cn(
              "group h-8 px-3 rounded-full flex items-center gap-1.5 cursor-grab active:cursor-grabbing",
              "glass-tactile-pill",
              "hover:scale-105 active:scale-95 transition-all text-xs font-semibold",
              glowClasses
            )}
            title="Drag anywhere to reposition - Click to view real API quota details"
          >
            <GripVertical className="size-3 text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300 transition-colors shrink-0 -ml-0.5" />
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
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700">
                  {hasByok ? `${activeByokProvider} Key` : "Free Tier"}
                </span>
                {(pos.x !== 0 || pos.y !== 0) && (
                  <button
                    type="button"
                    onClick={handleResetPosition}
                    className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Reset position to top right"
                  >
                    <RotateCcw className="size-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Main Hero Allowance Card */}
            <div className="rounded-[20px] p-3.5 bg-white/45 dark:bg-white/[0.03] backdrop-blur-md border border-white/60 dark:border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.7)] dark:shadow-none space-y-2.5">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-black font-display tracking-tight text-slate-900 dark:text-white">
                    {hasByok && providerQuota.percentRemaining != null
                      ? `${providerQuota.percentRemaining}%`
                      : hasByok
                      ? "Active"
                      : `${percentAllowanceRemaining}%`}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 ml-1.5 font-medium">
                    {hasByok ? "capacity remaining" : `/ ${remaining} actions left`}
                  </span>
                </div>
                <span className="text-[11px] font-mono font-bold text-slate-900 dark:text-white">
                  {hasByok ? "Live Key" : `${usageCount}/${DAILY_FREE_LIMIT} used`}
                </span>
              </div>

              {/* Progress Bar showing remaining allowance */}
              <div className="w-full h-2 rounded-full bg-slate-200/80 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 bg-slate-900 dark:bg-white"
                  style={{ width: `${Math.max(4, displayPercentage)}%` }}
                />
              </div>

              {hasByok && providerQuota.remainingTokens !== undefined && providerQuota.limitTokens !== undefined && (
                <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300 pt-0.5 font-mono">
                  <span>Tokens</span>
                  <span>{providerQuota.remainingTokens.toLocaleString()} / {providerQuota.limitTokens.toLocaleString()}</span>
                </div>
              )}

              {hasByok && providerQuota.remainingRequests !== undefined && providerQuota.limitRequests !== undefined && (
                <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300 pt-0.5 font-mono">
                  <span>Requests</span>
                  <span>{providerQuota.remainingRequests} / {providerQuota.limitRequests}</span>
                </div>
              )}

              {/* Reset Timer & Action Cost toggle */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                <span className="flex items-center gap-1">
                  <Clock className="size-3 text-slate-400 shrink-0" />
                  {hasByok && providerQuota.resetTime
                    ? `Resets in ${providerQuota.resetTime}`
                    : `Resets in ${timeUntilReset || "midnight UTC"}`}
                </span>
                <button
                  type="button"
                  onClick={() => setShowAllowanceWhy(!showAllowanceWhy)}
                  className="text-[10.5px] text-slate-700 dark:text-slate-300 font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <span>Details</span>
                  {showAllowanceWhy ? <ChevronUp className="size-2.5" /> : <ChevronDown className="size-2.5" />}
                </button>
              </div>

              {showAllowanceWhy && (
                <div className="pt-2 border-t border-slate-200/60 dark:border-white/5 text-[10.5px] text-slate-600 dark:text-slate-300 space-y-1">
                  <p className="leading-snug text-slate-500 dark:text-slate-400">Compute weight per action:</p>
                  <div className="grid grid-cols-3 gap-1 pt-0.5 font-mono text-[10px]">
                    <span className="p-1 rounded bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border border-white/50 dark:border-white/5 text-center font-bold text-slate-800 dark:text-slate-200">Chat: 1</span>
                    <span className="p-1 rounded bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border border-white/50 dark:border-white/5 text-center font-bold text-slate-800 dark:text-slate-200">Quiz: 4</span>
                    <span className="p-1 rounded bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border border-white/50 dark:border-white/5 text-center font-bold text-slate-800 dark:text-slate-200">Notes: 5</span>
                  </div>
                </div>
              )}
            </div>

            {/* Today's Activity Summary (Compact 3 chips) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400 px-0.5">
                <span>Today's Activity</span>
                <span className="font-mono text-[10px] text-slate-500">{usageStats.total} used today</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-center">
                <div className="p-2 rounded-xl bg-white/40 dark:bg-white/[0.02] backdrop-blur-sm border border-white/50 dark:border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.5)]">
                  <span className="block text-xs font-bold font-mono text-slate-800 dark:text-slate-200">{usageStats.chat}</span>
                  <span className="text-[10px] text-slate-400">Questions</span>
                </div>
                <div className="p-2 rounded-xl bg-white/40 dark:bg-white/[0.02] backdrop-blur-sm border border-white/50 dark:border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.5)]">
                  <span className="block text-xs font-bold font-mono text-slate-800 dark:text-slate-200">{usageStats.notes}</span>
                  <span className="text-[10px] text-slate-400">Notes</span>
                </div>
                <div className="p-2 rounded-xl bg-white/40 dark:bg-white/[0.02] backdrop-blur-sm border border-white/50 dark:border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.5)]">
                  <span className="block text-xs font-bold font-mono text-slate-800 dark:text-slate-200">{usageStats.derivatives}</span>
                  <span className="text-[10px] text-slate-400">Quizzes</span>
                </div>
              </div>
            </div>

            {/* AI Network Status Row (Clean single row) */}
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/40 dark:bg-white/[0.02] backdrop-blur-sm border border-white/50 dark:border-white/5 text-xs">
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <Cpu className="size-3.5 text-slate-400 shrink-0" />
                <span className="text-[11px] font-medium">{hasByok ? `${activeByokProvider} Key` : "Groq AI Engine"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-slate-900 dark:bg-white animate-pulse" />
                <span className="text-[11px] font-semibold text-slate-900 dark:text-white">
                  {hasByok && providerQuota.percentRemaining != null
                    ? `${providerQuota.percentRemaining}% limit left`
                    : "Operational"}
                </span>
              </div>
            </div>

            {/* Quota Exhausted Warning */}
            {remaining === 0 && !hasByok && (
              <div className="p-2.5 rounded-xl bg-rose-50/80 dark:bg-rose-950/40 backdrop-blur-sm border border-rose-200 dark:border-rose-800/60 text-[11px] text-rose-800 dark:text-rose-300 font-medium leading-relaxed">
                Daily free allowance exhausted. Add a personal free Groq or Gemini API key in Settings to continue without interruptions.
              </div>
            )}

            {/* BYOK Shortcut button */}
            <button
              onClick={() => {
                setPopoverOpen(false);
                router.push("/app/settings");
              }}
              className="w-full h-8 px-3 rounded-xl text-xs font-semibold bg-white/60 hover:bg-white/85 dark:bg-white/10 dark:hover:bg-white/15 backdrop-blur-sm border border-white/50 dark:border-white/10 text-slate-800 dark:text-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.04),inset_0_1px_1px_rgba(255,255,255,0.7)] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Key className="size-3 text-slate-500" />
              <span>{hasByok ? "Manage Custom Provider Keys" : "Use Your Own API Key (BYOK)"}</span>
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </motion.div>
  );
}

export default DailyQuotaPill;


