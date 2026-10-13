"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { 
  FileUp, 
  FileText, 
  Check, 
  Sparkles, 
  Layers, 
  HelpCircle, 
  Headphones, 
  BookmarkCheck, 
  ExternalLink,
  ChevronRight,
  Database
} from "lucide-react";
import { SectionHeading } from "./SectionHeading";

interface Stage {
  id: string;
  step: string;
  eyebrow: string;
  title: string;
  desc: string;
  metric: string;
}

const STAGES: Stage[] = [
  {
    id: "ingestion",
    step: "01",
    eyebrow: "INGESTION",
    title: "Upload your source",
    desc: "Drop in textbooks, research papers, lecture recordings, or web links. Speech-to-text and OCR parse content into clean text.",
    metric: "PDF, Audio & LaTeX",
  },
  {
    id: "structure",
    step: "02",
    eyebrow: "STRUCTURE",
    title: "Extract and structure",
    desc: "Key concepts, core definitions, and mathematical equations are organized into clean, hierarchical outlines.",
    metric: "Vector Chunking",
  },
  {
    id: "synthesis",
    step: "03",
    eyebrow: "SYNTHESIS",
    title: "Generate study modes",
    desc: "Derives structured notes, spaced repetition flashcard decks, practice quizzes, and 2-host conversational recaps.",
    metric: "5 Coordinated Modes",
  },
  {
    id: "verification",
    step: "04",
    eyebrow: "VERIFICATION",
    title: "Cite every answer",
    desc: "Every note passage, flashcard answer, and quiz solution points back to the exact page number, paragraph, or audio timestamp.",
    metric: "Verified Coordinates",
  },
];

export function KnowledgePipeline() {
  const [activeStep, setActiveStep] = useState<number>(0);
  const shouldReduceMotion = useReducedMotion();

  return (
    <section id="how-it-works" className="py-14 sm:py-24 relative z-10 mx-auto scroll-mt-24 w-full">
      <SectionHeading
        badge="How It Works"
        badgeTone="blue"
        line1="From source material to active learning"
        line2="in four continuous steps."
        description="Upload your material once. Source.io extracts structure, derives practice tools, and preserves exact citations."
        align="center"
      />

      <div className="mt-12 sm:mt-16 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left Column: Interactive Flow Steps */}
          <div className="lg:col-span-5 flex flex-col divide-y divide-slate-100">
            {STAGES.map((stage, idx) => {
              const isActive = activeStep === idx;
              return (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => setActiveStep(idx)}
                  className={`group relative text-left py-6 px-4 sm:px-6 transition-colors duration-200 rounded-2xl ${
                    isActive 
                      ? "bg-slate-50/80" 
                      : "hover:bg-slate-50/40"
                  }`}
                >
                  {/* Subtle active indicator bar */}
                  <div 
                    className={`absolute left-0 top-6 bottom-6 w-[3px] rounded-r transition-all duration-200 ${
                      isActive ? "bg-sky-600 opacity-100" : "opacity-0"
                    }`} 
                  />

                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Eyebrow & Metric */}
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono text-[11px] font-bold tracking-wider text-sky-600 uppercase">
                          {stage.eyebrow}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          / {stage.metric}
                        </span>
                      </div>

                      {/* Step Title */}
                      <h3 className={`text-base sm:text-lg font-semibold tracking-tight transition-colors ${
                        isActive ? "text-slate-900" : "text-slate-700 group-hover:text-slate-900"
                      }`}>
                        {stage.title}
                      </h3>

                      {/* Step Description */}
                      <p className={`mt-2 text-xs sm:text-[13px] leading-relaxed transition-colors ${
                        isActive ? "text-slate-600" : "text-slate-500 line-clamp-2"
                      }`}>
                        {stage.desc}
                      </p>
                    </div>

                    {/* Faint Signature Numeral */}
                    <span 
                      aria-hidden="true" 
                      className={`font-mono text-3xl font-extrabold select-none tracking-tighter transition-colors shrink-0 ${
                        isActive ? "text-sky-500/25" : "text-slate-200/80 group-hover:text-slate-300"
                      }`}
                    >
                      {stage.step}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Column: Sticky Live Visual Product Panel */}
          <div className="lg:col-span-7 lg:sticky lg:top-28">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-xs relative overflow-hidden min-h-[380px] sm:min-h-[420px] flex flex-col justify-between">
              
              {/* Panel Top Metadata Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-semibold text-slate-800">
                    STAGE {STAGES[activeStep].step}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="font-mono text-[11px] tracking-wide text-sky-600 uppercase font-medium">
                    {STAGES[activeStep].eyebrow}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {STAGES.map((_, i) => (
                    <div 
                      key={i} 
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        i === activeStep ? "w-6 bg-sky-600" : "w-1.5 bg-slate-200"
                      }`} 
                    />
                  ))}
                </div>
              </div>

              {/* Dynamic Product UI Content with subtle transition */}
              <div className="py-6 flex-1 flex flex-col justify-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeStep}
                    initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className="w-full"
                  >
                    {activeStep === 0 && <UploadIngestionMock />}
                    {activeStep === 1 && <HierarchicalOutlineMock />}
                    {activeStep === 2 && <StudyModesMock />}
                    {activeStep === 3 && <VerifiedCitationMock />}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Panel Bottom Footer with technical pipeline detail */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Engine: Whisper ASR + PyMuPDF + Gemini Vector Store
                </span>
                <span className="text-slate-400">
                  {STAGES[activeStep].metric}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

// Visual 1: Ingestion / Upload Mock
function UploadIngestionMock() {
  return (
    <div className="space-y-4">
      {/* Drag & Drop Area */}
      <div className="border border-dashed border-slate-300 rounded-xl p-5 bg-slate-50/60 text-center">
        <div className="size-10 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center mx-auto mb-2.5">
          <FileUp className="size-5" />
        </div>
        <p className="text-xs font-semibold text-slate-800">
          Drop textbooks, PDFs, lecture audio or slides
        </p>
        <p className="text-[11px] text-slate-500 font-mono mt-0.5">
          Up to 300 pages • Auto OCR & speech transcript
        </p>
      </div>

      {/* Processed Ingestion Item Preview */}
      <div className="border border-slate-200/90 rounded-xl p-3.5 bg-white space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="size-8 rounded-md bg-sky-50 text-sky-700 flex items-center justify-center font-mono text-[10px] font-bold">
              PDF
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-900 truncate">
                Griffiths_Quantum_Mechanics_Ch4.pdf
              </p>
              <p className="text-[10px] font-mono text-slate-500">
                4.2 MB • 38 pages • OCR complete
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-medium">
            <Check className="size-3" /> Ready
          </span>
        </div>

        {/* Ingestion stream progress */}
        <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
          <div className="bg-sky-600 h-full w-full rounded-full" />
        </div>
      </div>
    </div>
  );
}

// Visual 2: Hierarchical Outline Mock
function HierarchicalOutlineMock() {
  return (
    <div className="border border-slate-200/90 rounded-xl p-4 bg-white space-y-3 font-mono text-xs">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <span className="text-[11px] font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
          <Database className="size-3.5 text-sky-600" /> Vector Chunk Tree
        </span>
        <span className="text-[10px] text-slate-400">14 chunks indexed</span>
      </div>

      <div className="space-y-2 text-[11px]">
        {/* Node 1 */}
        <div className="p-2 rounded-lg bg-slate-50/80 border border-slate-100">
          <div className="flex items-center justify-between text-slate-900 font-semibold">
            <span>§4.1 Spin Angular Momentum</span>
            <span className="text-[10px] text-sky-600">p. 137</span>
          </div>
          <p className="text-[10px] text-slate-500 font-sans mt-0.5">
            Stern-Gerlach apparatus, eigenspaces of S_z and S_x
          </p>
        </div>

        {/* Node 2 - Nested */}
        <div className="ml-4 p-2 rounded-lg bg-sky-50/50 border border-sky-100/80">
          <div className="flex items-center justify-between text-slate-900 font-semibold">
            <span>↳ 4.1.2 Pauli Spin Matrices</span>
            <span className="text-[10px] text-sky-600 font-mono">3 chunks</span>
          </div>
          <p className="text-[10px] text-slate-600 font-sans mt-0.5">
            σ_x, σ_y, σ_z algebraic commutation [σ_i, σ_j] = 2iε_ijk σ_k
          </p>
        </div>

        {/* Node 3 */}
        <div className="p-2 rounded-lg bg-slate-50/80 border border-slate-100">
          <div className="flex items-center justify-between text-slate-900 font-semibold">
            <span>§4.2 Addition of Angular Momenta</span>
            <span className="text-[10px] text-sky-600">p. 152</span>
          </div>
          <p className="text-[10px] text-slate-500 font-sans mt-0.5">
            Clebsch-Gordan coefficient matrices & singlet states
          </p>
        </div>
      </div>
    </div>
  );
}

// Visual 3: Five Study Modes Mock
function StudyModesMock() {
  const modes = [
    { label: "Study Notes", icon: FileText, desc: "Dense synthesized summaries" },
    { label: "Leitner Flashcards", icon: Layers, desc: "Spaced repetition intervals" },
    { label: "Practice Quiz", icon: HelpCircle, desc: "Diagnostic testing with rationale" },
    { label: "Audio Recap", icon: Headphones, desc: "2-host podcast walkthrough" },
    { label: "Socratic Chat", icon: Sparkles, desc: "Direct grounded source dialogue" },
  ];

  return (
    <div className="space-y-2">
      <div className="text-[11px] font-mono text-slate-500 mb-2 flex items-center justify-between">
        <span>5 Coordinated Modalities</span>
        <span className="text-sky-600 font-medium">Single pipeline pass</span>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {modes.slice(0, 4).map((m) => {
          const Icon = m.icon;
          return (
            <div 
              key={m.label} 
              className="p-3 rounded-xl border border-slate-200/90 bg-white flex items-start gap-2.5"
            >
              <div className="size-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="size-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-800 leading-snug">
                  {m.label}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                  {m.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 5th Mode full width spotlight */}
      <div className="p-3 rounded-xl border border-sky-200/80 bg-sky-50/40 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="size-7 rounded-lg bg-sky-600 text-white flex items-center justify-center shrink-0">
            <Sparkles className="size-3.5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-900 leading-snug">
              Socratic Source Chat
            </p>
            <p className="text-[10px] text-slate-600">
              Zero hallucinations — constrained strictly to your documents
            </p>
          </div>
        </div>
        <ChevronRight className="size-4 text-sky-600" />
      </div>
    </div>
  );
}

// Visual 4: Verified Citation Mock (Highlighting the strongest feature)
function VerifiedCitationMock() {
  return (
    <div className="space-y-3">
      {/* Generated answer with citation chip */}
      <div className="border border-slate-200/90 rounded-xl p-4 bg-white space-y-2">
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wide">
            Generated Answer
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
            <BookmarkCheck className="size-3" /> 100% Grounded
          </span>
        </div>

        <p className="text-xs text-slate-800 leading-relaxed font-sans">
          The Pauli spin matrix along the z-axis has eigenvalues +1 and -1 corresponding to orthogonal spin-up and spin-down eigenspaces:
        </p>

        {/* Exact Citation Chip */}
        <div className="pt-2 flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-sky-50 text-sky-700 border border-sky-200 text-xs font-mono font-medium hover:bg-sky-100 transition-colors cursor-pointer">
            <BookmarkCheck className="size-3 text-sky-600" />
            <span>p. 42, ¶3</span>
            <ExternalLink className="size-2.5 opacity-60" />
          </div>

          <span className="text-[11px] font-mono text-slate-400">
            Lines 14–19 • Griffith_QM.pdf
          </span>
        </div>
      </div>

      {/* Source PDF Inspector Peek */}
      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] font-mono text-slate-600 space-y-1">
        <div className="flex items-center justify-between text-slate-400 text-[10px]">
          <span>SOURCE EXCERPT</span>
          <span>PAGE 42</span>
        </div>
        <p className="italic text-slate-700 line-clamp-2">
          "...the operator S_z is represented in this basis by the diagonal matrix (ħ/2) * diag(1, -1), confirming that measurement along z yields eigenvalues ±ħ/2."
        </p>
      </div>
    </div>
  );
}
