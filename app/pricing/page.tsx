import type { Metadata } from "next";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { PricingComparisonSection } from "@/components/landing/PricingComparisonSection";
import { CredibilityAndComparison } from "@/components/landing/CredibilityAndComparison";
import { LandingFooter } from "@/components/landing/LandingFooter";

export const metadata: Metadata = {
  title: "Pricing & Plans — Free Forever & Scholar Pass | Source.io",
  description:
    "Explore Source.io pricing plans: Free Forever with 25 daily AI actions, or Scholar Pass ($9/mo) for power academic workflows, 200 daily actions, and neural audio podcast synthesis. BYOK keys always supported.",
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    title: "Transparent Academic Pricing: Free Forever & Scholar Pass ($9/mo)",
    description:
      "A real free tier with no deceptive trial traps. 25 daily actions reset every night at 00:00 UTC. Bring your own keys anytime.",
  },
};

export default function PricingPage() {
  const pricingSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Source.io Pricing",
    "url": "https://sourceio.app/pricing",
    "applicationCategory": "EducationalApplication",
    "offers": [
      {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
        "name": "Free Forever Plan",
        "description": "25 daily AI actions, all 7 academic role presets, KaTeX math rendering, and unlimited BYOK keys."
      },
      {
        "@type": "Offer",
        "price": "9",
        "priceCurrency": "USD",
        "name": "Scholar Pass",
        "description": "200 daily AI actions, 50 studio audio podcast renders, priority GPU queuing, and deep monograph synthesis."
      }
    ]
  };

  return (
    <div className="min-h-[100dvh] bg-[#FAF9F6] text-slate-950 antialiased selection:bg-slate-900 selection:text-white font-sans relative overflow-x-clip transition-colors duration-200">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingSchema) }}
      />

      {/* Atmospheric Halos */}
      <div
        className="absolute top-0 right-0 w-full lg:w-[65%] h-[600px] -z-10 pointer-events-none opacity-45"
        style={{
          background: "radial-gradient(ellipse 90% 70% at 75% 25%, rgba(14,165,233,0.1) 0%, rgba(245,158,11,0.06) 45%, transparent 75%)",
          filter: "blur(60px)",
        }}
        aria-hidden="true"
      />

      {/* Header */}
      <LandingHeader />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 pt-24 sm:pt-28">
        {/* Unified Pricing Comparison */}
        <PricingComparisonSection />

        {/* Feature Matrix & FAQ */}
        <CredibilityAndComparison />

        {/* Footer */}
        <LandingFooter />
      </main>
    </div>
  );
}
