"use client";

import { LandingHeader } from "./LandingHeader";
import { TactileHeroPrototype } from "./TactileHeroPrototype";
import { IngestionRibbon } from "./IngestionRibbon";
import { InteractiveWorkflowDemo } from "./InteractiveWorkflowDemo";
import { FeatureMotionCards } from "./FeatureMotionCards";
import { KnowledgePipeline } from "./KnowledgePipeline";
import { CredibilityAndComparison } from "./CredibilityAndComparison";
import { LandingFooter } from "./LandingFooter";

export function LandingPage() {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground font-sans relative overflow-x-clip transition-colors duration-150">
      {/* Ambient Continuous Atmospheric Halos (Carrying the Hero's warm, luminous theme down the whole page) */}
      <div
        className="absolute top-0 right-0 w-full lg:w-[65%] h-[800px] -z-10 pointer-events-none opacity-80 dark:opacity-40"
        style={{
          background: "radial-gradient(ellipse 90% 70% at 75% 25%, rgba(6,182,212,0.12) 0%, rgba(245,158,11,0.08) 45%, transparent 75%)",
          filter: "blur(50px)",
        }}
        aria-hidden="true"
      />
      <div
        className="absolute top-[1300px] left-0 w-full lg:w-[55%] h-[750px] -z-10 pointer-events-none opacity-70 dark:opacity-30"
        style={{
          background: "radial-gradient(ellipse 80% 60% at 20% 50%, rgba(245,158,11,0.09) 0%, rgba(6,182,212,0.06) 50%, transparent 75%)",
          filter: "blur(60px)",
        }}
        aria-hidden="true"
      />
      <div
        className="absolute top-[2600px] right-0 w-full lg:w-[60%] h-[800px] -z-10 pointer-events-none opacity-75 dark:opacity-35"
        style={{
          background: "radial-gradient(ellipse 85% 65% at 80% 50%, rgba(6,182,212,0.1) 0%, rgba(245,158,11,0.07) 50%, transparent 80%)",
          filter: "blur(60px)",
        }}
        aria-hidden="true"
      />
      <div
        className="absolute bottom-[400px] left-1/2 -translate-x-1/2 w-full max-w-5xl h-[600px] -z-10 pointer-events-none opacity-60 dark:opacity-25"
        style={{
          background: "radial-gradient(circle at 50% 50%, rgba(245,158,11,0.08) 0%, rgba(6,182,212,0.08) 55%, transparent 80%)",
          filter: "blur(65px)",
        }}
        aria-hidden="true"
      />

      {/* Floating 3D Geometric Confetti Accents Across the Page Margins */}
      <div className="absolute top-[850px] left-8 size-4 rotate-12 bg-amber-400/60 rounded-xs shadow-xs pointer-events-none hidden xl:block" />
      <div className="absolute top-[1250px] right-12 size-3.5 rotate-45 bg-primary/60 rounded-xs shadow-xs pointer-events-none hidden xl:block" />
      <div className="absolute top-[2200px] left-10 size-3 rounded-full bg-cyan-400/50 shadow-xs pointer-events-none hidden xl:block" />
      <div className="absolute top-[3100px] right-14 size-4 rotate-12 bg-amber-400/50 rounded-xs shadow-xs pointer-events-none hidden xl:block" />
      <div className="absolute top-[4200px] left-12 size-3.5 rotate-45 bg-primary/50 rounded-xs shadow-xs pointer-events-none hidden xl:block" />

      {/* 1. Sticky Navigation Header */}
      <LandingHeader />

      {/* Main Fluid Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 sm:space-y-24 pb-16 pt-4">
        {/* 2. Hero Section (Tactile Orb Stage & Bottom Dock) */}
        <TactileHeroPrototype />

        {/* 3. Ingestion Formats Floating Ribbon */}
        <IngestionRibbon />

        {/* 4. Interactive Study Workbench (The 5 Views) */}
        <InteractiveWorkflowDemo />

        {/* 5. Verification & Grounding Engine Bento */}
        <FeatureMotionCards />

        {/* 6. Continuous 4-Stage Knowledge Pipeline */}
        <KnowledgePipeline />

        {/* 7. Guarantees, Domain Use-Cases, Comparison Matrix & FAQ */}
        <CredibilityAndComparison />

        {/* 8. Modern Footer */}
        <LandingFooter />
      </main>
    </div>
  );
}

