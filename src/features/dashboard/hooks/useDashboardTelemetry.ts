"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { accountKeys } from "@/lib/queryKeys";
import { useAuth } from "@/features/auth/context/AuthContext";

export interface DashboardTelemetry {
  totalDocs: number;
  totalCards: number;
  totalNotes: number;
  /** created_at of the user's AI actions over the last 30 days. */
  activityTimestamps: string[];
}

/** Real per-user counts + recent AI activity. No fallbacks: zero means zero. */
export function useDashboardTelemetry() {
  const { user } = useAuth();
  return useQuery({
    queryKey: accountKeys.dashboardTelemetry(user?.id),
    enabled: !!user?.id,
    staleTime: 30_000,
    queryFn: async (): Promise<DashboardTelemetry> => {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const [docsRes, cardsRes, notesRes, logsRes] = await Promise.all([
        supabase.from("documents").select("id", { count: "exact", head: true }),
        supabase.from("flashcards").select("id", { count: "exact", head: true }),
        supabase.from("notes").select("id", { count: "exact", head: true }),
        supabase
          .from("ai_usage_logs")
          .select("created_at")
          .eq("user_id", user!.id)
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .limit(2000),
      ]);
      const firstError = docsRes.error ?? cardsRes.error ?? notesRes.error ?? logsRes.error;
      if (firstError) throw firstError;
      return {
        totalDocs: docsRes.count ?? 0,
        totalCards: cardsRes.count ?? 0,
        totalNotes: notesRes.count ?? 0,
        activityTimestamps: (logsRes.data ?? []).map((r) => r.created_at),
      };
    },
  });
}
