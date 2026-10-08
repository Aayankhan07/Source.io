"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion, useMotionValue, useSpring, useTransform } from "framer-motion";
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
    <section className="relative w-full min-h-[calc(100dvh-4.5rem)] flex flex-col justify-center pt-24 sm:pt-28 lg:pt-32 pb-8 sm:pb-12 select-none">
      {/* Ambient Atmospheric Glow (Subtle Sand/Sky Halos) */}
      <div
        className="absolute top-10 right-0 w-full lg:w-[60%] h-[550px] -z-10 pointer-events-none opacity-70 dark:opacity-30"
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
          <h1 className="text-[clamp(32px,3.8vw,50px)] font-extrabold tracking-[-0.025em] leading-[1.22] text-slate-900 dark:text-white font-display text-balance">
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
          <p className="text-base sm:text-lg leading-[1.7] text-slate-600 dark:text-slate-300 max-w-[520px]">
            Extract notes, test comprehension, and cite every fact. Source.io converts dense documents and recordings into structured notes, flashcards, quizzes, audio recaps, and grounded chat—with every answer linked back to its source.
          </p>

          {/* Action CTAs: Consistent Start free & See a live demo with Tactile Button Physics */}
          <div className="flex flex-wrap items-center gap-3 pt-2 w-full sm:w-auto">
            <motion.div
              whileHover={{ scale: 1.025, y: -1 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <Link
                href={mounted && user ? "/app" : "/auth"}
                className="px-6 py-3.5 rounded-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-950 font-semibold text-sm shadow-tactile-pill flex items-center justify-center gap-2 group cursor-pointer"
              >
                <span>{mounted && user ? "Open workspace" : "Start free"}</span>
                <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.025, y: -1 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <Link
                href="/app/doc/demo-quantum"
                className="px-5 py-3.5 rounded-full bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-sm border border-black/[0.08] dark:border-white/10 shadow-tactile-pill flex items-center justify-center gap-2 cursor-pointer group"
              >
                <span>See a live demo</span>
              </Link>
            </motion.div>
          </div>

          {/* Trust Guarantees */}
          <div className="pt-3 flex flex-wrap items-center gap-x-6 gap-y-2.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
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

        {/* Right Column: Balanced preview frame with directional slide and subtle 3D tilt parallax */}
        <motion.div 
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0.3 : 0.85, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-6 xl:col-span-6 w-full flex items-center justify-center lg:justify-end [perspective:1000px]"
        >
          <motion.div 
            style={{
              rotateX: shouldReduceMotion ? 0 : rotateX,
              rotateY: shouldReduceMotion ? 0 : rotateY,
              transformStyle: "preserve-3d",
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="w-full max-w-[620px] rounded-[28px] sm:rounded-[36px] overflow-hidden border border-black/[0.08] dark:border-white/10 shadow-tactile-dock bg-white dark:bg-slate-900/90 p-2 sm:p-2.5 transition-shadow hover:shadow-2xl cursor-default"
          >
            <img
              src="/hero-image-2.jpg"
              alt="Source.io study workspace preview"
              className="w-full h-auto aspect-[16/11] rounded-[20px] sm:rounded-[28px] object-cover pointer-events-none select-none"
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
