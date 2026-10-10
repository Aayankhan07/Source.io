"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Clock, 
  Check, 
  ArrowRight, 
  Key 
} from "lucide-react";
import { SectionHeading } from "./SectionHeading";
import { motion, useReducedMotion } from "motion/react";

export function FreeTierTransparency() {
  const shouldReduceMotion = useReducedMotion();
  // Live calculation of time until 00:00 UTC
  const [timeUntilReset, setTimeUntilReset] = useState<string>("");

  useEffect(() => {
    function updateCountdown() {
      const now = new Date();
      const nextUtcMidnight = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + 1,
        0, 0, 0, 0
      ));
      const diffMs = nextUtcMidnight.getTime() - now.getTime();
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      setTimeUntilReset(
        `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`
      );
    }
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const coreBenefits = [
    {
      title: "25 free AI actions every day",
      desc: "Enough daily allowance to ingest textbooks, generate notes, derive flashcards, take quizzes, and run cited chat.",
      metric: "25 / day",
    },
    {
      title: "3 active source workspaces",
      desc: "Maintain up to 3 dense source documents concurrently with real-time vector embeddings and instant switching.",
      metric: "3 Sources",
    },
    {
      title: "Zero-data retention guarantee",
      desc: "Your research papers and personal notes are never stored or used to train third-party AI models.",
      metric: "100% Private",
    },
  ];

  return (
    <motion.section 
      id="pricing" 
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: shouldReduceMotion ? 0.3 : 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="py-12 sm:py-20 relative z-10 w-full scroll-mt-24"
    >
      {/* Section Header */}
      <SectionHeading
        badge="Free Plan"
        badgeTone="amber"
        line1="Start free."
        line2="No credit card required."
        description="Everything you need to master your current coursework, with generous daily allowances that refresh every 24 hours."
        align="left"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mt-8">
        {/* Left Column: 3 Core Benefits */}
        <div className="lg:col-span-7 flex flex-col justify-between gap-4">
          {coreBenefits.map((feat) => {
            return (
              <div
                key={feat.title}
                onMouseMove={(e) => {
                  if (shouldReduceMotion) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  e.currentTarget.style.setProperty("--feat-x", `${e.clientX - rect.left}px`);
                  e.currentTarget.style.setProperty("--feat-y", `${e.clientY - rect.top}px`);
                }}
                className="group relative p-5 sm:p-6 rounded-[28px] bg-white border border-slate-200/90 hover:border-slate-300 shadow-tactile-card hover:shadow-lg flex items-start justify-between gap-4 select-none hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                {/* Spotlight cursor glow */}
                <div 
                  className="pointer-events-none absolute -inset-px rounded-[28px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-0"
                  style={{
                    background: "radial-gradient(350px circle at var(--feat-x, 100px) var(--feat-y, 100px), rgba(245, 158, 11, 0.08), transparent 70%)"
                  }}
                />

                <div className="relative z-10">
                  <h4 className="text-base font-bold text-slate-900 font-display mb-1 group-hover:text-amber-600 transition-colors">
                    {feat.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
                <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-slate-100 group-hover:bg-amber-50 group-hover:text-amber-700 text-slate-800 shrink-0 transition-colors relative z-10">
                  {feat.metric}
                </span>
              </div>
            );
          })}

          {/* Optional BYOK Pill for Technical Learners */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 flex items-center justify-between text-xs text-slate-600 transition-colors hover:shadow-xs">
            <div className="flex items-center gap-2">
              <Key className="size-4 text-slate-500" />
              <span>Need unlimited volume? Bring your own Groq API key in Settings.</span>
            </div>
            <span className="text-[11px] font-mono text-emerald-600 font-semibold">Optional BYOK</span>
          </div>
        </div>

        {/* Right Column: In-App Tactile Quota Pill Showcase */}
        <div className="lg:col-span-5 w-full flex flex-col">
          <div className="h-full p-6 sm:p-7 rounded-[32px] sm:rounded-[36px] bg-slate-950 text-white border border-slate-800 shadow-2xl flex flex-col justify-between relative overflow-hidden select-none hover:border-slate-700 transition-colors duration-300">
            {/* Ambient Corner Flare */}
            <div className="absolute top-0 right-0 size-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-5">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-mono">
                  <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Daily Quota System</span>
                </div>
                <span className="text-xs font-mono text-emerald-400 font-semibold">Refreshes Daily</span>
              </div>

              <div>
                <h3 className="text-xl font-bold font-display text-white tracking-tight">
                  Transparent Daily Refresh
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Your 25 study actions reset automatically every day at midnight UTC.
                </p>
              </div>

              {/* Live Quota Bar Mockup */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3 hover:border-white/20 transition-colors">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300">Daily Balance</span>
                  <span className="font-bold text-emerald-400">22 / 25 Available</span>
                </div>

                <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-amber-400" style={{ width: "88%" }} />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span className="flex items-center gap-1.5">
                    <Clock className="size-3 text-amber-400" />
                    <span>Reset in {timeUntilReset || "02h 15m 00s"}</span>
                  </span>
                  <span className="font-mono text-[10px]">00:00 UTC</span>
                </div>
              </div>

              {/* Guarantees checklist */}
              <div className="space-y-2 text-xs text-slate-300 pt-1">
                <div className="flex items-center gap-2">
                  <div className="size-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="size-2.5" />
                  </div>
                  <span>No credit card required to start</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="size-2.5" />
                  </div>
                  <span>Full access to all 5 study modes</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="size-2.5" />
                  </div>
                  <span>Instant guest demo with quantum notes</span>
                </div>
              </div>

              {/* Action Button: Consistent Start free */}
              <div className="pt-2">
                <motion.div
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.965, y: 0.5 }}
                  transition={{ type: "spring", stiffness: 450, damping: 25 }}
                >
                  <Link
                    href="/auth"
                    className="w-full py-3.5 px-4 rounded-full bg-white hover:bg-slate-100 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg cursor-pointer"
                  >
                    <span>Start free</span>
                    <ArrowRight className="size-4" />
                  </Link>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
