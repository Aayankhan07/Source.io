"use client";

import React, { useState } from "react";
import { ChevronDown, CheckCircle2, BookOpen, Layers, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface TaskItem {
  id: string;
  title: string;
  category: string;
  progress: number;
  completed: boolean;
}

export function TactileDailyGoals() {
  const { toast } = useToast();
  const [filter, setFilter] = useState<"Day" | "Week" | "Month">("Day");
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);

  const initialTasks: Record<string, TaskItem[]> = {
    Day: [
      {
        id: "d-1",
        title: "Review 15 Spaced Repetition cards",
        category: "Flashcards",
        progress: 57,
        completed: false,
      },
      {
        id: "d-2",
        title: "Complete Chapter 2 Distributed quiz",
        category: "Quizzes",
        progress: 42,
        completed: false,
      },
    ],
    Week: [
      {
        id: "w-1",
        title: "Master 50 Quantum Computing terms",
        category: "Flashcards",
        progress: 80,
        completed: false,
      },
      {
        id: "w-2",
        title: "Complete MIT 6.824 Consensus Lab",
        category: "Study",
        progress: 65,
        completed: false,
      },
    ],
    Month: [
      {
        id: "m-1",
        title: "Finish 12 Lecture Transcriptions",
        category: "Audio",
        progress: 92,
        completed: false,
      },
      {
        id: "m-2",
        title: "Maintain 30-Day Study Streak",
        category: "Habit",
        progress: 74,
        completed: false,
      },
    ],
  };

  const [taskMap, setTaskMap] = useState<Record<string, TaskItem[]>>(initialTasks);

  const currentTasks = taskMap[filter] || [];

  const handleToggleTask = (taskId: string) => {
    setTaskMap((prev) => {
      const updated = prev[filter].map((t) => {
        if (t.id === taskId) {
          const isDone = !t.completed;
          if (isDone) {
            toast({
              title: "Task Completed! 🎉",
              description: `Great job finishing "${t.title}".`,
            });
          }
          return {
            ...t,
            completed: isDone,
            progress: isDone ? 100 : 50,
          };
        }
        return t;
      });
      return { ...prev, [filter]: updated };
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900/90 rounded-[32px] p-5 sm:p-6 border border-black/[0.04] dark:border-white/10 shadow-tactile-card flex flex-col justify-between select-none relative">
      {/* Header with Title & Filter */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold font-display text-slate-900 dark:text-white tracking-tight">
            Homework
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Click tasks to mark them complete
          </p>
        </div>

        {/* Working Dropdown Menu */}
        <div className="relative">
          <button 
            onClick={() => setFilterMenuOpen((prev) => !prev)}
            className="h-8 px-3 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>{filter}</span>
            <ChevronDown className="size-3" />
          </button>

          <AnimatePresence>
            {filterMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.95 }}
                className="absolute right-0 mt-2 w-28 bg-white dark:bg-slate-900 rounded-[18px] border border-black/[0.06] dark:border-white/10 p-1.5 shadow-tactile-dock z-40"
              >
                {(["Day", "Week", "Month"] as const).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      setFilter(opt);
                      setFilterMenuOpen(false);
                    }}
                    className={cn(
                      "w-full px-2.5 py-1.5 rounded-[12px] text-xs font-semibold text-left transition-colors cursor-pointer",
                      filter === opt
                        ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
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

      {/* Task List with Tactile Progress Bars */}
      <div className="flex flex-col gap-3.5">
        {currentTasks.map((task) => (
          <div 
            key={task.id} 
            onClick={() => handleToggleTask(task.id)}
            className="p-2.5 rounded-[20px] hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Icon Pill - Shows checkmark when done */}
                <div className={cn(
                  "size-9 rounded-[14px] flex items-center justify-center shrink-0 shadow-2xs transition-colors",
                  task.completed 
                    ? "bg-emerald-500 text-white" 
                    : "bg-[#1E232A] text-white dark:bg-white dark:text-slate-950"
                )}>
                  {task.completed ? <Check className="size-4 stroke-[3]" /> : <BookOpen className="size-4" />}
                </div>
                <span className={cn(
                  "text-xs sm:text-sm font-semibold truncate transition-colors",
                  task.completed 
                    ? "line-through text-slate-400 dark:text-slate-500" 
                    : "text-slate-900 dark:text-white"
                )}>
                  {task.title}
                </span>
              </div>

              {/* Percentage Badge */}
              <span className={cn(
                "text-xs sm:text-sm font-bold font-mono tabular-nums shrink-0",
                task.completed ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-white"
              )}>
                {task.progress}%
              </span>
            </div>

            {/* Progress Bar Track */}
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${task.progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className={cn(
                  "h-full rounded-full transition-colors",
                  task.completed 
                    ? "bg-emerald-500" 
                    : "bg-gradient-to-r from-emerald-500 to-emerald-400"
                )}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
