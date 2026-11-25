"use client";

import { useMemo } from "react";
import { track } from "@/lib/analytics/track";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth/context/AuthContext";
import { learningKeys } from "@/lib/queryKeys";
import { scheduleReview, type ReviewResult, type ReviewState } from "./leitner";
import { isPersistableId } from "./ids";

export interface FlashcardReview extends ReviewState {
  flashcard_id: string;
}

type ReviewList = FlashcardReview[];

/**
 * Leitner review state for one document's flashcards.
 * Disabled (no fetch, no writes) when signed out or for non-persisted decks
 * such as the public demo.
 */
export function useFlashcardReviews(documentId: string) {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const enabled = !!userId && isPersistableId(documentId);
  const key = learningKeys.documentReviews(userId, documentId);

  const query = useQuery({
    queryKey: key,
    enabled,
    staleTime: 60_000,
    queryFn: async (): Promise<ReviewList> => {
      const { data, error } = await supabase
        .from("flashcard_reviews")
        .select("flashcard_id, box, due_at, review_count, last_result")
        .eq("document_id", documentId);
      if (error) throw error;
      return (data ?? []).map((r) => ({
        flashcard_id: r.flashcard_id,
        box: r.box,
        due_at: r.due_at,
        review_count: r.review_count,
        last_result: (r.last_result as ReviewResult | null) ?? null,
      }));
    },
  });

  const reviews = useMemo(() => {
    const map = new Map<string, FlashcardReview>();
    for (const r of query.data ?? []) map.set(r.flashcard_id, r);
    return map;
  }, [query.data]);

  const mutation = useMutation({
    mutationFn: async (next: FlashcardReview) => {
      const { error } = await supabase.from("flashcard_reviews").upsert(
        {
          user_id: userId!,
          document_id: documentId,
          flashcard_id: next.flashcard_id,
          box: next.box,
          due_at: next.due_at,
          last_result: next.last_result,
          review_count: next.review_count,
        },
        { onConflict: "user_id,flashcard_id" },
      );
      if (error) throw error;
      track("flashcards_reviewed", { count: 1 });
    },
    onMutate: async (next) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<ReviewList>(key);
      queryClient.setQueryData<ReviewList>(key, (old = []) => [
        ...old.filter((r) => r.flashcard_id !== next.flashcard_id),
        next,
      ]);
      return { previous };
    },
    onError: (_err, _next, ctx) => {
      if (ctx) queryClient.setQueryData(key, ctx.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: learningKeys.leitnerBoxes(userId) });
    },
  });

  /** Grade a card. Computes the next Leitner state from the cached one and upserts it optimistically. */
  const recordReview = (flashcardId: string, result: ReviewResult, now: Date = new Date()) => {
    if (!enabled) return;
    const next = scheduleReview(reviews.get(flashcardId), result, now);
    mutation.mutate({ flashcard_id: flashcardId, ...next });
  };

  return {
    enabled,
    reviews,
    isLoading: enabled && query.isLoading,
    isError: query.isError,
    saveError: mutation.error,
    recordReview,
  };
}
