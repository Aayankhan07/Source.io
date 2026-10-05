"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useTheme } from "@/hooks/use-theme";
import {
  ArrowRight,
  Sparkles,
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
  { id: "notes", label: "Structured Notes", icon: FileText, badge: "LaTeX & Outlines" },
  { id: "cards", label: "Spaced Cards", icon: Layers, badge: "Leitner Repetition" },
  { id: "quiz", label: "Practice Quiz", icon: ListChecks, badge: "Instant Proofs" },
  { id: "podcast", label: "Audio Recap", icon: Headphones, badge: "2-Host Studio" },
  { id: "chat", label: "Cited Copilot", icon: MessagesSquare, badge: "Passage Anchors" },
];

export function TactileHeroPrototype() {
  const { user } = useAuth();
  const { mounted } = useTheme();
  const [activeMode, setActiveMode] = useState<HeroMode>("notes");

  // Interactive Card Flip state
  const [cardFlipped, setCardFlipped] = useState(false);

  // Interactive Quiz state
  const [quizSelected, setQuizSelected] = useState<number | null>(null);

  // Audio Podcast playback state
  const [audioPlaying, setAudioPlaying] = useState(false);

  return (
    <section className="relative w-full pt-20 sm:pt-24 pb-12 sm:pb-16 select-none overflow-hidden">
      {/* Ambient Atmospheric Glow (Subtle Sand/Sky Halos) */}
      <div
        className="absolute top-10 right-0 w-full lg:w-[60%] h-[550px] -z-10 pointer-events-none opacity-70 dark:opacity-30"
        style={{
          background: "radial-gradient(ellipse 85% 65% at 70% 30%, rgba(14,165,233,0.12) 0%, rgba(245,158,11,0.08) 45%, transparent 75%)",
          filter: "blur(60px)",
        }}
        aria-hidden="true"
      />

      <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Column: Copy & Value Proposition */}
        <div className="lg:col-span-6 flex flex-col items-start text-left space-y-5">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/5 dark:bg-white/10 border border-slate-900/10 dark:border-white/15 text-slate-900 dark:text-white text-xs font-semibold shadow-xs">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Multimodal Study Workspace</span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">1 Source → 5 Modes</span>
          </div>

          {/* Headline */}
          <h1 className="text-[clamp(34px,4.4vw,56px)] font-extrabold tracking-tight leading-[1.08] text-slate-900 dark:text-white font-display text-balance">
            Turn Any Dense Source Into{" "}
            <span className="text-primary relative inline-block">
              5 Verified Study Modes.
              <svg
                className="absolute -bottom-1.5 left-0 w-full h-2 text-primary/40"
                viewBox="0 0 100 20"
                preserveAspectRatio="none"
              >
                <path d="M0 15 Q 50 2 100 15" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
              </svg>
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg leading-relaxed text-slate-600 dark:text-slate-300 max-w-[520px]">
            Ingest dense textbooks, 2-hour lecture recordings, or research papers. Source.io derivers
            streamed Markdown notes with LaTeX, Leitner flashcards, interactive quizzes, 2-host audio recaps,
            and sentence-level cited chat.
          </p>

          {/* Action CTAs: Direct Demo & Signup */}
          <div className="flex flex-wrap items-center gap-3 pt-2 w-full sm:w-auto">
            <Link
              href={mounted && user ? "/app" : "/auth"}
              className="px-6 py-3 rounded-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 active:scale-98 text-white dark:text-slate-950 font-semibold text-sm shadow-tactile-pill transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>{mounted && user ? "Open study workspace" : "Get started free"}</span>
              <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              href="/app/doc/demo-quantum"
              className="px-5 py-3 rounded-full bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-98 text-slate-800 dark:text-slate-200 font-semibold text-sm border border-black/[0.08] dark:border-white/10 shadow-tactile-pill transition-all flex items-center justify-center gap-2 cursor-pointer group"
            >
              <Sparkles className="size-4 text-amber-500" />
              <span>Explore live demo</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 text-slate-500">
                No sign up
              </span>
            </Link>
          </div>

          {/* Trust Guarantees */}
          <div className="pt-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-emerald-500" />
              <span>25 free AI actions / day</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-emerald-500" />
              <span>3 saved document slots</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-emerald-500" />
              <span>Zero credit card required</span>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Tactile Workspace Stage */}
        <div className="lg:col-span-6 w-full">
          <div className="rounded-[32px] sm:rounded-[36px] bg-white dark:bg-slate-900/90 border border-black/[0.06] dark:border-white/10 p-4 sm:p-6 shadow-tactile-dock relative overflow-hidden flex flex-col justify-between">
            {/* Stage Header: Ingested Source Badge & Real-Time Coordinates */}
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-white/10 pb-3 mb-4">
              <div className="flex items-center gap-2.5 truncate">
                <div className="size-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <FileText className="size-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate font-display">
                    Introduction to Quantum Computing
                  </h4>
                  <p className="text-[10px] font-mono text-slate-400">PDF • 38 pages • 48 vector coordinates</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Ready
                </span>
              </div>
            </div>

            {/* 5 Modality Tabs Navigation */}
            <div className="grid grid-cols-5 gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-white/[0.04] mb-4">
              {MODES.map((tab) => {
                const isActive = activeMode === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveMode(tab.id)}
                    type="button"
                    className={cn(
                      "py-2 px-1 rounded-xl text-center flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer relative group",
                      isActive
                        ? "bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-tactile-pill font-bold"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium"
                    )}
                  >
                    <div
                      className={cn(
                        "size-6 sm:size-7 rounded-lg flex items-center justify-center transition-transform",
                        isActive ? "scale-105 bg-primary/10 text-primary" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200"
                      )}
                    >
                      <Icon className="size-4 shrink-0" />
                    </div>
                    <span className="text-[10px] truncate max-w-full leading-none">
                      {tab.label.split(" ")[0]}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Interactive Dynamic Stage Body */}
            <div className="min-h-[260px] flex flex-col justify-between">
              <AnimatePresence mode="wait">
                {/* 1. Structured Notes View */}
                {activeMode === "notes" && (
                  <motion.div
                    key="notes"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0 shadow-xs">
                        <FileText className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-900 dark:text-white text-xs truncate">
                            § 1. Fundamental Quantum Mechanics
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                            p. 2 • §1.1 • 98% match
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono">Cornell hierarchical notes with KaTeX equations</p>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      Quantum Computing leverages linear superpositions of physical states. A qubit state is expressed mathematically as:
                    </p>

                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/10 text-center font-mono text-xs sm:text-sm text-slate-900 dark:text-white shadow-tactile-inset">
                      |ψ⟩ = α|0⟩ + β|1⟩ &nbsp;&nbsp;where |α|² + |β|² = 1
                    </div>

                    <div className="p-2.5 rounded-xl bg-amber-500/5 dark:bg-amber-400/5 border border-amber-500/20 text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-2">
                      <Sparkles className="size-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span>
                        <strong>Key Insight:</strong> Algorithms use quantum interference to cancel incorrect candidate states and amplify probability amplitudes.
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* 2. Spaced Repetition Flashcards */}
                {activeMode === "cards" && (
                  <motion.div
                    key="cards"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0 shadow-xs">
                        <Layers className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-900 dark:text-white text-xs truncate">
                            Card 1 of 4 • Spaced Repetition
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
                            Leitner: 4 Days
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono">Active recall testing with memory decay intervals</p>
                      </div>
                    </div>

                    <div
                      onClick={() => setCardFlipped(!cardFlipped)}
                      className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/10 hover:border-primary/40 transition-all cursor-pointer min-h-[130px] flex flex-col justify-between shadow-tactile-inset"
                    >
                      <div className="text-[10px] uppercase font-mono text-slate-400 tracking-wider">
                        {cardFlipped ? "Answer / Definition" : "Prompt / Question (Click to flip)"}
                      </div>

                      <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white text-center py-2">
                        {cardFlipped
                          ? "The principle allowing a qubit to exist as a linear combination of |0⟩ and |1⟩ until physical measurement forces a state collapse."
                          : "What is Quantum Superposition?"}
                      </div>

                      <div className="text-[10px] text-center text-slate-400">
                        {cardFlipped ? "Tap to show prompt" : "Tap card to flip"}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Retention Score: <strong className="text-emerald-500">94.2%</strong></span>
                      <span className="text-[11px] font-mono text-slate-400">Source: §1.1 • p. 2</span>
                    </div>
                  </motion.div>
                )}

                {/* 3. Practice Quiz */}
                {activeMode === "quiz" && (
                  <motion.div
                    key="quiz"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-2.5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0 shadow-xs">
                        <ListChecks className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-900 dark:text-white text-xs truncate">
                            Question 1 • Diagnostic Mastery
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                            Multiple Choice
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono">Instant verification anchored to source proofs</p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                      Which physical phenomenon describes a qubit losing its quantum state due to thermal noise?
                    </p>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {["Quantum Entanglement", "Environmental Decoherence", "Superposition Collapse", "Phase Inversion"].map(
                        (choice, idx) => {
                          const isCorrect = choice === "Environmental Decoherence";
                          const isSelected = quizSelected === idx;

                          return (
                            <button
                              key={choice}
                              onClick={() => setQuizSelected(idx)}
                              className={cn(
                                "p-2 rounded-xl text-left text-[11px] font-medium transition-all border cursor-pointer",
                                isSelected
                                  ? isCorrect
                                    ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-200"
                                    : "bg-red-50 dark:bg-red-950/40 border-red-500 text-red-800 dark:text-red-200"
                                  : "bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/10 hover:bg-slate-100 text-slate-700 dark:text-slate-300"
                              )}
                            >
                              {choice}
                            </button>
                          );
                        }
                      )}
                    </div>

                    {quizSelected !== null && (
                      <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-[10px] text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                        <span>✓ Verified from Section §1.3 (p. 4) of ingested PDF</span>
                        <button onClick={() => setQuizSelected(null)} className="underline cursor-pointer">Reset</button>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* 4. Podcast Audio Recap */}
                {activeMode === "podcast" && (
                  <motion.div
                    key="podcast"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0 shadow-xs">
                        <Headphones className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-900 dark:text-white text-xs truncate">
                            2-Host Conversational Audio Recap
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                            Clara & Julian
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono">Conversational Socratic recap synthesized from text</p>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950 text-white flex items-center justify-between gap-4 shadow-tactile-pill">
                      <button
                        onClick={() => setAudioPlaying(!audioPlaying)}
                        className="size-11 rounded-full bg-white text-slate-950 flex items-center justify-center shrink-0 hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                      >
                        {audioPlaying ? <Pause className="size-5" /> : <Play className="size-5 translate-x-0.5" />}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-bold truncate">Episode 01: The Qubit Paradox</span>
                          <span className="font-mono text-[10px] text-slate-400">03:42 / 12:15</span>
                        </div>

                        {/* Animated Equalizer Waveform Bars */}
                        <div className="flex items-center gap-1 h-5">
                          {Array.from({ length: 24 }).map((_, i) => (
                            <div
                              key={i}
                              className={cn(
                                "flex-1 rounded-full bg-primary transition-all",
                                audioPlaying
                                  ? "animate-pulse"
                                  : "opacity-40"
                              )}
                              style={{
                                height: `${Math.max(15, (Math.sin(i * 0.7) + 1.2) * 45)}%`,
                                animationDelay: `${i * 60}ms`,
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/10 text-[11px] text-slate-600 dark:text-slate-300">
                      <strong className="text-slate-900 dark:text-white">Clara:</strong> &quot;Think of classical bits as a coin lying flat on a table, heads or tails. Superposition is spinning that coin in mid-air...&quot;
                    </div>
                  </motion.div>
                )}

                {/* 5. Grounded Cited Chat Copilot */}
                {activeMode === "chat" && (
                  <motion.div
                    key="chat"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0 shadow-xs">
                        <MessagesSquare className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-900 dark:text-white text-xs truncate">
                            Document Ask Copilot
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 font-semibold">
                            Grounded Search
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono">Every statement anchored to immutable page & line coordinates</p>
                      </div>
                    </div>

                    {/* Question Bubble */}
                    <div className="p-2.5 rounded-2xl bg-slate-100 dark:bg-white/[0.06] text-xs text-slate-800 dark:text-slate-200 max-w-[85%] self-end ml-auto">
                      &quot;How does Grover&apos;s algorithm improve upon classical search?&quot;
                    </div>

                    {/* Answer Bubble with Coordinates */}
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/10 text-xs text-slate-700 dark:text-slate-300 space-y-2">
                      <p>
                        It delivers a <strong>quadratic speedup</strong>: searching an unsorted database of N items requires O(√N) queries instead of classical O(N).
                      </p>
                      <div className="pt-1.5 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between text-[10px] font-mono">
                        <span className="text-primary font-bold">Passage §2.4 (Page 7)</span>
                        <span className="text-emerald-500 font-semibold">Cosine 0.96</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Stage Footer: Direct Launch Link */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px]">Click any mode above to preview interactive synthesis</span>
              <Link
                href="/app/doc/demo-quantum"
                className="font-semibold text-primary hover:underline flex items-center gap-1 text-[11px]"
              >
                <span>Full workspace demo</span>
                <ChevronRight className="size-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
