"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useTheme } from "@/hooks/use-theme";
import {
  ArrowRight,
  FileText,
  Layers,
  ListChecks,
  Headphones,
  MessagesSquare,
  Play,
  Pause,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  BookOpen,
  Volume2
} from "lucide-react";
import { cn } from "@/lib/utils";

type HeroMode = "notes" | "cards" | "quiz" | "podcast" | "chat";

interface ModeTab {
  id: HeroMode;
  label: string;
  icon: React.ElementType;
  badge: string;
}

const MODES: ModeTab[] = [
  { id: "notes", label: "Structured Notes", icon: FileText, badge: "Understand ideas quickly" },
  { id: "cards", label: "Flashcards", icon: Layers, badge: "Retain concepts over time" },
  { id: "quiz", label: "Practice Quiz", icon: ListChecks, badge: "Test comprehension" },
  { id: "podcast", label: "Audio Recap", icon: Headphones, badge: "Review on the commute" },
  { id: "chat", label: "Grounded Chat", icon: MessagesSquare, badge: "Source-backed answers" },
];

export function TactileHeroPrototype() {
  const { user } = useAuth();
  const { mounted } = useTheme();
  const shouldReduceMotion = useReducedMotion();
  const [activeMode, setActiveMode] = useState<HeroMode>("notes");

  // Interactive 3D Tilt / Parallax Physics for Preview Card
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for rotation
  const smoothMouseX = useSpring(mouseX, { stiffness: 220, damping: 25 });
  const smoothMouseY = useSpring(mouseY, { stiffness: 220, damping: 25 });

  // Map to subtle ±3deg tilt
  const rotateX = useTransform(smoothMouseY, [-0.5, 0.5], [3, -3]);
  const rotateY = useTransform(smoothMouseX, [-0.5, 0.5], [-3, 3]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (shouldReduceMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width - 0.5;
    const yPct = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(xPct);
    mouseY.set(yPct);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  // Citation Sync Loop (4.5s pulse cycle)
  const [citationActive, setCitationActive] = useState(false);

  useEffect(() => {
    if (shouldReduceMotion) return;
    const interval = setInterval(() => {
      setCitationActive(true);
      const timer = setTimeout(() => {
        setCitationActive(false);
      }, 2200);
      return () => clearTimeout(timer);
    }, 4500);
    return () => clearInterval(interval);
  }, [shouldReduceMotion]);

  return (
    <section className="relative w-full min-h-[100dvh] flex flex-col justify-between lg:justify-center pt-20 xs:pt-22 sm:pt-24 lg:pt-20 pb-5 xs:pb-7 sm:pb-12 select-none overflow-hidden">
      {/* Ambient Subtle Shadow Background */}
      <div
        className="absolute top-10 right-0 w-full lg:w-[60%] h-[550px] -z-10 pointer-events-none opacity-40"
        style={{
          background: "radial-gradient(ellipse 85% 65% at 70% 30%, rgba(15,23,42,0.04) 0%, transparent 75%)",
          filter: "blur(60px)",
        }}
        aria-hidden="true"
      />

      <div className="grid lg:grid-cols-12 gap-3.5 xs:gap-4 sm:gap-8 lg:gap-12 xl:gap-16 items-center w-full flex-1 flex flex-col lg:grid justify-between lg:justify-center my-auto lg:my-auto">
        {/* Left Column: Copy & Value Proposition */}
        <motion.div 
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0.3 : 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-6 xl:col-span-6 flex flex-col items-start text-left space-y-2.5 xs:space-y-3.5 sm:space-y-6 lg:space-y-8 w-full"
        >

          {/* Headline with Animated Ink-Stroke Underline */}
          <h1 className="text-[23px] xs:text-[25px] sm:text-[clamp(30px,3.4vw,46px)] font-extrabold tracking-[-0.025em] leading-[1.2] sm:leading-[1.22] text-slate-900 font-display text-balance">
            Turn textbooks, lectures, and research papers into{" "}
            <span className="relative inline-block pb-1 text-slate-900">
              verified study & teaching tools.
              <svg
                className="absolute -bottom-1 left-0 w-full h-2 text-slate-900/60"
                viewBox="0 0 100 20"
                preserveAspectRatio="none"
              >
                <motion.path
                  d="M0 15 Q 50 2 100 15"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  fill="none"
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                />
              </svg>
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-[12.5px] xs:text-[13.5px] sm:text-base lg:text-lg leading-[1.55] sm:leading-[1.7] text-slate-600 w-full max-w-lg">
            <span className="sm:hidden">
              One source engine calibrated to your academic tier. Convert textbooks, papers, and recordings into verified study notes and coordinate citations.
            </span>
            <span className="hidden sm:inline">
              One source engine calibrated to your exact academic tier. Source.io converts textbooks, papers, and recordings into grounded study notes, flashcards, quizzes, audio recaps, and lesson plans—with modular blocks, adjustable rigor (Level 1–5), and exact coordinate proofs.
            </span>
          </p>

          {/* Action CTAs: Compact Side-by-Side on Mobile, Full on Desktop */}
          <div className="flex items-center gap-2.5 sm:gap-3 pt-0.5 sm:pt-2 w-full sm:w-auto">
            <motion.div
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.965, y: 0.5 }}
              transition={{ type: "spring", stiffness: 450, damping: 25 }}
              className="flex-1 sm:flex-initial"
            >
              <Link
                href={mounted && user ? "/app" : "/auth?mode=signup"}
                className="w-full sm:w-auto relative px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm shadow-[0_2px_8px_rgba(0,0,0,0.12),0_12px_24px_-8px_rgba(0,0,0,0.18)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.18),0_16px_32px_-8px_rgba(0,0,0,0.22)] border-t border-white/20 flex items-center justify-center gap-1.5 sm:gap-2 group cursor-pointer transition-[background-color,box-shadow] duration-200 whitespace-nowrap"
              >
                <span>{mounted && user ? "Open workspace" : "Start free"}</span>
                <ArrowRight className="size-3.5 sm:size-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.965, y: 0.5 }}
              transition={{ type: "spring", stiffness: 450, damping: 25 }}
              className="flex-1 sm:flex-initial"
            >
              <Link
                href="/app/doc/demo-quantum"
                className="w-full sm:w-auto px-4 sm:px-5 py-2.5 sm:py-3.5 rounded-full bg-white/90 hover:bg-white text-slate-800 font-semibold text-xs sm:text-sm border border-slate-200/90 hover:border-slate-300 shadow-sm hover:shadow-md flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer group transition-[background-color,border-color,box-shadow] duration-200 whitespace-nowrap"
              >
                <span>See demo</span>
              </Link>
            </motion.div>
          </div>

          {/* Trust Guarantees */}
          <div className="pt-0.5 sm:pt-4 flex items-center gap-x-2.5 sm:gap-x-6 text-[10.5px] sm:text-xs text-slate-600 font-medium overflow-x-auto scrollbar-none max-w-full whitespace-nowrap">
            <div className="flex items-center gap-1 shrink-0">
              <CheckCircle2 className="size-3 sm:size-3.5 text-slate-900 shrink-0" />
              <span>Students &amp; PhDs</span>
            </div>
            <span className="text-slate-300">•</span>
            <div className="flex items-center gap-1 shrink-0">
              <CheckCircle2 className="size-3 sm:size-3.5 text-slate-900 shrink-0" />
              <span>25 free daily</span>
            </div>
            <span className="text-slate-300">•</span>
            <div className="flex items-center gap-1 shrink-0">
              <CheckCircle2 className="size-3 sm:size-3.5 text-slate-900 shrink-0" />
              <span>Zero-retention</span>
            </div>
          </div>
        </motion.div>

        {/* Right Column: High-resolution floating workspace frame with active citation callout card */}
        <motion.div 
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0.3 : 0.85, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-6 xl:col-span-6 w-full flex items-center justify-center lg:justify-end [perspective:1000px] relative mt-2 xs:mt-3 sm:mt-0"
        >
          <motion.div 
            style={{
              rotateX: shouldReduceMotion ? 0 : rotateX,
              rotateY: shouldReduceMotion ? 0 : rotateY,
              transformStyle: "preserve-3d",
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="w-full max-w-[580px] rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200/90 shadow-[0_12px_36px_rgba(15,23,42,0.1),0_1px_3px_rgba(0,0,0,0.05)] bg-white p-2 sm:p-2.5 transition-shadow hover:shadow-2xl cursor-default relative group"
          >
            {/* Top Workspace Chrome */}
            <div className="flex items-center justify-between px-2.5 sm:px-3 py-1.5 sm:py-2 bg-slate-50/80 border border-slate-100 rounded-lg sm:rounded-xl mb-1.5 sm:mb-2 text-xs">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="size-2 sm:size-2.5 rounded-full bg-rose-400/80" />
                <span className="size-2 sm:size-2.5 rounded-full bg-amber-400/80" />
                <span className="size-2 sm:size-2.5 rounded-full bg-emerald-400/80" />
                <span className="font-mono text-[10px] sm:text-[11px] text-slate-500 ml-1 truncate max-w-[120px] sm:max-w-xs">quantum_intro.pdf</span>
              </div>
              <div className="flex items-center gap-1 font-mono text-[10px] sm:text-[11px] text-slate-900 bg-slate-100 px-1.5 sm:px-2 py-0.5 rounded-md border border-slate-200 font-medium">
                <span className="size-1.5 rounded-full bg-slate-900" />
                <span>38 Pages Indexed</span>
              </div>
            </div>

            {/* Tight UI Preview Graphic */}
            <div className="relative overflow-hidden rounded-lg sm:rounded-xl border border-slate-100 bg-slate-50 aspect-[4/3] xs:aspect-[16/11] sm:aspect-[16/10] max-h-[300px] xs:max-h-[340px] sm:max-h-none">
              <img
                src="/notes-preview.png"
                alt="Source.io study workspace preview showing verified notes and citations"
                className="w-full h-full object-cover object-top pointer-events-none select-none transition-transform duration-500 group-hover:scale-[1.02]"
              />

              {/* Floating Interactive Callout Card: Grounded Citation Pill with Spring Sync Pulse */}
              <motion.div 
                animate={
                  citationActive
                    ? { y: -2, scale: 1.01, borderColor: "rgba(255,255,255,0.4)" }
                    : { y: 0, scale: 1, borderColor: "rgba(51,65,85,0.8)" }
                }
                transition={{ type: "spring", stiffness: 450, damping: 24 }}
                className="absolute bottom-1.5 left-1.5 right-1.5 sm:bottom-4 sm:left-4 sm:right-auto sm:max-w-[340px] bg-slate-900/95 backdrop-blur-md text-white p-2 sm:p-3.5 rounded-lg sm:rounded-xl border shadow-2xl flex items-center sm:items-start gap-2 sm:gap-3 transition-colors duration-300"
              >
                <div className="size-6 sm:size-8 rounded-md sm:rounded-lg bg-white/10 border border-white/20 flex items-center justify-center shrink-0 text-white">
                  <ShieldCheck className="size-3 sm:size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-[9px] sm:text-[11px] font-mono text-slate-300 font-semibold uppercase tracking-wider">Citation Coordinate</span>
                    <span className="text-[8.5px] sm:text-[10px] font-mono bg-white/10 text-white border border-white/20 px-1 py-0.2 rounded">96% match</span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-slate-200 mt-0.5 sm:mt-1 font-medium leading-tight truncate sm:line-clamp-2">
                    "Decoherence is induced by environmental thermal vibrations..."
                  </p>
                  <div className="mt-0.5 sm:mt-1 text-[8.5px] sm:text-[10px] text-slate-400 font-mono">
                    Linked to <span className="text-white font-medium">Page 14, ¶3</span> in source PDF
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
