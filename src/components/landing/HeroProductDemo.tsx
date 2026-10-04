"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  FileText, ArrowRight, CheckCircle2, RotateCcw, 
  Sparkles, ShieldCheck, ChevronRight, Upload, Play, Clock,
  Layers, Headphones, HelpCircle, MessagesSquare, Check
} from "lucide-react";
import { toast } from "sonner";

interface HeroProductDemoProps {
  onExploreWorkflow?: () => void;
}

type LensMode = "notes" | "flashcard" | "quiz" | "podcast" | "chat";

export function HeroProductDemo({ onExploreWorkflow }: HeroProductDemoProps) {
  const [pipelineState, setPipelineState] = useState<"idle" | "processing" | "completed">("idle");
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [streamingCharCount, setStreamingCharCount] = useState<number>(0);
  const [activeLens, setActiveLens] = useState<LensMode>("notes");
  const [cardFlipped, setCardFlipped] = useState<boolean>(false);
  const [quizSelected, setQuizSelected] = useState<number | null>(null);
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
    setProgress(18);
    setStreamingCharCount(0);
    setActiveLens("notes");

    setTimeout(() => {
      setCurrentStep(1);
      setProgress(48);
    }, 550);

    setTimeout(() => {
      setCurrentStep(2);
      setProgress(78);
    }, 1100);

    setTimeout(() => {
      setCurrentStep(3);
      setProgress(94);
    }, 1600);

    setTimeout(() => {
      setProgress(100);
      setPipelineState("completed");
      toast.success("quantum_intro.pdf ingested & derived", {
        description: "5 study modalities ready with verified passage coordinates.",
      });

      let chars = 0;
      if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
      streamIntervalRef.current = setInterval(() => {
        chars += 5;
        setStreamingCharCount(chars);
        if (chars >= fullSampleNote.length) {
          if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
          streamIntervalRef.current = null;
        }
      }, 20);
    }, 2100);
  };

  const resetDemo = () => {
    if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
    setPipelineState("idle");
    setCurrentStep(0);
    setProgress(0);
    setStreamingCharCount(0);
    setActiveLens("notes");
    setCardFlipped(false);
    setQuizSelected(null);
  };

  useEffect(() => {
    return () => {
      if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
    };
  }, []);

  return (
    <div className="relative w-full rounded-2xl sm:rounded-3xl border border-border/80 bg-card/90 backdrop-blur-md shadow-xl overflow-hidden transition-all duration-300">
      {/* Top Chrome Window Header */}
      <div className="bg-accent/40 border-b border-border/70 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-border" />
            <span className="h-2.5 w-2.5 rounded-full bg-border" />
            <span className="h-2.5 w-2.5 rounded-full bg-border" />
          </div>
          <span className="text-xs font-mono text-muted-foreground ml-2">
            source_sandbox.app
          </span>
        </div>

        <div className="flex items-center gap-2">
          {pipelineState === "completed" && (
            <button
              type="button"
              onClick={resetDemo}
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground px-2 py-0.5 rounded-full hover:bg-accent transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" /> Replay
            </button>
          )}
          <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            Interactive
          </span>
        </div>
      </div>

      {/* Main Interactive Sandbox Body */}
      <div className="p-5 sm:p-6 min-h-[380px] flex flex-col justify-between">
        <AnimatePresence mode="wait">
          {/* STATE 1: IDLE / DROPZONE */}
          {pipelineState === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              className="flex-1 flex flex-col justify-center items-center text-center space-y-4 py-3"
            >
              <div className="h-12 w-12 rounded-2xl bg-accent border border-border flex items-center justify-center text-primary shadow-xs">
                <Upload className="h-5 w-5" strokeWidth={1.5} />
              </div>

              <div className="space-y-1 max-w-sm">
                <h2 className="text-base font-semibold text-foreground tracking-tight">
                  Drop a PDF, audio, or lecture URL
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Extracts verified study notes, Leitner flashcards, quizzes, and 2-host audio recap.
                </p>
              </div>

              {/* Sample Action Button */}
              <div className="pt-2 w-full max-w-xs space-y-2">
                <button
                  type="button"
                  onClick={startDemo}
                  className="w-full bg-primary hover:opacity-90 text-primary-foreground font-medium text-xs sm:text-sm py-2.5 px-4 rounded-xl shadow-xs transition-all active:scale-[0.98] flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Ingest sample: quantum_intro.pdf</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
                <div className="flex items-center justify-between text-xs font-mono text-muted-foreground px-1">
                  <span>38 pages • Chapter 1</span>
                  <span>Audio &amp; LaTeX</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* STATE 2: PIPELINE PROCESSING */}
          {pipelineState === "processing" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col justify-center space-y-5 max-w-md mx-auto w-full py-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Sparkles className="h-4 w-4 animate-spin text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-foreground font-mono">
                      Ingesting quantum_intro.pdf
                    </h3>
                    <p className="text-xs text-muted-foreground font-mono">
                      {steps[currentStep].label}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-foreground tabular-nums">
                  {progress}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-accent rounded-full h-1.5 overflow-hidden border border-border">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: [0.23, 1, 0.32, 1], duration: 0.4 }}
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
                        <span className="text-xs font-medium">{st.label}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{st.metric}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* STATE 3: INTERACTIVE 5-IN-1 DERIVATIONS */}
          {pipelineState === "completed" && (
            <motion.div
              key="completed"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              className="flex-1 flex flex-col justify-between space-y-3.5 text-left"
            >
              {/* Document Meta Header */}
              <div className="flex items-center justify-between border-b border-border/70 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <FileText className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-foreground">
                      The Quantum State Representation
                    </h3>
                    <span className="text-xs font-mono text-muted-foreground">
                      48 passage coordinates • 5 study lenses
                    </span>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <ShieldCheck className="h-3 w-3" /> Grounded
                </span>
              </div>

              {/* 5 Lens Switcher Pills with Distinct Chromatic Identities */}
              <div className="flex items-center gap-1 p-1 bg-accent/40 rounded-xl border border-border/60 overflow-x-auto">
                {[
                  { id: "notes", label: "Notes", icon: FileText, activeClass: "bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.15)]" },
                  { id: "flashcard", label: "Cards", icon: Layers, activeClass: "bg-violet-500/15 text-violet-300 border-violet-500/40 shadow-[0_0_10px_rgba(139,92,246,0.15)]" },
                  { id: "quiz", label: "Quiz", icon: HelpCircle, activeClass: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.15)]" },
                  { id: "podcast", label: "Audio", icon: Headphones, activeClass: "bg-rose-500/15 text-rose-300 border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.15)]" },
                  { id: "chat", label: "Chat", icon: MessagesSquare, activeClass: "bg-cyan-500/15 text-cyan-300 border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.15)]" },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeLens === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveLens(tab.id as LensMode)}
                      className={`flex-1 min-w-[56px] py-1.5 px-2 rounded-lg text-xs font-medium inline-flex items-center justify-center gap-1 transition-all active:scale-[0.98] cursor-pointer ${
                        isActive
                          ? `${tab.activeClass} font-semibold border`
                          : "text-muted-foreground hover:text-foreground hover:bg-card/50 border border-transparent"
                      }`}
                    >
                      <Icon className="h-3 w-3 shrink-0" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Lens Viewport Display */}
              <div className="bg-card/60 backdrop-blur-md rounded-xl p-3.5 border border-border/80 min-h-[145px] flex flex-col justify-center shadow-inner">
                {activeLens === "notes" && (
                  <div className="space-y-2.5">
                    <p className="text-xs text-foreground leading-relaxed font-sans min-h-[48px]">
                      A quantum state vector exists in{" "}
                      <span className="bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded font-mono font-medium border border-amber-400/30">
                        normalized Hilbert space |ψ⟩ = α|0⟩ + β|1⟩
                      </span>
                      . Unlike classical bits constrained to discrete values,{" "}
                      <span className="bg-cyan-500/15 text-cyan-300 px-1.5 py-0.5 rounded font-medium border border-cyan-500/25">
                        quantum superposition
                      </span>{" "}
                      allows simultaneous computation until measurement triggers collapse.
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-xs">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 shadow-xs">
                        <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                        <span>Passage §1.2 [p. 3]</span>
                        <span className="text-cyan-400 font-bold">0.98</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-950/30 border border-rose-500/30 text-rose-300 shadow-xs">
                        <Clock className="h-3 w-3 text-rose-400" />
                        <span>Lecture [01:14]</span>
                      </span>
                    </div>
                  </div>
                )}

                {activeLens === "flashcard" && (
                  <div
                    onClick={() => setCardFlipped(!cardFlipped)}
                    className={`p-3.5 rounded-lg border transition-all duration-300 cursor-pointer select-none space-y-2 shadow-xs ${
                      cardFlipped
                        ? "bg-violet-950/30 border-violet-500/40 shadow-[0_0_15px_rgba(139,92,246,0.15)]"
                        : "bg-card border-border hover:border-violet-500/30"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5 text-violet-400 font-medium">
                        <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                        Leitner Deck • Box 3
                      </span>
                      <span className="text-violet-400 font-medium hover:underline">
                        {cardFlipped ? "Click to view question" : "Click to flip answer"}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-foreground leading-relaxed">
                      {cardFlipped ? (
                        <span className="text-violet-200">
                          Linear superposition: <code className="text-cyan-300 bg-cyan-950/40 px-1 rounded">|ψ⟩ = α|0⟩ + β|1⟩</code> evaluates all multi-path algorithms simultaneously until measurement triggers wave-function collapse.
                        </span>
                      ) : (
                        "What mathematical property allows quantum systems to evaluate multiple states simultaneously before measurement?"
                      )}
                    </p>
                    <div className="flex items-center justify-between text-xs font-mono pt-1 border-t border-border/50">
                      <span className="text-amber-400">Next review: In 4 Days</span>
                      <span className="text-emerald-400 font-semibold">94.2% Retention</span>
                    </div>
                  </div>
                )}

                {activeLens === "quiz" && (
                  <div className="space-y-2.5">
                    <p className="text-xs font-medium text-foreground">
                      Which mathematical space contains normalized qubit state vectors?
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {[
                        { id: 0, text: "Euclidean R³ Space", correct: false },
                        { id: 1, text: "Complex Hilbert Space", correct: true },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setQuizSelected(opt.id)}
                          className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer font-mono text-xs flex items-center justify-between ${
                            quizSelected === opt.id
                              ? opt.correct
                                ? "bg-emerald-500/20 border-emerald-400 text-emerald-300 font-semibold shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                                : "bg-rose-500/20 border-rose-400 text-rose-300 font-semibold shadow-[0_0_15px_rgba(244,63,94,0.2)]"
                              : "bg-card border-border hover:border-emerald-500/40 text-foreground"
                          }`}
                        >
                          <div>
                            <span className="mr-1.5 opacity-60">{opt.id === 1 ? "B)" : "A)"}</span>
                            <span>{opt.text}</span>
                          </div>
                          {quizSelected === opt.id && (
                            <span className="text-xs">
                              {opt.correct ? "✓ Verified" : "✗ Incorrect"}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                    {quizSelected === 1 && (
                      <div className="text-xs text-emerald-300 font-mono flex items-center gap-1.5 pt-0.5">
                        <Check className="h-3 w-3 text-emerald-400" />
                        <span>Grounding confirmed from Chapter 1, equation (1.4).</span>
                      </div>
                    )}
                  </div>
                )}

                {activeLens === "podcast" && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                      <span className="flex items-center gap-1.5 text-rose-400">
                        <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                        2-Host Dialogue (Julian &amp; Clara)
                      </span>
                      <span className="text-muted-foreground">01:14 / 04:30</span>
                    </div>
                    {/* Visual Waveform bars with Aurora Gradient */}
                    <div className="flex items-center gap-1 h-8 py-1 px-2.5 bg-card/80 rounded-lg border border-border">
                      {[40, 70, 95, 30, 85, 60, 100, 45, 80, 55, 90, 65, 35, 75, 50].map((h, i) => (
                        <span
                          key={i}
                          className="flex-1 bg-gradient-to-t from-cyan-500 to-rose-400 rounded-full transition-all duration-300 opacity-80 hover:opacity-100"
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-foreground/80 italic font-serif">
                      &quot;...so superposition isn&apos;t just probability, it&apos;s physical phase coherence across Hilbert dimensions.&quot;
                    </p>
                  </div>
                )}

                {activeLens === "chat" && (
                  <div className="space-y-2 text-xs">
                    <div className="bg-card p-2.5 rounded-lg border border-border text-foreground font-mono">
                      Q: What is the formal equation for qubit superposition?
                    </div>
                    <div className="bg-cyan-950/30 p-2.5 rounded-lg border border-cyan-500/30 text-cyan-100">
                      <p className="leading-relaxed font-sans">
                        |ψ⟩ = α|0⟩ + β|1⟩ where |α|² + |β|² = 1.
                      </p>
                      <span className="inline-flex items-center gap-1.5 font-mono text-cyan-400 mt-1.5 text-xs font-medium">
                        <Check className="h-3 w-3 text-cyan-300" /> Cited from Chapter 1, p. 3 (§1.2)
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Quick-Action Link */}
              <div className="pt-1 flex items-center justify-between border-t border-border/70 mt-auto">
                <span className="text-xs font-mono text-muted-foreground">
                  View full multi-modal study workspace
                </span>
                <a
                  href="#workbench"
                  onClick={onExploreWorkflow}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer"
                >
                  <span>Explore the 5 views below</span>
                  <ChevronRight className="h-3 w-3" />
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Status Strip */}
      <div className="bg-accent/40 border-t border-border/70 px-4 py-2.5 flex items-center justify-between text-xs font-mono text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span>Whisper ASR • Vector Ingestion Engine</span>
        </div>
        <span>Zero Cost in Sandbox</span>
      </div>
    </div>
  );
}
