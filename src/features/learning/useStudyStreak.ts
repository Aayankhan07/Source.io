"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth/context/AuthContext";
import { learningKeys } from "@/lib/queryKeys";
import { computeStudyStreak, type StudyStreak } from "./streak";

/** How far back activity is read. The longest streak is computed within this window. */
const LOOKBACK_DAYS = 365;
const ROW_LIMIT = 5000;

/**
 * Current and longest study streak from real activity: flashcard reviews
 * (first + latest review day per card), quiz attempts and AI chat questions.
 * See streak.ts for why flashcard_reviews alone would undercount.
 */
export function useStudyStreak(enabled = true) {
  const { user } = useAuth();
  const userId = user?.id;

  const query = useQuery({
    queryKey: learningKeys.studyStreak(userId),
    enabled: enabled && !!userId,
    staleTime: 60_000,
    queryFn: async (): Promise<string[]> => {
      const since = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000).toISOString();
      // Newest first, so a server-side row cap trims old history rather than the current streak.
      const [reviewsRes, quizRes, chatRes] = await Promise.all([
        supabase
          .from("flashcard_reviews")
          .select("created_at, updated_at")
          .eq("user_id", userId!)
          .gte("updated_at", since)
          .order("updated_at", { ascending: false })
          .limit(ROW_LIMIT),
        supabase
          .from("quiz_attempts")
          .select("created_at")
          .eq("user_id", userId!)
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .limit(ROW_LIMIT),
        supabase
          .from("ai_usage_logs")
          .select("created_at")
          .eq("user_id", userId!)
          .eq("feature", "chat")
          .eq("status", "succeeded")
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .limit(ROW_LIMIT),
      ]);
      const firstError = reviewsRes.error ?? quizRes.error ?? chatRes.error;
      if (firstError) throw firstError;
      const out: string[] = [];
      for (const r of reviewsRes.data ?? []) out.push(r.created_at, r.updated_at);
      for (const r of quizRes.data ?? []) if (r.created_at) out.push(r.created_at);
      for (const r of chatRes.data ?? []) if (r.created_at) out.push(r.created_at);
      return out;
    },
  });

  const streak = useMemo<StudyStreak | null>(
    () => (query.data ? computeStudyStreak(query.data, new Date()) : null),
    [query.data],
  );

  return {
    streak,
    isLoading: enabled && !!userId && query.isLoading,
    isError: query.isError,
  };
}
