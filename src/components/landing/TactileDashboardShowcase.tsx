"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  LineChart, 
  Target, 
  Layers, 
  Clock, 
  BookOpen, 
  Sparkles, 
  ChevronRight, 
  FileText, 
  Video, 
  Mic, 
  CheckCircle2, 
  ArrowUpRight 
} from "lucide-react";
import { SectionHeading } from "./SectionHeading";
import { cn } from "@/lib/utils";

export function TactileDashboardShowcase() {
  const [hoveredDay, setHoveredDay] = useState<number>(4); // Thursday default
  const [activeCurveTab, setActiveCurveTab] = useState<"All" | "Theory" | "Practice" | "Lexicon">("All");

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Weekly retention telemetry points (0 - 100)
  const curves = {
    theory: [32, 48, 42, 74, 88, 76, 92],
    practice: [20, 36, 52, 60, 82, 70, 84],
    lexicon: [14, 25, 34, 45, 68, 58, 72],
  };

  // Helper for generating cubic SVG bezier path
  const generatePath = (points: number[]) => {
    const width = 540;
    const height = 150;
    const step = width / (points.length - 1);

    return points.reduce((acc, point, i) => {
      const x = i * step;
      const y = height - (point / 100) * height + 10;
      if (i === 0) return `M ${x},${y}`;
      const prevX = (i - 1) * step;
      const prevY = height - (points[i - 1] / 100) * height + 10;
      const cp1X = prevX + step / 2;
      const cp1Y = prevY;
      const cp2X = prevX + step / 2;
      const cp2Y = y;
      return `${acc} C ${cp1X},${cp1Y} ${cp2X},${cp2Y} ${x},${y}`;
    }, "");
  };

  const sampleLibrary = [
    {
      title: "Introduction to Quantum Computing",
      type: "PDF",
      icon: FileText,
      color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
      stats: "38 pages • 48 vectors",
      status: "Ready",
    },
    {
      title: "Linear Algebra & Eigenvalues",
      type: "Text",
      icon: BookOpen,
      color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
      stats: "Cornell Notes • 18 cards",
      status: "Ready",
    },
    {
      title: "Distributed Consensus Protocols",
      type: "YouTube",
      icon: Video,
      color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      stats: "52 min lecture • Socratic audio",
      status: "Ready",
    },
  ];

  return (
    <section id="dashboard" className="py-12 sm:py-20 relative z-10 w-full scroll-mt-24">
      {/* Section Header */}
      <SectionHeading
        badge="Command Center"
        badgeTone="blue"
        line1="Long-term retention,"
        line2="visually measured."
        description="Source.io doesn't just synthesize documents—it actively tracks your memory decay, study goals, and source library inside a tactile personal dashboard."
        align="left"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mt-8">
        {/* Left Column: Interactive Performance Retention Chart */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900/90 rounded-[32px] p-5 sm:p-7 border border-black/[0.06] dark:border-white/10 shadow-tactile-card flex flex-col justify-between select-none">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">
                  Tactile Performance Chart
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold">
                  Live Telemetry
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Multi-curve synthesis tracking your retention over time
              </p>
            </div>

            {/* Metric Legend Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-full bg-slate-100 dark:bg-white/[0.05] text-xs">
              {(["All", "Theory", "Practice", "Lexicon"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveCurveTab(tab)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer",
                    activeCurveTab === tab
                      ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold"
                      : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Retention SVG Curves Canvas */}
          <div className="relative w-full h-[180px] my-2">
            {/* Grid horizontal markers */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-40">
              <div className="border-b border-dashed border-slate-200 dark:border-white/10 w-full" />
              <div className="border-b border-dashed border-slate-200 dark:border-white/10 w-full" />
              <div className="border-b border-dashed border-slate-200 dark:border-white/10 w-full" />
            </div>

            <svg viewBox="0 0 540 170" className="w-full h-full overflow-visible" preserveAspectRatio="none">
              <defs>
                <linearGradient id="theoryGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#0284C7" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#0284C7" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Theory Curve (Sky) */}
              {(activeCurveTab === "All" || activeCurveTab === "Theory") && (
                <path
                  d={generatePath(curves.theory)}
                  fill="none"
                  stroke="#0284C7"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                />
              )}

              {/* Practice Curve (Purple) */}
              {(activeCurveTab === "All" || activeCurveTab === "Practice") && (
                <path
                  d={generatePath(curves.practice)}
                  fill="none"
                  stroke="#8B5CF6"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                />
              )}

              {/* Lexicon Curve (Rose) */}
              {(activeCurveTab === "All" || activeCurveTab === "Lexicon") && (
                <path
                  d={generatePath(curves.lexicon)}
                  fill="none"
                  stroke="#F43F5E"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
              )}
            </svg>

            {/* Interactive Vertical Hover Guide Bar */}
            <div
              className="absolute top-0 bottom-0 pointer-events-none transition-all duration-150 flex flex-col items-center"
              style={{ left: `${(hoveredDay / (days.length - 1)) * 100}%` }}
            >
              <div className="w-[1.5px] h-full bg-slate-900/30 dark:bg-white/30" />
              <div className="absolute -top-7 px-2 py-0.5 rounded-md bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-mono text-[10px] font-bold shadow-xs whitespace-nowrap">
                {curves.theory[hoveredDay]}% recall
              </div>
            </div>
          </div>

          {/* Days Interactive Ticker Bar */}
          <div className="grid grid-cols-7 gap-1 mt-4 pt-3 border-t border-slate-100 dark:border-white/10">
            {days.map((day, idx) => (
              <button
                key={day}
                onMouseEnter={() => setHoveredDay(idx)}
                onClick={() => setHoveredDay(idx)}
                className={cn(
                  "py-1.5 rounded-xl text-center text-xs font-mono transition-all cursor-pointer",
                  hoveredDay === idx
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-bold shadow-tactile-pill scale-105"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                )}
              >
                {day}
              </button>
            ))}
          </div>

          {/* Bottom Chart Footer Metrics */}
          <div className="grid grid-cols-3 gap-2 mt-5 pt-3 border-t border-slate-100 dark:border-white/10 text-center">
            <div>
              <div className="text-[10px] font-mono text-slate-400">Theory Recall</div>
              <div className="text-sm font-bold text-[#0284C7] font-display">88% peak</div>
            </div>
            <div>
              <div className="text-[10px] font-mono text-slate-400">Active Practice</div>
              <div className="text-sm font-bold text-[#8B5CF6] font-display">82% mastery</div>
            </div>
            <div>
              <div className="text-[10px] font-mono text-slate-400">Memory Decay</div>
              <div className="text-sm font-bold text-emerald-500 font-display">-42% slower</div>
            </div>
          </div>
        </div>

        {/* Right Column: Weekly Goals & Sources Library Stack */}
        <div className="lg:col-span-5 flex flex-col gap-6 w-full">
          {/* 1. Weekly Goals Capsule */}
          <div className="bg-white dark:bg-slate-900/90 rounded-[32px] p-5 sm:p-6 border border-black/[0.06] dark:border-white/10 shadow-tactile-card select-none">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target className="size-4 text-purple-500" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white font-display">
                  Weekly Study Target
                </h4>
              </div>
              <span className="text-[11px] font-mono text-slate-400">Week 41</span>
            </div>

            {/* Target Progress Bars */}
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-600 dark:text-slate-300 font-medium">Study Hours</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">9.5 / 12.0h</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-white/[0.08] overflow-hidden">
                  <div className="h-full rounded-full bg-blue-600" style={{ width: "79%" }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-600 dark:text-slate-300 font-medium">Sources Synthesized</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">4 / 5 docs</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-white/[0.08] overflow-hidden">
                  <div className="h-full rounded-full bg-purple-600" style={{ width: "80%" }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-600 dark:text-slate-300 font-medium">Comprehension Proofs</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">88% rate</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-white/[0.08] overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: "88%" }} />
                </div>
              </div>
            </div>
          </div>

          {/* 2. Study Library Grid Preview */}
          <div className="bg-white dark:bg-slate-900/90 rounded-[32px] p-5 sm:p-6 border border-black/[0.06] dark:border-white/10 shadow-tactile-card select-none">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <BookOpen className="size-4 text-primary" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white font-display">
                  Active Study Sources
                </h4>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-500">
                3 Free Slots
              </span>
            </div>

            <div className="space-y-2">
              {sampleLibrary.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.title}
                    href="/app/doc/demo-quantum"
                    className="p-2.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] hover:bg-slate-100 dark:hover:bg-white/[0.06] border border-black/[0.04] dark:border-white/05 flex items-center justify-between group transition-all"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className={cn("size-7 rounded-xl flex items-center justify-center shrink-0 border", item.color)}>
                        <Icon className="size-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-primary transition-colors">
                          {item.title}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">{item.stats}</div>
                      </div>
                    </div>
                    <ArrowUpRight className="size-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </Link>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-400">All materials parsed in local isolated sessions</span>
              <Link href="/app" className="text-xs font-bold text-primary hover:underline">
                Open App Library →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
