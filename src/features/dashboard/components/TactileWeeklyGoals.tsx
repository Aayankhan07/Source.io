"use client";

import React, { useMemo, useState } from "react";
import { BookOpen, FileText, Layers, CheckCircle2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { accountKeys } from "@/lib/queryKeys";
import { useAuth } from "@/features/auth/context/AuthContext";
import { cn } from "@/lib/utils";
import { startOfLocalDay, startOfWeek } from "../lib/activity";

type Period = "Week" | "Month";

interface ProgressCounts {
  sources: number;
  notes: number;
  flashcards: number;
  quizzes: number;
}

function periodStart(period: Period, now: Date): Date {
  if (period === "Week") return startOfWeek(now);
  const d = startOfLocalDay(now);
  d.setDate(1);
  return d;
}

/**
 * Real activity for the current week/month, counted from the user's own rows.
 * No targets or percentages are shown until users can set their own goals.
 */
export function TactileWeeklyGoals() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<Period>("Week");
  const sinceIso = useMemo(() => periodStart(period, new Date()).toISOString(), [period]);

  const { data, isLoading, isError } = useQuery({
    queryKey: accountKeys.weeklyProgress(user?.id, sinceIso),
    enabled: !!user?.id,
    staleTime: 30_000,
    queryFn: async (): Promise<ProgressCounts> => {
      const head = { count: "exact", head: true } as const;
      const [docs, notes, cards, attempts] = await Promise.all([
        supabase.from("documents").select("id", head).gte("created_at", sinceIso),
        supabase.from("notes").select("id", head).gte("created_at", sinceIso),
        supabase.from("flashcards").select("id", head).gte("created_at", sinceIso),
        supabase.from("quiz_attempts").select("id", head).gte("created_at", sinceIso),
      ]);
      const firstError = docs.error ?? notes.error ?? cards.error ?? attempts.error;
      if (firstError) throw firstError;
      return {
        sources: docs.count ?? 0,
        notes: notes.count ?? 0,
        flashcards: cards.count ?? 0,
        quizzes: attempts.count ?? 0,
      };
    },
  });

  const rows: { id: keyof ProgressCounts; label: string; icon: React.ElementType }[] = [
    { id: "sources", label: "Sources added", icon: BookOpen },
    { id: "notes", label: "Notes generated", icon: FileText },
    { id: "flashcards", label: "Flashcards generated", icon: Layers },
    { id: "quizzes", label: "Quizzes taken", icon: CheckCircle2 },
  ];

  const total = data ? data.sources + data.notes + data.flashcards + data.quizzes : 0;
  const periodLabel = period === "Week" ? "this week" : "this month";

  return (
    <div className="bg-card rounded-[32px] p-5 sm:p-6 border border-border shadow-tactile-card flex flex-col select-none relative h-full">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold font-display text-foreground tracking-tight">
            {period === "Week" ? "This Week" : "This Month"}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">What you created and studied {periodLabel}.</p>
        </div>

        <div className="flex items-center p-0.5 rounded-full bg-muted" role="tablist" aria-label="Period">
          {(["Week", "Month"] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              role="tab"
              aria-selected={period === opt}
              onClick={() => setPeriod(opt)}
              className={cn(
                "h-7 px-3 rounded-full text-xs font-semibold transition-colors cursor-pointer",
                period === opt ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <ul className="divide-y divide-border rounded-[20px] border border-border overflow-hidden bg-muted/20">
        {rows.map((row) => {
          const Icon = row.icon;
          return (
            <li key={row.id} className="flex items-center justify-between p-3 text-xs">
              <span className="flex items-center gap-2 font-medium text-foreground">
                <Icon className="size-3.5 text-muted-foreground" />
                {row.label}
              </span>
              <span className="font-mono font-bold text-foreground">
                {isLoading ? "–" : isError ? "?" : (data?.[row.id] ?? 0)}
              </span>
            </li>
          );
        })}
      </ul>

      <p className="text-xs text-muted-foreground mt-3">
        {isError
          ? "Could not load your activity. Try refreshing."
          : !isLoading && total === 0
            ? `Nothing yet ${periodLabel}. Open a source and generate notes, cards, or a quiz to get started.`
            : "Counts update as you study."}{" "}
        Quiz attempts are not recorded yet, so that count stays at 0 for now.
      </p>
    </div>
  );
}
