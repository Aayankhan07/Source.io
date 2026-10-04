"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Check, X, Sparkles, ArrowRight, ShieldCheck, 
  HelpCircle, Scale, Stethoscope, Binary, BookOpenCheck, Database, Lock
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function CredibilityAndComparison() {
  const [activeAudience, setActiveAudience] = useState<"cs" | "med" | "law" | "lang">("cs");

  const audienceContent = {
    cs: {
      field: "Engineering & Computer Science",
      icon: Binary,
      source: "Introduction to Distributed Systems (MIT 6.824, 42 pp.)",
      extracted: "Raft consensus election safety proofs, RPC log replication diagrams, and RPC timeout equations.",
      citation: "Passage §4.2 (p. 18) • 98% match"
    },
    med: {
      field: "Medicine & Life Sciences",
      icon: Stethoscope,
      source: "Cardiovascular Pathophysiology & Hemodynamics (36 pp.)",
      extracted: "Ischemic cascade mechanisms, pharmacokinetics tables, and diagnostic algorithm flowcharts.",
      citation: "Passage §8.1 (p. 24) • 97% match"
    },
    law: {
      field: "Law & Public Policy",
      icon: Scale,
      source: "Antitrust Precedents & Statutory Analysis (Supreme Court, 58 pp.)",
      extracted: "Rule of reason precedents, market definition doctrines, and dissenting opinion cross-references.",
      citation: "Passage §2.3 (p. 14) • 96% match"
    },
    lang: {
      field: "Humanities & Linguistics",
      icon: BookOpenCheck,
      source: "Comparative Linguistics & Historical Syntax (28 pp.)",
      extracted: "Proto-Indo-European phonetic shifts, morphological declensions, and vocabulary frequency charts.",
      citation: "Passage §5.4 (p. 9) • 95% match"
    }
  };

  const comparisonRows = [
    {
      feature: "Verifiable Page & Time Coordinates",
      source: true,
      chatgpt: false,
      notebooklm: "Partial (Document level)",
      note: "Every statement anchored to exact paragraph & audio millisecond"
    },
    {
      feature: "Active Spaced Repetition (Leitner Algorithm)",
      source: true,
      chatgpt: false,
      notebooklm: false,
      note: "Adaptive intervals (1d, 2d, 4d, 7d) derived from source text"
    },
    {
      feature: "Interactive Comprehension Practice Quiz",
      source: true,
      chatgpt: "Requires manual prompting",
      notebooklm: false,
      note: "Instant right/wrong verification with coordinate explanations"
    },
    {
      feature: "Conversational 2-Host Audio Dialogues",
      source: true,
      chatgpt: false,
      notebooklm: true,
      note: "Generated multi-speaker audio with synchronized transcripts"
    },
    {
      feature: "No Training on Your Personal Documents",
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
      q: "What does 'One source, five views' mean?",
      a: "The document is the spine of the workspace. When you ingest a single file, Source.io automatically derives: 1) streamed structured notes, 2) Leitner spaced flashcards, 3) an interactive quiz, 4) a 2-host audio podcast recap, and 5) a cited grounding chat. You don't have to configure 5 separate tools."
    },
    {
      q: "Are my research papers or documents used to train AI models?",
      a: "No. Your documents and audio files are parsed strictly in isolated sessions with zero retention for model training. Your data remains strictly yours."
    }
  ];

  return (
    <div id="comparison" className="space-y-24 sm:space-y-32 scroll-mt-20">
      {/* GROUNDING GUARANTEES RIBBON (Replaces fabricated customer testimonials) */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 border-y border-border/80 bg-card/30">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="text-center max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-display font-medium text-foreground tracking-tight">
              Built on provable verification, not claims
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">
              How Source guarantees high-fidelity comprehension across long documents.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 pt-4 text-left max-w-5xl mx-auto">
            <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-2.5">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <ShieldCheck className="h-4 w-4" strokeWidth={1.5} />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Coordinate Citations</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Every generated statement, question, and summary points to the precise paragraph, line number, or audio millisecond.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-2.5">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Database className="h-4 w-4" strokeWidth={1.5} />
              </div>
              <h3 className="text-sm font-semibold text-foreground">5 Derived Modalities</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                One ingested paper automatically populates Notes, Flashcards, Quizzes, Podcast audio, and Cited Chat in one unified workspace.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-2.5">
              <div className="h-8 w-8 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-400">
                <Lock className="h-4 w-4" strokeWidth={1.5} />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Zero Retention</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Documents are parsed in ephemeral memory with strict RLS isolation. Your research is never used to train public or private models.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* USE CASES BY AUDIENCE */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-left">
        <div className="max-w-2xl mb-8">
          <h2 className="text-3xl sm:text-4xl font-display font-medium text-foreground tracking-tight">
            Built for rigorous disciplines
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-2">
            Select a field to inspect how Source extracts exact mathematical, medical, and legal anchors.
          </p>
        </div>

        {/* Audience Selector Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(["cs", "med", "law", "lang"] as const).map((key) => {
            const item = audienceContent[key];
            const Icon = item.icon;
            const isSelected = activeAudience === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveAudience(key)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "bg-card hover:bg-accent text-muted-foreground hover:text-foreground border-border"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{item.field}</span>
              </button>
            );
          })}
        </div>

        {/* Active Audience Card */}
        <div className="bg-card rounded-2xl sm:rounded-3xl border border-border/80 p-6 sm:p-8 shadow-xs grid lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <span className="text-xs font-mono text-primary font-semibold block">
              SAMPLE INGESTION SPECIFICATION
            </span>
            <h3 className="text-xl font-semibold text-foreground">
              {audienceContent[activeAudience].source}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {audienceContent[activeAudience].extracted}
            </p>
            <div className="pt-2 flex items-center gap-3">
              <span className="text-xs font-mono px-3 py-1 rounded-md bg-accent border border-border text-foreground font-semibold">
                {audienceContent[activeAudience].citation}
              </span>
              <span className="text-xs text-muted-foreground">
                Verified against source text
              </span>
            </div>
          </div>

          <div className="lg:col-span-5 bg-accent/40 rounded-2xl border border-border/70 p-5 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-border text-muted-foreground">
              <span>DERIVED WORKSPACE MODALITIES</span>
              <span className="text-emerald-500">READY</span>
            </div>
            <div className="space-y-1.5 text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>1. Markdown Note Outline</span>
                <Check className="h-3.5 w-3.5 text-emerald-500" />
              </div>
              <div className="flex items-center justify-between">
                <span>2. Spaced Flashcard Deck</span>
                <Check className="h-3.5 w-3.5 text-emerald-500" />
              </div>
              <div className="flex items-center justify-between">
                <span>3. Practice Quiz with Proofs</span>
                <Check className="h-3.5 w-3.5 text-emerald-500" />
              </div>
              <div className="flex items-center justify-between">
                <span>4. Conversational Audio Podcast</span>
                <Check className="h-3.5 w-3.5 text-emerald-500" />
              </div>
              <div className="flex items-center justify-between">
                <span>5. Grounded Vector Chat</span>
                <Check className="h-3.5 w-3.5 text-emerald-500" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* OBJECTIVE COMPARISON MATRIX */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-left">
        <div className="max-w-2xl mb-12">
          <h2 className="text-3xl sm:text-4xl font-display font-medium text-foreground tracking-tight">
            How Source.io compares
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-2 leading-relaxed">
            Why single-prompt chat windows struggle with long-form academic and professional documents.
          </p>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto rounded-3xl border border-border/80 bg-card shadow-xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-accent/40 text-foreground font-mono">
                <th className="p-4 pl-6 font-semibold">Capability</th>
                <th className="p-4 font-semibold text-primary">Source.io</th>
                <th className="p-4 font-normal text-muted-foreground">Generic ChatGPT</th>
                <th className="p-4 font-normal text-muted-foreground pr-6">NotebookLM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {comparisonRows.map((row) => (
                <tr key={row.feature} className="hover:bg-accent/20 transition-colors">
                  <td className="p-4 pl-6 font-medium text-foreground">
                    <div>{row.feature}</div>
                    <div className="text-muted-foreground text-xs font-mono font-normal mt-0.5">{row.note}</div>
                  </td>
                  <td className="p-4">
                    {row.source === true ? (
                      <span className="inline-flex items-center gap-1.5 text-emerald-500 font-semibold font-mono">
                        <Check className="h-4 w-4" /> Native
                      </span>
                    ) : (
                      <span>{row.source}</span>
                    )}
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {row.chatgpt === false ? (
                      <span className="inline-flex items-center gap-1 text-muted-foreground/60 font-mono">
                        <X className="h-4 w-4" /> None
                      </span>
                    ) : (
                      <span>{row.chatgpt}</span>
                    )}
                  </td>
                  <td className="p-4 pr-6 text-muted-foreground">
                    {row.notebooklm === false ? (
                      <span className="inline-flex items-center gap-1 text-muted-foreground/60 font-mono">
                        <X className="h-4 w-4" /> None
                      </span>
                    ) : row.notebooklm === true ? (
                      <span className="inline-flex items-center gap-1 text-foreground font-mono">
                        <Check className="h-4 w-4" /> Yes
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

        {/* Mobile Card-Based Comparison View */}
        <div className="md:hidden space-y-4">
          {comparisonRows.map((row) => (
            <div key={row.feature} className="bg-card border border-border/80 rounded-2xl p-4 space-y-3">
              <div>
                <h3 className="font-semibold text-foreground text-xs">{row.feature}</h3>
                <p className="text-muted-foreground text-xs mt-0.5">{row.note}</p>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/60 text-xs font-mono">
                <div className="p-2 rounded bg-accent/40">
                  <span className="text-muted-foreground block text-xs mb-1">Source.io</span>
                  <span className="text-emerald-500 font-bold">Native</span>
                </div>
                <div className="p-2 rounded bg-card border border-border">
                  <span className="text-muted-foreground block text-xs mb-1">ChatGPT</span>
                  <span className="text-muted-foreground">{row.chatgpt === false ? "None" : "Prompted"}</span>
                </div>
                <div className="p-2 rounded bg-card border border-border">
                  <span className="text-muted-foreground block text-xs mb-1">NotebookLM</span>
                  <span className="text-muted-foreground">{row.notebooklm === false ? "None" : row.notebooklm === true ? "Yes" : "Partial"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FREQUENTLY ASKED QUESTIONS */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-left">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-display font-medium text-foreground tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-2">
            Details on file limits, local transcription, and coordinate verification.
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-3">
          {faqs.map((faq, idx) => (
            <AccordionItem 
              key={idx} 
              value={`item-${idx}`}
              className="border border-border/80 rounded-2xl bg-card px-5 data-[state=open]:border-primary/40 transition-colors"
            >
              <AccordionTrigger className="text-left font-medium text-sm text-foreground py-4 hover:no-underline">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-xs text-muted-foreground leading-relaxed pb-4 pt-1">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center pb-8">
        <div className="bg-card/90 rounded-3xl border border-border/80 p-8 sm:p-14 shadow-md space-y-6">
          <h2 className="text-3xl sm:text-5xl font-display font-medium text-foreground tracking-tight text-balance">
            Stop skimming. Start mastering.
          </h2>
          <p className="text-xs sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Upload your first document or lecture recording and experience the 5-in-1 grounded study workspace.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/auth"
              className="w-full sm:w-auto bg-primary hover:opacity-90 text-primary-foreground font-medium text-sm px-8 py-3.5 rounded-full shadow-sm active:scale-[0.98] transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Get started free</span>
              <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
            </Link>
            <a
              href="#workbench"
              className="w-full sm:w-auto bg-accent hover:bg-accent/80 text-foreground font-medium text-sm px-7 py-3.5 rounded-full border border-border/80 active:scale-[0.98] transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Explore live demo</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
