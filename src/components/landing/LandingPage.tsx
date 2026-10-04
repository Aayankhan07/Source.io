"use client";

import { LandingHeader } from "./LandingHeader";
import { LandingHero } from "./LandingHero";
import { IngestionRibbon } from "./IngestionRibbon";
import { InteractiveWorkflowDemo } from "./InteractiveWorkflowDemo";
import { FeatureMotionCards } from "./FeatureMotionCards";
import { KnowledgePipeline } from "./KnowledgePipeline";
import { CredibilityAndComparison } from "./CredibilityAndComparison";
import { LandingFooter } from "./LandingFooter";

export function LandingPage() {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground font-sans relative overflow-x-clip transition-colors duration-200">
      {/* 1. Sticky Floating Glass Header */}
      <LandingHeader />

      {/* 2. Asymmetric Split Hero with Interactive 5-in-1 Simulator */}
      <LandingHero />

      {/* 3. Ingestion Formats Ribbon */}
      <IngestionRibbon />

      {/* 4. Interactive Study Workbench (The 5 Views) */}
      <InteractiveWorkflowDemo />

      {/* 5. Verification & Grounding Engine Bento */}
      <FeatureMotionCards />

      {/* 6. Continuous 4-Stage Knowledge Pipeline */}
      <KnowledgePipeline />

      {/* 7. Guarantees, Domain Use-Cases, Comparison Matrix & FAQ */}
      <CredibilityAndComparison />

      {/* 8. Minimalist High-Craft Footer */}
      <LandingFooter />
    </div>
  );
}
