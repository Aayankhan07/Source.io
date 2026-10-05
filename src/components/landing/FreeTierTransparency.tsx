"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Sparkles, 
  Key, 
  Clock, 
  Zap, 
  ShieldCheck, 
  Check, 
  Layers, 
  ArrowRight,
  Database,
  Cpu,
  Infinity as InfinityIcon
} from "lucide-react";
import { SectionHeading } from "./SectionHeading";
import { cn } from "@/lib/utils";

export function FreeTierTransparency() {
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

  const features = [
    {
      title: "25 Free Actions Every 24h",
      desc: "Enough daily allowance to ingest a full textbook chapter, stream notes, derive flashcards, generate a quiz, and run cited chat.",
      metric: "25 / day",
      icon: Zap,
    },
    {
      title: "3 Active Workspace Slots",
      desc: "Maintain up to 3 dense source documents concurrently with real-time vector embeddings and instant switching.",
      metric: "3 Sources",
      icon: Database,
    },
    {
      title: "Sub-Second Groq Llama 3.3",
      desc: "Notes and derivations stream at 300+ tokens per second. No waiting minutes for complex study assets to generate.",
      metric: "70B Model",
      icon: Cpu,
    },
    {
      title: "Optional Unlimited BYOK",
      desc: "Power learners can input their own free Groq API key in Settings to bypass all daily quota limits forever.",
      metric: "Unlimited",
      icon: InfinityIcon,
    },
  ];

  return (
    <section id="pricing" className="py-12 sm:py-20 relative z-10 w-full scroll-mt-24">
      {/* Section Header */}
      <SectionHeading
        badge="Zero Paywall Games"
        badgeTone="amber"
        line1="A genuinely generous"
        line2="free study architecture."
        description="Source.io is designed for students, researchers, and professionals who need high-velocity study tools without predatory paywalls or bait-and-switch trials."
        align="left"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mt-8">
        {/* Left Column: Feature Highlights */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="p-5 sm:p-6 rounded-[28px] bg-white dark:bg-slate-900/90 border border-black/[0.06] dark:border-white/10 shadow-tactile-card flex flex-col justify-between select-none hover:-translate-y-1 transition-transform duration-200"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="size-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                      <Icon className="size-5" />
                    </div>
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-slate-200">
                      {feat.metric}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white font-display mb-1.5">
                    {feat.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: In-App Tactile Quota Pill Showcase */}
        <div className="lg:col-span-5 w-full">
          <div className="p-6 sm:p-7 rounded-[36px] bg-gradient-to-b from-slate-900 to-slate-950 text-white border border-white/10 shadow-tactile-dock flex flex-col justify-between relative overflow-hidden select-none">
            {/* Ambient Corner Flare */}
            <div className="absolute top-0 right-0 size-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-5">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-mono">
                  <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Daily Quota System</span>
                </div>
                <span className="text-xs font-mono text-amber-400">100% Free Forever</span>
              </div>

              <div>
                <h3 className="text-xl font-bold font-display text-white tracking-tight">
                  Transparent Daily Refresh
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Your 25 study generations reset automatically every day at midnight UTC.
                </p>
              </div>

              {/* Live Quota Bar Mockup */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
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
                  <span>Instant guest mode with preloaded quantum notes</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="size-2.5" />
                  </div>
                  <span>Bring your own Groq key for unlimited power use</span>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <Link
                  href="/auth"
                  className="w-full py-3 px-4 rounded-full bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 cursor-pointer"
                >
                  <span>Start studying now</span>
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
