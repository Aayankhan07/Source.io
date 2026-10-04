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
    <section className="min-h-[calc(100dvh-5rem)] flex flex-col justify-center pt-6 sm:pt-10 pb-12 px-4 sm:px-6 lg:px-10 xl:px-12 relative z-10 max-w-7xl mx-auto w-full">
      <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-14 items-center flex-1 my-auto w-full">
        {/* Left Column: Focused Copy Stack (Strictly 4 text elements per Taste Skill) */}
        <div className="lg:col-span-7 space-y-6 text-left">
          {/* 1. Eyebrow pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent border border-border text-xs font-mono text-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
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

          {/* 4. CTAs (Primary + Secondary) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
            <Link
              href={mounted && user ? "/app" : "/auth"}
              className="bg-primary hover:opacity-90 text-primary-foreground font-medium text-sm px-7 py-3 rounded-full shadow-sm active:scale-[0.98] transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{mounted && user ? "Open workspace" : "Get started free"}</span>
              <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
            </Link>
            <button
              type="button"
              onClick={scrollToWorkbench}
              className="bg-card hover:bg-accent text-foreground font-medium text-sm px-6 py-3 rounded-full border border-border/80 shadow-xs active:scale-[0.98] transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Explore live demo</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
            </button>
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
