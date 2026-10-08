"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { SectionHeading } from "./SectionHeading";

const STAGES = [
  {
    step: "Step 1",
    title: "Upload your source",
    desc: "Drop in textbooks, research papers, lecture recordings, or web links. Speech-to-text and OCR parse content into clean text.",
    metric: "Text, audio & LaTeX extracted",
  },
  {
    step: "Step 2",
    title: "Extract and structure",
    desc: "Key concepts, core definitions, and mathematical equations are organized into clean, hierarchical outlines.",
    metric: "Hierarchical outlines",
  },
  {
    step: "Step 3",
    title: "Generate study materials",
    desc: "Derives structured notes, spaced repetition flashcard decks, practice quizzes, and 2-host conversational recaps.",
    metric: "5 coordinated modes",
  },
  {
    step: "Step 4",
    title: "Review answers with citations",
    desc: "Every note passage, flashcard answer, and quiz solution points back to the exact page number, paragraph, or audio timestamp.",
    metric: "Verified page & audio citations",
  },
];

export function KnowledgePipeline() {
  const shouldReduceMotion = useReducedMotion();

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.1,
        delayChildren: shouldReduceMotion ? 0 : 0.05,
      },
    },
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 22 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { 
        duration: shouldReduceMotion ? 0.25 : 0.6, 
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number] 
      },
    },
  };
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

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 text-left"
      >
        {STAGES.map((stage) => {
          return (
            <motion.div 
              key={stage.title}
              variants={cardVariants}
              onMouseMove={(e) => {
                if (shouldReduceMotion) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                e.currentTarget.style.setProperty("--mouse-x", `${x}px`);
                e.currentTarget.style.setProperty("--mouse-y", `${y}px`);
              }}
              className="bg-white dark:bg-slate-900/90 rounded-[28px] sm:rounded-[32px] border border-black/[0.06] dark:border-white/10 p-6 sm:p-7 flex flex-col justify-between shadow-tactile-card hover:shadow-tactile-dock hover:-translate-y-1.5 transition-all duration-300 relative overflow-hidden group cursor-default"
            >
              {/* Interactive Spotlight Hover Glow */}
              <div 
                className="pointer-events-none absolute -inset-px rounded-[28px] sm:rounded-[32px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-0"
                style={{
                  background: "radial-gradient(400px circle at var(--mouse-x, 100px) var(--mouse-y, 100px), rgba(14, 165, 233, 0.08), transparent 70%)"
                }}
              />

              <div className="relative z-10">
                <div className="mb-4">
                  <span className="inline-block text-lg sm:text-xl font-extrabold font-display text-slate-900 dark:text-white tracking-tight">
                    {stage.step}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-display mb-2.5 leading-snug">
                  {stage.title}
                </h3>
                <p className="text-[13.5px] leading-relaxed text-slate-600 dark:text-slate-300">
                  {stage.desc}
                </p>
              </div>

              <div className="pt-4 mt-6 border-t border-slate-100 dark:border-white/10 relative z-10">
                <span className="inline-block px-3 py-1.5 rounded-full bg-slate-50 dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/10 text-xs font-mono font-medium text-slate-700 dark:text-slate-300 shadow-2xs">
                  {stage.metric}
                </span>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}
