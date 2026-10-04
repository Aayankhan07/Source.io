"use client";

import { SectionHeading } from "./SectionHeading";

const STAGES = [
  {
    title: "Parse & extract",
    desc: "Drop in files or URLs. Neural OCR and Whisper ASR transcribe texts and audio timestamps with high fidelity.",
    metric: "OCR + Whisper ASR",
  },
  {
    title: "Structure notes",
    desc: "Synthesizes hierarchical markdown outlines, mathematical equations, and core definitions into study notes.",
    metric: "Structured markdown",
  },
  {
    title: "Derive practice",
    desc: "Generates active spaced flashcard decks (Leitner algorithm), comprehension quizzes, and two-host conversational recaps.",
    metric: "Leitner decks & quiz",
  },
  {
    title: "Query citations",
    desc: "Engage in grounded conversation where every statement points back to the exact passage and audio coordinate.",
    metric: "Coordinate citations",
  },
];

export function KnowledgePipeline() {
  return (
    <section id="pipeline" className="py-12 md:py-16 relative z-10 mx-auto scroll-mt-24 w-full">
      <SectionHeading
        badge="Pipeline Architecture"
        badgeTone="amber"
        line1="From raw multimedia,"
        line2="to complete comprehension."
        description="A continuous four-stage pipeline that extracts, structures, and cross-references study materials."
        align="center"
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 text-left">
        {STAGES.map((stage, idx) => {
          const auraColors = [
            "bg-cyan-500/10 dark:bg-cyan-500/15",
            "bg-amber-500/10 dark:bg-amber-500/15",
            "bg-cyan-500/10 dark:bg-cyan-500/15",
            "bg-amber-500/10 dark:bg-amber-500/15",
          ];
          return (
            <div 
              key={stage.title}
              className="bg-card/95 dark:bg-card/85 backdrop-blur-xl rounded-[30px] sm:rounded-[34px] border border-border/80 hover:border-cyan-500/40 p-6 sm:p-7 flex flex-col justify-between shadow-[0_16px_40px_-10px_rgba(0,0,0,0.06)] dark:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.45)] hover:-translate-y-1.5 transition-all duration-300 relative overflow-hidden group"
            >
              {/* Subtle luminous halo */}
              <div 
                className={`pointer-events-none absolute -top-16 -right-16 size-36 ${auraColors[idx % auraColors.length]} rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500`}
                aria-hidden="true"
              />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-5">
                  <span className="text-2xl font-bold font-mono text-foreground/90 tracking-tight">
                    0{idx + 1}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-muted/60 dark:bg-muted/40 border border-border/70 text-muted-foreground font-mono text-[11px] font-medium">
                    Step {idx + 1} of 4
                  </span>
                </div>
                <h3 className="text-base font-bold text-foreground font-display mb-2">{stage.title}</h3>
                <p className="text-[13px] leading-relaxed text-muted-foreground">{stage.desc}</p>
              </div>

              <div className="pt-4 mt-6 border-t border-border/60 text-xs font-mono text-muted-foreground flex items-center justify-between relative z-10">
                <span className="px-2.5 py-0.5 rounded-full bg-muted/50 border border-border/60 text-[11px] font-medium">{stage.metric}</span>
                <span className="size-2 rounded-full bg-cyan-500 dark:bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]" aria-hidden="true" />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
