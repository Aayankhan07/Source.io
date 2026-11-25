"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth/context/AuthContext";
import { learningKeys } from "@/lib/queryKeys";
import type { Citation } from "@/lib/services/pipeline";
import { isPersistableId } from "./ids";

export const CHAT_HISTORY_LIMIT = 50;

export interface StoredChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  created_at: string;
}

type RawRow = {
  id: string;
  role: string;
  content: string;
  created_at: string;
  citations?: unknown;
};

/** Postgres "undefined_column": the citations column has not been migrated yet. */
const UNDEFINED_COLUMN = "42703";

function parseCitations(raw: unknown): Citation[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out = raw.filter(
    (c): c is Citation =>
      !!c &&
      typeof c === "object" &&
      typeof (c as Citation).n === "number" &&
      typeof (c as Citation).text === "string",
  ).map((c) => ({
    n: c.n,
    order_index: typeof c.order_index === "number" ? c.order_index : 0,
    similarity: typeof c.similarity === "number" ? c.similarity : 0,
    text: c.text,
  }));
  return out.length ? out : undefined;
}

async function fetchLatest(documentId: string, columns: string) {
  // Newest N, then flipped to ascending so long threads show their latest turns.
  return supabase
    .from("chat_messages")
    .select(columns)
    .eq("document_id", documentId)
    .order("created_at", { ascending: false })
    .limit(CHAT_HISTORY_LIMIT) as unknown as Promise<{
    data: RawRow[] | null;
    error: { code?: string; message: string } | null;
  }>;
}

export async function loadChatHistory(documentId: string): Promise<StoredChatMessage[]> {
  let res = await fetchLatest(documentId, "id, role, content, citations, created_at");
  if (res.error?.code === UNDEFINED_COLUMN) {
    res = await fetchLatest(documentId, "id, role, content, created_at");
  }
  if (res.error) throw res.error;
  return (res.data ?? [])
    .filter((r) => r.role === "user" || r.role === "assistant")
    .reverse()
    .map((r) => ({
      id: r.id,
      role: r.role as "user" | "assistant",
      content: r.content,
      citations: parseCitations(r.citations),
      created_at: r.created_at,
    }));
}

/** Persisted chat for one document (last 50 messages, oldest first) plus a "clear" action. */
export function useChatHistory(documentId: string) {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const enabled = !!userId && isPersistableId(documentId);
  const key = learningKeys.chatHistory(userId, documentId);

  const history = useQuery({
    queryKey: key,
    enabled,
    // Load once per mount; new turns live in component state until the next visit.
    staleTime: Number.POSITIVE_INFINITY,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    queryFn: () => loadChatHistory(documentId),
  });

  const clear = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("chat_messages")
        .delete()
        .eq("document_id", documentId)
        .eq("user_id", userId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.setQueryData<StoredChatMessage[]>(key, []);
    },
  });

  return {
    enabled,
    messages: history.data,
    isLoading: enabled && history.isLoading,
    isError: history.isError,
    clearChat: clear.mutateAsync,
    clearing: clear.isPending,
    /** Mark history stale without refetching now (the current view already shows new turns locally). */
    markStale: () => {
      void queryClient.invalidateQueries({ queryKey: key, refetchType: "none" });
    },
  };
}
