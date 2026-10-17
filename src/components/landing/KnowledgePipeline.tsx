"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { 
  FileText, 
  Layers, 
  HelpCircle, 
  Headphones, 
  BookmarkCheck, 
  ExternalLink,
  ChevronRight,
  ScanLine,
  Check
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
    eyebrow: "CALIBRATION & SYNTHESIS",
    title: "Calibrate role, blocks & rigor (1–5)",
    desc: "Tailors output to your preset—ELI12, Cornell Notes, KaTeX Proofs, IMRaD Critique, or 60-Min Lesson Plans—with customizable rigor depth and modular blocks.",
    metric: "7 Calibrated Personas",
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
  const [isPaused, setIsPaused] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  // Auto-stepping 4.5s cycle with pause on user interaction
  useEffect(() => {
    if (shouldReduceMotion || isPaused) return;
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % STAGES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [shouldReduceMotion, isPaused]);

  return (
    <section id="how-it-works" className="py-14 sm:py-24 relative z-10 mx-auto scroll-mt-24 w-full">
      <SectionHeading
        badge="How It Works"
        badgeTone="blue"
        line1="From source material to active learning in four continuous steps."
        description="Upload your material once. Source.io extracts structure, derives practice tools, and preserves exact citations."
        align="center"
      />

      <div className="mt-12 sm:mt-16 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Interactive Flow Steps */}
          <div 
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            className="lg:col-span-5 flex flex-col divide-y divide-slate-100"
          >
            {STAGES.map((stage, idx) => {
              const isActive = activeStep === idx;
              return (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => {
                    setActiveStep(idx);
                    setIsPaused(true);
                  }}
                  className={`group relative text-left py-6 px-4 sm:px-6 transition-colors duration-200 rounded-2xl cursor-pointer ${
                    isActive 
                      ? "bg-slate-50/80" 
                      : "hover:bg-slate-50/40"
                  }`}
                >
                  {/* Sliding active indicator bar */}
                  {isActive && (
                    <motion.div 
                      layoutId="pipelineIndicator"
                      className="absolute left-0 top-5 bottom-5 w-[3px] rounded-r bg-slate-900 shadow-sm"
                      transition={{ type: "spring", stiffness: 420, damping: 30 }}
                    />
                  )}

                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Eyebrow & Metric */}
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono text-[11px] font-bold tracking-wider text-slate-900 uppercase">
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
                        isActive ? "text-slate-900/30" : "text-slate-200/80 group-hover:text-slate-300"
                      }`}
                    >
                      {stage.step}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Column: Persistent Source Page Annotated Across Steps */}
          <div className="lg:col-span-7 h-full flex flex-col justify-center">
            <div className="relative h-full">
              
              {/* Document Sheet (Grounded on Canvas - No nested cards, subtle hairline paper aesthetic) */}
              <div className="relative rounded-2xl bg-white border border-slate-200/80 shadow-[0_4px_24px_rgba(15,23,42,0.04)] overflow-hidden h-full min-h-[480px] sm:min-h-[520px] p-6 sm:p-8 flex flex-col justify-between">
                
                {/* Real Document Running Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 text-[11px] font-mono text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700">GRIFFITHS</span>
                    <span>•</span>
                    <span className="truncate max-w-[200px] sm:max-w-xs">Introduction to Quantum Mechanics (3rd Ed.)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-900 font-semibold">p. 14, ¶3</span>
                    <span>•</span>
                    <span>SEC 1.2</span>
                  </div>
                </div>

                {/* Persistent Textbook Page Body */}
                <div className="relative py-5 space-y-4 font-serif text-[13px] sm:text-[14px] leading-relaxed text-slate-800">
                  
                  {/* Step 1: Ingestion Scan Line Overlay */}
                  {activeStep === 0 && !shouldReduceMotion && (
                    <motion.div
                      initial={{ top: "0%" }}
                      animate={{ top: ["0%", "100%", "0%"] }}
                      transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute left-0 right-0 h-[2px] bg-slate-900 shadow-[0_0_8px_rgba(15,23,42,0.4)] z-30 pointer-events-none"
                    >
                      <div className="absolute right-2 -top-4 px-1.5 py-0.5 rounded bg-slate-900 text-white font-mono text-[9px] uppercase tracking-wider">
                        OCR Scan
                      </div>
                    </motion.div>
                  )}

                  {/* Section Title */}
                  <div className="font-sans font-bold text-base sm:text-lg text-slate-900 tracking-tight not-italic">
                    1.2 The Statistical Interpretation & Superposition
                  </div>

                  {/* Paragraph 1 - Core Theory */}
                  <div className="relative group">
                    {/* Step 1 OCR Bounding Boxes */}
                    {activeStep === 0 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute -inset-1 border border-dashed border-slate-400 bg-slate-100/30 rounded pointer-events-none"
                      >
                        <span className="absolute -top-2.5 left-2 px-1.5 py-0.5 bg-slate-100 text-slate-900 border border-slate-300 font-mono text-[9px] rounded font-semibold">
                          99.8% Text Coordinate Match
                        </span>
                      </motion.div>
                    )}

                    {/* Step 2 Structured Highlight (Key Concept) */}
                    {activeStep >= 1 && (
                      <span className="bg-slate-200/80 text-slate-950 rounded px-1 py-0.5 font-sans font-medium">
                        [Key Concept: Born Rule]
                      </span>
                    )}{" "}
                    What is the physical interpretation of the wave function $\Psi(x, t)$? Born&apos;s statistical interpretation asserts that $|\Psi(x, t)|^2$ gives the probability density of finding the particle at point $x$ at time $t$.
                  </div>

                  {/* Paragraph 2 - Equation & Math */}
                  <div className="relative py-2 my-1">
                    {/* Step 1 Equation Bounding Box */}
                    {activeStep === 0 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 border border-slate-400 bg-slate-100/30 rounded flex items-center justify-between px-2 pointer-events-none"
                      >
                        <span className="font-mono text-[9px] text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-300 font-semibold">
                          LaTeX Formula & Notation Parser
                        </span>
                      </motion.div>
                    )}

                    {/* Step 2 Structured Highlight (Equation) */}
                    <div className={`p-3 rounded-lg text-center font-mono text-xs sm:text-sm transition-colors duration-200 ${
                      activeStep >= 1 
                        ? "bg-slate-100 border border-slate-300 text-slate-950 font-semibold" 
                        : "bg-slate-50 border border-slate-100 text-slate-800"
                    }`}>
                      $$P(a \le x \le b) = \int_a^b |\Psi(x, t)|^2 \, dx = 1$$
                      {activeStep >= 1 && (
                        <span className="block mt-1 text-[10px] text-slate-600 font-sans uppercase font-bold tracking-wider">
                          Equation 1.3 • Normalization Condition
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Paragraph 3 - The Exact Target Paragraph for Citations */}
                  <div className="relative">
                    {/* Step 1 OCR Bounding Box */}
                    {activeStep === 0 && (
                      <div className="absolute -inset-1 border border-dashed border-slate-400 bg-slate-100/30 rounded pointer-events-none">
                        <span className="absolute -top-2.5 left-2 px-1.5 py-0.5 bg-slate-100 text-slate-900 border border-slate-300 font-mono text-[9px] rounded font-semibold">
                          Paragraph Coordinate Match
                        </span>
                      </div>
                    )}

                    {/* Step 2 & 3 Highlight */}
                    {activeStep === 1 && (
                      <span className="bg-slate-200/80 text-slate-950 rounded px-1 py-0.5 font-sans font-medium">
                        [Definition: Quantum Indeterminacy]
                      </span>
                    )}

                    {/* Step 4 Verification: Active Coordinate Highlight with connecting indicator */}
                    {activeStep === 3 && (
                      <div className="absolute -inset-1.5 rounded-lg border-2 border-slate-900 bg-slate-100/60 pointer-events-none" />
                    )}

                    <span className={activeStep === 3 ? "relative z-10 font-medium text-slate-950" : ""}>
                      The wave function itself is not an observable; only its modulus squared corresponds to measurable physical probability. Prior to projective measurement, the particle does not &quot;have&quot; a definite position $x$ in any classical sense.
                    </span>

                    {/* Step 4 Target Coordinate Pin */}
                    {activeStep === 3 && (
                      <span className="relative z-10 inline-flex items-center gap-1 ml-1.5 px-1.5 py-0.5 rounded bg-slate-900 text-white font-mono text-[10px] font-bold tracking-tight">
                        Target Passage ¶3
                      </span>
                    )}
                  </div>
                </div>

                {/* Dynamic Step Layer Overlays (Lifting off the page or connecting to it) */}
                <div className="pt-4 border-t border-slate-100 mt-2">
                  <AnimatePresence mode="wait">
                    
                    {/* STEP 1 OVERLAY: Ingestion Live Scan Status */}
                    {activeStep === 0 && (
                      <motion.div
                        key="overlay-ingestion"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-500"
                      >
                        <div className="flex items-center gap-2">
                          <ScanLine className="size-4 text-slate-900 animate-pulse" />
                          <span className="text-slate-800 font-medium">
                            PyMuPDF layout parser: 3 text blocks, 1 LaTeX equation
                          </span>
                        </div>
                        <span className="text-slate-900 font-medium flex items-center gap-1">
                          <Check className="size-3 text-slate-900" /> Vector coordinates mapped
                        </span>
                      </motion.div>
                    )}

                    {/* STEP 2 OVERLAY: Slim Hierarchical Outline Tree sliding beside page */}
                    {activeStep === 1 && (
                      <motion.div
                        key="overlay-structure"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="space-y-1.5 font-mono text-[11px]"
                      >
                        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                          Derived Hierarchical Chunk Map
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 text-slate-900 border border-slate-300">
                            <span className="size-1.5 rounded-full bg-slate-900" />
                            §1.2 Born Rule [Concept]
                          </span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 text-slate-900 border border-slate-300">
                            <span className="size-1.5 rounded-full bg-slate-900" />
                            Eq 1.3 Normalization [Formula]
                          </span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 text-slate-900 border border-slate-300">
                            <span className="size-1.5 rounded-full bg-slate-900" />
                            ¶3 Indeterminacy [Definition]
                          </span>
                        </div>
                      </motion.div>
                    )}

                    {/* STEP 3 OVERLAY: Passage lifts off and splits into 4 output stubs */}
                    {activeStep === 2 && (
                      <motion.div
                        key="overlay-synthesis"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="space-y-2"
                      >
                        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center justify-between">
                          <span>Synthesized Stubs (Lifted from ¶3)</span>
                          <span className="text-slate-900">4 Synchronized Modalities</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          
                          {/* Note Stub */}
                          <div className="p-2 rounded-lg border border-slate-200 bg-slate-50 text-left">
                            <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500 font-semibold mb-1">
                              <FileText className="size-3 text-slate-900" /> Note
                            </div>
                            <p className="text-[11px] text-slate-800 line-clamp-2 leading-tight">
                              Wavefunction magnitude squared defines probability density.
                            </p>
                          </div>

                          {/* Flashcard Stub */}
                          <div className="p-2 rounded-lg border border-slate-200 bg-slate-50 text-left">
                            <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500 font-semibold mb-1">
                              <Layers className="size-3 text-slate-900" /> Card
                            </div>
                            <p className="text-[11px] text-slate-800 line-clamp-2 leading-tight">
                              Q: Is Ψ(x,t) observable? A: No, only |Ψ|².
                            </p>
                          </div>

                          {/* Quiz Stub */}
                          <div className="p-2 rounded-lg border border-slate-200 bg-slate-50 text-left">
                            <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500 font-semibold mb-1">
                              <HelpCircle className="size-3 text-slate-900" /> Quiz
                            </div>
                            <p className="text-[11px] text-slate-800 line-clamp-2 leading-tight">
                              What does |Ψ|² dx represent in Born&apos;s rule?
                            </p>
                          </div>

                          {/* Audio Waveform Stub */}
                          <div className="p-2 rounded-lg border border-slate-200 bg-slate-50 text-left">
                            <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500 font-semibold mb-1">
                              <Headphones className="size-3 text-slate-900" /> Podcast
                            </div>
                            <div className="flex items-center gap-0.5 h-4 mt-1">
                              {[60, 100, 40, 80, 50, 90, 30].map((h, i) => (
                                <div 
                                  key={i} 
                                  className="w-1 bg-slate-900 rounded-full" 
                                  style={{ height: `${h}%` }} 
                                />
                              ))}
                            </div>
                          </div>

                        </div>
                      </motion.div>
                    )}

                    {/* STEP 4 OVERLAY: Exact Answer Sentence with Citation Chip pointing back */}
                    {activeStep === 3 && (
                      <motion.div
                        key="overlay-verification"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="p-3 sm:p-4 rounded-xl bg-slate-900 text-white space-y-2 relative shadow-md"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-slate-300 font-semibold uppercase tracking-wider">
                            Verified Synthesized Answer
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-white bg-white/10 px-2 py-0.5 rounded border border-white/20">
                            <BookmarkCheck className="size-3" /> Exact Source Link
                          </span>
                        </div>

                        <p className="text-xs sm:text-[13px] text-slate-200 leading-snug font-sans">
                          &quot;A particle does not possess a definite classical position prior to measurement; only $|\Psi(x,t)|^2$ describes the probability distribution.&quot;
                        </p>

                        {/* Citation Chip visibly linking back */}
                        <div className="pt-1 flex items-center justify-between border-t border-slate-800">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/10 text-white border border-white/20 font-mono text-xs font-semibold">
                            <BookmarkCheck className="size-3.5 text-white" />
                            <span>p. 14, ¶3</span>
                            <ChevronRight className="size-3" />
                            <span>Lines 18–22</span>
                          </div>

                          <span className="text-[10px] font-mono text-slate-400">
                            Cosine similarity: 98.4%
                          </span>
                        </div>
                      </motion.div>
                    )}

                  </AnimatePresence>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
