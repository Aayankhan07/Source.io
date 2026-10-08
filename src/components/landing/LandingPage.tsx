"use client";

import { useEffect } from "react";
import { LandingHeader } from "./LandingHeader";
import { TactileHeroPrototype } from "./TactileHeroPrototype";
import { IngestionRibbon } from "./IngestionRibbon";
import { KnowledgePipeline } from "./KnowledgePipeline";
import { InteractiveWorkflowDemo } from "./InteractiveWorkflowDemo";
import { FreeTierTransparency } from "./FreeTierTransparency";
import { CredibilityAndComparison } from "./CredibilityAndComparison";
import { LandingFooter } from "./LandingFooter";

export function LandingPage() {
  useEffect(() => {
    // Strictly enforce Light Theme on the landing page
    document.documentElement.classList.remove("dark");
  }, []);

  return (
    <div className="min-h-[100dvh] bg-tactile-canvas text-foreground font-sans relative overflow-x-clip transition-colors duration-200">
      {/* Ambient Continuous Atmospheric Halos (Soft, subtle sky and warm amber accents) */}
      <div
        className="absolute top-0 right-0 w-full lg:w-[65%] h-[700px] -z-10 pointer-events-none opacity-50"
        style={{
          background: "radial-gradient(ellipse 90% 70% at 75% 25%, rgba(14,165,233,0.1) 0%, rgba(245,158,11,0.06) 45%, transparent 75%)",
          filter: "blur(60px)",
        }}
        aria-hidden="true"
      />
      <div
        className="absolute top-[1400px] left-0 w-full lg:w-[55%] h-[650px] -z-10 pointer-events-none opacity-40 dark:opacity-15"
        style={{
          background: "radial-gradient(ellipse 80% 60% at 20% 50%, rgba(245,158,11,0.06) 0%, rgba(14,165,233,0.05) 50%, transparent 75%)",
          filter: "blur(70px)",
        }}
        aria-hidden="true"
      />
      <div
        className="absolute top-[2800px] right-0 w-full lg:w-[60%] h-[700px] -z-10 pointer-events-none opacity-40 dark:opacity-20"
        style={{
          background: "radial-gradient(ellipse 85% 65% at 80% 50%, rgba(14,165,233,0.07) 0%, rgba(245,158,11,0.05) 50%, transparent 80%)",
          filter: "blur(70px)",
        }}
        aria-hidden="true"
      />

      {/* 1. Floating Capsule App-Style Navigation Header */}
      <LandingHeader />

      {/* Main Fluid Container (Linear 9-Section Flow) */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 sm:space-y-24 pb-16 pt-4">
        {/* Section 1: Hero Section with clear promise, CTAs, trust line & quantum computing preview */}
        <TactileHeroPrototype />

        {/* Section 2: Supported Ingestion Formats */}
        <IngestionRibbon />

        {/* Section 3: How It Works (4-Step Workflow) */}
        <KnowledgePipeline />

        {/* Section 4: Product Demo (5 Benefit-Driven Study Modes with sc switcher & placeholders) */}
        <InteractiveWorkflowDemo />

        {/* Section 7: Pricing & Free Plan Transparency (3 core pillars + daily reset) */}
        <FreeTierTransparency />

        {/* Section 8: Use Cases, Capability Comparison, 5 Core FAQs & Final CTA */}
        <CredibilityAndComparison />

        {/* Section 9: Modern Tactile Footer */}
        <LandingFooter />
      </main>
    </div>
  );
}
