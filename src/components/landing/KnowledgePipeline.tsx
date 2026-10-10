"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import { UploadCloud, Layers, Cpu, BookmarkCheck, ArrowRight } from "lucide-react";
import { SectionHeading } from "./SectionHeading";

const STAGES = [
  {
    step: "01",
    label: "Ingestion",
    title: "Upload your source",
    desc: "Drop in textbooks, research papers, lecture recordings, or web links. Speech-to-text and OCR parse content into clean text.",
    metric: "PDF, Audio & LaTeX",
    icon: UploadCloud,
  },
  {
    step: "02",
    label: "Structure",
    title: "Extract and structure",
    desc: "Key concepts, core definitions, and mathematical equations are organized into clean, hierarchical outlines.",
    metric: "Vector Chunking",
    icon: Layers,
  },
  {
    step: "03",
    label: "Synthesis",
    title: "Generate study modes",
    desc: "Derives structured notes, spaced repetition flashcard decks, practice quizzes, and 2-host conversational recaps.",
    metric: "5 Coordinated Modes",
    icon: Cpu,
  },
  {
    step: "04",
    label: "Verification",
    title: "Cite every answer",
    desc: "Every note passage, flashcard answer, and quiz solution points back to the exact page number, paragraph, or audio timestamp.",
    metric: "Verified Coordinates",
    icon: BookmarkCheck,
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

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 18 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0.25 : 0.6,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      },
    },
  };

  return (
    <section id="how-it-works" className="py-12 sm:py-20 relative z-10 mx-auto scroll-mt-24 w-full">
      <SectionHeading
        badge="How It Works"
        badgeTone="blue"
        line1="From source material to active learning"
        line2="in four continuous steps."
        description="Upload your material once. Source.io extracts structure, derives practice tools, and preserves exact citations."
        align="center"
      />

      {/* Horizontal Continuous Pipeline Timeline */}
      <div className="mt-12 sm:mt-16">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative text-left"
        >
          {STAGES.map((stage, idx) => {
            const Icon = stage.icon;
            const isLast = idx === STAGES.length - 1;
            return (
              <motion.div
                key={stage.step}
                variants={itemVariants}
                className="group relative flex flex-col justify-between p-6 sm:p-7 rounded-[28px] bg-white border border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_36px_rgba(0,0,0,0.07)] hover:border-sky-500/40 transition-all duration-300"
              >
                <div>
                  {/* Connector Bridge to next card (Desktop only) */}
                  {!isLast && (
                    <div 
                      className="hidden lg:block absolute top-[44px] -right-[26px] w-[28px] z-20 pointer-events-none" 
                      aria-hidden="true"
                    >
                      <div className="w-full h-[2px] bg-gradient-to-r from-slate-300 to-slate-200" />
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-1.5 rounded-full bg-sky-500 ring-2 ring-white" />
                    </div>
                  )}

                  {/* Step Header */}
                  <div className="flex items-center justify-between mb-6">
                    {/* Node Icon */}
                    <div className="size-13 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-900 group-hover:bg-sky-50 group-hover:border-sky-500/50 group-hover:scale-105 transition-all duration-200 shadow-xs">
                      <Icon className="size-6 text-slate-700 group-hover:text-sky-600 transition-colors" />
                    </div>

                    {/* Step Number */}
                    <span className="font-mono text-3xl font-extrabold text-slate-200 select-none tracking-tighter group-hover:text-sky-500/30 transition-colors">
                      {stage.step}
                    </span>
                  </div>

                  {/* Step Label */}
                  <p className="text-[11px] font-mono uppercase tracking-widest text-sky-600 font-bold mb-1.5">
                    {stage.label}
                  </p>

                  {/* Title */}
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 font-display mb-2.5 leading-snug">
                    {stage.title}
                  </h3>

                  {/* Description */}
                  <p className="text-xs sm:text-[13px] leading-relaxed text-slate-600">
                    {stage.desc}
                  </p>
                </div>

                {/* Bottom Metric Tag */}
                <div className="pt-5 mt-6 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-500 font-medium">
                    {stage.metric}
                  </span>
                  <ArrowRight className="size-3.5 text-slate-400 group-hover:text-sky-500 group-hover:translate-x-1 transition-all" />
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
