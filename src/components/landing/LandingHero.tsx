"use client";

import Link from "next/link";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useTheme } from "@/hooks/use-theme";
import { ArrowRight, ChevronRight } from "lucide-react";
import { HeroProductDemo } from "./HeroProductDemo";

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
    <section className="min-h-[calc(100dvh-5rem)] flex flex-col justify-center relative isolate w-full overflow-hidden">
      {/* Full-Bleed Atmospheric Aurora Canopy (Spans entire screen, zero edge cutoff) */}
      <div className="absolute inset-0 pointer-events-none select-none z-0 overflow-hidden">
        {/* Primary Centered Top-Down Aurora Glow */}
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[1400px] xl:w-[1800px] h-[680px] opacity-50 dark:opacity-75"
          style={{
            background: "radial-gradient(ellipse 75% 55% at 50% -5%, rgba(6, 182, 212, 0.28), rgba(14, 116, 144, 0.16) 45%, rgba(15, 23, 42, 0.08) 70%, transparent 85%)",
          }}
        />

        {/* Dedicated Soft Radial Glow for Right-hand Demo Sandbox */}
        <div 
          className="absolute top-1/4 right-[2%] xl:right-[8%] w-[600px] h-[500px] rounded-full blur-[110px] opacity-35 dark:opacity-50"
          style={{
            background: "radial-gradient(circle, rgba(6, 182, 212, 0.32) 0%, rgba(14, 116, 144, 0.18) 50%, transparent 75%)",
          }}
        />

        {/* Subtle Architectural Dot Matrix Overlay with smooth radial fade */}
        <div 
          className="absolute inset-0 text-slate-900/20 dark:text-white/15 opacity-50 dark:opacity-70 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            maskImage: "radial-gradient(ellipse 75% 65% at 50% 30%, black, transparent 80%)",
            WebkitMaskImage: "radial-gradient(ellipse 75% 65% at 50% 30%, black, transparent 80%)",
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-10 xl:px-12 pt-6 sm:pt-10 pb-12 relative z-10 my-auto">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-14 items-center w-full">
          {/* Left Column: Focused Copy Stack (Strictly 4 text elements per Taste Skill) */}
          <div className="lg:col-span-7 space-y-6 text-left">
          {/* 1. Eyebrow pill with live chromatic pulse */}
          <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-full bg-cyan-500/10 dark:bg-cyan-950/40 border border-cyan-500/30 dark:border-cyan-500/25 text-xs font-mono text-cyan-800 dark:text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.12)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
            </span>
            <span>One source, five study lenses</span>
          </div>

          {/* 2. Headline (Max 2 lines desktop) */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-medium tracking-tight text-foreground leading-[1.08] text-balance">
            Turn any source into structured mastery
          </h1>

          {/* 3. Subtext (<20 words, strictly disciplined) */}
          <p className="text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed">
            Drop in documents, recordings, or lectures. Source derives five verified study modes with exact passage citations.
          </p>

          {/* 4. CTAs (Primary + Secondary) with Luminous Bloom */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
            <Link
              href={mounted && user ? "/app" : "/auth"}
              className="bg-foreground hover:bg-foreground/90 text-background font-medium text-sm px-7 py-3 rounded-full shadow-[0_0_24px_rgba(6,182,212,0.35)] hover:shadow-[0_0_32px_rgba(6,182,212,0.5)] border border-cyan-400/40 active:scale-[0.98] transition-all inline-flex items-center justify-center gap-2 cursor-pointer group"
            >
              <span>{mounted && user ? "Open workspace" : "Get started free"}</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 text-cyan-400" strokeWidth={1.5} />
            </Link>
            <button
              type="button"
              onClick={scrollToWorkbench}
              className="bg-card/80 hover:bg-accent/80 backdrop-blur-md text-foreground font-medium text-sm px-6 py-3 rounded-full border border-border/80 shadow-xs active:scale-[0.98] transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Explore live demo</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
            </button>
          </div>

          {/* Telemetry Micro-Pills (Unified Electric Cyan) */}
          <div className="flex flex-wrap items-center gap-4 pt-1 text-xs font-mono text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400/90 shadow-[0_0_6px_rgba(6,182,212,0.4)]" />
              <span>8 Ingest Formats</span>
            </span>
            <span className="text-border">/</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400/90 shadow-[0_0_6px_rgba(6,182,212,0.4)]" />
              <span>Sentence-Level Citations</span>
            </span>
            <span className="text-border">/</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400/90 shadow-[0_0_6px_rgba(6,182,212,0.4)]" />
              <span>100% Grounded</span>
            </span>
          </div>
        </div>

          {/* Right Column: Live Interactive 5-in-1 Simulator */}
          <div className="lg:col-span-5 relative w-full">
            <HeroProductDemo onExploreWorkflow={scrollToWorkbench} />
          </div>
        </div>
      </div>
    </section>
  );
}
