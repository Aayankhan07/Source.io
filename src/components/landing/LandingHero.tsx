"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useTheme } from "@/hooks/use-theme";
import { ArrowRight, ChevronRight } from "lucide-react";
import { HeroProductDemo } from "./HeroProductDemo";
import { reveal, revealStagger, VIEWPORT } from "./motion";

export function LandingHero() {
  const { user } = useAuth();
  const { mounted } = useTheme();

  const scrollToWorkbench = () => {
    const el = document.getElementById("workbench");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative w-full pt-8 pb-14 md:pt-14 md:pb-20 overflow-hidden">
      {/* Background Architectural Grid Pattern (Clean, ink-tinted, zero colored glows) */}
      <div
        className="absolute inset-0 text-slate-900/[0.04] dark:text-white/[0.03] pointer-events-none select-none"
        style={{
          backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 30%, black, transparent 85%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 30%, black, transparent 85%)",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Focused Copy Stack */}
          <motion.div
            variants={revealStagger}
            initial="hidden"
            whileInView="show"
            viewport={VIEWPORT}
            className="lg:col-span-7 flex flex-col items-start relative text-left"
          >
            {/* 1. Tinted Eyebrow Badge (Sentence case, no uppercase tracking wide) */}
            <motion.div variants={reveal} className="mb-4">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/10 text-blue-950 dark:bg-blue-950/70 dark:text-blue-200 border border-blue-900/25 dark:border-blue-700/50 text-[12px] font-semibold leading-[18px] shadow-xs">
                <span className="size-2 rounded-full bg-blue-950 dark:bg-blue-400 shrink-0" />
                <span>One source, five study lenses</span>
              </span>
            </motion.div>

            {/* 2. Two-Tone Headline (52/57 desktop, second half in slate #6F7988) */}
            <motion.h1
              variants={reveal}
              className="text-[clamp(32px,4.5vw,52px)] font-bold tracking-[-0.025em] leading-[1.08] text-foreground font-sans text-balance"
            >
              <span>Turn any raw source</span>{" "}
              <span className="text-[#6F7988] dark:text-slate-400 font-normal">
                into structured mastery.
              </span>
            </motion.h1>

            {/* 3. Disciplined Description (15.5px, max 520px) */}
            <motion.p
              variants={reveal}
              className="mt-4 text-[15.5px] leading-[1.7] text-muted-foreground max-w-[520px]"
            >
              Drop in textbooks, recorded lectures, or research papers. Source.io derives five
              verified study modes with sentence-level citations.
            </motion.p>

            {/* 4. Action Buttons (Primary + Secondary) */}
            <motion.div variants={reveal} className="mt-7 flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <Link
                href={mounted && user ? "/app" : "/auth"}
                className="bg-primary text-primary-foreground font-medium rounded-md px-5 py-2.5 text-sm shadow-xs hover:opacity-95 active:scale-[0.99] transition-all inline-flex items-center justify-center gap-2 cursor-pointer group"
              >
                <span>{mounted && user ? "Open workspace" : "Start free"}</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 text-blue-950 dark:text-blue-400" />
              </Link>
              <button
                type="button"
                onClick={scrollToWorkbench}
                className="border border-border/80 bg-card hover:bg-muted/70 text-foreground font-medium rounded-md px-4 py-2.5 text-sm shadow-xs active:scale-[0.99] transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Explore the 5 views</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            </motion.div>

            {/* 5. Telemetry Meta Strip (11px floor, sentence case, no glows) */}
            <motion.div
              variants={reveal}
              className="mt-6 flex flex-wrap items-center gap-3 text-[11px] font-medium text-muted-foreground select-none"
            >
              <span className="inline-flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-blue-900 dark:bg-blue-400" />
                <span>8 ingest formats</span>
              </span>
              <span className="text-border">·</span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-blue-900 dark:bg-blue-400" />
                <span>Sentence-level citations</span>
              </span>
              <span className="text-border">·</span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-blue-900 dark:bg-blue-400" />
                <span>100% grounded facts</span>
              </span>
            </motion.div>
          </motion.div>

          {/* Right Column: Live Interactive 5-in-1 Simulator */}
          <div className="lg:col-span-5 relative w-full">
            <HeroProductDemo onExploreWorkflow={scrollToWorkbench} />
          </div>
        </div>
      </div>
    </section>
  );
}
