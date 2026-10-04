"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useTheme } from "@/hooks/use-theme";
import {
  ArrowRight,
  Play,
  Pause,
  Plus,
  MessageSquare,
  Star,
  ChevronDown,
  Volume2,
  CheckCircle2,
  Layers,
  FileText,
  Headphones,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StudyLensData {
  id: string;
  name: string;
  role: string;
  subject: string;
  avatar: string;
  rating: number;
  highlightTag: string;
  description: string;
  previewType: "notes" | "audio" | "flashcards";
}

const LENSES: StudyLensData[] = [
  {
    id: "notes",
    name: "Dr. Elena Vance",
    role: "Quantum Physics · Lecture 04",
    subject: "Structured Notes",
    avatar: "/assets/avatar_elena.jpg",
    rating: 5,
    highlightTag: "Sentence-level citations",
    description: "Derives hierarchical Cornell notes with LaTeX formulas and interactive proof margins.",
    previewType: "notes",
  },
  {
    id: "audio",
    name: "Alex Chen",
    role: "2-Host Studio Audio",
    subject: "Audio Walkthrough",
    avatar: "/assets/avatar_alex.jpg",
    rating: 5,
    highlightTag: "Conversational recap",
    description: "Listen to an engaging Socratic dialogue breaking down dense textbook chapters.",
    previewType: "audio",
  },
  {
    id: "flashcards",
    name: "Maya Lin",
    role: "Cognitive Science & Recall",
    subject: "Spaced Flashcards",
    avatar: "/assets/avatar_maya.jpg",
    rating: 5,
    highlightTag: "Leitner spaced repetition",
    description: "Automatically formats diagnostic card decks with active recall triggers and mastery scoring.",
    previewType: "flashcards",
  },
];

export function TactileHeroPrototype() {
  const { user } = useAuth();
  const { mounted } = useTheme();
  const [activeLensIndex, setActiveLensIndex] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const activeLens = LENSES[activeLensIndex];

  const scrollToWorkbench = () => {
    const el = document.getElementById("workbench");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative w-full pt-6 pb-12 md:pt-10 md:pb-16 overflow-hidden select-none">
      {/* 1. Organic Warm/Luminous Curved Backdrop (Echoes the sand/cream sweeping boundary) */}
      <div
        className="absolute top-0 right-0 w-full lg:w-[65%] h-[85%] -z-10 pointer-events-none opacity-80 dark:opacity-40"
        style={{
          background: "radial-gradient(ellipse 90% 70% at 75% 25%, rgba(6,182,212,0.12) 0%, rgba(245,158,11,0.08) 45%, transparent 75%)",
          filter: "blur(40px)",
        }}
        aria-hidden="true"
      />

      {/* Main Grid: Left Column Copy + Right Hero Synthesis Orb */}
      <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center mb-8 sm:mb-12">
        {/* Left Column: Focused Copy Stack & Tactile CTA */}
        <div className="lg:col-span-6 flex flex-col items-start text-left space-y-5">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/5 dark:bg-white/10 border border-slate-900/15 dark:border-white/15 text-slate-900 dark:text-white text-xs font-semibold shadow-xs">
            <span className="size-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_#f59e0b]" />
            <span>Interactive Study Architecture</span>
          </div>

          {/* Chunky, Expressive Headline */}
          <h1 className="text-[clamp(34px,4.2vw,56px)] font-bold tracking-tight leading-[1.08] text-foreground font-display text-balance">
            Master Complex Knowledge In{" "}
            <span className="text-primary relative inline-block">
              Any Source
              <svg
                className="absolute -bottom-1.5 left-0 w-full h-2 text-primary/40"
                viewBox="0 0 100 20"
                preserveAspectRatio="none"
              >
                <path d="M0 15 Q 50 2 100 15" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
              </svg>
            </span>{" "}
            With AI Study Lenses.
          </h1>

          {/* Description */}
          <p className="text-base sm:text-lg leading-relaxed text-muted-foreground max-w-[500px]">
            Ingest dense textbooks, 2-hour lecture recordings, or research papers. Source.io derivers
            five interactive study modes with sentence-level citations.
          </p>

          {/* Tactile Pill Action Buttons */}
          <div className="flex flex-wrap items-center gap-3.5 pt-2 w-full sm:w-auto">
            <Link
              href={mounted && user ? "/app" : "/auth"}
              className="px-6 py-3 rounded-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 active:scale-98 text-white dark:text-slate-950 font-semibold text-sm shadow-[0_12px_24px_-6px_rgba(15,23,42,0.4)] transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>{mounted && user ? "Open study workspace" : "Get started free"}</span>
              <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <button
              type="button"
              onClick={scrollToWorkbench}
              className="px-5 py-3 rounded-full bg-card hover:bg-muted/60 active:scale-98 text-foreground font-semibold text-sm border border-border/80 shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Explore 5 views</span>
              <ChevronDown className="size-4 text-muted-foreground" />
            </button>
          </div>

          {/* Scroll Explore Cue */}
          <div className="pt-2 flex items-center gap-2 text-xs text-muted-foreground font-medium">
            <span className="animate-bounce">↓</span>
            <span>Scroll explore interactive studio</span>
          </div>
        </div>

        {/* Right Column: The Sculptural Synthesis Orb & Floating Pills */}
        <div className="lg:col-span-6 flex items-center justify-center relative py-6">
          {/* Layer 1: Ambient Circular Orb Backdrop with Concentric Halo */}
          <div className="relative w-[340px] h-[340px] sm:w-[420px] sm:h-[420px] rounded-full flex items-center justify-center">
            {/* Outer Concentric Orbital Ring */}
            <div className="absolute inset-0 rounded-full border border-primary/20 dark:border-primary/15 animate-[spin_60s_linear_infinite]" />
            <div className="absolute inset-4 rounded-full border border-amber-500/20 dark:border-amber-400/10" />

            {/* Glowing Orb Gradient Disk */}
            <div
              className="absolute inset-8 rounded-full opacity-90"
              style={{
                background: "radial-gradient(circle at 40% 40%, rgba(6,182,212,0.25) 0%, rgba(245,158,11,0.18) 55%, transparent 85%)",
              }}
            />

            {/* Playful Floating 3D Geometric Confetti Accents (like reference) */}
            <div className="absolute -top-2 right-12 size-4 rotate-45 bg-amber-400/80 rounded-sm shadow-sm" />
            <div className="absolute bottom-14 -left-3 size-3 rounded-full bg-primary/70 shadow-sm" />
            <div className="absolute top-24 -right-2 size-3.5 rotate-12 bg-primary/60 rounded-xs shadow-sm" />

            {/* Layer 2: Central Squircle Card with Editorial Avatar */}
            <motion.div
              key={activeLens.id}
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="w-[260px] h-[260px] sm:w-[310px] sm:h-[310px] rounded-[36px] p-2 bg-gradient-to-b from-white/90 via-white/40 to-white/10 dark:from-white/15 dark:to-white/5 border-2 border-white/80 dark:border-white/15 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.18)] relative overflow-hidden flex flex-col justify-between"
            >
              {/* Avatar Background */}
              <div className="absolute inset-2 rounded-[30px] overflow-hidden">
                <img
                  src={activeLens.avatar}
                  alt={activeLens.name}
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              </div>

              {/* Top Tag Inside Card */}
              <div className="relative z-10 p-2 flex justify-end">
                <span className="px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md text-white text-[11px] font-medium border border-white/20">
                  {activeLens.highlightTag}
                </span>
              </div>

              {/* Layer 3: Frosted Translucent Glass Overlay Pill */}
              <div className="relative z-10 m-2 p-3 rounded-[22px] bg-white/80 dark:bg-zinc-900/85 backdrop-blur-xl border border-white/90 dark:border-white/20 shadow-md flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <h4 className="text-xs sm:text-sm font-bold text-foreground font-display truncate">
                    {activeLens.name}
                  </h4>
                  <p className="text-[11px] text-muted-foreground truncate">{activeLens.role}</p>
                </div>
                <div className="size-2 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.6)] shrink-0" />
              </div>
            </motion.div>

            {/* Layer 4: Floating Tactile Satellite Action Buttons (Directly nestled at bottom edge) */}
            <div className="absolute -bottom-5 sm:-bottom-6 flex items-center gap-3 z-20">
              {/* Satellite 1: New Source / Plus */}
              <button
                type="button"
                onClick={() => {
                  const nextIndex = (activeLensIndex + 1) % LENSES.length;
                  setActiveLensIndex(nextIndex);
                }}
                title="Next Study Lens"
                className="size-11 sm:size-12 rounded-full bg-card hover:bg-muted/80 text-foreground border border-border shadow-[0_8px_16px_-4px_rgba(0,0,0,0.12)] flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
              >
                <Plus className="size-5 text-muted-foreground" />
              </button>

              {/* Satellite 2 (Primary Center): Play Podcast or Audio recap */}
              <button
                type="button"
                onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                title={isPlayingAudio ? "Pause Audio Recap" : "Play Audio Recap"}
                className="size-13 sm:size-14 rounded-full bg-slate-900 hover:bg-slate-800 text-white shadow-[0_12px_24px_-4px_rgba(15,23,42,0.5)] border border-white/20 flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                {isPlayingAudio ? (
                  <Pause className="size-6 text-white" />
                ) : (
                  <Play className="size-6 text-white translate-x-0.5" />
                )}
              </button>

              {/* Satellite 3: Chat / Ask Question */}
              <button
                type="button"
                onClick={scrollToWorkbench}
                title="Ask AI this document"
                className="size-11 sm:size-12 rounded-full bg-card hover:bg-muted/80 text-foreground border border-border shadow-[0_8px_16px_-4px_rgba(0,0,0,0.12)] flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
              >
                <MessageSquare className="size-5 text-primary" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. The Floating Anchored Study Dock */}
      <div className="w-full mt-4">
        <div className="relative rounded-[32px] sm:rounded-[40px] bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 dark:from-zinc-950 dark:via-zinc-900 dark:to-blue-950/70 p-4 sm:p-6 text-white shadow-[0_20px_40px_-15px_rgba(15,23,42,0.4)] border border-blue-900/30">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Dock Brand / Metric Left Pod */}
            <div className="flex items-center gap-4 shrink-0">
              <div className="size-12 sm:size-14 rounded-full bg-white text-slate-950 flex items-center justify-center font-display font-black text-xl shadow-md shrink-0 border border-white/20 select-none">
                <span>5</span>
                <span className="text-amber-500 text-xs font-sans font-bold ml-0.5">★</span>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold font-display tracking-tight text-white">
                  5 Study Views
                </div>
                <div className="text-xs sm:text-sm text-slate-300 font-medium">
                  Instant Synthesis. Any Material.
                </div>
              </div>
            </div>

            {/* Popping Lens Cards (Poking out of the capsule!) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1 lg:max-w-2xl">
              {LENSES.map((lens, idx) => {
                const isActive = activeLensIndex === idx;
                return (
                  <button
                    key={lens.id}
                    type="button"
                    onClick={() => setActiveLensIndex(idx)}
                    className={cn(
                      "group p-3 rounded-[24px] text-left transition-all duration-200 cursor-pointer flex flex-col justify-between relative overflow-hidden",
                      isActive
                        ? "bg-white text-zinc-950 shadow-xl -translate-y-2 ring-2 ring-primary"
                        : "bg-white/10 hover:bg-white/15 text-white/90 hover:-translate-y-1"
                    )}
                  >
                    <div className="flex items-center gap-2.5 mb-2">
                      <img
                        src={lens.avatar}
                        alt={lens.name}
                        className="size-9 rounded-[14px] object-cover shrink-0 border border-white/20"
                      />
                      <div className="min-w-0 flex-1">
                        <div
                          className={cn(
                            "text-xs font-bold font-display truncate",
                            isActive ? "text-zinc-950" : "text-white"
                          )}
                        >
                          {lens.subject}
                        </div>
                        <div
                          className={cn(
                            "text-[10px] truncate",
                            isActive ? "text-zinc-600" : "text-cyan-200/70"
                          )}
                        >
                          {lens.name}
                        </div>
                      </div>
                    </div>

                    {/* Star Rating Row */}
                    <div className="flex items-center justify-between pt-1 border-t border-current/10">
                      <div className="flex items-center gap-0.5 text-amber-400">
                        {Array.from({ length: lens.rating }).map((_, i) => (
                          <Star key={i} className="size-2.5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <span
                        className={cn(
                          "text-[10px] font-mono",
                          isActive ? "text-primary font-bold" : "text-white/60"
                        )}
                      >
                        {isActive ? "Active" : "Select"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Next Action Arrow */}
            <div className="hidden lg:flex items-center justify-center">
              <button
                type="button"
                onClick={() => setActiveLensIndex((activeLensIndex + 1) % LENSES.length)}
                className="size-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
                title="Next Lens"
              >
                <ArrowRight className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
