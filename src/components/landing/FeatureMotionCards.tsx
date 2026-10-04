"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { SectionHeading } from "./SectionHeading";

export function FeatureMotionCards() {
  // Card 1: Acoustic Diarization & Waveform State
  const [activeSpeakerIdx, setActiveSpeakerIdx] = useState<number>(0);
  const speakers = [
    { name: "Clara", text: "Superposition allows linear state combinations...", timestamp: "01:14" },
    { name: "Julian", text: "Evaluating multi-path algorithms simultaneously...", timestamp: "01:28" },
    { name: "Clara", text: "Until projective physical measurement prompts reduction.", timestamp: "01:42" }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSpeakerIdx((prev) => (prev + 1) % speakers.length);
    }, 2800);
    return () => clearInterval(timer);
  }, [speakers.length]);

  // Card 2: Cosine Similarity Interactive Scoring
  const [simQueryIdx, setSimQueryIdx] = useState<number>(0);
  const queries = [
    { query: "How does decoherence destroy phase?", topScore: 0.96, secondScore: 0.91, topPassage: "§3.4 Thermal noise dispersion..." },
    { query: "What is normalized Hilbert space?", topScore: 0.98, secondScore: 0.94, topPassage: "§1.1 Linear state vectors |ψ⟩..." },
    { query: "Can Bell pairs teleport qubits?", topScore: 0.95, secondScore: 0.89, topPassage: "§1.3 Non-local entanglement..." },
  ];

  // Card 3: Adaptive Leitner Interactive Simulation
  const [leitnerInterval, setLeitnerInterval] = useState<number>(4);
  const [leitnerRetention, setLeitnerRetention] = useState<number>(94.2);
  const [leitnerCards, setLeitnerCards] = useState<number>(28);

  const simulateReview = () => {
    setLeitnerInterval((prev) => (prev >= 14 ? 1 : prev + 3));
    setLeitnerRetention((prev) => (prev >= 98 ? 89.4 : +(prev + 1.4).toFixed(1)));
    setLeitnerCards((prev) => (prev >= 40 ? 18 : prev + 4));
    toast.success("Leitner repetition step simulated", {
      description: `Next review interval extended to ${leitnerInterval + 3} days.`,
    });
  };

  return (
    <section id="grounding" className="py-12 md:py-16 relative z-10 mx-auto scroll-mt-24 w-full">
      <SectionHeading
        badge="Verification Engine"
        badgeTone="slate"
        line1="Citations back to source passages,"
        line2="with exact coordinates."
        description="Every statement retains an immutable anchor back to page numbers, audio timestamps, and verifiable cosine similarity."
        align="left"
      />

      {/* Tactile Bento Grid: 20px gap, rounded-[32px]-[40px] squircles, Hero-style dark blue and amber accents */}
      <div className="grid lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
        {/* Cell 1: Neural Transcription & Waveform (Col 7) */}
        <div className="lg:col-span-7 bg-card/95 dark:bg-card/85 backdrop-blur-xl rounded-[36px] sm:rounded-[40px] border border-border/80 p-6 sm:p-8 flex flex-col justify-between shadow-[0_20px_50px_-15px_rgba(15,23,42,0.08)] dark:shadow-[0_22px_55px_-15px_rgba(0,0,0,0.55)] hover:border-slate-800/40 dark:hover:border-blue-500/30 transition-all duration-300 relative overflow-hidden group min-h-[500px]">
          {/* Subtle interior luminous aura - Hero dark blue & warm amber */}
          <div className="pointer-events-none absolute -top-24 -right-24 size-64 bg-slate-900/5 dark:bg-blue-950/35 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-500" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 size-52 bg-amber-500/10 dark:bg-amber-500/15 rounded-full blur-3xl" />

          {/* Floating Confetti Accents (Hero-style) */}
          <div className="absolute top-6 right-28 size-3.5 rotate-45 bg-amber-400/80 rounded-xs shadow-xs hidden sm:block pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base sm:text-lg font-bold text-foreground font-display">
                Acoustic transcriptions with word-level alignment
              </h3>
              <span className="px-3 py-1 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-950 text-xs font-mono font-semibold shrink-0 shadow-xs">
                ASR 16kHz
              </span>
            </div>
            <p className="text-[13.5px] leading-relaxed text-muted-foreground mb-6 max-w-xl">
              Whisper neural models isolate multi-speaker conversations from lectures and audiobooks, indexing each statement to precise audio millisecond marks.
            </p>
          </div>

          {/* Waveform Console - Tactile Dark Blue & Obsidian Stage matching the Hero's bottom dock */}
          <div className="p-5 sm:p-6 rounded-[28px] sm:rounded-[32px] bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 dark:from-zinc-950 dark:via-zinc-900 dark:to-blue-950/80 text-white border border-blue-900/30 shadow-[0_16px_36px_-10px_rgba(15,23,42,0.5)] relative overflow-hidden z-10 mt-auto">
            {/* Ambient amber disk */}
            <div
              className="absolute -top-12 -right-12 size-40 pointer-events-none opacity-20"
              style={{
                background: "radial-gradient(circle, rgba(245,158,11,0.6) 0%, transparent 70%)",
              }}
            />

            <div className="flex items-center justify-between text-xs font-mono text-slate-300 mb-3.5 relative z-10">
              <span className="flex items-center gap-2 text-white font-medium">
                <span className="size-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_#f59e0b]" /> Live ASR Diarization
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-md text-slate-200 border border-white/15 text-[11px] font-medium">
                16 kHz • 24-bit PCM
              </span>
            </div>

            {/* Visualizer bars - Rich dark blue to amber peaks */}
            <div className="h-20 sm:h-24 flex items-center justify-between gap-1.5 px-1 relative z-10">
              {[40, 65, 80, 45, 90, 75, 30, 85, 95, 60, 40, 70, 85, 100, 50, 65, 80, 45, 60, 90, 75, 35, 55, 70].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 bg-gradient-to-t from-blue-700 via-blue-500 to-amber-300 rounded-full opacity-85 hover:opacity-100 transition-all duration-300 shadow-[0_0_8px_rgba(59,130,246,0.3)]"
                  style={{
                    height: `${Math.max(16, (h * ((i + activeSpeakerIdx) % 4 + 1)) / 4)}%`,
                  }}
                />
              ))}
            </div>

            {/* Active Speaker Snippet - Frosted Overlay Pill */}
            <div className="mt-4 pt-3.5 border-t border-white/10 flex items-center justify-between text-xs relative z-10">
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <span className="px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-bold text-xs font-mono shadow-xs shrink-0 select-none">
                  {speakers[activeSpeakerIdx].name}
                </span>
                <span className="text-slate-200 truncate font-medium">
                  "{speakers[activeSpeakerIdx].text}"
                </span>
              </div>
              <span className="font-mono text-xs text-slate-300 font-semibold px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15 tabular-nums shrink-0">
                {speakers[activeSpeakerIdx].timestamp}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: 2 Stacked Cards (Col 5) */}
        <div className="lg:col-span-5 flex flex-col gap-5 sm:gap-6">
          {/* Cell 2: Cosine Similarity Scoring with Dynamic Re-ranking */}
          <div className="bg-card/95 dark:bg-card/85 backdrop-blur-xl rounded-[32px] sm:rounded-[36px] border border-border/80 p-6 sm:p-7 shadow-[0_18px_45px_-12px_rgba(15,23,42,0.06)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.45)] hover:border-slate-800/40 dark:hover:border-blue-500/30 transition-all duration-300 relative overflow-hidden group">
            {/* Subtle interior luminous aura - Warm Amber */}
            <div className="pointer-events-none absolute -bottom-20 -right-20 size-48 bg-amber-500/10 dark:bg-amber-500/15 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-500" />

            <div className="relative z-10 mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-bold text-foreground font-display">
                  Cosine similarity ranking
                </h3>
                <button
                  type="button"
                  onClick={() => setSimQueryIdx((prev) => (prev + 1) % queries.length)}
                  className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-950 border border-transparent shadow-xs transition-all cursor-pointer active:scale-95"
                >
                  Rotate query ↻
                </button>
              </div>
              <p className="text-[13px] leading-relaxed text-muted-foreground">
                Incoming queries compute dense vector embeddings, retrieving matched source fragments with transparent certainty scores.
              </p>
            </div>

            <div className="space-y-3.5 bg-muted/40 dark:bg-muted/20 p-4 sm:p-5 rounded-[24px] border border-border/70 text-xs backdrop-blur-xs relative z-10">
              <div className="text-xs text-muted-foreground pb-2 border-b border-border/60 flex items-center justify-between font-mono">
                <span>Query vector</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-900/5 text-slate-900 dark:bg-white/10 dark:text-white font-semibold border border-slate-900/15 dark:border-white/15">
                  Dim 1536
                </span>
              </div>
              
              {/* Query Input Pill - Refined, balanced styling */}
              <div className="p-3 sm:p-3.5 rounded-[18px] bg-card/90 dark:bg-card border border-border/80 text-xs text-foreground font-medium flex items-center justify-between gap-2.5 shadow-2xs">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="size-2 rounded-full bg-amber-400 animate-pulse shrink-0 shadow-[0_0_6px_#f59e0b]" />
                  <span className="truncate text-foreground font-medium">"{queries[simQueryIdx].query}"</span>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-900 text-white dark:bg-white dark:text-slate-950 shrink-0">
                  vec(q)
                </span>
              </div>

              {/* Progress similarity bars - Ample vertical spacing and no clipping */}
              <div className="space-y-3 pt-1 font-mono text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="truncate max-w-[210px] text-foreground font-medium" title={queries[simQueryIdx].topPassage}>
                      {queries[simQueryIdx].topPassage}
                    </span>
                    <span className="text-slate-900 dark:text-blue-300 font-bold tabular-nums">
                      {queries[simQueryIdx].topScore}
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                    <motion.div
                      key={`top-${simQueryIdx}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${queries[simQueryIdx].topScore * 100}%` }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-slate-900 via-blue-900 to-blue-700 dark:from-blue-600 dark:to-indigo-400 rounded-full"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5 text-muted-foreground">
                    <span className="truncate max-w-[210px]" title="§2.1 Secondary baseline comparison">
                      §2.1 Secondary baseline...
                    </span>
                    <span className="tabular-nums font-semibold">{queries[simQueryIdx].secondScore}</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <motion.div
                      key={`sec-${simQueryIdx}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${queries[simQueryIdx].secondScore * 100}%` }}
                      transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
                      className="h-full bg-muted-foreground/30 rounded-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cell 3: Spaced Repetition Interactive Simulation */}
          <div className="bg-card/95 dark:bg-card/85 backdrop-blur-xl rounded-[32px] sm:rounded-[36px] border border-border/80 p-6 sm:p-7 shadow-[0_18px_45px_-12px_rgba(15,23,42,0.06)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.45)] hover:border-slate-800/40 dark:hover:border-blue-500/30 transition-all duration-300 relative overflow-hidden group">
            {/* Subtle interior luminous aura - Hero dark blue */}
            <div className="pointer-events-none absolute -top-20 -left-20 size-48 bg-slate-900/5 dark:bg-blue-950/30 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-500" />

            <div className="relative z-10 mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-bold text-foreground font-display">
                  Adaptive Leitner scheduling
                </h3>
                <button
                  type="button"
                  onClick={simulateReview}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-950 shadow-[0_8px_18px_-4px_rgba(15,23,42,0.35)] active:scale-95 transition-all cursor-pointer"
                >
                  <RotateCcw className="size-3" /> Simulate
                </button>
              </div>
              <p className="text-[13px] leading-relaxed text-muted-foreground">
                Surfaces challenging concepts right before memory decay occurs, reducing total review time while reinforcing long-term retention.
              </p>
            </div>

            {/* 3 Tactile Metric Pods (matching Hero satellite buttons) */}
            <div className="grid grid-cols-3 gap-2.5 text-center text-xs relative z-10">
              <div className="p-3.5 sm:p-4 rounded-[22px] bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10 shadow-xs hover:-translate-y-0.5 transition-transform">
                <span className="text-muted-foreground block text-[11px] mb-0.5 font-medium">Interval</span>
                <motion.span
                  key={leitnerInterval}
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="font-bold text-slate-950 dark:text-blue-300 tabular-nums text-lg sm:text-xl block font-display"
                >
                  {leitnerInterval}d
                </motion.span>
              </div>
              <div className="p-3.5 sm:p-4 rounded-[22px] bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10 shadow-xs hover:-translate-y-0.5 transition-transform">
                <span className="text-muted-foreground block text-[11px] mb-0.5 font-medium">Retention</span>
                <motion.span
                  key={leitnerRetention}
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="font-bold text-slate-950 dark:text-white tabular-nums text-lg sm:text-xl block font-display"
                >
                  {leitnerRetention}%
                </motion.span>
              </div>
              <div className="p-3.5 sm:p-4 rounded-[22px] bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10 shadow-xs hover:-translate-y-0.5 transition-transform">
                <span className="text-muted-foreground block text-[11px] mb-0.5 font-medium">Decks</span>
                <motion.span
                  key={leitnerCards}
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="font-bold text-slate-950 dark:text-white tabular-nums text-lg sm:text-xl block font-display"
                >
                  {leitnerCards}
                </motion.span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
