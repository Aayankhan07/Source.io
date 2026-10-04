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
    <section className="min-h-[calc(100dvh-5rem)] flex flex-col justify-center pt-6 sm:pt-10 pb-12 px-4 sm:px-6 lg:px-10 xl:px-12 relative z-10 max-w-7xl mx-auto w-full overflow-hidden">
      {/* Ambient Aurora Glow Canvas (Atmospheric depth behind hero) */}
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[550px] lg:w-[700px] h-[500px] pointer-events-none select-none -z-10 opacity-35 dark:opacity-45 blur-[120px] transition-opacity duration-1000">
        <div className="absolute top-0 right-10 w-72 h-72 rounded-full bg-cyan-500/40" />
        <div className="absolute bottom-10 right-32 w-80 h-80 rounded-full bg-indigo-600/35" />
        <div className="absolute top-1/3 left-10 w-64 h-64 rounded-full bg-emerald-500/25" />
      </div>

      <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-14 items-center flex-1 my-auto w-full">
        {/* Left Column: Focused Copy Stack (Strictly 4 text elements per Taste Skill) */}
        <div className="lg:col-span-7 space-y-6 text-left">
          {/* 1. Eyebrow pill with live chromatic pulse */}
          <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/25 text-xs font-mono text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
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

          {/* Telemetry Micro-Pills */}
          <div className="flex flex-wrap items-center gap-4 pt-1 text-xs font-mono text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              <span>8 Ingest Formats</span>
            </span>
            <span className="text-border">/</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
              <span>Sentence-Level Citations</span>
            </span>
            <span className="text-border">/</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>100% Grounded</span>
            </span>
          </div>
        </div>

        {/* Right Column: Live Interactive 5-in-1 Simulator */}
        <div className="lg:col-span-5 relative w-full">
          <HeroProductDemo onExploreWorkflow={scrollToWorkbench} />
        </div>
      </div>
    </section>
  );
}
