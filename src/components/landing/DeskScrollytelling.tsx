"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";

interface Step {
  id: number;
  tag: string;
  title: string;
  description: string;
  align: "left" | "right";
}

const steps: Step[] = [
  {
    id: 1,
    tag: "Phase 01",
    title: "The Initial Spark",
    description:
      "Every workflow begins in stillness—a cup of coffee, pen and paper, waiting for focus to set in.",
    align: "left",
  },
  {
    id: 2,
    tag: "Phase 02",
    title: "Audio Engineering",
    description:
      "Capturing raw frequencies and crafting soundscapes directly within the digital workstation.",
    align: "right",
  },
  {
    id: 3,
    tag: "Phase 03",
    title: "Deep Focus & Notes",
    description:
      "Iterating through late-night thoughts under the desk lamp, cross-referencing ideas by hand.",
    align: "left",
  },
  {
    id: 4,
    tag: "Phase 04",
    title: "The Architecture",
    description:
      "Bringing conceptual ideas to life—grounded into blueprints, physical structures, and clean form.",
    align: "right",
  },
];

export function DeskScrollytelling() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  // Framer motion scroll progress hook
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Load video metadata to get precise duration
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  // Scrub video on scroll using requestAnimationFrame for smooth 60fps rendering
  useEffect(() => {
    if (shouldReduceMotion) return;
    let animationFrameId: number;
    const unsubscribe = scrollYProgress.on("change", (latestProgress) => {
      if (!videoRef.current || duration === 0) return;
      animationFrameId = requestAnimationFrame(() => {
        if (videoRef.current) {
          // Clamp currentTime safely within bounds
          videoRef.current.currentTime = Math.min(
            Math.max(latestProgress * duration, 0),
            duration
          );
        }
      });
    });
    return () => {
      unsubscribe();
      cancelAnimationFrame(animationFrameId);
    };
  }, [scrollYProgress, duration, shouldReduceMotion]);

  if (shouldReduceMotion) {
    return (
      <div className="relative py-20 bg-slate-950 text-white px-6 md:px-20" aria-label="Desk workflow overview">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-semibold tracking-widest uppercase text-amber-400">Workflow Narrative</span>
            <h2 className="text-3xl font-bold tracking-tight">Structured Learning Stages</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {steps.map((step) => (
              <div key={step.id} className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-md">
                <span className="text-xs font-semibold tracking-widest uppercase text-amber-400 mb-2 block">{step.tag}</span>
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-sm text-zinc-300 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative h-[450dvh] bg-slate-950"
      aria-label="Desk workflow scrollytelling"
    >
      {/* Sticky Fullscreen Video Layer */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">
        <video
          ref={videoRef}
          src="/desk-pan.mp4"
          playsInline
          muted
          preload="auto"
          onLoadedMetadata={handleLoadedMetadata}
          className="absolute inset-0 h-full w-full object-cover brightness-[0.8] contrast-[1.05]"
          aria-hidden="true"
        />
        {/* Ambient Dark Gradients */}
        <div
          className="absolute inset-0 bg-radial-[circle_at_center,transparent_40%,rgba(0,0,0,0.85)_100%] pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none"
          aria-hidden="true"
        />
      </div>

      {/* Floating Story Beats Track */}
      <div className="relative -mt-[100vh] z-10 flex flex-col pointer-events-none">
        {steps.map((step, idx) => (
          <StoryCard
            key={step.id}
            step={step}
            index={idx}
            scrollYProgress={scrollYProgress}
          />
        ))}
      </div>
    </div>
  );
}

// Individual card with dynamic scroll-tied opacity and translation
function StoryCard({
  step,
  index,
  scrollYProgress,
}: {
  step: Step;
  index: number;
  scrollYProgress: any;
}) {
  // Compute window range for each section
  const start = index * 0.25;
  const peak = start + 0.12;
  const end = (index + 1) * 0.25;

  const opacity = useTransform(scrollYProgress, [start, peak, end], [0, 1, 0]);
  const translateY = useTransform(scrollYProgress, [start, peak, end], [40, 0, -40]);

  return (
    <div className="h-screen w-full flex items-center px-6 md:px-20">
      <div
        className={`w-full flex ${
          step.align === "right" ? "justify-end" : "justify-start"
        }`}
      >
        <motion.div
          style={{ opacity, y: translateY }}
          className="max-w-md w-full rounded-2xl border border-white/10 bg-slate-950/60 p-6 md:p-8 backdrop-blur-xl shadow-2xl pointer-events-auto"
        >
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-amber-400 mb-2">
            {step.tag}
          </span>
          <h3 className="text-2xl font-bold tracking-tight text-white mb-3">
            {step.title}
          </h3>
          <p className="text-sm md:text-base leading-relaxed text-zinc-300">
            {step.description}
          </p>
        </motion.div>
      </div>
    </div>
  );
}