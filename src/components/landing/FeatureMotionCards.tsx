"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { ShieldCheck, FileText, CheckCircle2, Lock } from "lucide-react";
import { SectionHeading } from "./SectionHeading";

export function FeatureMotionCards() {
  // Card 1: Acoustic Diarization & Waveform State
  const [activeSpeakerIdx, setActiveSpeakerIdx] = useState<number>(0);
  const speakers = [
    { name: "Prof. Clara", text: "Superposition allows linear state combinations |ψ⟩ = α|0⟩ + β|1⟩...", timestamp: "01:14" },
    { name: "Dr. Julian", text: "Evaluating multi-path algorithms simultaneously prior to collapse...", timestamp: "01:28" },
    { name: "Prof. Clara", text: "Until projective physical measurement forces wave function reduction.", timestamp: "01:42" }
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

  return (
    <section id="verification" className="py-12 md:py-16 relative z-10 mx-auto scroll-mt-24 w-full">
      <SectionHeading
        badge="Verifiable Grounding"
        badgeTone="blue"
        line1="Every important answer"
        line2="points back to the source."
        description="Source.io transforms complex material into active-learning tools while preserving a traceable link to the original page, paragraph, or audio timestamp."
        align="left"
      />

      {/* Tactile Bento Grid: 20px gap, rounded-[32px]-[40px] squircles */}
      <div className="grid lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
        {/* Cell 1: Neural Transcription & Audio Timestamps (Col 7) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900/90 rounded-[32px] sm:rounded-[36px] border border-slate-200 dark:border-white/10 p-6 sm:p-8 flex flex-col justify-between shadow-tactile-card hover:border-slate-300 dark:hover:border-white/20 transition-all duration-200 relative overflow-hidden group min-h-[460px]">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-display">
                Audio timestamp citations
              </h3>
              <span className="px-3 py-1 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-950 text-xs font-mono font-semibold shrink-0 shadow-xs">
                Timestamp sync
              </span>
            </div>
            <p className="text-[13.5px] leading-relaxed text-slate-600 dark:text-slate-300 mb-6 max-w-xl">
              Recorded lectures and audiobooks are indexed to exact millisecond marks. Every spoken concept in your summary links directly to that moment in the audio.
            </p>
          </div>

          {/* Waveform Console */}
          <div className="p-5 sm:p-6 rounded-[24px] sm:rounded-[28px] bg-slate-950 text-white border border-slate-800 shadow-xl relative overflow-hidden z-10 mt-auto">
            <div className="flex items-center justify-between text-xs font-mono text-slate-300 mb-3.5 relative z-10">
              <span className="flex items-center gap-2 text-white font-medium">
                <span className="size-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
                Synchronized Lecture Playback
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-slate-200 border border-white/15 text-[11px] font-medium">
                12:15 total duration
              </span>
            </div>

            {/* Visualizer bars */}
            <div className="h-16 sm:h-20 flex items-center justify-between gap-1.5 px-1 relative z-10">
              {[40, 65, 80, 45, 90, 75, 30, 85, 95, 60, 40, 70, 85, 100, 50, 65, 80, 45, 60, 90, 75, 35, 55, 70].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 bg-gradient-to-t from-sky-600 to-emerald-300 rounded-full opacity-85 transition-all duration-300"
                  style={{
                    height: `${Math.max(16, (h * ((i + activeSpeakerIdx) % 4 + 1)) / 4)}%`,
                  }}
                />
              ))}
            </div>

            {/* Active Speaker Snippet */}
            <div className="mt-4 pt-3.5 border-t border-white/10 flex items-center justify-between text-xs relative z-10">
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-400 text-slate-950 font-bold text-xs font-mono shadow-xs shrink-0 select-none">
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
          {/* Cell 2: Page & Paragraph Citations with Dynamic Re-ranking */}
          <div className="bg-white dark:bg-slate-900/90 rounded-[28px] sm:rounded-[32px] border border-slate-200 dark:border-white/10 p-6 sm:p-7 shadow-tactile-card hover:border-slate-300 dark:hover:border-white/20 transition-all duration-200 relative overflow-hidden group">
            <div className="relative z-10 mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                  Page-level citations
                </h3>
                <button
                  type="button"
                  onClick={() => setSimQueryIdx((prev) => (prev + 1) % queries.length)}
                  className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-950 shadow-xs transition-all cursor-pointer active:scale-95"
                >
                  Rotate query ↻
                </button>
              </div>
              <p className="text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">
                Every generated statement computes similarity against your source text, linking back to the exact page and paragraph.
              </p>
            </div>

            {/* Interactive Query Card */}
            <div className="p-4 rounded-[20px] bg-slate-50 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 text-xs font-mono relative z-10 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Query test:</span>
                <span className="text-primary font-bold">{queries[simQueryIdx].topScore * 100}% cosine score</span>
              </div>
              <p className="font-semibold text-slate-900 dark:text-white font-sans text-xs">
                "{queries[simQueryIdx].query}"
              </p>
              <div className="pt-2 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-[11px]">
                <span className="text-slate-600 dark:text-slate-300">{queries[simQueryIdx].topPassage}</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                  Verified
                </span>
              </div>
            </div>
          </div>

          {/* Cell 3: Strict Zero-Data Retention & Privacy Guarantee */}
          <div className="bg-white dark:bg-slate-900/90 rounded-[28px] sm:rounded-[32px] border border-slate-200 dark:border-white/10 p-6 sm:p-7 shadow-tactile-card hover:border-slate-300 dark:hover:border-white/20 transition-all duration-200 relative overflow-hidden group">
            <div className="relative z-10 mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
                  <ShieldCheck className="size-5 text-emerald-500" />
                  <span>Zero-data retention</span>
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-semibold">
                  Privacy guarantee
                </span>
              </div>
              <p className="text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">
                Your research papers, thesis drafts, and confidential lecture notes are processed in isolated sessions. Never used to train AI models.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs relative z-10">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10">
                <Lock className="size-4 text-slate-700 dark:text-slate-300 mx-auto mb-1" />
                <span className="text-[11px] font-semibold text-slate-900 dark:text-white block">No Training</span>
                <span className="text-[10px] text-slate-500">100% Private</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10">
                <FileText className="size-4 text-slate-700 dark:text-slate-300 mx-auto mb-1" />
                <span className="text-[11px] font-semibold text-slate-900 dark:text-white block">Isolated</span>
                <span className="text-[10px] text-slate-500">Per-Session RLS</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10">
                <CheckCircle2 className="size-4 text-emerald-500 mx-auto mb-1" />
                <span className="text-[11px] font-semibold text-slate-900 dark:text-white block">Your Data</span>
                <span className="text-[10px] text-slate-500">Always Yours</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
