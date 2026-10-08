"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, X, ArrowRight, BookOpen, GraduationCap, Microscope, Briefcase, Users } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SectionHeading } from "./SectionHeading";

export function CredibilityAndComparison() {
  const [activePersona, setActivePersona] = useState<"students" | "researchers" | "professionals" | "teams">("students");

  const personas = {
    students: {
      title: "Students Preparing for Exams",
      icon: GraduationCap,
      source: "Introduction to Distributed Systems (MIT 6.824, 42 pp.)",
      description: "Turn dense semester textbooks and recorded lectures into high-yield flashcards, practice quizzes, and audio recaps you can listen to on your commute.",
      extracted: "Raft consensus election safety proofs, RPC log replication diagrams, and timeout equations.",
      citation: "Page 18 • §4.2 • 98% match",
    },
    researchers: {
      title: "Researchers Reviewing Papers",
      icon: Microscope,
      source: "Attention Is All You Need (Vaswani et al., 15 pp.)",
      description: "Digest complex preprints and doctoral papers rapidly. Extract mathematical equations, cross-reference citations, and trace every claim back to the original paragraph.",
      extracted: "Multi-head scaled dot-product attention equations, positional encoding matrices, and BLEU benchmarks.",
      citation: "Page 4 • §3.2 • 99% match",
    },
    professionals: {
      title: "Technical Professionals",
      icon: Briefcase,
      source: "RFC 7540: Hypertext Transfer Protocol Version 2 (HTTP/2, 96 pp.)",
      description: "Transform dense API documentation, regulatory statutes, and system architecture specifications into structured, verifiable reference guides.",
      extracted: "Stream multiplexing state machine, HPACK compression headers, and flow control frames.",
      citation: "Page 22 • §5.1 • 97% match",
    },
    teams: {
      title: "Teams & Study Groups",
      icon: Users,
      source: "System Architecture & Security Runbook (58 pp.)",
      description: "Turn recorded onboarding sessions, recorded engineering talks, and company playbooks into interactive learning modules with verifiable references.",
      extracted: "Disaster recovery failover sequences, token encryption guidelines, and incident response checklists.",
      citation: "Page 14 • §2.3 • 96% match",
    },
  };

  const comparisonRows = [
    {
      feature: "Page & line-level citations",
      source: true,
      chatgpt: false,
      notebooklm: "Partial (doc-level)",
      note: "Every statement anchored to exact paragraph & audio millisecond",
    },
    {
      feature: "Audio timestamp sync",
      source: true,
      chatgpt: false,
      notebooklm: "Partial",
      note: "Synchronized playback linked to written transcript moments",
    },
    {
      feature: "Active spaced repetition (Leitner)",
      source: true,
      chatgpt: false,
      notebooklm: false,
      note: "Adaptive intervals (1d, 2d, 4d, 7d) derived automatically from source text",
    },
    {
      feature: "Interactive practice quizzes with proofs",
      source: true,
      chatgpt: "Requires manual prompt",
      notebooklm: false,
      note: "Instant right/wrong verification with coordinate explanations",
    },
    {
      feature: "Multi-format ingestion (PDF, Audio, LaTeX)",
      source: true,
      chatgpt: "Text only",
      notebooklm: "Text & Audio",
      note: "Extracts text, Whisper speech-to-text, and mathematical equations",
    },
    {
      feature: "Strict zero-data retention policy",
      source: true,
      chatgpt: "Opt-out required",
      notebooklm: "Cloud indexed",
      note: "Documents processed in isolated sessions; never used to train models",
    },
  ];

  const faqs = [
    {
      q: "What file types and sizes are supported?",
      a: "Source.io accepts PDF documents up to 50MB, audio recordings (MP3, WAV, M4A), YouTube lecture links, Markdown, DOCX, and LaTeX documents. Text extraction, OCR, and speech-to-text run automatically upon upload.",
    },
    {
      q: "How are citations generated?",
      a: "When Source ingests your document, it splits passages into vector embedding chunks with immutable page numbers, paragraph positions, and audio timestamps. Every answer, flashcard, and quiz question computes similarity against these chunks and displays the exact coordinate.",
    },
    {
      q: "Are my research papers or documents used to train AI models?",
      a: "No. Your documents and audio files are parsed strictly in isolated sessions with zero retention for model training. Your research and coursework remain strictly yours.",
    },
    {
      q: "Is there really a free plan?",
      a: "Yes. Every registered user gets 25 free AI actions every 24 hours and 3 active source workspace slots. No credit card is required to sign up, and allowances refresh daily at 00:00 UTC.",
    },
    {
      q: "Can I export my notes and flashcards?",
      a: "Yes. You can export your structured notes to standard Markdown or PDF, and export flashcard decks to Anki-compatible formats for offline study.",
    },
  ];

  return (
    <div className="space-y-16 md:space-y-24 scroll-mt-20">
      {/* 1. Use Cases Across Disciplines */}
      <section className="mx-auto text-left w-full">
        <SectionHeading
          badge="Use Cases"
          badgeTone="amber"
          line1="Built for serious learning,"
          line2="across every discipline."
          description="From doctoral research papers to undergraduate exams, Source.io adapts to rigorous source material."
          align="left"
        />

        {/* Persona Selector Tabs */}
        <div className="flex flex-wrap gap-2.5 mb-6">
          {(["students", "researchers", "professionals", "teams"] as const).map((key) => {
            const item = personas[key];
            const Icon = item.icon;
            const isSelected = activePersona === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActivePersona(key)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold border transition-all cursor-pointer shadow-xs active:scale-95 ${
                  isSelected
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 border-slate-900 dark:border-white shadow-sm"
                    : "bg-white dark:bg-slate-900/90 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10"
                }`}
              >
                <Icon className="size-3.5" />
                <span>{item.title}</span>
              </button>
            );
          })}
        </div>

        {/* Active Persona Card */}
        <div className="bg-white dark:bg-slate-900/90 rounded-[32px] sm:rounded-[36px] border border-slate-200 dark:border-white/10 p-7 sm:p-9 shadow-tactile-card grid lg:grid-cols-12 gap-8 items-center relative overflow-hidden">
          <div className="lg:col-span-7 space-y-3.5 relative z-10">
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 font-medium block">
              Sample source workflow
            </span>
            <h3 className="text-xl font-bold font-display text-slate-900 dark:text-white">
              {personas[activePersona].source}
            </h3>
            <p className="text-[14px] leading-relaxed text-slate-700 dark:text-slate-300">
              {personas[activePersona].description}
            </p>
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-xs text-slate-600 dark:text-slate-300">
              <strong className="text-slate-900 dark:text-white block mb-1">Extracted key topics:</strong>
              {personas[activePersona].extracted}
            </div>
            <div className="pt-2 flex flex-wrap items-center gap-2.5">
              <span className="text-xs font-mono px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-semibold">
                {personas[activePersona].citation}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Verified against original source
              </span>
            </div>
          </div>

          <div className="lg:col-span-5 bg-slate-50 dark:bg-white/[0.03] rounded-[24px] border border-slate-200 dark:border-white/10 p-6 space-y-3 text-xs relative z-10 shadow-xs">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-white/10 text-xs font-mono text-slate-500 dark:text-slate-400">
              <span>Derived study assets</span>
              <span className="text-emerald-500 font-semibold">Ready</span>
            </div>
            <div className="space-y-2.5 text-slate-700 dark:text-slate-300 font-medium">
              <div className="flex items-center justify-between">
                <span>1. Structured Markdown Outline</span>
                <Check className="size-4 text-emerald-500" />
              </div>
              <div className="flex items-center justify-between">
                <span>2. Active Recall Flashcards</span>
                <Check className="size-4 text-emerald-500" />
              </div>
              <div className="flex items-center justify-between">
                <span>3. Practice Quiz with Explanations</span>
                <Check className="size-4 text-emerald-500" />
              </div>
              <div className="flex items-center justify-between">
                <span>4. Conversational Audio Recap</span>
                <Check className="size-4 text-emerald-500" />
              </div>
              <div className="flex items-center justify-between">
                <span>5. Grounded Source Chat</span>
                <Check className="size-4 text-emerald-500" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Capability Comparison */}
      <section id="comparison" className="mx-auto text-left w-full scroll-mt-24">
        <SectionHeading
          badge="Comparison"
          badgeTone="blue"
          line1="Built for verifiable learning"
          description="How Source.io compares with generic AI chat windows when studying dense sources."
          align="left"
        />

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto rounded-[32px] border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/90 shadow-tactile-card">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-slate-900 dark:text-white font-mono text-xs">
                <th className="h-12 px-6 font-semibold">Capability</th>
                <th className="h-12 px-5 font-bold text-slate-900 dark:text-white">Source.io</th>
                <th className="h-12 px-5 font-normal text-slate-500 dark:text-slate-400">Generic ChatGPT</th>
                <th className="h-12 px-6 font-normal text-slate-500 dark:text-slate-400">NotebookLM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/10">
              {comparisonRows.map((row) => (
                <tr key={row.feature} className="h-12 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-3.5 font-medium text-slate-900 dark:text-white">
                    <div>{row.feature}</div>
                    <div className="text-slate-500 text-xs font-mono font-normal mt-0.5">{row.note}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    {row.source === true ? (
                      <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold font-mono text-xs">
                        <Check className="size-4" /> Native
                      </span>
                    ) : (
                      <span>{row.source}</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 text-xs font-mono">
                    {row.chatgpt === false ? (
                      <span className="inline-flex items-center gap-1 text-slate-400 font-mono text-xs">
                        <X className="size-4 text-slate-400" /> None
                      </span>
                    ) : (
                      <span>{row.chatgpt}</span>
                    )}
                  </td>
                  <td className="px-6 py-3.5 text-slate-500 text-xs font-mono">
                    {row.notebooklm === false ? (
                      <span className="inline-flex items-center gap-1 text-slate-400 font-mono text-xs">
                        <X className="size-4 text-slate-400" /> None
                      </span>
                    ) : row.notebooklm === true ? (
                      <span className="inline-flex items-center gap-1 text-slate-800 dark:text-slate-200 font-mono text-xs">
                        <Check className="size-4 text-emerald-500" /> Yes
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
            <div key={row.feature} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[22px] p-4 space-y-2 shadow-xs">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white text-xs">{row.feature}</h3>
                <p className="text-slate-500 text-[11px] mt-0.5">{row.note}</p>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-white/10 text-xs font-mono">
                <div className="p-2 rounded-[12px] bg-slate-100 dark:bg-white/10 text-center">
                  <span className="text-slate-500 block text-[10px] mb-0.5">Source.io</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">Native</span>
                </div>
                <div className="p-2 rounded-[12px] bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-center">
                  <span className="text-slate-500 block text-[10px] mb-0.5">ChatGPT</span>
                  <span className="text-slate-500">{row.chatgpt === false ? "None" : "Prompted"}</span>
                </div>
                <div className="p-2 rounded-[12px] bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-center">
                  <span className="text-slate-500 block text-[10px] mb-0.5">NotebookLM</span>
                  <span className="text-slate-500">{row.notebooklm === false ? "None" : row.notebooklm === true ? "Yes" : "Partial"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-6 font-medium">
          Built with feedback from students, researchers, and technical learners.
        </p>
      </section>

      {/* 3. Frequently Asked Questions */}
      <section id="faq" className="max-w-3xl mx-auto text-left w-full scroll-mt-24">
        <SectionHeading
          badge="FAQ"
          badgeTone="slate"
          line1="Frequently asked questions."
          description="Everything you need to know about file formats, coordinate verification, and privacy."
          align="center"
        />

        <Accordion type="single" collapsible className="w-full space-y-3.5">
          {faqs.map((faq, idx) => (
            <AccordionItem 
              key={idx} 
              value={`item-${idx}`}
              className="border border-slate-200/90 dark:border-white/10 rounded-full bg-white dark:bg-slate-900/90 px-6 sm:px-8 shadow-xs transition-all hover:border-slate-300 dark:hover:border-white/20"
            >
              <AccordionTrigger className="min-h-[58px] sm:min-h-[64px] text-left font-bold text-sm sm:text-[15px] leading-normal text-slate-900 dark:text-white py-4 sm:py-5 hover:no-underline font-display cursor-pointer flex items-center justify-between gap-4">
                <span className="flex-1 py-0.5">{faq.q}</span>
              </AccordionTrigger>
              <AccordionContent className="text-[13.5px] leading-relaxed text-slate-600 dark:text-slate-300 pb-5 pt-1">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* 4. Final CTA Banner */}
      <section className="text-center pb-6 w-full relative">
        <div className="relative rounded-[36px] sm:rounded-[44px] bg-slate-950 text-white p-8 sm:p-16 shadow-2xl border border-slate-800 overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] pointer-events-none opacity-30"
            style={{
              background: "radial-gradient(ellipse at center, rgba(14,165,233,0.3) 0%, rgba(245,158,11,0.15) 50%, transparent 80%)",
              filter: "blur(60px)",
            }}
          />

          {/* Central Content */}
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold font-display tracking-tight text-white">
              Stop skimming. <span className="text-slate-300 font-normal">Start mastering.</span>
            </h2>

            <p className="text-base sm:text-lg leading-relaxed text-slate-300 max-w-[520px] mx-auto">
              Upload your first document or lecture recording and see what Source.io can generate.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Link
                href="/auth"
                className="w-full sm:w-auto bg-white text-slate-950 font-bold text-sm px-8 py-3.5 rounded-full shadow-xl hover:bg-slate-100 active:scale-95 transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Start free</span>
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/app/doc/demo-quantum"
                className="w-full sm:w-auto border border-white/20 bg-white/10 hover:bg-white/15 text-white font-semibold text-sm px-7 py-3.5 rounded-full backdrop-blur-md active:scale-95 transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>See a live demo</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
