"use client";

import { useState } from "react";
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

  // Interactive Card Flip state
  const [cardFlipped, setCardFlipped] = useState(false);

  // Interactive Quiz state
  const [quizSelected, setQuizSelected] = useState<number | null>(null);

  // Audio Podcast playback state
  const [audioPlaying, setAudioPlaying] = useState(false);

  return (
    <section className="relative w-full min-h-[100dvh] flex flex-col justify-center pt-20 sm:pt-24 lg:pt-20 pb-8 sm:pb-12 select-none">
      {/* Ambient Atmospheric Glow (Subtle Sand/Sky Halos) */}
      <div
        className="absolute top-10 right-0 w-full lg:w-[60%] h-[550px] -z-10 pointer-events-none opacity-70"
        style={{
          background: "radial-gradient(ellipse 85% 65% at 70% 30%, rgba(14,165,233,0.12) 0%, rgba(245,158,11,0.08) 45%, transparent 75%)",
          filter: "blur(60px)",
        }}
        aria-hidden="true"
      />

      <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-16 items-center w-full my-auto">
        {/* Left Column: Copy & Value Proposition */}
        <motion.div 
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0.3 : 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-6 xl:col-span-6 flex flex-col items-start text-left space-y-6 sm:space-y-8"
        >

          {/* Headline */}
          <h1 className="text-[clamp(32px,3.8vw,50px)] font-extrabold tracking-[-0.025em] leading-[1.22] text-slate-900 font-display text-balance">
            Turn textbooks, lectures, and research papers into{" "}
            <span className="text-primary relative inline-block pb-1">
              verified study materials.
              <svg
                className="absolute -bottom-1 left-0 w-full h-2 text-primary/40"
                viewBox="0 0 100 20"
                preserveAspectRatio="none"
              >
                <path d="M0 15 Q 50 2 100 15" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
              </svg>
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg leading-[1.7] text-slate-600 w-full max-w-lg">
            Extract notes, test comprehension, and cite every fact. Source.io converts dense documents and recordings into structured notes, flashcards, quizzes, audio recaps, and grounded chat—with every answer linked back to its source.
          </p>

          {/* Action CTAs: Consistent Start free & See a live demo with Tactile Button Physics */}
          <div className="flex flex-wrap items-center gap-3 pt-2 w-full sm:w-auto">
            <motion.div
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.965, y: 0.5 }}
              transition={{ type: "spring", stiffness: 450, damping: 25 }}
            >
              <Link
                href={mounted && user ? "/app" : "/auth?mode=signup"}
                className="relative px-6 py-3.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm shadow-[0_2px_8px_rgba(0,0,0,0.12),0_12px_24px_-8px_rgba(0,0,0,0.18)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.18),0_16px_32px_-8px_rgba(0,0,0,0.22)] border-t border-white/20 flex items-center justify-center gap-2 group cursor-pointer transition-[background-color,box-shadow] duration-200"
              >
                <span>{mounted && user ? "Open workspace" : "Start free"}</span>
                <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.965, y: 0.5 }}
              transition={{ type: "spring", stiffness: 450, damping: 25 }}
            >
              <Link
                href="/app/doc/demo-quantum"
                className="px-5 py-3.5 rounded-full bg-white/90 hover:bg-white text-slate-800 font-semibold text-sm border border-slate-200/90 hover:border-slate-300 shadow-sm hover:shadow-md flex items-center justify-center gap-2 cursor-pointer group transition-[background-color,border-color,box-shadow] duration-200"
              >
                <span>See a live demo</span>
              </Link>
            </motion.div>
          </div>

          {/* Trust Guarantees */}
          <div className="pt-3 flex flex-wrap items-center gap-x-6 gap-y-2.5 text-xs text-slate-500 font-medium">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-emerald-500" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-emerald-500" />
              <span>25 free actions daily</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-emerald-500" />
              <span>Zero-data retention</span>
            </div>
          </div>
        </motion.div>

        {/* Right Column: High-resolution floating workspace frame with active citation callout card */}
        <motion.div 
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0.3 : 0.85, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-6 xl:col-span-6 w-full flex items-center justify-center lg:justify-end [perspective:1000px] relative"
        >
          <motion.div 
            style={{
              rotateX: shouldReduceMotion ? 0 : rotateX,
              rotateY: shouldReduceMotion ? 0 : rotateY,
              transformStyle: "preserve-3d",
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="w-full max-w-[580px] rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200/90 shadow-[0_20px_50px_rgba(15,23,42,0.12),0_1px_3px_rgba(0,0,0,0.05)] bg-white p-2.5 transition-shadow hover:shadow-2xl cursor-default relative group"
          >
            {/* Top Workspace Chrome */}
            <div className="flex items-center justify-between px-3 py-2 bg-slate-50/80 border border-slate-100 rounded-xl mb-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-rose-400/80" />
                <span className="size-2.5 rounded-full bg-amber-400/80" />
                <span className="size-2.5 rounded-full bg-emerald-400/80" />
                <span className="font-mono text-[11px] text-slate-500 ml-1 truncate max-w-[160px] sm:max-w-xs">quantum_intro.pdf</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 font-medium">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>38 Pages Indexed</span>
              </div>
            </div>

            {/* Tight UI Preview Graphic */}
            <div className="relative overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
              <img
                src="/notes-preview.png"
                alt="Source.io study workspace preview showing verified notes and citations"
                className="w-full h-auto aspect-[16/10] object-cover object-top pointer-events-none select-none transition-transform duration-500 group-hover:scale-[1.02]"
              />

              {/* Floating Interactive Callout Card: Grounded Citation Pill */}
              <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-auto sm:max-w-[340px] bg-slate-900/95 backdrop-blur-md text-white p-3 sm:p-3.5 rounded-xl border border-slate-700/80 shadow-2xl flex items-start gap-3">
                <div className="size-8 rounded-lg bg-sky-500/20 border border-sky-400/30 flex items-center justify-center shrink-0 text-sky-400">
                  <ShieldCheck className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono text-sky-400 font-semibold uppercase tracking-wider">Citation Coordinate</span>
                    <span className="text-[10px] font-mono bg-sky-950/80 text-sky-300 border border-sky-500/30 px-1.5 py-0.2 rounded">96% match</span>
                  </div>
                  <p className="text-xs text-slate-200 mt-1 font-medium leading-snug line-clamp-2">
                    "Decoherence is induced by environmental thermal vibrations and stray fields."
                  </p>
                  <div className="mt-1.5 text-[10px] text-slate-400 font-mono">
                    Linked to <span className="text-white font-medium">Page 14, ¶3</span> in source PDF
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
