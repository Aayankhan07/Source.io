"use client";

import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth/context/AuthContext";
import type { DocumentRow, FlashcardRow, NoteRow, PodcastRow, QuizQuestionRow, QuizRow } from "@/features/documents/types";
import { queryKeys } from "@/lib/queryKeys";
import type { DocumentAssets } from "./types";

async function fetchDocument(docId: string): Promise<DocumentRow | null> {
  const { data, error } = await supabase
    .from("documents")
    .select("id,title,source_type,status,raw_text,error_code,created_at")
    .eq("id", docId)
    .maybeSingle();
  if (error) throw error;
  return (data as DocumentRow) ?? null;
}

async function fetchAssets(docId: string): Promise<DocumentAssets> {
  const [n, f, q, p] = await Promise.all([
    supabase
      .from("notes")
      .select("id,document_id,markdown")
      .eq("document_id", docId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("flashcards")
      .select("id,document_id,front,back,order_index")
      .eq("document_id", docId)
      .order("order_index"),
    supabase
      .from("quizzes")
      .select("id,document_id,title")
      .eq("document_id", docId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("podcasts")
      .select("id,document_id,script,audio_url,status")
      .eq("document_id", docId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (n.error) console.error("Error loading note:", n.error);
  if (f.error) console.error("Error loading flashcards:", f.error);
  if (q.error) console.error("Error loading quiz:", q.error);
  if (p.error) console.error("Error loading podcast:", p.error);

  let quiz: QuizRow | null = null;
  if (q.data) {
    const { data: questions, error: qErr } = await supabase
      .from("quiz_questions")
      .select("id,quiz_id,question,type,choices,correct,explanation,order_index")
      .eq("quiz_id", q.data.id)
      .order("order_index");
    if (qErr) console.error("Error loading quiz questions:", qErr);
    quiz = { ...(q.data as Omit<QuizRow, "questions">), questions: (questions ?? []) as QuizQuestionRow[] };
  }

  return {
    note: (n.data as NoteRow) ?? null,
    cards: (f.data as FlashcardRow[]) ?? [],
    quiz,
    podcast: (p.data as unknown as PodcastRow) ?? null,
  };
}

const hasExtractedText = (doc: DocumentRow) => !!doc.raw_text && doc.raw_text.trim().length >= 20;

/**
 * Server state for one document workspace: the document row, its generated assets,
 * and the realtime subscription that keeps both fresh. Query functions are read-only.
 */
export function useWorkspaceData(docId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const docQuery = useQuery({
    queryKey: queryKeys.document(docId ?? ""),
    enabled: !!docId && !!user,
    queryFn: () => fetchDocument(docId!),
    refetchInterval: (query) => {
      const s = query.state.data?.status;
      return s === "pending" || s === "processing" ? 2000 : false;
    },
  });

  const assetsQuery = useQuery({
    queryKey: queryKeys.assets(docId ?? ""),
    enabled: !!docId && !!user,
    queryFn: () => fetchAssets(docId!),
  });

  // A file whose text was extracted in the browser (PDF/DOCX) can be left at pending if the
  // ingest call never landed. The protect_document_server_columns trigger allows exactly one
  // client transition, pending/processing -> ready when raw_text is present, so promote it
  // once here (explicitly, not as a side effect of a query function).
  const promotedRef = useRef<string | null>(null);
  const doc = docQuery.data;
  useEffect(() => {
    if (!doc || promotedRef.current === doc.id) return;
    if ((doc.status !== "pending" && doc.status !== "processing") || !hasExtractedText(doc)) return;
    promotedRef.current = doc.id;
    void supabase
      .from("documents")
      .update({ status: "ready" })
      .eq("id", doc.id)
      .then(({ error }) => {
        if (error) {
          console.warn("Could not mark the document ready:", error.message);
          return;
        }
        queryClient.setQueryData<DocumentRow | null>(queryKeys.document(doc.id), (prev) =>
          prev ? { ...prev, status: "ready" } : prev,
        );
        queryClient.invalidateQueries({ queryKey: queryKeys.documents });
      });
  }, [doc, queryClient]);

  // Realtime updates
  useEffect(() => {
    if (!docId || !user) return;

    const channel = supabase
      .channel(`doc-${docId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "documents", filter: `id=eq.${docId}` },
        (payload) => {
          // Replica identity is DEFAULT, so payload.new may omit large columns like raw_text: merge, don't replace.
          queryClient.setQueryData<DocumentRow | null>(queryKeys.document(docId), (prev) =>
            prev ? { ...prev, ...(payload.new as Partial<DocumentRow>) } : (payload.new as DocumentRow),
          );
          queryClient.invalidateQueries({ queryKey: queryKeys.documents });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "podcasts", filter: `document_id=eq.${docId}` },
        (payload) => {
          queryClient.setQueryData<DocumentAssets>(queryKeys.assets(docId), (prev) =>
            prev ? { ...prev, podcast: (payload.new as PodcastRow) ?? null } : prev,
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [docId, user, queryClient]);

  return { docQuery, assetsQuery };
}
