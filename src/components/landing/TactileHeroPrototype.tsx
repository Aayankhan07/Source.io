"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useTheme } from "@/hooks/use-theme";
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  FileText,
  Layers,
  ListChecks,
  Headphones,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureMode {
  id: "notes" | "cards" | "quiz" | "podcast";
  label: string;
  tabLabel: string;
  icon: React.ElementType;
  image: string;
  objectPosition: string;
  badge: string;
  coordTitle: string;
  coordTag: string;
  coordText: string;
  coordLocation: string;
  demoQuery: string;
}

const FEATURE_MODES: FeatureMode[] = [
  {
    id: "notes",
    label: "Structured Notes",
    tabLabel: "Notes",
    icon: FileText,
    image: "/workspace-notes.png",
    objectPosition: "object-top",
    badge: "Page-Anchored Notes • Rigor Level 4",
    coordTitle: "Citation Coordinate",
    coordTag: "98% match",
    coordText: "Decoherence is induced by environmental thermal vibrations...",
    coordLocation: "Linked to Page 14, ¶3 in source PDF",
    demoQuery: "tab=notes",
  },
  {
    id: "cards",
    label: "Active Flashcards",
    tabLabel: "Flashcards",
    icon: Layers,
    image: "/workspace-flashcards.png",
    objectPosition: "object-[50%_35%]",
    badge: "Leitner Spaced Repetition",
    coordTitle: "Active Recall Proof",
    coordTag: "Box 4 • 94.2% Retention",
    coordText: "What is Quantum Superposition? Normalized linear combination...",
    coordLocation: "Derived from Griffiths Ch. 1, §1.2",
    demoQuery: "tab=cards",
  },
  {
    id: "quiz",
    label: "Practice Quiz",
    tabLabel: "Quiz",
    icon: ListChecks,
    image: "/workspace-quiz.png",
    objectPosition: "object-[50%_25%]",
    badge: "Instant Verification",
    coordTitle: "Diagnostic Check",
    coordTag: "3 Questions Indexed",
    coordText: "Which physical phenomenon causes a qubit to lose its state?",
    coordLocation: "Correct: Environmental Decoherence",
    demoQuery: "tab=quiz",
  },
  {
    id: "podcast",
    label: "Audio Podcast",
    tabLabel: "Podcast",
    icon: Headphones,
    image: "/workspace-podcast.png",
    objectPosition: "object-[50%_20%]",
    badge: "Synchronized Audio Studio",
    coordTitle: "Socratic Dialogue",
    coordTag: "0:25 / 3:00",
    coordText: "Host A (Dr. Sarah Chen) & Host B (Marcus) debate quantum computing...",
    coordLocation: "Timestamp 0:25 synchronized to text",
    demoQuery: "tab=podcast",
  },
];

export function TactileHeroPrototype() {
  const { user } = useAuth();
  const { mounted } = useTheme();
  const shouldReduceMotion = useReducedMotion();

  // Carousel State: 5-second automatic progression with hover pause and directional tracking
  const [activeIdx, setActiveIdx] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isPaused, setIsPaused] = useState(false);

  const nextCard = useCallback(() => {
    setDirection(1);
    setActiveIdx((prev) => (prev + 1) % FEATURE_MODES.length);
  }, []);

  const prevCard = useCallback(() => {
    setDirection(-1);
    setActiveIdx((prev) => (prev - 1 + FEATURE_MODES.length) % FEATURE_MODES.length);
  }, []);

  const handleSelectTab = (targetIdx: number) => {
    if (targetIdx === activeIdx) return;
    setDirection(targetIdx > activeIdx ? 1 : -1);
    setActiveIdx(targetIdx);
  };

  useEffect(() => {
    if (shouldReduceMotion) return;
    if (isPaused) return;

    const timer = setInterval(() => {
      nextCard();
    }, 5000);

    return () => clearInterval(timer);
  }, [isPaused, shouldReduceMotion, nextCard]);

  const activeMode = FEATURE_MODES[activeIdx];

  return (
    <section 
      id="modes"
      className="relative w-full flex flex-col items-center justify-center pt-20 xs:pt-24 sm:pt-28 lg:pt-30 pb-12 sm:pb-20 select-none overflow-hidden text-center scroll-mt-24"
    >
      {/* Ambient Continuous Atmospheric Halos */}
      <div
        className="absolute top-10 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[450px] -z-10 pointer-events-none opacity-50"
        style={{
          background: "radial-gradient(ellipse 80% 50% at 50% 30%, rgba(15,23,42,0.04) 0%, transparent 75%)",
          filter: "blur(60px)",
        }}
        aria-hidden="true"
      />

      {/* Monumental Centered Headline */}
      <motion.h1
        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: shouldReduceMotion ? 0.3 : 0.7, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
        className="text-4xl xs:text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-[-0.035em] leading-[1.05] sm:leading-[1.04] text-slate-900 font-display text-balance max-w-4xl mx-auto"
      >
        <span className="block text-slate-900">Master the Text.</span>
        <span className="block text-slate-900 mt-1">Skip the Grind.</span>
      </motion.h1>

      {/* Centered Catchy Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: shouldReduceMotion ? 0.3 : 0.7, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
        className="mt-3.5 sm:mt-5 text-base sm:text-lg lg:text-xl text-slate-600 font-normal leading-relaxed max-w-2xl mx-auto text-balance"
      >
        Notes, flashcards, and quizzes grounded 100% in your actual sources.
      </motion.p>

      {/* Centered Action CTAs */}
      <motion.div
        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: shouldReduceMotion ? 0.3 : 0.7, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
        className="mt-6 sm:mt-7 flex flex-row items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto"
      >
        <motion.div
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 450, damping: 25 }}
        >
          <Link
            href={mounted && user ? "/app" : "/auth?mode=signup"}
            className="px-6 sm:px-8 py-3 sm:py-3.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm shadow-[0_2px_8px_rgba(0,0,0,0.12),0_12px_24px_-8px_rgba(0,0,0,0.18)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.18),0_16px_32px_-8px_rgba(0,0,0,0.22)] border-t border-white/20 flex items-center justify-center gap-2 group cursor-pointer transition-[background-color,box-shadow] duration-200 whitespace-nowrap"
          >
            <span>{mounted && user ? "Open workspace" : "Start free"}</span>
            <ArrowRight className="size-3.5 sm:size-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 450, damping: 25 }}
        >
          <Link
            href={`/app/doc/demo-quantum?${activeMode.demoQuery}`}
            className="px-5 sm:px-7 py-3 sm:py-3.5 rounded-full bg-white/90 hover:bg-white text-slate-800 font-semibold text-xs sm:text-sm border border-slate-200/90 hover:border-slate-300 shadow-2xs hover:shadow-xs flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer transition-[background-color,border-color,box-shadow] duration-200 whitespace-nowrap"
          >
            <span>Test live demo</span>
          </Link>
        </motion.div>
      </motion.div>

      {/* Centered Trust Guarantees */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.32 }}
        className="mt-3.5 sm:mt-4 flex items-center justify-center gap-x-2.5 sm:gap-x-5 text-[11px] sm:text-xs text-slate-500 font-medium overflow-x-auto scrollbar-none max-w-full whitespace-nowrap"
      >
        <div className="flex items-center gap-1 shrink-0">
          <CheckCircle2 className="size-3.5 text-slate-900 shrink-0" />
          <span>Students &amp; PhDs</span>
        </div>
        <span className="text-slate-300">•</span>
        <div className="flex items-center gap-1 shrink-0">
          <CheckCircle2 className="size-3.5 text-slate-900 shrink-0" />
          <span>25 free daily</span>
        </div>
        <span className="text-slate-300">•</span>
        <div className="flex items-center gap-1 shrink-0">
          <CheckCircle2 className="size-3.5 text-slate-900 shrink-0" />
          <span>Zero-retention</span>
        </div>
      </motion.div>

      {/* Interactive Mode Switcher Tabs (NO TIMER LINE UNDERNEATH) */}
      <div className="flex items-center justify-center mt-7 sm:mt-9 mb-4">
        <div className="inline-flex items-center gap-1 sm:gap-1.5 p-1 sm:p-1.5 rounded-full bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-x-auto scrollbar-none max-w-full">
          {FEATURE_MODES.map((mode, idx) => {
            const Icon = mode.icon;
            const isActive = idx === activeIdx;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => handleSelectTab(idx)}
                className={cn(
                  "relative px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 sm:gap-2 transition-colors cursor-pointer whitespace-nowrap select-none",
                  isActive
                    ? "text-white"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="heroActivePill"
                    className="absolute inset-0 rounded-full bg-slate-900 shadow-sm -z-0"
                    transition={{ type: "spring", stiffness: 450, damping: 32 }}
                  />
                )}
                <Icon className="size-3.5 sm:size-4 relative z-10 shrink-0" />
                <span className="relative z-10">{mode.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3D Side-Swiping Physical Card Deck Showcase (Full-Bleed Stage with Soft Edge Fades) */}
      <div
        className="relative w-full h-[420px] xs:h-[460px] sm:h-[540px] md:h-[600px] lg:h-[650px] flex items-center justify-center [perspective:1400px] overflow-hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Full-width continuous atmospheric glow behind cards */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-6xl h-[500px] -z-10 pointer-events-none opacity-50"
          style={{
            background: "radial-gradient(ellipse 75% 55% at 50% 50%, rgba(15,23,42,0.04) 0%, rgba(15,23,42,0.01) 60%, transparent 85%)",
            filter: "blur(60px)",
          }}
          aria-hidden="true"
        />

        {/* Left Edge Soft Gradient Fade Scrim */}
        <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 lg:w-56 bg-gradient-to-r from-[#FAF9F6] via-[#FAF9F6]/80 to-transparent z-35 pointer-events-none" />

        {/* Right Edge Soft Gradient Fade Scrim */}
        <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 lg:w-56 bg-gradient-to-l from-[#FAF9F6] via-[#FAF9F6]/80 to-transparent z-35 pointer-events-none" />

        {/* Subtle Left Chevron Button */}
        <button
          type="button"
          onClick={prevCard}
          aria-label="Previous card"
          className="absolute left-3 sm:left-6 lg:left-10 xl:left-16 top-1/2 -translate-y-1/2 z-40 size-10 sm:size-12 rounded-full bg-white/95 hover:bg-white text-slate-700 hover:text-slate-950 shadow-[0_4px_16px_rgba(0,0,0,0.12)] border border-slate-200/90 flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 backdrop-blur-md"
        >
          <ChevronLeft className="size-5 sm:size-6" />
        </button>

        {/* Subtle Right Chevron Button */}
        <button
          type="button"
          onClick={nextCard}
          aria-label="Next card"
          className="absolute right-3 sm:right-6 lg:right-10 xl:right-16 top-1/2 -translate-y-1/2 z-40 size-10 sm:size-12 rounded-full bg-white/95 hover:bg-white text-slate-700 hover:text-slate-950 shadow-[0_4px_16px_rgba(0,0,0,0.12)] border border-slate-200/90 flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 backdrop-blur-md"
        >
          <ChevronRight className="size-5 sm:size-6" />
        </button>

        {/* Cards Deck Track with Bilateral Mask */}
        <div 
          className="relative w-full h-full flex items-center justify-center"
          style={{
            maskImage: "linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)",
          }}
        >
          {FEATURE_MODES.map((mode, idx) => {
            let diff = (idx - activeIdx + 4) % 4;
            if (diff === 3) diff = -1;

            const isCenter = diff === 0;
            const isRight = diff === 1;
            const isLeft = diff === -1;
            const isHidden = Math.abs(diff) >= 2;

            // Target animation coordinates for smooth side swiping with absolute center anchoring
            let targetX = "-50%";
            let targetScale = 1;
            let targetOpacity = 1;
            let targetZIndex = 30;
            let targetBlur = "blur(0px)";

            if (isRight) {
              targetX = "calc(-50% + 72%)";
              targetScale = 0.88;
              targetOpacity = 0.62;
              targetZIndex = 20;
              targetBlur = "blur(0.5px)";
            } else if (isLeft) {
              targetX = "calc(-50% - 72%)";
              targetScale = 0.88;
              targetOpacity = 0.62;
              targetZIndex = 20;
              targetBlur = "blur(0.5px)";
            } else if (isHidden) {
              targetX = direction === 1 ? "calc(-50% + 140%)" : "calc(-50% - 140%)";
              targetScale = 0.72;
              targetOpacity = 0;
              targetZIndex = 0;
              targetBlur = "blur(4px)";
            }

            return (
              <motion.div
                key={mode.id}
                animate={{
                  x: targetX,
                  y: "-50%",
                  scale: targetScale,
                  opacity: targetOpacity,
                  zIndex: targetZIndex,
                  filter: targetBlur,
                }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 28,
                  mass: 0.9,
                  opacity: { duration: isHidden ? 0.2 : 0.4 },
                }}
                drag={isCenter ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -40 || info.velocity.x < -250) {
                    nextCard();
                  } else if (info.offset.x > 40 || info.velocity.x > 250) {
                    prevCard();
                  }
                }}
                onClick={() => {
                  if (isRight) nextCard();
                  if (isLeft) prevCard();
                }}
                className={cn(
                  "absolute top-1/2 left-1/2 w-[88vw] max-w-[390px] xs:max-w-[430px] sm:w-[740px] sm:max-w-[740px] md:w-[840px] md:max-w-[840px] lg:w-[940px] lg:max-w-[940px] xl:w-[1000px] xl:max-w-[1000px] rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-[0_20px_50px_rgba(15,23,42,0.12),0_1px_3px_rgba(0,0,0,0.05)] bg-white p-2 sm:p-2.5 transition-shadow duration-300",
                  isCenter ? "shadow-[0_25px_60px_rgba(15,23,42,0.16)] cursor-grab active:cursor-grabbing" : "cursor-pointer hover:opacity-75"
                )}
                style={{
                  transformStyle: "preserve-3d",
                  willChange: "transform, opacity",
                }}
              >
                {/* Card Top Window Chrome */}
                <div className="flex items-center justify-between px-2.5 sm:px-3 py-1.5 sm:py-2 bg-slate-50/90 border border-slate-100 rounded-lg sm:rounded-xl mb-1.5 sm:mb-2 text-xs">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="size-2 sm:size-2.5 rounded-full bg-rose-400/80" />
                    <span className="size-2 sm:size-2.5 rounded-full bg-amber-400/80" />
                    <span className="size-2 sm:size-2.5 rounded-full bg-emerald-400/80" />
                    <span className="font-mono text-[10px] sm:text-[11px] text-slate-500 ml-1 truncate max-w-[120px] sm:max-w-xs">
                      quantum_intro.pdf
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 font-mono text-[10px] sm:text-[11px] text-slate-900 bg-slate-100 px-1.5 sm:px-2 py-0.5 rounded-md border border-slate-200 font-medium">
                      <span className="size-1.5 rounded-full bg-slate-900" />
                      <span>{mode.badge}</span>
                    </div>
                    {isCenter && (
                      <Link
                        href={`/app/doc/demo-quantum?${mode.demoQuery}`}
                        className="hidden sm:inline-flex items-center gap-1 font-mono text-[10px] text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200 transition-colors"
                        title="Open live workspace demo"
                      >
                        <span>Test Live</span>
                        <ExternalLink className="size-2.5" />
                      </Link>
                    )}
                  </div>
                </div>

                {/* Real High-Resolution Workspace Screenshot */}
                <div className="relative overflow-hidden rounded-lg sm:rounded-xl border border-slate-100 bg-slate-50 aspect-[16/10] sm:aspect-[16/9] max-h-[340px] xs:max-h-[380px] sm:max-h-[460px] md:max-h-[500px]">
                  <img
                    src={mode.image}
                    alt={`Source.io workspace preview - ${mode.label}`}
                    loading="eager"
                    decoding="async"
                    className={cn(
                      "w-full h-full object-cover pointer-events-none select-none",
                      mode.objectPosition
                    )}
                  />

                  {/* Floating Citation Coordinate Proof Badge (Featured when active) */}
                  <div
                    className={cn(
                      "absolute bottom-2 left-2 right-2 sm:bottom-3.5 sm:left-3.5 sm:right-auto sm:max-w-[340px] bg-slate-900/95 backdrop-blur-md text-white p-2.5 sm:p-3 rounded-lg sm:rounded-xl border border-slate-700/80 shadow-2xl flex items-start gap-2.5 sm:gap-3 text-left z-20 transition-all duration-300",
                      isCenter ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
                    )}
                  >
                    <div className="size-6 sm:size-7 rounded-md bg-white/10 border border-white/20 flex items-center justify-center shrink-0 text-white mt-0.5">
                      <ShieldCheck className="size-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="text-[9px] sm:text-[10.5px] font-mono text-slate-300 font-semibold uppercase tracking-wider">
                          {mode.coordTitle}
                        </span>
                        <span className="text-[8.5px] sm:text-[9.5px] font-mono bg-white/10 text-white border border-white/20 px-1 py-0.2 rounded">
                          {mode.coordTag}
                        </span>
                      </div>
                      <p className="text-[10px] sm:text-xs text-slate-200 mt-1 font-medium leading-tight truncate sm:line-clamp-2">
                        &ldquo;{mode.coordText}&rdquo;
                      </p>
                      <div className="mt-1 text-[8.5px] sm:text-[9.5px] text-slate-400 font-mono">
                        <span className="text-white font-medium">{mode.coordLocation}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
