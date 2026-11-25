"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { track } from "@/lib/analytics/track";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth/context/AuthContext";
import { learningKeys } from "@/lib/queryKeys";
import type { Json } from "@/integrations/supabase/types";
import { isPersistableId } from "./ids";

export interface QuizBest {
  /** Best percentage (0-100) across the user's previous attempts. */
  percent: number;
  score: number;
  total: number;
  attempts: number;
}

export interface QuizAttemptAnswer {
  question_id: string;
  answer: string;
  correct: boolean;
}

export interface QuizAttemptInput {
  score: number;
  total: number;
  answers: QuizAttemptAnswer[];
}

/** Best previous score for a quiz, plus a recorder for finished attempts. */
export function useQuizAttempts(quizId: string | null | undefined) {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const enabled = !!userId && isPersistableId(quizId);
  const key = learningKeys.quizBest(userId, quizId ?? "");

  const best = useQuery({
    queryKey: key,
    enabled,
    staleTime: 60_000,
    queryFn: async (): Promise<QuizBest | null> => {
      const { data, error } = await supabase
        .from("quiz_attempts")
        .select("score, total")
        .eq("quiz_id", quizId!)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      let top: QuizBest | null = null;
      for (const row of data ?? []) {
        const total = Number(row.total) || 0;
        const score = Number(row.score) || 0;
        const percent = total > 0 ? Math.round((score / total) * 100) : 0;
        if (!top || percent > top.percent) top = { percent, score, total, attempts: 0 };
      }
      return top ? { ...top, attempts: data?.length ?? 0 } : null;
    },
  });

  const record = useMutation({
    mutationFn: async (attempt: QuizAttemptInput) => {
      const { error } = await supabase.from("quiz_attempts").insert({
        quiz_id: quizId!,
        user_id: userId!,
        score: attempt.score,
        total: attempt.total,
        answers: attempt.answers as unknown as Json,
      });
      if (error) throw error;
      track("quiz_completed", { score_pct: attempt.total > 0 ? Math.round((attempt.score / attempt.total) * 100) : 0 });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: key });
    },
  });

  return {
    enabled,
    /** Best score from attempts saved before this render (null when none / disabled). */
    best: enabled ? (best.data ?? null) : null,
    recordAttempt: (attempt: QuizAttemptInput) => {
      if (enabled) record.mutate(attempt);
    },
  };
}
