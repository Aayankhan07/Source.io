"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  FileText, ArrowRight, CheckCircle2, RotateCcw, 
  Sparkles, ShieldCheck, ChevronRight, Upload, Play, Clock
} from "lucide-react";
import { toast } from "sonner";

interface HeroProductDemoProps {
  onExploreWorkflow?: () => void;
}

export function HeroProductDemo({ onExploreWorkflow }: HeroProductDemoProps) {
  const [pipelineState, setPipelineState] = useState<"idle" | "processing" | "completed">("idle");
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [streamingCharCount, setStreamingCharCount] = useState<number>(0);
  const streamIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const steps = [
    { label: "Parsing PDF & Whisper ASR", metric: "38 pages • 14 min audio" },
    { label: "Extracting mathematical matrices", metric: "Hilbert vector space" },
    { label: "Synthesizing 5 study modalities", metric: "Notes, Decks, Quiz, Audio" },
    { label: "Indexing passage coordinates", metric: "48 verified vectors" },
  ];

  const fullSampleNote = 
    "A quantum state vector exists in normalized Hilbert space |ψ⟩ = α|0⟩ + β|1⟩. Unlike classical bits constrained to discrete binary values, quantum superposition allows simultaneous multi-path computation until measurement triggers state reduction.";

  const startDemo = () => {
    setPipelineState("processing");
    setCurrentStep(0);
    setProgress(15);
    setStreamingCharCount(0);

    // Step 0 -> Step 1
    setTimeout(() => {
      setCurrentStep(1);
      setProgress(45);
    }, 600);

    // Step 1 -> Step 2
    setTimeout(() => {
      setCurrentStep(2);
      setProgress(75);
    }, 1200);

    // Step 2 -> Step 3
    setTimeout(() => {
      setCurrentStep(3);
      setProgress(95);
    }, 1700);

    // Step 3 -> Completed
    setTimeout(() => {
      setProgress(100);
      setPipelineState("completed");
      toast.success("quantum_intro.pdf ingested & derived!", {
        description: "5 study modalities ready with verified passage coordinates.",
      });

      // Stream text in line by line
      let chars = 0;
      if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
      streamIntervalRef.current = setInterval(() => {
        chars += 4;
        setStreamingCharCount(chars);
        if (chars >= fullSampleNote.length) {
          if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
          streamIntervalRef.current = null;
        }
      }, 25);
    }, 2200);
  };

  const resetDemo = () => {
    if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
    setPipelineState("idle");
    setCurrentStep(0);
    setProgress(0);
    setStreamingCharCount(0);
  };

  useEffect(() => {
    return () => {
      if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
    };
  }, []);

  return (
    <div className="relative w-full rounded-2xl sm:rounded-3xl border border-border bg-card shadow-xl shadow-black/5 overflow-hidden transition-all duration-300">
      {/* Chrome Window Header */}
      <div className="bg-accent/40 border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-border" />
            <span className="h-2.5 w-2.5 rounded-full bg-border" />
            <span className="h-2.5 w-2.5 rounded-full bg-border" />
          </div>
          <span className="text-[11px] font-mono text-muted-foreground ml-2">
            interactive_sandbox.app
          </span>
        </div>

        <div className="flex items-center gap-2">
          {pipelineState === "completed" && (
            <button
              type="button"
              onClick={resetDemo}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground px-2 py-0.5 rounded-full hover:bg-accent transition-colors"
            >
              <RotateCcw className="h-3 w-3" /> Replay
            </button>
          )}
          <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            Live Preview
          </span>
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div className="p-5 sm:p-7 min-h-[360px] flex flex-col justify-between">
        <AnimatePresence mode="wait">
          {/* STATE 1: IDLE / DROPZONE */}
          {pipelineState === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="flex-1 flex flex-col justify-center items-center text-center space-y-4"
            >
              <div className="h-14 w-14 rounded-2xl bg-accent border border-border flex items-center justify-center text-muted-foreground group-hover:text-foreground transition-colors shadow-2xs">
                <Upload className="h-6 w-6 stroke-1 text-primary" />
              </div>

              <div className="space-y-1.5 max-w-sm">
                <h3 className="text-base font-semibold text-foreground tracking-tight">
                  Drop a PDF or paste lecture link
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Extracts verified notes, Leitner flashcards, practice quizzes, and 2-host audio recap.
                </p>
              </div>

              {/* Sample Action Button */}
              <div className="pt-2 w-full max-w-xs">
                <button
                  type="button"
                  onClick={startDemo}
                  className="w-full bg-primary hover:opacity-90 text-primary-foreground font-medium text-xs sm:text-sm py-2.5 px-4 rounded-xl shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Try sample: quantum_intro.pdf</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
                <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground mt-2 px-1">
                  <span>38 pages • Chapter 1</span>
                  <span>Audio & LaTeX</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* STATE 2: PIPELINE PROCESSING IN REAL TIME */}
          {pipelineState === "processing" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col justify-center space-y-6 max-w-md mx-auto w-full py-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Sparkles className="h-4 w-4 animate-spin text-primary" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-foreground font-mono">
                      Ingesting quantum_intro.pdf
                    </h4>
                    <p className="text-[11px] text-muted-foreground font-mono">
                      {steps[currentStep].label}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-foreground tabular-nums">
                  {progress}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-accent rounded-full h-2 overflow-hidden border border-border">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: "easeOut", duration: 0.4 }}
                />
              </div>

              {/* Micro-steps */}
              <div className="space-y-2 pt-1 font-mono text-xs">
                {steps.map((st, idx) => {
                  const isDone = currentStep > idx || progress === 100;
                  const isCurrent = currentStep === idx && progress < 100;
                  return (
                    <div
                      key={st.label}
                      className={`flex items-center justify-between p-2 rounded-lg border transition-all ${
                        isCurrent
                          ? "bg-accent/80 border-primary/40 text-foreground"
                          : isDone
                          ? "bg-accent/30 border-border text-muted-foreground"
                          : "opacity-40 border-transparent text-muted-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isDone ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        ) : isCurrent ? (
                          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                        ) : (
                          <span className="h-2 w-2 rounded-full bg-border" />
                        )}
                        <span className="text-[11px] font-medium">{st.label}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{st.metric}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* STATE 3: COMPLETED LIVE DERIVATION VIEW */}
          {pipelineState === "completed" && (
            <motion.div
              key="completed"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col justify-between space-y-4 text-left"
            >
              {/* Document Header Metadata */}
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <FileText className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">
                      The Quantum State Representation
                    </h4>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      Derived into 5 formats • 48 coordinates
                    </span>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="h-3 w-3" /> Grounded
                </span>
              </div>

              {/* Streaming Note Passage with Glowing Citation Chips */}
              <div className="space-y-3 bg-accent/30 rounded-xl p-3.5 border border-border">
                <p className="text-xs text-foreground leading-relaxed font-sans min-h-[64px]">
                  {fullSampleNote.slice(0, streamingCharCount)}
                  {streamingCharCount < fullSampleNote.length && (
                    <span className="inline-block w-1.5 h-3.5 bg-primary ml-0.5 animate-pulse align-middle" />
                  )}
                </p>

                {/* Pulsing Coordinates */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-card border border-border text-[11px] font-mono text-foreground shadow-2xs"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Passage §1.2 [p. 3]</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">0.98</span>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-card border border-border text-[11px] font-mono text-foreground shadow-2xs"
                  >
                    <Clock className="h-3 w-3 text-sky-500" />
                    <span>Lecture Audio [01:14]</span>
                  </motion.div>
                </div>
              </div>

              {/* Modality Chips Quick Select */}
              <div className="pt-1 flex items-center justify-between border-t border-border mt-auto">
                <span className="text-[11px] font-mono text-muted-foreground">
                  View in full study simulator
                </span>
                <a
                  href="#simulator"
                  onClick={onExploreWorkflow}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  <span>Open 5 views below</span>
                  <ChevronRight className="h-3 w-3" />
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Status Strip */}
      <div className="bg-accent/40 border-t border-border px-4 py-2.5 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span>Whisper ASR • Vector Ingestion Engine</span>
        </div>
        <span>Zero API Cost in Sandbox</span>
      </div>
    </div>
  );
}
