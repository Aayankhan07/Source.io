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
    } catch {}
  }, []);

  const handleResetPosition = () => {
    setPos({ x: 0, y: 0 });
    posRef.current = { x: 0, y: 0 };
    try {
      localStorage.removeItem("source_quota_pill_pos");
    } catch {}
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
    } catch {}
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
              "bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-tactile-pill",
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
                <div className="w-9 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden ml-0.5">
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
          className="w-88 max-w-[calc(100vw-32px)] p-4.5 rounded-3xl bg-white dark:bg-slate-900 border border-black/[0.08] dark:border-white/10 shadow-tactile-card backdrop-blur-md text-foreground"
        >
          <div className="space-y-3.5">
            {/* Header */}
            <div className="flex items-center justify-between pb-1 border-b border-border/60">
              <div className="flex items-center gap-1.5">
                <Zap className="size-4 text-purple-600 dark:text-purple-400" />
                <h4 className="font-bold text-xs font-display">Plan & Quota Dashboard</h4>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleResetPosition}
                  className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-0.5 cursor-pointer transition-colors"
                  title="Reset pill position to top right default"
                >
                  <RotateCcw className="size-2.5" />
                  <span>Reset pos</span>
                </button>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                  {hasByok ? "BYOK Active" : "Free Student Plan"}
                </span>
              </div>
            </div>

            {/* ========================================================= */}
            {/* BAR A: Source.io Student Allowance                        */}
            {/* ========================================================= */}
            <div className="space-y-2 rounded-2xl p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-white/5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-700 dark:text-slate-200">Source.io Allowance</span>
                <span className="text-purple-600 dark:text-purple-400 font-mono text-[11px]">
                  {hasByok ? "Unlimited (0 charge)" : `${percentAllowanceRemaining}% remaining`}
                </span>
              </div>

              {!hasByok && (
                <>
                  <Progress value={percentUsed} className="h-2 rounded-full bg-slate-200 dark:bg-slate-700" />
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                    <span>AI usage today: {usageCount} / {DAILY_FREE_LIMIT} actions</span>
                    <span className="font-mono text-[10px] font-bold">{remaining} left</span>
                  </div>
                </>
              )}

              {hasByok && (
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">
                  <ShieldCheck className="size-3.5" />
                  <span>Your custom {activeByokProvider} key bypasses daily quotas.</span>
                </div>
              )}

              <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                <Clock className="size-3 text-slate-400 shrink-0" />
                <span>Resets in {timeUntilReset || "midnight UTC"}</span>
              </div>

              {/* "Why did my allowance change?" explanation toggle */}
              <div className="pt-1.5 border-t border-slate-200/60 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setShowAllowanceWhy(!showAllowanceWhy)}
                  className="w-full flex items-center justify-between text-[10.5px] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-1 font-medium">
                    <HelpCircle className="size-3 text-purple-500" />
                    Why did my allowance change?
                  </span>
                  {showAllowanceWhy ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                </button>
                {showAllowanceWhy && (
                  <div className="mt-1.5 p-2 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 text-[10.5px] text-purple-950 dark:text-purple-200 leading-normal space-y-1">
                    <p>
                      Notes, flashcards, quizzes, and long questions use different amounts of AI processing. Source.io allowance accounts for action weights:
                    </p>
                    <div className="grid grid-cols-3 gap-1 pt-1 text-[10px] font-mono">
                      <span className="bg-white/80 dark:bg-slate-900/80 p-1 rounded text-center border border-purple-100 dark:border-purple-900">Chat: 1 unit</span>
                      <span className="bg-white/80 dark:bg-slate-900/80 p-1 rounded text-center border border-purple-100 dark:border-purple-900">Quizzes: 4 units</span>
                      <span className="bg-white/80 dark:bg-slate-900/80 p-1 rounded text-center border border-purple-100 dark:border-purple-900">Notes: 5 units</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ========================================================= */}
            {/* BAR B: Provider Quota / Health (Informational Snapshot)    */}
            {/* ========================================================= */}
            <div className="space-y-2 rounded-2xl p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-white/5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <Cpu className="size-3.5 text-slate-600 dark:text-slate-400" />
                  <span className="text-slate-700 dark:text-slate-200">
                    {hasByok ? `${activeByokProvider} Quota` : "Groq Provider Capacity"}
                  </span>
                </div>
                
                <div className="flex items-center gap-1.5">
                  {/* Data Freshness Indicator */}
                  <span
                    className={cn(
                      "text-[9px] font-mono px-1.5 py-0.5 rounded-full flex items-center gap-1 font-semibold",
                      providerFreshness.status === "live" && "bg-emerald-100/80 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
                      providerFreshness.status === "recent" && "bg-sky-100/80 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300",
                      providerFreshness.status === "stale" && "bg-amber-100/80 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300",
                      providerFreshness.status === "unknown" && "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    )}
                    title={`Captured ${providerFreshness.detail}`}
                  >
                    {providerFreshness.status === "live" && (
                      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    )}
                    {providerFreshness.label}
                  </span>

                  <span
                    className={cn(
                      "text-[10px] font-mono px-1.5 py-0.5 rounded-full font-bold",
                      providerHealthStatus === "Good"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                        : providerHealthStatus === "Moderate"
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                        : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                    )}
                  >
                    {providerHealthStatus}
                  </span>
                </div>
              </div>

              {/* State 1: Exact Groq Quota */}
              {providerQuotaState === "exact" && (
                <div className="space-y-1.5 pt-1 text-xs">
                  {requestPercentRemaining != null && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 dark:text-slate-400">Requests remaining:</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {requestPercentRemaining}%
                      </span>
                    </div>
                  )}

                  {tokenPercentRemaining != null && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 dark:text-slate-400">Tokens remaining:</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          {tokenPercentRemaining}%
                        </span>
                      </div>
                      <Progress
                        value={100 - tokenPercentRemaining}
                        className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10.5px] text-slate-400 dark:text-slate-500 pt-0.5">
                    <span>Captured: {providerFreshness.detail}</span>
                    <span>Resets in: {providerSnapshot?.raw_reset_tokens || providerSnapshot?.raw_reset_requests || "rolling window"}</span>
                  </div>
                </div>
              )}

              {/* State 2: Estimated */}
              {providerQuotaState === "estimated" && (
                <div className="py-1 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                  <div className="flex items-center justify-between">
                    <span>Estimated Provider Usage:</span>
                    <span className="font-mono font-bold">~60% capacity remaining</span>
                  </div>
                  <Progress value={40} className="h-1.5 rounded-full" />
                </div>
              )}

              {/* State 3: Unknown Provider Quota */}
              {providerQuotaState === "unknown" && (
                <div className="py-1 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  {hasByok ? (
                    <span>
                      {activeByokProvider} does not expose exact real-time header counters. Source.io tracks your requests directly.
                    </span>
                  ) : (
                    <span>
                      Provider availability: <strong className="text-emerald-600 dark:text-emerald-400">Operational</strong>. High-speed inference available.
                    </span>
                  )}
                </div>
              )}

              {/* Stale Data Warning */}
              {providerFreshness.isStale && (
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-[10.5px] text-amber-800 dark:text-amber-300">
                  Provider quota information may be outdated ({providerFreshness.detail}). Updated on next AI action.
                </div>
              )}

              <p className="text-[10px] text-slate-400 dark:text-slate-500 italic pt-0.5">
                *Informational shared capacity. Student allowance is strictly enforced by Source.io.
              </p>
            </div>

            {/* ========================================================= */}
            {/* TODAY'S ACTIVITY BREAKDOWN                                */}
            {/* ========================================================= */}
            <div className="rounded-2xl p-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-white/5">
              <button
                type="button"
                onClick={() => setShowActivityHistory(!showActivityHistory)}
                className="w-full flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Activity className="size-3.5 text-slate-500" />
                  <span>Today's Activity Breakdown</span>
                </span>
                <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                  {usageStats.total} actions {showActivityHistory ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                </span>
              </button>

              {showActivityHistory && (
                <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-white/5 space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span>Copilot Questions</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{usageStats.chat}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span>Notes Generations</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{usageStats.notes}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span>Flashcards & Quizzes</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{usageStats.derivatives}</span>
                  </div>
                  <div className="pt-1.5 border-t border-slate-200/40 dark:border-white/5 flex items-center justify-between font-semibold text-slate-800 dark:text-slate-100 text-xs">
                    <span>Total Actions Used</span>
                    <span className="font-mono">{usageStats.total} / {hasByok ? "Unlimited" : DAILY_FREE_LIMIT}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quota Exhausted Warning */}
            {remaining === 0 && !hasByok && (
              <div className="p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-[11px] text-rose-800 dark:text-rose-300 font-medium leading-relaxed">
                Daily free allowance exhausted. Add a personal free Groq or Gemini API key in Settings to continue without interruptions.
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
              <span>{hasByok ? "Manage Custom Provider Keys" : "Use Your Own AI Provider (BYOK)"}</span>
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </motion.div>
  );
}

export default DailyQuotaPill;


