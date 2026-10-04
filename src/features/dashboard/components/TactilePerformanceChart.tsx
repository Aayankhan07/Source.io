"use client";

import React, { useState } from "react";
import { Maximize2, Minimize2, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function TactilePerformanceChart() {
  const [timeframe, setTimeframe] = useState<"Weekly" | "Monthly">("Weekly");
  const [timeframeOpen, setTimeframeOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number>(4); // Thursday default
  const [isExpandedModal, setIsExpandedModal] = useState(false);

  const days = timeframe === "Weekly" 
    ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    : ["W1", "W2", "W3", "W4", "W5", "W6", "W7"];

  // Weekly data points for the 3 curves (0-100 scale)
  const weeklyData = {
    theory: [25, 42, 36, 68, 88, 72, 85],
    practice: [15, 30, 48, 55, 78, 64, 76],
    lexicon: [10, 22, 28, 40, 60, 52, 65],
  };

  const monthlyData = {
    theory: [35, 50, 62, 70, 82, 90, 95],
    practice: [25, 40, 58, 65, 75, 84, 88],
    lexicon: [18, 32, 45, 55, 68, 78, 82],
  };

  const activeData = timeframe === "Weekly" ? weeklyData : monthlyData;

  // SVG coordinates calculation helper (w: 600, h: 200)
  const getSvgPath = (points: number[]) => {
    const width = 600;
    const height = 180;
    const step = width / (points.length - 1);
    
    return points.reduce((acc, point, i) => {
      const x = i * step;
      const y = height - (point / 100) * height + 10;
      if (i === 0) return `M ${x},${y}`;
      // Smooth cubic bezier curve
      const prevX = (i - 1) * step;
      const prevY = height - (points[i - 1] / 100) * height + 10;
      const cp1X = prevX + step / 2;
      const cp1Y = prevY;
      const cp2X = prevX + step / 2;
      const cp2Y = y;
      return `${acc} C ${cp1X},${cp1Y} ${cp2X},${cp2Y} ${x},${y}`;
    }, "");
  };

  const theoryPath = getSvgPath(activeData.theory);
  const practicePath = getSvgPath(activeData.practice);
  const lexiconPath = getSvgPath(activeData.lexicon);

  const hoverX = (hoveredIndex / (days.length - 1)) * 100;
  const hoverValue = activeData.theory[hoveredIndex];

  return (
    <>
      <div className="bg-white dark:bg-slate-900/90 rounded-[32px] p-5 sm:p-6 border border-black/[0.04] dark:border-white/10 shadow-tactile-card flex flex-col justify-between relative overflow-hidden select-none">
        {/* Top Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold font-display text-slate-900 dark:text-white tracking-tight">
              Performance Chart
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Track results and watch your retention rise.
            </p>

            {/* Metric Legend Pills */}
            <div className="flex items-center gap-4 mt-2.5 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <span className="size-2 rounded-full bg-[#0284C7]" /> Theory
              </span>
              <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <span className="size-2 rounded-full bg-[#4F35D2]" /> Practice
              </span>
              <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <span className="size-2 rounded-full bg-[#F43F5E]" /> Lexicon
              </span>
            </div>
          </div>

          {/* Right Timeframe Filter & Expand */}
          <div className="flex items-center gap-2 self-start sm:self-auto relative">
            <div className="relative">
              <button
                onClick={() => setTimeframeOpen((prev) => !prev)}
                className="h-8 px-3 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>{timeframe}</span>
                <ChevronDown className="size-3" />
              </button>

              <AnimatePresence>
                {timeframeOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-28 bg-white dark:bg-slate-900 rounded-[18px] border border-black/[0.06] dark:border-white/10 p-1.5 shadow-tactile-dock z-40"
                  >
                    {(["Weekly", "Monthly"] as const).map((opt) => (
                      <button
                        key={opt}
                        onClick={() => {
                          setTimeframe(opt);
                          setTimeframeOpen(false);
                        }}
                        className={cn(
                          "w-full px-2.5 py-1.5 rounded-[12px] text-xs font-semibold text-left transition-colors cursor-pointer",
                          timeframe === opt
                            ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
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
              onClick={() => setIsExpandedModal(true)}
              title="Expand Chart Modal"
              className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
            >
              <Maximize2 className="size-3.5" />
            </button>
          </div>
        </div>

        {/* Main Chart Canvas Area */}
        <div className="relative w-full h-52 sm:h-56 mt-2 flex">
          {/* SVG Drawing Container */}
          <div className="relative flex-1 h-full pr-10">
            {/* Interactive Vertical Grid Stripe Columns (hoverable) */}
            <div className="absolute inset-0 flex justify-between px-2 z-10">
              {days.map((day, i) => (
                <div 
                  key={day} 
                  onMouseEnter={() => setHoveredIndex(i)}
                  className={cn(
                    "flex-1 h-full rounded-t-xl transition-colors cursor-pointer flex flex-col justify-end pb-8",
                    hoveredIndex === i 
                      ? "bg-slate-100/80 dark:bg-white/[0.06] border-x border-slate-200/80 dark:border-white/10" 
                      : "hover:bg-slate-50/50 dark:hover:bg-white/[0.02]"
                  )}
                />
              ))}
            </div>

            <svg className="w-full h-44 overflow-visible relative pointer-events-none" viewBox="0 0 600 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="theoryGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0284C7" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#0284C7" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="practiceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4F35D2" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#4F35D2" stopOpacity="0" />
                </linearGradient>
              </defs>

              <path d={`${theoryPath} L 600,200 L 0,200 Z`} fill="url(#theoryGrad)" />
              <path d={`${practicePath} L 600,200 L 0,200 Z`} fill="url(#practiceGrad)" />

              <path
                d={lexiconPath}
                fill="none"
                stroke="#F43F5E"
                strokeWidth="2.5"
                strokeDasharray="4 3"
                className="opacity-70"
              />
              <path
                d={practicePath}
                fill="none"
                stroke="#4F35D2"
                strokeWidth="3"
              />
              <path
                d={theoryPath}
                fill="none"
                stroke="#0284C7"
                strokeWidth="3.5"
              />
            </svg>

            {/* Dynamic Interactive Tooltip Callout (tracking hover) */}
            <motion.div 
              animate={{ left: `${Math.min(85, Math.max(15, hoverX))}%` }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="absolute top-2 -translate-x-1/2 bg-slate-950 text-white rounded-[16px] px-3.5 py-1.5 shadow-tactile-pill flex items-center gap-1.5 text-xs font-bold pointer-events-none z-20 whitespace-nowrap"
            >
              <span className="text-amber-400">↑</span>
              <span>+{hoverValue}% Retention ({days[hoveredIndex]})</span>
            </motion.div>

            {/* X-Axis Day Labels */}
            <div className="absolute bottom-0 inset-x-0 flex justify-between text-[11px] font-mono font-medium text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-white/5 pointer-events-none">
              {days.map((day, i) => (
                <span 
                  key={day} 
                  className={cn(
                    "text-center flex-1 transition-colors",
                    hoveredIndex === i ? "text-slate-900 dark:text-white font-bold" : ""
                  )}
                >
                  {day}
                </span>
              ))}
            </div>
          </div>

          {/* Right Y-Axis Percentage Labels */}
          <div className="w-8 h-40 flex flex-col justify-between text-[10px] font-mono text-slate-400 dark:text-slate-500 text-right self-start pt-1 pointer-events-none">
            <span>100%</span>
            <span>80%</span>
            <span>40%</span>
            <span>0%</span>
          </div>
        </div>
      </div>

      {/* Expanded Chart Modal */}
      <AnimatePresence>
        {isExpandedModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-[32px] border border-black/[0.08] dark:border-white/10 p-6 sm:p-8 shadow-tactile-dock"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold font-display text-slate-900 dark:text-white">
                    Detailed Performance Analytics
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Continuous Leitner retention curve analysis across study sources.
                  </p>
                </div>
                <button
                  onClick={() => setIsExpandedModal(false)}
                  className="size-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  <Minimize2 className="size-4" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-[22px] bg-sky-50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/40">
                  <span className="text-xs text-sky-700 dark:text-sky-300 font-semibold">Theory Retention</span>
                  <span className="text-2xl font-bold block mt-1 text-slate-900 dark:text-white font-mono">88%</span>
                </div>
                <div className="p-4 rounded-[22px] bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40">
                  <span className="text-xs text-purple-700 dark:text-purple-300 font-semibold">Practice Accuracy</span>
                  <span className="text-2xl font-bold block mt-1 text-slate-900 dark:text-white font-mono">78%</span>
                </div>
                <div className="p-4 rounded-[22px] bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40">
                  <span className="text-xs text-rose-700 dark:text-rose-300 font-semibold">Lexicon Recall</span>
                  <span className="text-2xl font-bold block mt-1 text-slate-900 dark:text-white font-mono">65%</span>
                </div>
              </div>

              <button
                onClick={() => setIsExpandedModal(false)}
                className="w-full py-3 rounded-full bg-slate-950 text-white dark:bg-white dark:text-slate-950 font-bold text-sm shadow-tactile-pill cursor-pointer"
              >
                Close View
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
