"use client";

import { SectionHeading } from "./SectionHeading";

const STAGES = [
  {
    step: "01",
    title: "Upload your source",
    desc: "Drop in textbooks, research papers, lecture recordings, or web links. Speech-to-text and OCR parse content into clean text.",
    metric: "Text, audio & LaTeX extracted",
  },
  {
    step: "02",
    title: "Extract and structure",
    desc: "Key concepts, core definitions, and mathematical equations are organized into clean, hierarchical outlines.",
    metric: "Hierarchical outlines",
  },
  {
    step: "03",
    title: "Generate study materials",
    desc: "Derives structured notes, spaced repetition flashcard decks, practice quizzes, and 2-host conversational recaps.",
    metric: "5 coordinated modes",
  },
  {
    step: "04",
    title: "Review answers with citations",
    desc: "Every note passage, flashcard answer, and quiz solution points back to the exact page number, paragraph, or audio timestamp.",
    metric: "Verified page & audio citations",
  },
];

export function KnowledgePipeline() {
  return (
    <section id="how-it-works" className="py-12 md:py-16 relative z-10 mx-auto scroll-mt-24 w-full">
      <SectionHeading
        badge="How It Works"
        badgeTone="blue"
        line1="From source material to active learning"
        line2="in four steps."
        description="Upload your material once. Source.io extracts structure, derives practice tools, and preserves exact citations."
        align="center"
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 text-left">
        {STAGES.map((stage) => {
          return (
            <div 
              key={stage.title}
              className="bg-white/95 dark:bg-slate-900/90 rounded-[28px] sm:rounded-[32px] border border-slate-200 dark:border-white/10 p-6 sm:p-7 flex flex-col justify-between shadow-tactile-card hover:-translate-y-1 transition-all duration-200 relative overflow-hidden group"
            >
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-5">
                  <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white tracking-tight">
                    {stage.step}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 font-mono text-[11px] font-semibold">
                    Step {stage.step} of 04
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-display mb-2">
                  {stage.title}
                </h3>
                <p className="text-[13.5px] leading-relaxed text-slate-600 dark:text-slate-300">
                  {stage.desc}
                </p>
              </div>

              <div className="pt-4 mt-6 border-t border-slate-100 dark:border-white/10 text-xs font-mono text-slate-600 dark:text-slate-400 flex items-center justify-between relative z-10">
                <span className="px-2.5 py-0.5 rounded-full bg-slate-50 dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/10 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                  {stage.metric}
                </span>
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse shadow-xs" aria-hidden="true" />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
