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

const DAILY_FREE_LIMIT = 25;

export function DailyQuotaPill() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { settings } = useSettings();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [showAllowanceWhy, setShowAllowanceWhy] = useState(false);
  const [showActivityHistory, setShowActivityHistory] = useState(false);

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

  // 2. Fetch latest provider health / rate limit snapshot (Bar B: Provider Quota)
  const { data: providerSnapshot } = useQuery({
    queryKey: ["latest_provider_usage_snapshot"],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("provider_usage")
        .select("*")
        .order("captured_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        return null;
      }
      return data;
    },
    refetchInterval: 15_000,
  });

  // Dynamic freshness calculation clock
  const [nowMs, setNowMs] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 5_000);
    return () => clearInterval(timer);
  }, []);

  // Data freshness indicator for Bar B (Live: <15s, Recent: <5m, Stale: >=5m, Unknown)
  const providerFreshness = useMemo(() => {
    if (!providerSnapshot?.captured_at) {
      return { status: "unknown" as const, label: "Unknown", detail: "No recent provider telemetry", isStale: false };
    }
    const ageMs = nowMs - new Date(providerSnapshot.captured_at).getTime();
    const ageSec = Math.max(0, Math.floor(ageMs / 1000));

    if (ageSec < 15) {
      return { status: "live" as const, label: "Live", detail: `${ageSec}s ago`, isStale: false };
    }
    if (ageSec < 300) {
      const min = Math.floor(ageSec / 60);
      const sec = ageSec % 60;
      const timeStr = min > 0 ? `${min}m ${sec}s ago` : `${sec}s ago`;
      return { status: "recent" as const, label: "Recent", detail: timeStr, isStale: false };
    }
    const min = Math.floor(ageSec / 60);
    return { status: "stale" as const, label: "Stale", detail: `${min}m ago`, isStale: true };
  }, [providerSnapshot?.captured_at, nowMs]);

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

  // Compute Provider Quota state: Exact | Estimated | Unknown
  const providerQuotaState = useMemo(() => {
    if (hasByok) {
      if (activeByokProvider === "Groq" && providerSnapshot?.remaining_tokens != null) {
        return "exact";
      }
      return "unknown"; // Gemini / OpenAI do not expose exact remaining quota headers
    }

    if (!providerSnapshot) {
      return "unknown";
    }

    if (
      providerSnapshot.remaining_tokens != null &&
      providerSnapshot.token_limit != null &&
      providerSnapshot.token_limit > 0
    ) {
      return "exact";
    }

    if (providerSnapshot.remaining_tokens != null || providerSnapshot.remaining_requests != null) {
      return "estimated";
    }

    return "unknown";
  }, [hasByok, activeByokProvider, providerSnapshot]);

  // Exact calculations
  const tokenPercentRemaining = useMemo(() => {
    if (
      providerSnapshot?.remaining_tokens != null &&
      providerSnapshot?.token_limit != null &&
      providerSnapshot.token_limit > 0
    ) {
      return Math.min(
        100,
        Math.max(
          0,
          Math.round((providerSnapshot.remaining_tokens / providerSnapshot.token_limit) * 100)
        )
      );
    }
    return null;
  }, [providerSnapshot]);

  const requestPercentRemaining = useMemo(() => {
    if (
      providerSnapshot?.remaining_requests != null &&
      providerSnapshot?.request_limit != null &&
      providerSnapshot.request_limit > 0
    ) {
      return Math.min(
        100,
        Math.max(
          0,
          Math.round((providerSnapshot.remaining_requests / providerSnapshot.request_limit) * 100)
        )
      );
    }
    return null;
  }, [providerSnapshot]);

  const providerHealthStatus = useMemo(() => {
    if (tokenPercentRemaining == null) return "Good";
    if (tokenPercentRemaining > 40) return "Good";
    if (tokenPercentRemaining > 15) return "Moderate";
    return "Constrained";
  }, [tokenPercentRemaining]);

  // Alert glowing state styles
  const glowClasses = useMemo(() => {
    if (hasByok) {
      return "border-emerald-500/40 text-emerald-950 dark:text-emerald-100 hover:border-emerald-500/60 shadow-[0_4px_16px_rgba(16,185,129,0.15)]";
    }
    if (remaining === 0) {
      return "border-rose-500/60 shadow-[0_0_16px_rgba(244,63,94,0.35)] text-rose-900 dark:text-rose-200 animate-pulse";
    }
    if (remaining <= 3) {
      return "border-amber-400/60 shadow-[0_0_14px_rgba(251,191,36,0.35)] text-amber-900 dark:text-amber-200";
    }
    return "border-white/80 dark:border-white/15 text-slate-800 dark:text-slate-100 hover:border-white dark:hover:border-white/30 shadow-[0_6px_24px_-2px_rgba(15,23,42,0.08),inset_0_1px_1.5px_rgba(255,255,255,0.95)] dark:shadow-[0_8px_24px_-2px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.15)]";
  }, [hasByok, remaining]);

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
              "bg-white/50 hover:bg-white/70 dark:bg-slate-900/40 dark:hover:bg-slate-900/60",
              "backdrop-blur-xl backdrop-saturate-150 border",
              "hover:scale-105 active:scale-95 transition-all text-xs font-semibold",
              glowClasses
            )}
            title="Drag anywhere to reposition • Click to view usage allowance"
          >
            <GripVertical className="size-3 text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300 transition-colors shrink-0 -ml-0.5" />
            {hasByok ? (
              <>
                <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>BYOK: {activeByokProvider}</span>
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
                <div className="w-9 h-1.5 rounded-full bg-slate-900/10 dark:bg-white/15 overflow-hidden ml-0.5 border border-white/40 dark:border-white/5">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-300",
                      remaining <= 3
                        ? "bg-amber-500"
                        : "bg-purple-600 dark:bg-purple-400"
                    )}
                    style={{ width: `${Math.max(6, percentAllowanceRemaining)}%` }}
                  />
                </div>
              </>
            )}
          </button>
        </PopoverTrigger>

        <PopoverContent
          side="bottom"
          align="end"
          sideOffset={8}
          collisionPadding={12}
          className="w-[320px] p-4 rounded-[26px] bg-white/75 dark:bg-slate-900/75 backdrop-blur-2xl backdrop-saturate-150 border border-white/70 dark:border-white/15 shadow-[0_20px_50px_rgba(15,23,42,0.12),inset_0_1px_1.5px_rgba(255,255,255,0.9)] dark:shadow-[0_24px_54px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.12)] text-foreground select-none"
        >
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between pb-0.5">
              <div className="flex items-center gap-1.5">
                <Sparkles className="size-4 text-purple-600 dark:text-purple-400" />
                <h4 className="font-bold text-xs font-display text-slate-900 dark:text-white">AI Allowance</h4>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                  {hasByok ? "BYOK Active" : "Free Student Tier"}
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
                    {hasByok ? "∞" : remaining}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 ml-1.5 font-medium">
                    {hasByok ? "actions (unmetered)" : `/ ${DAILY_FREE_LIMIT} actions left`}
                  </span>
                </div>
                <span className="text-[11px] font-mono font-bold text-purple-600 dark:text-purple-400">
                  {hasByok ? "BYOK" : `${percentAllowanceRemaining}%`}
                </span>
              </div>

              {/* Progress Bar showing remaining allowance */}
              {!hasByok && (
                <div className="w-full h-2 rounded-full bg-slate-200/80 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      remaining <= 3 ? "bg-amber-500" : "bg-gradient-to-r from-purple-600 to-indigo-500"
                    )}
                    style={{ width: `${Math.max(4, percentAllowanceRemaining)}%` }}
                  />
                </div>
              )}

              {/* Reset Timer & Action Cost toggle */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                <span className="flex items-center gap-1">
                  <Clock className="size-3 text-slate-400 shrink-0" />
                  Resets in {timeUntilReset || "midnight UTC"}
                </span>
                <button
                  type="button"
                  onClick={() => setShowAllowanceWhy(!showAllowanceWhy)}
                  className="text-[10.5px] text-purple-600 dark:text-purple-400 font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <span>Cost rules</span>
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
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  {providerQuotaState === "exact" && tokenPercentRemaining != null
                    ? `${tokenPercentRemaining}% capacity`
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


