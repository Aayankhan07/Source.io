"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Check, ArrowRight, Key, Clock } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

export function PricingComparisonSection() {
  const shouldReduceMotion = useReducedMotion();
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

  return (
    <motion.section
      id="pricing-plans"
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: shouldReduceMotion ? 0.3 : 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="py-12 sm:py-16 relative z-10 w-full scroll-mt-24"
    >
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3 mb-10">
        <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 font-semibold">
          04. TRANSPARENT PRICING & FREE ALLOWANCE
        </p>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-display tracking-tight text-slate-900 dark:text-white">
          A real free tier. No deceptive trial traps.
        </h2>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
          Every account receives 25 daily AI actions that reset every night at 00:00 UTC. Bring your own API key anytime for unlimited local usage.
        </p>

        {/* Next quota countdown pill */}
        <div className="pt-2 flex justify-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 text-xs font-mono text-slate-700 dark:text-slate-300 shadow-sm">
            <Clock className="size-3.5 text-slate-500 dark:text-slate-400" />
            <span>Next quota refresh in: <strong className="font-semibold text-slate-900 dark:text-white">{timeUntilReset || "24h 00m 00s"}</strong></span>
          </div>
        </div>
      </div>

      {/* 3 Pricing Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch max-w-6xl mx-auto">
        {/* Plan 1: Free Forever */}
        <div className="relative rounded-[28px] bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 p-7 sm:p-8 flex flex-col justify-between shadow-tactile-card hover:-translate-y-1 transition-transform duration-200">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-mono uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                FREE FOREVER
              </span>
              <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                Daily Refill
              </span>
            </div>

            <div className="mb-4">
              <span className="text-4xl sm:text-5xl font-black font-display text-slate-900 dark:text-white">$0</span>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
                No credit card or payment info needed
              </p>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
              Designed for students and independent researchers reviewing course syllabi, articles, and exam preps.
            </p>

            <ul className="space-y-3 text-xs sm:text-[13px] text-slate-700 dark:text-slate-200 border-t border-slate-100 dark:border-white/10 pt-6">
              <li className="flex items-start gap-2.5">
                <Check className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>25 AI study generations every single day</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>3 concurrent active document slots</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>All 5 study modes (Notes, Cards, Quiz, Audio, Chat)</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>Sub-second KaTeX math & LaTeX formula rendering</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>Zero data retention: documents never train models</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>Export to Markdown, Anki (.apkg), and MP3</span>
              </li>
            </ul>
          </div>

          <div className="pt-8">
            <Link
              href="/auth"
              className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-900 dark:text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Start free without credit card</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>

        {/* Plan 2: Scholar Pass (Highlighted Card) */}
        <div className="relative rounded-[28px] bg-white dark:bg-slate-900/90 border-2 border-slate-900 dark:border-white p-7 sm:p-8 flex flex-col justify-between shadow-2xl hover:-translate-y-1 transition-transform duration-200">
          {/* Top Floating Badge */}
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-black text-white dark:bg-white dark:text-black text-[11px] font-mono font-bold px-3 py-1 rounded-full shadow-md whitespace-nowrap">
            Most Popular for Full-Time Students
          </div>

          <div>
            <div className="flex items-center justify-between mb-4 mt-1">
              <span className="text-[11px] font-mono uppercase font-bold tracking-wider text-slate-900 dark:text-white">
                SCHOLAR PASS
              </span>
              <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border border-sky-500/40 bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400">
                Unlimited
              </span>
            </div>

            <div className="mb-4">
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl sm:text-5xl font-black font-display text-slate-900 dark:text-white">$9</span>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">/ month</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
                Or use your own Groq / Gemini API key free
              </p>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
              For heavy semesters, thesis literature reviews, and medical or legal exam board preparations.
            </p>

            <ul className="space-y-3 text-xs sm:text-[13px] text-slate-700 dark:text-slate-200 border-t border-slate-100 dark:border-white/10 pt-6">
              <li className="flex items-start gap-2.5">
                <Check className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span className="font-semibold text-slate-900 dark:text-white">Unlimited AI generations with priority queue</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>Unlimited active document storage slots</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>High-bitrate studio audio podcast generation</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>Full-book ingestion (up to 300 pages per file)</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>Custom Leitner interval memory curves</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>Option to Bring-Your-Own-Key (BYOK) for $0/mo</span>
              </li>
            </ul>
          </div>

          <div className="pt-8">
            <Link
              href="/auth"
              className="w-full py-3 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors shadow-lg cursor-pointer"
            >
              <span>Get Scholar Pass</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>

        {/* Plan 3: Campus & Research Lab */}
        <div className="relative rounded-[28px] bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 p-7 sm:p-8 flex flex-col justify-between shadow-tactile-card hover:-translate-y-1 transition-transform duration-200">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-mono uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                CAMPUS & RESEARCH LAB
              </span>
              <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300">
                Team License
              </span>
            </div>

            <div className="mb-4">
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl sm:text-5xl font-black font-display text-slate-900 dark:text-white">$29</span>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">/ lab seat</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
                Billed annually or per research grant
              </p>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
              For university departments, clinical study groups, and enterprise research teams.
            </p>

            <ul className="space-y-3 text-xs sm:text-[13px] text-slate-700 dark:text-slate-200 border-t border-slate-100 dark:border-white/10 pt-6">
              <li className="flex items-start gap-2.5">
                <Check className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>Shared collaborative document repositories</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>Classroom shared flashcard decks & quiz metrics</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>Canvas & Blackboard LMS single sign-on (SSO)</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>Dedicated compliance DPA & zero-retention SLA</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>Direct priority engineering support</span>
              </li>
            </ul>
          </div>

          <div className="pt-8">
            <Link
              href="/auth"
              className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-900 dark:text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Contact Academic Licensing</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom BYOK (Bring Your Own Key) Callout Banner */}
      <div className="max-w-6xl mx-auto mt-8">
        <div className="p-4 sm:p-5 rounded-[22px] bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 shadow-tactile-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-800 dark:text-slate-200 shrink-0">
              <Key className="size-4" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white font-display">
                Developer & Hacker Friendly: Bring Your Own API Key (BYOK)
              </p>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                Have your own Groq or Gemini API key? Plug it in under Settings and bypass all daily rate limits for free forever.
              </p>
            </div>
          </div>

          <Link
            href="/app/settings"
            className="text-xs font-semibold text-slate-900 dark:text-white hover:underline whitespace-nowrap shrink-0 self-end sm:self-center"
          >
            Configure in Settings →
          </Link>
        </div>
      </div>
    </motion.section>
  );
}
