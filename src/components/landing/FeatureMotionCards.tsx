"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Mic, ArrowRight, RotateCcw, Sparkles } from "lucide-react";
import { toast } from "sonner";

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
    toast.success("Leitner Repetition Step Simulated", {
      description: `Next review interval extended to ${leitnerInterval + 3} days.`,
    });
  };

  return (
    <section id="grounding" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 relative z-10 max-w-7xl mx-auto scroll-mt-24 w-full">
      <div className="text-left max-w-2xl mb-12">
        <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/25 text-xs font-mono text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.12)] mb-3">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
          </span>
          <span>GROUNDED, NOT ASSERTED</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-display font-medium text-foreground tracking-tight leading-tight">
          Citations back to source passages with exact coordinates
        </h2>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
          Every statement retains an immutable anchor back to page numbers, audio timestamps, and verifiable cosine similarity.
        </p>
      </div>

      {/* Bento Grid: 3 Rich Motion Cells */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Cell 1: Neural Transcription & Waveform (Col 7) */}
        <div className="lg:col-span-7 bg-card rounded-3xl border border-border p-6 sm:p-8 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-display font-medium text-foreground">
                Acoustic transcriptions with word-level alignment
              </h3>
              <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.15)]">
                <Mic className="h-4 w-4" />
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-lg mb-6">
              Whisper neural models isolate multi-speaker conversations from lectures and audiobooks, indexing each statement to precise audio millisecond marks.
            </p>
          </div>

          {/* Animated Waveform Motion Visual with Aurora Gradient */}
          <div className="my-3 p-4 rounded-2xl bg-accent/30 border border-border">
            <div className="flex items-center justify-between text-xs font-mono text-muted-foreground mb-2">
              <span className="flex items-center gap-1.5 text-foreground font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live ASR Diarization Waveform
              </span>
              <span className="text-cyan-400 font-bold">16 kHz Mono</span>
            </div>

            <div className="h-14 flex items-end gap-1.5 px-1 justify-between">
              {[25, 45, 65, 30, 85, 95, 55, 40, 75, 90, 60, 35, 70, 80, 50, 65, 40, 85, 30, 60, 95, 45, 75, 55].map((val, idx) => (
                <motion.div
                  key={idx}
                  animate={{
                    height: [`${Math.max(15, val * 0.3)}%`, `${val}%`, `${Math.max(10, val * 0.25)}%`]
                  }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    repeatType: "reverse",
                    delay: (idx % 8) * 0.1,
                  }}
                  className="w-1.5 bg-gradient-to-t from-cyan-500 via-teal-400 to-emerald-400 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.2)]"
                />
              ))}
            </div>
          </div>

          {/* Diarization Excerpt Box with Pulsing Active Speaker */}
          <div className="rounded-2xl bg-accent/50 border border-border p-4 space-y-2.5 font-mono text-xs text-foreground mt-2">
            <div className="flex items-center justify-between pb-2 border-b border-border text-xs text-muted-foreground">
              <span>SPEAKER DIARIZATION</span>
              <span>TIMESTAMP</span>
            </div>
            {speakers.map((spk, idx) => {
              const isActive = activeSpeakerIdx === idx;
              return (
                <motion.div
                  key={idx}
                  animate={{ opacity: isActive ? 1 : 0.6 }}
                  className={`flex items-center justify-between p-2 rounded-lg transition-all ${
                    isActive ? "bg-card border border-primary/30 shadow-2xs" : ""
                  }`}
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                      spk.name === "Clara" 
                        ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20" 
                        : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    }`}>
                      {spk.name}
                    </span>
                    <span className="truncate text-xs">"{spk.text}"</span>
                  </div>
                  <span className="text-muted-foreground tabular-nums shrink-0">{spk.timestamp}</span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Right Column: 2 Stacked Cards (Col 5) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Cell 2: Cosine Similarity Scoring with Dynamic Re-ranking */}
          <div className="bg-card rounded-3xl border border-border p-6 flex-1 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-display font-medium text-foreground">
                  Cosine similarity ranking
                </h3>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 hidden sm:inline-block">
                    Interactive
                  </span>
                  <button
                    type="button"
                    aria-label="Rotate sample query to test dynamic re-ranking"
                    title="Rotate sample query"
                    onClick={() => setSimQueryIdx((prev) => (prev + 1) % queries.length)}
                    className="text-xs font-mono px-2.5 py-1 rounded-full bg-accent hover:bg-card border border-border transition-colors cursor-pointer"
                  >
                    Rotate query ↻
                  </button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                Incoming queries compute dense vector embeddings, retrieving matched source fragments with transparent certainty scores.
              </p>
            </div>

            <div className="space-y-3 bg-accent/40 p-4 rounded-2xl border border-border font-mono text-xs">
              <div className="text-xs text-muted-foreground pb-2 border-b border-border flex items-center justify-between">
                <span>QUERY VECTOR</span>
                <span className="text-primary font-bold">DIM 1536</span>
              </div>
              
              <div className="p-2 rounded bg-card border border-border text-xs text-foreground font-semibold flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-primary" />
                <span className="truncate">"{queries[simQueryIdx].query}"</span>
              </div>

              {/* Progress similarity bars */}
              <div className="space-y-2 pt-1">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span 
                      className="truncate max-w-[240px] sm:max-w-xs text-foreground"
                      title={queries[simQueryIdx].topPassage}
                    >
                      {queries[simQueryIdx].topPassage}
                    </span>
                    <span className="text-emerald-400 font-bold tabular-nums">
                      {queries[simQueryIdx].topScore}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-accent rounded-full overflow-hidden p-0.5">
                    <motion.div
                      key={`top-${simQueryIdx}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${queries[simQueryIdx].topScore * 100}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1 text-muted-foreground">
                    <span 
                      className="truncate max-w-[240px] sm:max-w-xs"
                      title="§2.1 Secondary baseline comparison"
                    >
                      §2.1 Secondary baseline...
                    </span>
                    <span className="tabular-nums">{queries[simQueryIdx].secondScore}</span>
                  </div>
                  <div className="h-1.5 w-full bg-accent rounded-full overflow-hidden">
                    <motion.div
                      key={`sec-${simQueryIdx}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${queries[simQueryIdx].secondScore * 100}%` }}
                      transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
                      className="h-full bg-muted-foreground/40 rounded-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cell 3: Spaced Repetition Interactive Simulation */}
          <div className="bg-card rounded-3xl border border-border p-6 flex-1 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-display font-medium text-foreground">
                  Adaptive Leitner scheduling
                </h3>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 hidden sm:inline-block">
                    Interactive
                  </span>
                  <button
                    type="button"
                    aria-label="Simulate spaced-repetition review step"
                    title="Simulate spaced-repetition review step"
                    onClick={simulateReview}
                    className="inline-flex items-center gap-1 text-xs font-mono px-3 py-1 rounded-full bg-amber-400 hover:bg-amber-300 text-black font-semibold shadow-[0_0_15px_rgba(245,158,11,0.25)] transition-all cursor-pointer"
                  >
                    <RotateCcw className="h-3 w-3" /> Simulate Review
                  </button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                Surfaces challenging concepts right before memory decay occurs, reducing total review time while reinforcing long-term retention.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2.5 text-center font-mono text-xs">
              <div className="p-3 rounded-2xl bg-amber-950/25 border border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.06)]">
                <span className="text-amber-400/80 block text-xs mb-1 font-semibold">INTERVAL</span>
                <motion.span
                  key={leitnerInterval}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="font-bold text-amber-300 tabular-nums text-sm block"
                >
                  {leitnerInterval} Days
                </motion.span>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-950/25 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.06)]">
                <span className="text-emerald-400/80 block text-xs mb-1 font-semibold">RETENTION</span>
                <motion.span
                  key={leitnerRetention}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="font-bold text-emerald-300 tabular-nums text-sm block"
                >
                  {leitnerRetention}%
                </motion.span>
              </div>
              <div className="p-3 rounded-2xl bg-violet-950/25 border border-violet-500/30 shadow-[0_0_12px_rgba(139,92,246,0.06)]">
                <span className="text-violet-400/80 block text-xs mb-1 font-semibold">DECKS</span>
                <motion.span
                  key={leitnerCards}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="font-bold text-violet-300 tabular-nums text-sm block"
                >
                  {leitnerCards} Cards
                </motion.span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
