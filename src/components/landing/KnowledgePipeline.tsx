"use client";

import { FileText, Sparkles, Layers, ShieldCheck } from "lucide-react";

const STAGES = [
  {
    title: "Parse & Extract",
    desc: "Drop in files or URLs. Local neural OCR and Whisper transcribe texts and audio timestamps with zero cloud leakage.",
    metric: "OCR + Whisper ASR",
    icon: FileText,
    colorClass: "text-rose-400 bg-rose-500/10 border-rose-500/25",
    hoverBorder: "hover:border-rose-500/40",
    dotClass: "bg-rose-400",
  },
  {
    title: "Structure Notes",
    desc: "Synthesizes hierarchical markdown outlines, mathematical equations, and core definitions into study notes.",
    metric: "Markdown Outlines",
    icon: Sparkles,
    colorClass: "text-amber-400 bg-amber-500/10 border-amber-500/25",
    hoverBorder: "hover:border-amber-500/40",
    dotClass: "bg-amber-400",
  },
  {
    title: "Derive Practice",
    desc: "Generates active spaced flashcard decks (Leitner algorithm), comprehension quizzes, and two-host conversational recaps.",
    metric: "Leitner Decks",
    icon: Layers,
    colorClass: "text-violet-400 bg-violet-500/10 border-violet-500/25",
    hoverBorder: "hover:border-violet-500/40",
    dotClass: "bg-violet-400",
  },
  {
    title: "Query Citations",
    desc: "Engage in grounded conversation where every statement points back to the exact passage and timestamp.",
    metric: "Coordinate Citations",
    icon: ShieldCheck,
    colorClass: "text-cyan-400 bg-cyan-500/10 border-cyan-500/25",
    hoverBorder: "hover:border-cyan-500/40",
    dotClass: "bg-cyan-400",
  },
];

export function KnowledgePipeline() {
  return (
    <section id="pipeline" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 relative z-10 max-w-7xl mx-auto scroll-mt-24 border-t border-border/80 w-full">
      <div className="text-center max-w-xl mx-auto mb-14">
        <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/25 text-xs font-mono text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.12)] mb-3">
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
              className={`bg-card/90 rounded-2xl border border-border/80 p-6 flex flex-col justify-between shadow-xs transition-all duration-200 ${stage.hoverBorder} hover:scale-[1.01]`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-muted-foreground font-mono text-xs font-semibold tabular-nums">
                    Stage 0{idx + 1}
                  </span>
                  <div className={`h-8 w-8 rounded-xl border flex items-center justify-center ${stage.colorClass}`}>
                    <Icon className="h-4 w-4" strokeWidth={1.5} />
                  </div>
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">{stage.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{stage.desc}</p>
              </div>

              <div className="pt-4 mt-6 border-t border-border/70 text-xs font-mono text-muted-foreground flex items-center justify-between">
                <span>{stage.metric}</span>
                <span className={`h-2 w-2 rounded-full ${stage.dotClass} shadow-[0_0_8px_currentColor]`} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
