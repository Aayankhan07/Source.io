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
    <section id="pipeline" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 relative z-10 max-w-7xl mx-auto scroll-mt-24 border-t border-border/80 w-full">
      <div className="text-center max-w-xl mx-auto mb-14">
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
              className="bg-card/90 rounded-2xl border border-border/80 p-6 flex flex-col justify-between shadow-xs hover:border-primary/40 transition-all duration-200"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-muted-foreground font-mono text-xs font-semibold tabular-nums">
                    Stage 0{idx + 1}
                  </span>
                  <div className="h-7 w-7 rounded-lg bg-accent flex items-center justify-center text-primary">
                    <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
                  </div>
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">{stage.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{stage.desc}</p>
              </div>

              <div className="pt-4 mt-6 border-t border-border/70 text-xs font-mono text-muted-foreground flex items-center justify-between">
                <span>{stage.metric}</span>
                <span className="h-1.5 w-1.5 rounded-full bg-primary/60" />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
