"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { learningKeys } from "@/lib/queryKeys";
import { useAuth } from "@/features/auth/context/AuthContext";
import { LEITNER_INTERVAL_DAYS, LEITNER_MAX_BOX, clampBox } from "@/features/learning/leitner";
import type { LeitnerBox } from "../components/TactilePerformanceChart";

const BOX_NAMES = ["New", "Learning", "Reviewing", "Known", "Mastered"] as const;

/** Count reviewed flashcards per Leitner box (1..5). Pure, for testing. */
export function aggregateLeitnerBoxes(rows: readonly { box: number }[]): LeitnerBox[] {
  const counts = new Array<number>(LEITNER_MAX_BOX).fill(0);
  for (const r of rows) counts[clampBox(r.box) - 1] += 1;
  return counts.map((count, i) => ({
    box: `Box ${i + 1}`,
    name: BOX_NAMES[i],
    interval: `${LEITNER_INTERVAL_DAYS[i]}d`,
    count,
  }));
}

/** The signed-in user's flashcard_reviews grouped by Leitner box. */
export function useLeitnerBoxes(enabled = true) {
  const { user } = useAuth();
  return useQuery({
    queryKey: learningKeys.leitnerBoxes(user?.id),
    enabled: enabled && !!user?.id,
    staleTime: 30_000,
    queryFn: async (): Promise<LeitnerBox[]> => {
      // Only the box column is needed; RLS limits rows to the caller.
      const { data, error } = await supabase
        .from("flashcard_reviews")
        .select("box")
        .eq("user_id", user!.id)
        .limit(10_000);
      if (error) throw error;
      return aggregateLeitnerBoxes(data ?? []);
    },
  });
}
