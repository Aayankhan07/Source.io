"use client";

import { LandingHeader } from "./LandingHeader";
import { TactileHeroPrototype } from "./TactileHeroPrototype";
import { IngestionRibbon } from "./IngestionRibbon";
import { InteractiveWorkflowDemo } from "./InteractiveWorkflowDemo";
import { TactileDashboardShowcase } from "./TactileDashboardShowcase";
import { FeatureMotionCards } from "./FeatureMotionCards";
import { KnowledgePipeline } from "./KnowledgePipeline";
import { FreeTierTransparency } from "./FreeTierTransparency";
import { CredibilityAndComparison } from "./CredibilityAndComparison";
import { LandingFooter } from "./LandingFooter";

export function LandingPage() {
  return (
    <div className="min-h-[100dvh] bg-tactile-canvas text-foreground font-sans relative overflow-x-clip transition-colors duration-200">
      {/* Ambient Continuous Atmospheric Halos (Luminous, subtle sky and warm amber tones) */}
      <div
        className="absolute top-0 right-0 w-full lg:w-[65%] h-[800px] -z-10 pointer-events-none opacity-60 dark:opacity-30"
        style={{
          background: "radial-gradient(ellipse 90% 70% at 75% 25%, rgba(14,165,233,0.12) 0%, rgba(245,158,11,0.08) 45%, transparent 75%)",
          filter: "blur(60px)",
        }}
        aria-hidden="true"
      />
      <div
        className="absolute top-[1600px] left-0 w-full lg:w-[55%] h-[750px] -z-10 pointer-events-none opacity-50 dark:opacity-20"
        style={{
          background: "radial-gradient(ellipse 80% 60% at 20% 50%, rgba(245,158,11,0.08) 0%, rgba(14,165,233,0.07) 50%, transparent 75%)",
          filter: "blur(70px)",
        }}
        aria-hidden="true"
      />
      <div
        className="absolute top-[3200px] right-0 w-full lg:w-[60%] h-[800px] -z-10 pointer-events-none opacity-50 dark:opacity-25"
        style={{
          background: "radial-gradient(ellipse 85% 65% at 80% 50%, rgba(139,92,246,0.08) 0%, rgba(14,165,233,0.06) 50%, transparent 80%)",
          filter: "blur(70px)",
        }}
        aria-hidden="true"
      />

      {/* 1. Floating Capsule App-Style Navigation Header */}
      <LandingHeader />

      {/* Main Fluid Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 sm:space-y-24 pb-16 pt-4">
        {/* 2. Hero Section: Authentic 5-Mode Synthesis & Live Demo CTAs */}
        <TactileHeroPrototype />

        {/* 3. Ingestion Formats Floating Ribbon */}
        <IngestionRibbon />

        {/* 4. Interactive Study Workbench (The 5 Modalities Deep Dive) */}
        <InteractiveWorkflowDemo />

        {/* 5. Study Command Center (Performance Curves, Weekly Goals & Library) */}
        <TactileDashboardShowcase />

        {/* 6. Verification & Grounding Engine Bento */}
        <FeatureMotionCards />

        {/* 7. Continuous 4-Stage Knowledge Pipeline */}
        <KnowledgePipeline />

        {/* 8. 100% Free Architecture & Daily Quota Transparency */}
        <FreeTierTransparency />

        {/* 9. Guarantees, Domain Comparison & FAQ */}
        <CredibilityAndComparison />

        {/* 10. Modern Tactile Footer */}
        <LandingFooter />
      </main>
    </div>
  );
}
