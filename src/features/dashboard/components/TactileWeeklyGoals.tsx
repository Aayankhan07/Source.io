"use client";

import React, { useState } from "react";
import { ChevronDown, CheckCircle2, Clock, BookOpen, Layers, Check, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface GoalTarget {
  id: string;
  title: string;
  metric: string;
  current: number;
  target: number;
  unit: string;
  color: string;
  icon: React.ElementType;
}

interface GoalTask {
  id: string;
  title: string;
  category: "Flashcards" | "Quiz" | "Notes" | "Podcast";
  completed: boolean;
}

export function TactileWeeklyGoals() {
  const { toast } = useToast();
  const [filter, setFilter] = useState<"Day" | "Week" | "Month">("Week");
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);

  // Targets by timeframe
  const targetsByFilter: Record<string, GoalTarget[]> = {
    Day: [
      { id: "t-1", title: "Daily Focus", metric: "Study Time", current: 2.5, target: 3.0, unit: "h", color: "bg-cyan-500", icon: Clock },
      { id: "t-2", title: "Card Reviews", metric: "Flashcards", current: 18, target: 20, unit: " cards", color: "bg-indigo-500", icon: Layers },
      { id: "t-3", title: "Day Retention", metric: "Recall", current: 85, target: 90, unit: "%", color: "bg-emerald-500", icon: Sparkles },
    ],
    Week: [
      { id: "t-1", title: "Target Hours", metric: "Hours Studied", current: 9.5, target: 12.0, unit: "h", color: "bg-cyan-500", icon: Clock },
      { id: "t-2", title: "Sources Covered", metric: "Synthesized", current: 4, target: 5, unit: " docs", color: "bg-indigo-500", icon: BookOpen },
      { id: "t-3", title: "Target Retention", metric: "Comprehension", current: 88, target: 90, unit: "%", color: "bg-emerald-500", icon: Sparkles },
    ],
    Month: [
      { id: "t-1", title: "Monthly Hours", metric: "Total Hours", current: 38, target: 45, unit: "h", color: "bg-cyan-500", icon: Clock },
      { id: "t-2", title: "Curriculum Sets", metric: "Mastered", current: 14, target: 18, unit: " docs", color: "bg-indigo-500", icon: BookOpen },
      { id: "t-3", title: "Overall Retention", metric: "Long-term Recall", current: 89, target: 92, unit: "%", color: "bg-emerald-500", icon: Sparkles },
    ],
  };

  const [tasks, setTasks] = useState<GoalTask[]>([
    { id: "g-1", title: "Review 15 Spaced Repetition cards", category: "Flashcards", completed: false },
    { id: "g-2", title: "Complete Chapter 2 Distributed quiz", category: "Quiz", completed: false },
    { id: "g-3", title: "Listen to Socratic audio walkthrough", category: "Podcast", completed: true },
  ]);

  const activeTargets = targetsByFilter[filter] || targetsByFilter.Week;

  const handleToggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const nextCompleted = !t.completed;
          if (nextCompleted) {
            toast({
              title: "Goal Milestone Met! 🎉",
              description: `Completed "${t.title}". Great active study work!`,
            });
          }
          return { ...t, completed: nextCompleted };
        }
        return t;
      })
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900/90 rounded-[32px] p-5 sm:p-6 border border-black/[0.04] dark:border-white/10 shadow-tactile-card flex flex-col justify-between select-none relative h-full">
      {/* Top Header & Dropdown */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold font-display text-slate-900 dark:text-white tracking-tight">
            Weekly Goals Progress
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Track study hours, document coverage, and retention
          </p>
        </div>

        {/* Filter Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setFilterMenuOpen((prev) => !prev)}
            className="h-8 px-3 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>{filter}</span>
            <ChevronDown className="size-3 text-slate-500" />
          </button>

          <AnimatePresence>
            {filterMenuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                className="absolute right-0 top-10 w-28 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-1 z-30 flex flex-col gap-0.5"
              >
                {(["Day", "Week", "Month"] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      setFilter(opt);
                      setFilterMenuOpen(false);
                    }}
                    className={cn(
                      "w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer",
                      filter === opt
                        ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950 font-semibold"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Target Progress Rows */}
      <div className="space-y-3.5 mb-4">
        {activeTargets.map((target) => {
          const Icon = target.icon;
          const percent = Math.min(100, Math.round((target.current / target.target) * 100));

          return (
            <div key={target.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                  <Icon className="size-3.5 text-slate-400" />
                  <span>{target.title}</span>
                </span>
                <span className="font-mono text-slate-500 dark:text-slate-400 font-semibold">
                  {target.current} / {target.target}{target.unit} ({percent}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className={cn("h-full rounded-full", target.color)}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Actionable Goals Checklist */}
      <div className="pt-3 border-t border-slate-100 dark:border-white/5 space-y-2">
        <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold block mb-1">
          Active Study Targets
        </span>
        {tasks.map((task) => (
          <button
            key={task.id}
            type="button"
            onClick={() => handleToggleTask(task.id)}
            className={cn(
              "w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between text-xs cursor-pointer",
              task.completed
                ? "bg-slate-50/60 dark:bg-white/[0.02] border-emerald-500/30 text-slate-400 dark:text-slate-500 line-through"
                : "bg-white dark:bg-slate-800/60 border-slate-200/80 dark:border-white/10 text-slate-800 dark:text-slate-200 hover:border-blue-500/40"
            )}
          >
            <div className="flex items-center gap-2.5 min-w-0 pr-2">
              <div
                className={cn(
                  "size-4 rounded-md border flex items-center justify-center transition-colors shrink-0",
                  task.completed
                    ? "bg-emerald-600 border-emerald-600 text-white"
                    : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                )}
              >
                {task.completed && <Check className="size-3 stroke-[3]" />}
              </div>
              <span className="truncate font-medium">{task.title}</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 shrink-0">
              {task.category}
            </span>
          </button>
        ))}

        {tasks.every((t) => t.completed) && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/25 flex items-center gap-3 mt-2 shadow-2xs"
          >
            <div className="size-9 rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-base shrink-0 border border-emerald-500/30">
              🏆
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-emerald-800 dark:text-emerald-200">
                Targets Mastered!
              </div>
              <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80 leading-tight mt-0.5">
                All study milestones reached. Memory retention probability peaked at 92%.
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
