"use client";

import { useEffect } from "react";
import { LandingHeader } from "./LandingHeader";
import { TactileHeroPrototype } from "./TactileHeroPrototype";
import { IngestionRibbon } from "./IngestionRibbon";
import { KnowledgePipeline } from "./KnowledgePipeline";
import { PricingComparisonSection } from "./PricingComparisonSection";
import { 
  AcademicPersonasSection, 
  ComparisonTableSection, 
  FaqAndFinalCtaSection 
} from "./CredibilityAndComparison";
import { LandingFooter } from "./LandingFooter";
import { useTheme } from "@/hooks/use-theme";

export function LandingPage() {
  const { setTheme } = useTheme();

  useEffect(() => {
    setTheme("light");
    document.documentElement.classList.remove("dark");
  }, [setTheme]);

  return (
    <div className="min-h-[100dvh] bg-[#FAF9F6] text-slate-950 antialiased selection:bg-slate-900 selection:text-white font-sans relative overflow-x-clip transition-colors duration-200">
      {/* Ambient Continuous Atmospheric Halos (Subtle neutral monochrome ink) */}
      <div
        className="absolute top-0 right-0 w-full lg:w-[65%] h-[700px] -z-10 pointer-events-none opacity-60"
        style={{
          background: "radial-gradient(ellipse 90% 70% at 75% 25%, rgba(15,23,42,0.03) 0%, transparent 75%)",
          filter: "blur(60px)",
        }}
        aria-hidden="true"
      />
      <div
        className="absolute top-[1400px] left-0 w-full lg:w-[55%] h-[650px] -z-10 pointer-events-none opacity-50"
        style={{
          background: "radial-gradient(ellipse 80% 60% at 20% 50%, rgba(15,23,42,0.025) 0%, transparent 75%)",
          filter: "blur(70px)",
        }}
        aria-hidden="true"
      />
      <div
        className="absolute top-[2800px] right-0 w-full lg:w-[60%] h-[700px] -z-10 pointer-events-none opacity-50"
        style={{
          background: "radial-gradient(ellipse 85% 65% at 80% 50%, rgba(15,23,42,0.025) 0%, transparent 80%)",
          filter: "blur(70px)",
        }}
        aria-hidden="true"
      />

      {/* 1. Floating Capsule App-Style Navigation Header */}
      <LandingHeader />

      {/* Hero Section: Full-width atmospheric stage with full-bleed side fade */}
      <TactileHeroPrototype />

      {/* Main Fluid Container (Clean rhythmic vertical spacing) */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Section 2: Supported Ingestion Formats */}
        <IngestionRibbon />

        {/* Section 3: How It Works (4-Step Workflow) */}
        <KnowledgePipeline />

        {/* Section 4: Role-Adaptive Architecture (7 Calibrated Workspaces) */}
        <AcademicPersonasSection />

        {/* Section 6: Capability Comparison Table */}
        <ComparisonTableSection />

        {/* Section 7: Transparent Pricing & Free Plan */}
        <PricingComparisonSection />

        {/* Section 8: Frequently Asked Questions & Final CTA */}
        <FaqAndFinalCtaSection />

        {/* Section 9: Modern Tactile Footer */}
        <LandingFooter />
      </main>
    </div>
  );
}
