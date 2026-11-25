"use client";

import React, { useState, useMemo } from "react";
import { Maximize2, Minimize2, ChevronDown, RotateCw, BookOpen, Layers, Activity, FileText } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { useDashboardTelemetry } from "../hooks/useDashboardTelemetry";
import { useLeitnerBoxes } from "../hooks/useLeitnerBoxes";
import { bucketByDay } from "../lib/activity";

/**
 * One Leitner box of real review data, aggregated from flashcard_reviews by
 * useLeitnerBoxes (or supplied by the caller). Until the user has reviewed a
 * card the component shows an honest empty state instead of modelled percentages.
 */
export interface LeitnerBox {
  box: string;
  name: string;
  interval: string;
  count: number;
}

interface TactilePerformanceChartProps {
  isGuest?: boolean;
  boxes?: LeitnerBox[];
}

type Timeframe = "7 Days" | "30 Days";

export function TactilePerformanceChart({ isGuest = false, boxes: boxesProp }: TactilePerformanceChartProps) {
  const { data: reviewBoxes } = useLeitnerBoxes(!isGuest && !boxesProp);
  const boxes = boxesProp ?? reviewBoxes;
  const [timeframe, setTimeframe] = useState<Timeframe>("7 Days");
  const [timeframeOpen, setTimeframeOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isExpandedModal, setIsExpandedModal] = useState(false);

  const { data: telemetry, isLoading, isError } = useDashboardTelemetry();

  const totalDocs = telemetry?.totalDocs ?? 0;
  const totalCards = telemetry?.totalCards ?? 0;
  const totalNotes = telemetry?.totalNotes ?? 0;

  const dayCount = timeframe === "7 Days" ? 7 : 30;
  const activity = useMemo(
    () => bucketByDay(telemetry?.activityTimestamps ?? [], dayCount),
    [telemetry, dayCount]
  );
  const totalActivity = activity.reduce((sum, d) => sum + d.count, 0);
  const maxActivity = Math.max(1, ...activity.map((d) => d.count));
  const activeIndex = hoveredIndex !== null && hoveredIndex < activity.length ? hoveredIndex : activity.length - 1;

  const boxTotal = (boxes ?? []).reduce((sum, b) => sum + b.count, 0);
  const hasReviewData = boxTotal > 0;

  return (
    <>
      <div className="bg-card rounded-[32px] p-5 sm:p-6 border border-border shadow-tactile-card flex flex-col justify-between relative overflow-hidden select-none">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold font-display text-foreground tracking-tight">
              Study Activity
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isGuest
                ? "Sign in to track your study activity."
                : "AI study actions you ran, and your flashcard review progress."}
            </p>

            <div className="flex flex-wrap items-center gap-2 mt-3 text-xs font-medium">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted border border-border text-foreground font-mono text-xs">
                <Layers className="size-3 text-muted-foreground" />
                {totalCards} {totalCards === 1 ? "card" : "cards"}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted border border-border text-muted-foreground font-mono text-xs">
                <BookOpen className="size-3 text-muted-foreground" />
                {totalDocs} {totalDocs === 1 ? "source" : "sources"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto relative">
            <div className="relative">
              <button
                type="button"
                onClick={() => setTimeframeOpen((prev) => !prev)}
                className="h-8 px-3 rounded-full bg-muted hover:bg-accent text-xs font-semibold text-foreground flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>{timeframe}</span>
                <ChevronDown className="size-3 text-muted-foreground" />
              </button>

              <AnimatePresence>
                {timeframeOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-28 bg-popover rounded-[18px] border border-border p-1.5 shadow-tactile-dock z-40"
                  >
                    {(["7 Days", "30 Days"] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          setTimeframe(opt);
                          setHoveredIndex(null);
                          setTimeframeOpen(false);
                        }}
                        className={cn(
                          "w-full px-2.5 py-1.5 rounded-[12px] text-xs font-semibold text-left transition-colors cursor-pointer",
                          timeframe === opt ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
                        )}
                      >
                        {opt}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              type="button"
              onClick={() => setIsExpandedModal(true)}
              title="Expand details"
              aria-label="Expand details"
              className="size-8 rounded-full bg-muted hover:bg-accent flex items-center justify-center text-muted-foreground transition-colors cursor-pointer"
            >
              <Maximize2 className="size-3.5" />
            </button>
          </div>
        </div>

        {/* 1. Leitner review distribution (real data only) */}
        <div className="my-3 p-3.5 rounded-[22px] bg-muted/40 border border-border space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-foreground font-display flex items-center gap-1.5">
              <RotateCw className="size-3.5 text-muted-foreground" />
              Spaced-repetition progress
            </span>
          </div>
          {hasReviewData ? (
            <LeitnerBars boxes={boxes!} total={boxTotal} />
          ) : (
            <p className="text-xs text-muted-foreground">
              Review cards to see your progress.
              {totalCards === 0 ? " Generate flashcards from a source to get started." : ""}
            </p>
          )}
        </div>

        {/* 2. Daily AI activity histogram */}
        <div className="relative w-full h-36 mt-1 flex">
          <div className="relative flex-1 h-full pr-8">
            {totalActivity === 0 ? (
              <div className="absolute inset-x-0 bottom-6 top-2 flex flex-col items-center justify-center text-center gap-1.5 rounded-[18px] border border-dashed border-border">
                <Activity className="size-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {isLoading
                    ? "Loading activity…"
                    : isError
                      ? "Could not load activity."
                      : `No study activity in the last ${dayCount} days.`}
                </span>
              </div>
            ) : (
              <>
                <div
                  className={cn(
                    "absolute inset-x-0 bottom-6 top-8 flex items-end justify-between px-1",
                    dayCount <= 7 ? "gap-2" : "gap-0.5"
                  )}
                >
                  {activity.map((d, i) => {
                    const heightPercent = d.count === 0 ? 4 : Math.max(10, Math.round((d.count / maxActivity) * 100));
                    const isActive = activeIndex === i;
                    return (
                      <div
                        key={d.date}
                        onMouseEnter={() => setHoveredIndex(i)}
                        className="flex-1 h-full flex flex-col justify-end items-center cursor-pointer group"
                      >
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={cn(
                            "w-full max-w-[28px] rounded-t-xl transition-all duration-200",
                            isActive
                              ? "bg-slate-900 dark:bg-white shadow-tactile-pill"
                              : "bg-slate-300 dark:bg-slate-700 group-hover:bg-slate-500 dark:group-hover:bg-slate-500"
                          )}
                        />
                      </div>
                    );
                  })}
                </div>

                <div className="absolute top-0 inset-x-0 flex justify-center pointer-events-none">
                  <div className="bg-popover text-popover-foreground border border-border rounded-full px-3 py-1 shadow-tactile-pill text-xs font-mono font-bold flex items-center gap-1.5">
                    <span>{activity[activeIndex]?.label}:</span>
                    <span className="text-foreground">
                      {activity[activeIndex]?.count ?? 0} AI{" "}
                      {activity[activeIndex]?.count === 1 ? "action" : "actions"}
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* X-axis labels */}
            <div className="absolute bottom-0 inset-x-0 flex justify-between text-xs font-mono font-medium text-muted-foreground pt-1.5 border-t border-border pointer-events-none">
              {dayCount <= 7 ? (
                activity.map((d, i) => (
                  <span
                    key={d.date}
                    className={cn("text-center flex-1", activeIndex === i && totalActivity > 0 ? "text-foreground font-bold" : "")}
                  >
                    {d.label}
                  </span>
                ))
              ) : (
                <>
                  <span>{activity[0]?.label}</span>
                  <span>{activity[activity.length - 1]?.label}</span>
                </>
              )}
            </div>
          </div>

          <div className="w-8 h-28 flex flex-col justify-between text-xs font-mono text-muted-foreground text-right self-start pt-8 pointer-events-none">
            {totalActivity > 0 && (
              <>
                <span>{maxActivity}</span>
                <span>0</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Expanded details modal */}
      <AnimatePresence>
        {isExpandedModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Study activity details"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-card rounded-[32px] border border-border p-6 sm:p-8 shadow-tactile-dock select-none"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold font-display text-foreground tracking-tight">Study Activity</h3>
                  <p className="text-xs text-muted-foreground mt-1">Totals across your library.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsExpandedModal(false)}
                  aria-label="Close"
                  className="size-9 rounded-full bg-muted hover:bg-accent flex items-center justify-center text-foreground cursor-pointer"
                >
                  <Minimize2 className="size-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-6">
                <StatBox icon={BookOpen} label="Sources" value={totalDocs} />
                <StatBox icon={FileText} label="Notes" value={totalNotes} />
                <StatBox icon={Layers} label="Flashcards" value={totalCards} />
              </div>

              <div className="space-y-2 mb-6">
                <span className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-wider block">
                  Spaced-repetition boxes
                </span>
                {hasReviewData ? (
                  <div className="divide-y divide-border rounded-[20px] border border-border overflow-hidden bg-muted/20">
                    {boxes!.map((b) => (
                      <div key={b.box} className="flex items-center justify-between p-3 text-xs">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono font-bold text-foreground">{b.box}</span>
                          <span className="text-muted-foreground">({b.name})</span>
                        </div>
                        <div className="flex items-center gap-3 font-mono">
                          <span className="text-muted-foreground">Review every {b.interval}</span>
                          <span className="font-bold text-foreground px-2 py-0.5 rounded bg-muted border border-border">
                            {b.count} cards
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground p-3 rounded-[20px] border border-dashed border-border">
                    Review cards to see your progress.
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsExpandedModal(false)}
                className="w-full py-3 rounded-full bg-primary text-primary-foreground font-bold text-sm shadow-tactile-pill cursor-pointer hover:opacity-95 transition-opacity"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

function StatBox({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }) {
  return (
    <div className="p-4 rounded-[22px] bg-muted/40 border border-border">
      <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
        <Icon className="size-3.5" />
        {label}
      </span>
      <span className="text-2xl font-bold block mt-1 text-foreground font-mono">{value}</span>
    </div>
  );
}

function LeitnerBars({ boxes, total }: { boxes: LeitnerBox[]; total: number }) {
  const opacities = ["opacity-20", "opacity-40", "opacity-60", "opacity-80", "opacity-100"];
  return (
    <>
      <div className="h-3 w-full rounded-full bg-muted overflow-hidden flex gap-0.5 p-0.5 border border-border/50">
        {boxes.map((box, idx) => {
          const percent = Math.round((box.count / total) * 100);
          if (box.count === 0) return null;
          return (
            <div
              key={box.box}
              style={{ width: `${percent}%` }}
              className={cn("h-full rounded-full bg-foreground transition-all duration-300", opacities[idx % opacities.length])}
              title={`${box.box} (${box.name}): ${box.count} cards (${percent}%)`}
            />
          );
        })}
      </div>
      <div className="grid grid-cols-5 gap-1 pt-1 text-xs font-mono text-center">
        {boxes.map((b) => (
          <div key={b.box} className="flex flex-col items-center">
            <span className="font-bold text-foreground">{b.count}</span>
            <span className="text-muted-foreground truncate w-full">{b.name}</span>
          </div>
        ))}
      </div>
    </>
  );
}
