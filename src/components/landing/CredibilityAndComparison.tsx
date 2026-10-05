"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, X, ArrowRight } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SectionHeading } from "./SectionHeading";

export function CredibilityAndComparison() {
  const [activeAudience, setActiveAudience] = useState<"cs" | "med" | "law" | "lang">("cs");

  const audienceContent = {
    cs: {
      field: "Computer Science",
      source: "Introduction to Distributed Systems (MIT 6.824, 42 pp.)",
      extracted: "Raft consensus election safety proofs, RPC log replication diagrams, and timeout equations.",
      citation: "Passage §4.2 (p. 18) • 98% match"
    },
    med: {
      field: "Medicine",
      source: "Cardiovascular Pathophysiology & Hemodynamics (36 pp.)",
      extracted: "Ischemic cascade mechanisms, pharmacokinetics tables, and diagnostic algorithm flowcharts.",
      citation: "Passage §8.1 (p. 24) • 97% match"
    },
    law: {
      field: "Law & Policy",
      source: "Antitrust Precedents & Statutory Analysis (Supreme Court, 58 pp.)",
      extracted: "Rule of reason precedents, market definition doctrines, and dissenting opinion cross-references.",
      citation: "Passage §2.3 (p. 14) • 96% match"
    },
    lang: {
      field: "Linguistics",
      source: "Comparative Linguistics & Historical Syntax (28 pp.)",
      extracted: "Proto-Indo-European phonetic shifts, morphological declensions, and vocabulary frequency charts.",
      citation: "Passage §5.4 (p. 9) • 95% match"
    }
  };

  const comparisonRows = [
    {
      feature: "Verifiable page & time coordinates",
      source: true,
      chatgpt: false,
      notebooklm: "Partial (doc-level)",
      note: "Every statement anchored to exact paragraph & audio millisecond"
    },
    {
      feature: "Active spaced repetition (Leitner)",
      source: true,
      chatgpt: false,
      notebooklm: false,
      note: "Adaptive intervals (1d, 2d, 4d, 7d) derived from source text"
    },
    {
      feature: "Interactive practice quiz with proofs",
      source: true,
      chatgpt: "Requires manual prompt",
      notebooklm: false,
      note: "Instant right/wrong verification with coordinate explanations"
    },
    {
      feature: "Conversational 2-host audio recap",
      source: true,
      chatgpt: false,
      notebooklm: true,
      note: "Generated multi-speaker audio with synchronized transcripts"
    },
    {
      feature: "Strict zero-training privacy policy",
      source: true,
      chatgpt: "Opt-out required",
      notebooklm: "Cloud indexed",
      note: "Strict zero-data-retention guarantee for academic papers"
    }
  ];

  const faqs = [
    {
      q: "What file formats and sizes can I upload?",
      a: "Source.io accepts PDF documents up to 50MB, audio files (MP3, WAV, M4A), Markdown, DOCX, and direct YouTube video lecture links. OCR and Whisper transcription run automatically upon ingestion."
    },
    {
      q: "How does coordinate citation verification work?",
      a: "When Source ingests your document, it splits passages into vector embedding chunks with immutable page numbers, paragraph positions, and audio timestamps. Every answer, flashcard, and quiz question computes cosine similarity against these chunks and displays the exact coordinate."
    },
    {
      q: "What does 'One source, five study lenses' mean?",
      a: "The document is the spine of the workspace. When you ingest a single file, Source.io automatically derives: 1) structured notes, 2) Leitner spaced flashcards, 3) an interactive quiz, 4) a 2-host audio podcast recap, and 5) a cited grounding chat. You don't have to configure 5 separate tools."
    },
    {
      q: "Are my research papers or documents used to train AI models?",
      a: "No. Your documents and audio files are parsed strictly in isolated sessions with zero retention for model training. Your data remains strictly yours."
    }
  ];

  return (
    <div id="comparison" className="space-y-16 md:space-y-24 scroll-mt-20">
      {/* 1. Grounding Guarantees */}
      <section className="py-6 relative z-10 mx-auto w-full">
        <SectionHeading
          badge="Guarantees"
          badgeTone="blue"
          line1="Built on provable verification,"
          line2="not claims."
          description="How Source.io guarantees high-fidelity comprehension across long documents."
          align="left"
        />

        <div className="grid sm:grid-cols-3 gap-5">
          <div className="p-7 sm:p-8 rounded-[30px] bg-card/90 backdrop-blur-xl border border-border/80 shadow-[0_12px_32px_-12px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_32px_-12px_rgba(0,0,0,0.35)] hover:-translate-y-1 transition-all duration-300 relative group overflow-hidden">
            <div className="flex items-center justify-between mb-5">
              <span className="text-2xl font-bold font-mono tracking-tight text-foreground">
                100%
              </span>
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-muted/60 text-muted-foreground border border-border/60 font-medium">
                Deterministic
              </span>
            </div>
            <h3 className="text-base font-bold text-foreground font-display mb-2">Coordinate citations</h3>
            <p className="text-[13.5px] leading-relaxed text-muted-foreground">
              Every statement points to the precise paragraph, line number, or audio millisecond with verifiable certainty.
            </p>
          </div>

          <div className="p-7 sm:p-8 rounded-[30px] bg-card/90 backdrop-blur-xl border border-border/80 shadow-[0_12px_32px_-12px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_32px_-12px_rgba(0,0,0,0.35)] hover:-translate-y-1 transition-all duration-300 relative group overflow-hidden">
            <div className="flex items-center justify-between mb-5">
              <span className="text-2xl font-bold font-mono tracking-tight text-foreground">
                5-in-1
              </span>
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-muted/60 text-muted-foreground border border-border/60 font-medium">
                Synchronized
              </span>
            </div>
            <h3 className="text-base font-bold text-foreground font-display mb-2">Five derived modalities</h3>
            <p className="text-[13.5px] leading-relaxed text-muted-foreground">
              One ingested paper populates Notes, Flashcards, Quizzes, Podcast audio recap, and Cited Chat.
            </p>
          </div>

          <div className="p-7 sm:p-8 rounded-[30px] bg-card/90 backdrop-blur-xl border border-border/80 shadow-[0_12px_32px_-12px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_32px_-12px_rgba(0,0,0,0.35)] hover:-translate-y-1 transition-all duration-300 relative group overflow-hidden">
            <div className="flex items-center justify-between mb-5">
              <span className="text-2xl font-bold font-mono tracking-tight text-foreground">
                0-Day
              </span>
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-muted/60 text-muted-foreground border border-border/60 font-medium">
                Ephemeral RLS
              </span>
            </div>
            <h3 className="text-base font-bold text-foreground font-display mb-2">Zero data retention</h3>
            <p className="text-[13.5px] leading-relaxed text-muted-foreground">
              Documents are parsed in ephemeral memory with strict RLS. Your research is never used to train models.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Disciplines */}
      <section className="mx-auto text-left w-full">
        <SectionHeading
          badge="Disciplines"
          badgeTone="amber"
          line1="Engineered for rigorous domains,"
          line2="from proofs to statutes."
          description="Select a discipline to inspect how Source extracts exact mathematical, clinical, and statutory anchors."
          align="left"
        />

        {/* Audience Selector Tabs */}
        <div className="flex flex-wrap gap-2.5 mb-5">
          {(["cs", "med", "law", "lang"] as const).map((key) => {
            const item = audienceContent[key];
            const isSelected = activeAudience === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveAudience(key)}
                className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all cursor-pointer shadow-xs active:scale-95 ${
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-card hover:bg-muted text-muted-foreground hover:text-foreground border-border"
                }`}
              >
                <span>{item.field}</span>
              </button>
            );
          })}
        </div>

        {/* Active Discipline Card (Hero-style squircle card) */}
        <div className="bg-card/90 backdrop-blur-xl rounded-[32px] sm:rounded-[36px] border border-border/80 p-7 sm:p-9 shadow-[0_20px_45px_-12px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_45px_-12px_rgba(0,0,0,0.45)] grid lg:grid-cols-12 gap-8 items-center relative overflow-hidden">
          {/* Subtle warm halo accent in card corner */}
          <div
            className="absolute top-0 right-0 w-64 h-64 pointer-events-none opacity-40"
            style={{
              background: "radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%)",
            }}
          />

          <div className="lg:col-span-7 space-y-3.5 relative z-10">
            <span className="text-xs font-mono text-muted-foreground font-medium block">
              Sample ingestion specification
            </span>
            <h3 className="text-xl font-bold font-display text-foreground">
              {audienceContent[activeAudience].source}
            </h3>
            <p className="text-[14px] leading-relaxed text-muted-foreground">
              {audienceContent[activeAudience].extracted}
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-2.5">
              <span className="text-xs font-mono px-3.5 py-1.5 rounded-full bg-muted/80 border border-border text-foreground font-semibold">
                {audienceContent[activeAudience].citation}
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                Verified against source text
              </span>
            </div>
          </div>

          <div className="lg:col-span-5 bg-muted/30 backdrop-blur-md rounded-[24px] border border-border/70 p-6 space-y-3 text-xs relative z-10 shadow-xs">
            <div className="flex items-center justify-between pb-2.5 border-b border-border/60 text-xs font-mono text-muted-foreground">
              <span>Derived study assets</span>
              <span className="text-primary font-semibold">Ready</span>
            </div>
            <div className="space-y-2.5 text-muted-foreground font-medium">
              <div className="flex items-center justify-between">
                <span>1. Markdown Note Outline</span>
                <Check className="size-4 text-primary" />
              </div>
              <div className="flex items-center justify-between">
                <span>2. Spaced Flashcard Deck</span>
                <Check className="size-4 text-primary" />
              </div>
              <div className="flex items-center justify-between">
                <span>3. Practice Quiz with Proofs</span>
                <Check className="size-4 text-primary" />
              </div>
              <div className="flex items-center justify-between">
                <span>4. Conversational Audio Podcast</span>
                <Check className="size-4 text-primary" />
              </div>
              <div className="flex items-center justify-between">
                <span>5. Grounded Vector Chat</span>
                <Check className="size-4 text-primary" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Comparison Matrix */}
      <section className="mx-auto text-left w-full">
        <SectionHeading
          badge="Comparison"
          badgeTone="blue"
          line1="How Source.io compares,"
          line2="feature by feature."
          description="Why single-prompt chat windows struggle with long-form academic and technical sources."
          align="left"
        />

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto rounded-[32px] border border-border/80 bg-card/90 backdrop-blur-xl shadow-[0_16px_40px_-15px_rgba(0,0,0,0.08)] dark:shadow-[0_16px_40px_-15px_rgba(0,0,0,0.4)]">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-border/80 bg-muted/40 text-foreground font-mono text-xs">
                <th className="h-12 px-6 font-semibold">Capability</th>
                <th className="h-12 px-5 font-bold text-slate-900 dark:text-blue-300">Source.io</th>
                <th className="h-12 px-5 font-normal text-muted-foreground">Generic ChatGPT</th>
                <th className="h-12 px-6 font-normal text-muted-foreground">NotebookLM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {comparisonRows.map((row) => (
                <tr key={row.feature} className="h-12 hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-3 font-medium text-foreground">
                    <div>{row.feature}</div>
                    <div className="text-muted-foreground text-xs font-mono font-normal mt-0.5">{row.note}</div>
                  </td>
                  <td className="px-5 py-3">
                    {row.source === true ? (
                      <span className="inline-flex items-center gap-1.5 text-primary font-medium font-mono text-xs">
                        <Check className="size-4" /> Native
                      </span>
                    ) : (
                      <span>{row.source}</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground text-xs">
                    {row.chatgpt === false ? (
                      <span className="inline-flex items-center gap-1 text-muted-foreground/60 font-mono text-xs">
                        <X className="size-4" /> None
                      </span>
                    ) : (
                      <span>{row.chatgpt}</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-muted-foreground text-xs">
                    {row.notebooklm === false ? (
                      <span className="inline-flex items-center gap-1 text-muted-foreground/60 font-mono text-xs">
                        <X className="size-4" /> None
                      </span>
                    ) : row.notebooklm === true ? (
                      <span className="inline-flex items-center gap-1 text-foreground font-mono text-xs">
                        <Check className="size-4" /> Yes
                      </span>
                    ) : (
                      <span>{row.notebooklm}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden space-y-3">
          {comparisonRows.map((row) => (
            <div key={row.feature} className="bg-card border border-border/80 rounded-[22px] p-4 space-y-2 shadow-xs">
              <div>
                <h3 className="font-semibold text-foreground text-xs">{row.feature}</h3>
                <p className="text-muted-foreground text-[11px] mt-0.5">{row.note}</p>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/60 text-xs font-mono">
                <div className="p-2 rounded-[12px] bg-muted/50 text-center">
                  <span className="text-muted-foreground block text-[10px] mb-0.5">Source.io</span>
                  <span className="text-primary font-semibold">Native</span>
                </div>
                <div className="p-2 rounded-[12px] bg-card border border-border text-center">
                  <span className="text-muted-foreground block text-[10px] mb-0.5">ChatGPT</span>
                  <span className="text-muted-foreground">{row.chatgpt === false ? "None" : "Prompted"}</span>
                </div>
                <div className="p-2 rounded-[12px] bg-card border border-border text-center">
                  <span className="text-muted-foreground block text-[10px] mb-0.5">NotebookLM</span>
                  <span className="text-muted-foreground">{row.notebooklm === false ? "None" : row.notebooklm === true ? "Yes" : "Partial"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Frequently Asked Questions */}
      <section className="max-w-3xl mx-auto text-left w-full">
        <SectionHeading
          badge="FAQ"
          badgeTone="slate"
          line1="Frequently asked questions."
          description="Details on file formats, coordinate verification, and data isolation."
          align="center"
        />

        <Accordion type="single" collapsible className="w-full space-y-3.5">
          {faqs.map((faq, idx) => (
            <AccordionItem 
              key={idx} 
              value={`item-${idx}`}
              className="border border-border/80 rounded-[26px] bg-card/95 backdrop-blur-xl px-6 shadow-xs data-[state=open]:border-blue-900/30 dark:data-[state=open]:border-blue-500/50 data-[state=open]:shadow-[0_12px_28px_-10px_rgba(15,23,42,0.12)] transition-all"
            >
              <AccordionTrigger className="text-left font-bold text-sm text-foreground py-4.5 hover:no-underline font-display cursor-pointer">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-[13.5px] leading-relaxed text-muted-foreground pb-5 pt-1">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* 5. Final CTA - Styled as the Hero's Signature Anchored Capsule / Dock */}
      <section className="text-center pb-6 w-full relative">
        <div className="relative rounded-[36px] sm:rounded-[44px] bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 dark:from-zinc-950 dark:via-zinc-900 dark:to-blue-950/70 p-8 sm:p-16 text-white shadow-[0_24px_50px_-15px_rgba(15,23,42,0.45)] border border-blue-900/30 overflow-hidden">
          {/* Glowing Orb Halo (Echoes Hero Synthesis Orb) */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] pointer-events-none opacity-40"
            style={{
              background: "radial-gradient(ellipse at center, rgba(15,23,42,0.6) 0%, rgba(245,158,11,0.18) 50%, transparent 80%)",
              filter: "blur(60px)",
            }}
          />

          {/* Floating Confetti Elements */}
          <div className="absolute top-8 left-12 size-4 rotate-45 bg-amber-400/80 rounded-xs shadow-xs hidden sm:block" />
          <div className="absolute bottom-8 right-16 size-4 rotate-12 bg-amber-500/70 rounded-xs shadow-xs hidden sm:block" />
          <div className="absolute top-12 right-24 size-3 rounded-full bg-blue-500/50 shadow-xs hidden sm:block" />

          {/* Central Content */}
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <div className="size-14 rounded-full bg-white text-slate-950 flex items-center justify-center font-display font-black text-2xl shadow-xl mx-auto mb-4 border border-white/20 select-none">
              <span>S</span>
              <span className="text-amber-500 text-sm ml-0.5">★</span>
            </div>

            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold font-display tracking-tight text-white">
              Stop skimming. <span className="text-slate-300 font-normal">Start mastering.</span>
            </h2>

            <p className="text-base sm:text-lg leading-relaxed text-slate-200/80 max-w-[520px] mx-auto">
              Upload your first document or lecture recording and experience the 5-in-1 grounded study workspace.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Link
                href="/auth"
                className="w-full sm:w-auto bg-white text-zinc-950 font-bold text-sm px-8 py-3.5 rounded-full shadow-xl hover:bg-white/95 active:scale-95 transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Start free</span>
                <ArrowRight className="size-4" />
              </Link>
              <a
                href="#workbench"
                className="w-full sm:w-auto border border-white/20 bg-white/10 hover:bg-white/15 text-white font-semibold text-sm px-7 py-3.5 rounded-full backdrop-blur-md active:scale-95 transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Explore live demo</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
