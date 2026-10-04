"use client";

import { FileText, Sparkles, Layers, ShieldCheck } from "lucide-react";

const STAGES = [
  {
    title: "Parse & Extract",
    desc: "Drop in files or URLs. Local neural OCR and Whisper transcribe texts and audio timestamps with zero cloud leakage.",
    metric: "OCR + Whisper ASR",
    icon: FileText,
  },
  {
    title: "Structure Notes",
    desc: "Synthesizes hierarchical markdown outlines, mathematical equations, and core definitions into study notes.",
    metric: "Markdown Outlines",
    icon: Sparkles,
  },
  {
    title: "Derive Practice",
    desc: "Generates active spaced flashcard decks (Leitner algorithm), comprehension quizzes, and two-host conversational recaps.",
    metric: "Leitner Decks",
    icon: Layers,
  },
  {
    title: "Query Citations",
    desc: "Engage in grounded conversation where every statement points back to the exact passage and timestamp.",
    metric: "Coordinate Citations",
    icon: ShieldCheck,
  },
];

export function KnowledgePipeline() {
  return (
    <section id="pipeline" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 relative z-10 max-w-7xl mx-auto scroll-mt-24 border-t border-slate-200/80 dark:border-border/80 w-full">
      <div className="text-center max-w-xl mx-auto mb-14">
        <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-full bg-cyan-500/10 dark:bg-cyan-950/40 border border-cyan-500/30 dark:border-cyan-500/25 text-xs font-mono text-cyan-800 dark:text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.12)] mb-3">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
          </span>
          <span>4-STAGE INGEST ENGINE</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-display font-medium text-foreground tracking-tight mb-2">
          From raw media to complete comprehension
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          A continuous four-stage pipeline that operates without manual prompt tinkering.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
        {STAGES.map((stage, idx) => {
          const Icon = stage.icon;
          return (
            <div 
              key={stage.title}
              className="bg-card/90 rounded-2xl border border-slate-200/90 dark:border-border/80 hover:border-cyan-500/40 hover:shadow-[0_0_20px_rgba(6,182,212,0.08)] p-6 flex flex-col justify-between shadow-2xs transition-all duration-200 hover:scale-[1.01] group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-slate-500 dark:text-muted-foreground group-hover:text-cyan-600 dark:group-hover:text-cyan-400 font-mono text-xs font-semibold tabular-nums transition-colors">
                    Stage 0{idx + 1}
                  </span>
                  <div className="h-8 w-8 rounded-xl border border-slate-200/90 dark:border-white/[0.08] bg-slate-100/70 dark:bg-white/[0.03] group-hover:bg-cyan-500/10 group-hover:border-cyan-500/30 text-slate-500 dark:text-zinc-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 flex items-center justify-center transition-all duration-200">
                    <Icon className="h-4 w-4" strokeWidth={1.5} />
                  </div>
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">{stage.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{stage.desc}</p>
              </div>

              <div className="pt-4 mt-6 border-t border-slate-200/80 dark:border-border/70 text-xs font-mono text-slate-500 dark:text-muted-foreground flex items-center justify-between">
                <span>{stage.metric}</span>
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-500/50 dark:bg-cyan-400/50 group-hover:bg-cyan-500 dark:group-hover:bg-cyan-400 group-hover:shadow-[0_0_8px_rgba(6,182,212,0.6)] transition-all" />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
