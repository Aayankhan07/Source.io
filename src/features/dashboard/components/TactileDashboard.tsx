"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { queryKeys } from "@/lib/queryKeys";
import { useAuth } from "@/features/auth/context/AuthContext";
import { DocumentRow } from "@/features/documents/types";
import { useAppShell } from "@/features/documents/context/AppShellContext";
import { Search, X, Layers, RotateCcw, Check, Sparkles, ArrowRight, BookOpen, Brain, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

import { TactileTopBar } from "./TactileTopBar";
import { TactileSourceCards } from "./TactileSourceCards";
import { TactilePerformanceChart } from "./TactilePerformanceChart";
import { TactileDailyGoals } from "./TactileDailyGoals";
import { TactileLeaderboard } from "./TactileLeaderboard";

export function TactileDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { openUpload } = useAppShell();
  const [activePill, setActivePill] = useState("dashboard");
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");

  // Query actual user documents
  const { data: documents = [], isLoading } = useQuery({
    queryKey: queryKeys.documents,
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("id,title,source_type,status,error_code,created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as DocumentRow[];
    },
  });

  // Interactive Flashcards state for "Flashcards" tab
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardStats, setCardStats] = useState({ reviewed: 14, mastered: 11 });

  const flashcards = [
    {
      id: "fc-1",
      subject: "Quantum Computing",
      front: "What is Quantum Superposition?",
      back: "A principle allowing a qubit to exist as a linear combination of |0⟩ and |1⟩ simultaneously until measured: |ψ⟩ = α|0⟩ + β|1⟩.",
      box: "Box 3 (14d interval)",
    },
    {
      id: "fc-2",
      subject: "Distributed Systems",
      front: "What guarantees Leader Election safety in Raft?",
      back: "At most one leader can be elected in a given term through randomized election timeouts and majority vote quorums.",
      box: "Box 2 (4d interval)",
    },
    {
      id: "fc-3",
      subject: "Molecular Biology",
      front: "What is the function of DNA Helicase?",
      back: "Unwinds the double helix at replication forks, breaking hydrogen bonds between complementary base pairs.",
      box: "Box 1 (1d interval)",
    },
  ];

  // Interactive Quiz state for "Quizzes" tab
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const sampleQuiz = {
    title: "Quantum & Distributed Systems Verification",
    question: "Which quantum phenomenon causes exponential state scaling (2^N) across entangled qubits?",
    options: [
      "Thermal Phase Relaxation",
      "Quantum Superposition & Bell State Entanglement",
      "Classical Bit-Flip Parity",
      "Decoherence Leakage",
    ],
    correct: 1,
    explanation: "Entanglement links qubit amplitudes together such that N qubits require 2^N complex probability numbers to represent.",
  };

  const handleSelectQuizOption = (idx: number) => {
    setSelectedOption(idx);
    setQuizScore(idx === sampleQuiz.correct ? 100 : 0);
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Top Floating Pill Navigation & User Controls (No theme toggle in navbar) */}
      <TactileTopBar
        activePill={activePill}
        onSelectPill={setActivePill}
        onOpenSearch={() => setSearchModalOpen(true)}
      />

      {/* Main Page Title Header */}
      <div className="mb-5 sm:mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-slate-900 dark:text-white tracking-tight">
            {activePill === "dashboard" && "Dashboard"}
            {activePill === "sources" && "Study Sources & Textbooks"}
            {activePill === "flashcards" && "Spaced Repetition Deck"}
            {activePill === "quizzes" && "Adaptive Quizzes & Mock Exams"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {activePill === "dashboard" && "Track daily performance, active study sets, and peer rankings."}
            {activePill === "sources" && "Consolidated papers, audio lectures, and YouTube video sets."}
            {activePill === "flashcards" && "Leitner cognitive interval review — surfaces cards right before memory decay."}
            {activePill === "quizzes" && "Ground your memory with citations back to source paragraphs."}
          </p>
        </div>

        {activePill !== "dashboard" && (
          <button
            onClick={() => setActivePill("dashboard")}
            className="h-9 px-4 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            ← Back to Dashboard
          </button>
        )}
      </div>

      {/* VIEW 1: Main Dashboard Grid (matching reference image) */}
      {activePill === "dashboard" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
          {/* Left Column: Select a Course / Source List (Col 5) */}
          <div className="lg:col-span-5 w-full">
            <TactileSourceCards
              documents={documents}
              isLoading={isLoading}
              onNewSource={openUpload}
              onExpandView={() => setActivePill("sources")}
            />
          </div>

          {/* Right Column: Performance Chart + Bottom Widgets (Col 7) */}
          <div className="lg:col-span-7 flex flex-col gap-5 sm:gap-6 w-full">
            {/* Top Performance Chart */}
            <TactilePerformanceChart />

            {/* Bottom 2 Split Cards: Homework Goals & Friends Score */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
              <TactileDailyGoals />
              <TactileLeaderboard />
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: Study Sources Tab */}
      {activePill === "sources" && (
        <div className="w-full">
          <TactileSourceCards
            documents={documents}
            isLoading={isLoading}
            onNewSource={openUpload}
          />
        </div>
      )}

      {/* VIEW 3: Interactive Spaced Repetition Flashcards Tab */}
      {activePill === "flashcards" && (
        <div className="max-w-2xl mx-auto flex flex-col items-center gap-6 py-4">
          {/* Metric Bar */}
          <div className="w-full flex items-center justify-between px-2 text-xs font-semibold text-slate-500">
            <span>Card {currentCardIdx + 1} of {flashcards.length}</span>
            <span className="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-mono">
              {flashcards[currentCardIdx].box}
            </span>
            <span>Mastered: {cardStats.mastered}</span>
          </div>

          {/* Flip Flashcard */}
          <div
            onClick={() => setIsFlipped((prev) => !prev)}
            className="w-full h-80 rounded-[32px] bg-white dark:bg-slate-900 border border-black/[0.06] dark:border-white/10 p-8 shadow-tactile-dock flex flex-col justify-between cursor-pointer select-none relative hover:border-slate-300 dark:hover:border-slate-700 transition-all"
          >
            <div className="flex items-center justify-between text-xs font-medium text-slate-400">
              <span>{flashcards[currentCardIdx].subject}</span>
              <span className="text-[11px] underline">Click to flip ↻</span>
            </div>

            <div className="my-auto text-center">
              <span className="text-xs uppercase tracking-widest text-slate-400 font-bold block mb-3 font-mono">
                {isFlipped ? "Answer" : "Question"}
              </span>
              <p className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-white leading-relaxed">
                {isFlipped ? flashcards[currentCardIdx].back : flashcards[currentCardIdx].front}
              </p>
            </div>

            <div className="text-center text-xs text-slate-400">
              {isFlipped ? "Ready to rate your recall" : "Tap card to reveal answer"}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 w-full max-w-md justify-center">
            <button
              onClick={() => {
                setIsFlipped(false);
                setCurrentCardIdx((prev) => (prev + 1) % flashcards.length);
              }}
              className="flex-1 py-3 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-all cursor-pointer shadow-xs"
            >
              Review Again (1d)
            </button>
            <button
              onClick={() => {
                setCardStats((prev) => ({ ...prev, mastered: prev.mastered + 1 }));
                setIsFlipped(false);
                setCurrentCardIdx((prev) => (prev + 1) % flashcards.length);
              }}
              className="flex-1 py-3 rounded-full bg-[#1E232A] hover:bg-slate-800 text-white dark:bg-white dark:text-slate-950 text-xs font-bold transition-all cursor-pointer shadow-tactile-pill"
            >
              Got it Right (4d)
            </button>
          </div>
        </div>
      )}

      {/* VIEW 4: Interactive Quiz Tab */}
      {activePill === "quizzes" && (
        <div className="max-w-2xl mx-auto py-4">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-black/[0.06] dark:border-white/10 p-6 sm:p-8 shadow-tactile-dock">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold font-mono px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300">
                Active Assessment
              </span>
              <span className="text-xs text-slate-400 font-mono">1 Question • Instant Check</span>
            </div>

            <h3 className="text-xl font-bold font-display text-slate-900 dark:text-white mb-6 leading-snug">
              {sampleQuiz.question}
            </h3>

            <div className="flex flex-col gap-3 mb-6">
              {sampleQuiz.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectQuizOption(i)}
                  className={cn(
                    "p-4 rounded-[20px] border text-left text-sm font-semibold transition-all cursor-pointer flex items-center justify-between",
                    selectedOption === i
                      ? i === sampleQuiz.correct
                        ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200"
                        : "bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-900 dark:text-rose-200"
                      : "bg-slate-50/70 dark:bg-white/[0.03] border-slate-200/80 dark:border-white/10 text-slate-800 dark:text-slate-200 hover:bg-slate-100"
                  )}
                >
                  <span>{opt}</span>
                  {selectedOption === i && (
                    <span className="text-xs font-bold">
                      {i === sampleQuiz.correct ? "✓ Correct" : "✕ Try again"}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {selectedOption !== null && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-[20px] bg-slate-100 dark:bg-slate-800/60 text-xs text-slate-600 dark:text-slate-300 leading-relaxed"
              >
                <span className="font-bold text-slate-900 dark:text-white block mb-1">Explanation & Citation:</span>
                {sampleQuiz.explanation}
              </motion.div>
            )}
          </div>
        </div>
      )}

      {/* Global Quick Search Dialog Modal */}
      <AnimatePresence>
        {searchModalOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-950/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-[28px] border border-black/[0.08] dark:border-white/10 p-5 shadow-tactile-dock"
            >
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-white/10 pb-3 mb-3">
                <Search className="size-5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search sources, topics, flashcards, or quizzes..."
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  autoFocus
                  className="w-full bg-transparent text-sm sm:text-base text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
                />
                <button
                  onClick={() => setSearchModalOpen(false)}
                  className="size-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
                {[
                  { id: "demo-quantum", title: "Introduction to Quantum Computing", type: "PDF" },
                  { id: "demo-linalg", title: "Linear Algebra & Eigenvalues", type: "Textbook" },
                  { id: "demo-biology", title: "Molecular Biology & Genetics", type: "Audio" },
                ]
                  .filter((d) => d.title.toLowerCase().includes(globalSearch.toLowerCase()))
                  .map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setSearchModalOpen(false);
                        router.push(`/app/doc/${item.id}`);
                      }}
                      className="p-3 rounded-[16px] hover:bg-slate-50 dark:hover:bg-white/[0.04] text-left flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
                    >
                      <span>{item.title}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 font-mono text-slate-500">
                        {item.type}
                      </span>
                    </button>
                  ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
