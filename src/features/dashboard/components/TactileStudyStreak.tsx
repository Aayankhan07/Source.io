"use client";

import { Flame, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStudyStreak } from "@/features/learning/useStudyStreak";

function days(n: number) {
  return `${n} day${n === 1 ? "" : "s"}`;
}

/** Study streak from real reviews, quiz attempts and chat questions. No placeholder values. */
export function TactileStudyStreak() {
  const { streak, isLoading, isError } = useStudyStreak();
  const current = streak?.current ?? 0;
  const longest = streak?.longest ?? 0;

  let hint: string;
  if (isError) hint = "Could not load your streak. Try refreshing.";
  else if (isLoading) hint = "Loading your activity…";
  else if (current === 0) hint = "Review a few cards to start a streak.";
  else if (streak?.activeToday) hint = "You studied today. Come back tomorrow to keep it going.";
  else hint = "Review a card today to keep your streak alive.";

  return (
    <div className="bg-card rounded-[32px] p-5 sm:p-6 border border-border shadow-tactile-card flex flex-col gap-4 h-full select-none">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base sm:text-lg font-bold font-display text-foreground tracking-tight">Study streak</h2>
        <Flame
          className={cn("size-5", current > 0 ? "text-orange-500" : "text-muted-foreground")}
          aria-hidden="true"
        />
      </div>

      <div className="flex items-end gap-6">
        <div>
          <p className="text-4xl font-extrabold font-display text-foreground leading-none" aria-live="polite">
            {isLoading || isError ? "–" : current}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{current === 1 ? "day in a row" : "days in a row"}</p>
        </div>
        {longest > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground pb-1">
            <Trophy className="size-3.5" aria-hidden="true" />
            <span>
              Best: <span className="font-mono font-bold text-foreground">{days(longest)}</span>
            </span>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
