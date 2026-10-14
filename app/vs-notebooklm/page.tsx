import type { Metadata } from "next";
import Link from "next/link";
import { Check, X, ArrowRight, ShieldCheck, Zap, Sparkles, BookOpen } from "lucide-react";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";

export const metadata: Metadata = {
  title: "Source.io vs Google NotebookLM: Feature Comparison & Alternatives (2026)",
  description:
    "Detailed comparison between Source.io and Google NotebookLM for students, researchers, and engineers. Compare citation accuracy, spaced repetition flashcards, and KaTeX math formulas.",
  alternates: {
    canonical: "/vs-notebooklm",
  },
  openGraph: {
    title: "Source.io vs Google NotebookLM: The Complete 2026 Comparison",
    description:
      "Looking for a NotebookLM alternative with 3D flashcards, practice quizzes, and page-and-line citation proofs? See how Source.io compares.",
  },
};

export default function VsNotebookLMPage() {
  const comparisonItems = [
    {
      feature: "Page & Line-Level Citations",
      source: "Native (Clickable coordinate proofs with exact line & paragraph highlighting)",
      notebooklm: "Document-level citation chips with partial text anchoring",
      winner: "Source.io",
    },
    {
      feature: "Interactive Spaced Repetition (Flashcards)",
      source: "Native 3D Leitner-box deck with customizable memory retention intervals",
      notebooklm: "None (Text note summaries only)",
      winner: "Source.io",
    },
    {
      feature: "Practice Quizzes with Explanations",
      source: "Full diagnostic quizzes with immediate explanation and source proof",
      notebooklm: "Basic suggested questions and study guide notes",
      winner: "Source.io",
    },
    {
      feature: "Audio Overview / Podcasts",
      source: "Dual-host conversational recap with synchronized waveform and interactive transcript",
      notebooklm: "Deep Dive Audio Overview (two AI hosts, un-synced player)",
      winner: "Tie / Specialized",
    },
    {
      feature: "Complex Math & LaTeX / KaTeX",
      source: "Sub-second KaTeX rendering with native equation copy and formatting",
      notebooklm: "Basic Markdown text rendering",
      winner: "Source.io",
    },
    {
      feature: "Bring Your Own Key (BYOK)",
      source: "Supported (Connect Gemini or Groq API keys to bypass rate limits)",
      notebooklm: "Google account only (no custom API keys)",
      winner: "Source.io",
    },
    {
      feature: "Document Upload Limits",
      source: "50MB / up to 300 pages per file",
      notebooklm: "500,000 words per notebook",
      winner: "Tie",
    },
    {
      feature: "Commercial Model Training Policy",
      source: "Strict zero-retention policy (documents never train commercial models)",
      notebooklm: "Google Workspace Enterprise terms apply",
      winner: "Source.io",
    },
  ];

  const comparisonSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Source.io vs Google NotebookLM: Feature & Capability Comparison",
    "url": "https://sourceio.app/vs-notebooklm",
    "description": "Comprehensive side-by-side comparison between Source.io and Google NotebookLM for academic study, research analysis, and active recall.",
    "publisher": {
      "@type": "Organization",
      "name": "Source.io",
      "url": "https://sourceio.app"
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBFA] text-slate-900 flex flex-col font-sans selection:bg-amber-100 selection:text-amber-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(comparisonSchema) }}
      />
      <LandingHeader />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 pt-32 pb-20 w-full">
        {/* Breadcrumb & Badge */}
        <div className="flex items-center gap-2 mb-4">
          <Link href="/" className="text-xs font-mono text-slate-500 hover:text-slate-800">Home</Link>
          <span className="text-xs text-slate-400">/</span>
          <span className="text-xs font-mono text-amber-700 font-semibold">Comparisons</span>
        </div>

        {/* Hero Header */}
        <div className="space-y-4 mb-12">
          <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold tracking-wide text-amber-700 ring-1 ring-inset ring-amber-600/20 uppercase shadow-2xs">
            2026 Comparison Guide
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-slate-950 leading-[1.15]">
            Source.io vs. Google NotebookLM
          </h1>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-3xl">
            Google NotebookLM popularized AI audio overviews, but serious students and researchers require 
            active learning tools: verifiable line-level citations, spaced repetition flashcards, 
            and diagnostic practice quizzes. Here is how the two platforms compare.
          </p>
        </div>

        {/* Feature Matrix Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-16">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-mono uppercase text-slate-500">
                <tr>
                  <th className="py-4 px-6 font-bold">Learning Capability</th>
                  <th className="py-4 px-6 font-bold text-slate-900 bg-amber-50/50">Source.io</th>
                  <th className="py-4 px-6 font-bold">Google NotebookLM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {comparisonItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-semibold text-slate-900 text-xs sm:text-sm">
                      {item.feature}
                    </td>
                    <td className="py-4 px-6 text-xs sm:text-sm bg-amber-50/30 text-slate-900 font-medium">
                      <div className="flex items-start gap-2">
                        <Check className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{item.source}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-xs sm:text-sm text-slate-600">
                      <span>{item.notebooklm}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* In-depth Editorial Breakdown */}
        <div className="space-y-12 max-w-3xl">
          <section className="space-y-3">
            <h2 className="text-2xl font-bold font-display text-slate-900">
              1. Verification: Document-Level vs. Coordinate-Level Citations
            </h2>
            <p className="text-sm sm:text-base leading-relaxed text-slate-600">
              In academic study, being told a claim appears somewhere in a 50-page PDF is not enough. 
              <strong> Source.io</strong> indexes documents into atomic passages with page, paragraph, and line bounding coordinates. 
              Every generated summary or flashcard links directly to an interactive split-view reader with cosine similarity metrics, 
              preventing subtle hallucinations from derailing exam prep or literature reviews.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold font-display text-slate-900">
              2. Active Recall: Flashcards & Quizzes vs. Passive Listening
            </h2>
            <p className="text-sm sm:text-base leading-relaxed text-slate-600">
              Cognitive science demonstrates that active retrieval practice produces 200% higher retention 
              than passive re-reading or listening. While NotebookLM is celebrated for its dual-speaker audio generation, 
              it leaves learners without tools to test their knowledge. 
              <strong> Source.io</strong> closes the loop with 3D Leitner spaced-repetition flashcards and multiple-choice quizzes 
              featuring complete diagnostic rationales.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold font-display text-slate-900">
              3. Privacy & Zero-Retention Security
            </h2>
            <p className="text-sm sm:text-base leading-relaxed text-slate-600">
              Graduate researchers, medical professionals, and intellectual property authors cannot risk their private preprints 
              or unpublished datasets being ingested into global AI training corpora. 
              Source.io enforces an immutable zero-retention guarantee: your files exist strictly to power your private study workspace.
            </p>
          </section>
        </div>

        {/* Bottom CTA Box */}
        <div className="mt-16 p-8 sm:p-12 rounded-3xl bg-slate-950 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl border border-slate-800">
          <div className="space-y-2 text-center sm:text-left">
            <h3 className="text-2xl font-bold font-display">Experience the difference for free.</h3>
            <p className="text-xs sm:text-sm text-slate-400">
              No credit card required. Receive 25 free daily study generations or explore the interactive quantum demo right now.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/auth?mode=signup"
              className="px-6 py-3 rounded-full bg-white text-slate-950 font-bold text-xs sm:text-sm hover:bg-slate-100 transition-colors inline-flex items-center gap-1.5 shadow-md"
            >
              <span>Get Started Free</span>
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/app/doc/demo-quantum"
              className="px-5 py-3 rounded-full bg-white/10 text-white hover:bg-white/15 font-semibold text-xs sm:text-sm transition-colors border border-white/20"
            >
              <span>Explore Demo Workspace</span>
            </Link>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
