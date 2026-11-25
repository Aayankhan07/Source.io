"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth/context/AuthContext";
import { learningKeys } from "@/lib/queryKeys";
import { summarizeDueCards, type DueSummary } from "./dueSummary";

interface DueCardsData {
  cards: { id: string; document_id: string }[];
  reviews: Map<string, { due_at: string }>;
}

const EMPTY: DueSummary = { totalDue: 0, documents: [] };

/**
 * Flashcards due today across all of the signed-in user's documents, grouped
 * by document. Unreviewed cards count as due (leitner.isDue semantics).
 */
export function useDueCards(enabled = true) {
  const { user } = useAuth();
  const userId = user?.id;

  const query = useQuery({
    queryKey: learningKeys.dueSummary(userId),
    enabled: enabled && !!userId,
    staleTime: 60_000,
    queryFn: async (): Promise<DueCardsData> => {
      const [cardsRes, reviewsRes] = await Promise.all([
        supabase.from("flashcards").select("id, document_id").eq("user_id", userId!).limit(10_000),
        supabase.from("flashcard_reviews").select("flashcard_id, due_at").eq("user_id", userId!).limit(10_000),
      ]);
      const firstError = cardsRes.error ?? reviewsRes.error;
      if (firstError) throw firstError;
      const reviews = new Map<string, { due_at: string }>();
      for (const r of reviewsRes.data ?? []) reviews.set(r.flashcard_id, { due_at: r.due_at });
      return { cards: cardsRes.data ?? [], reviews };
    },
  });

  // "Today" is evaluated at render time so a long-lived tab rolls over at local midnight on the next refetch.
  const summary = useMemo(
    () => (query.data ? summarizeDueCards(query.data.cards, query.data.reviews, new Date()) : EMPTY),
    [query.data],
  );

  return {
    summary,
    isLoading: enabled && !!userId && query.isLoading,
    isError: query.isError,
  };
}
