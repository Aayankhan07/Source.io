/**
 * Row types for the workspace domain.
 *
 * Server state lives in the TanStack Query cache (see `src/lib/queryKeys.ts`),
 * not in a store — keeping a second copy here is what previously let failed
 * reads render as empty states.
 */
export type DocumentRow = {
  id: string;
  title: string;
  source_type: "pdf" | "docx" | "text" | "audio" | "video" | "youtube";
  status: "pending" | "processing" | "ready" | "failed";
  error_code: string | null;
  created_at: string;
};

export type NoteRow = { id: string; document_id: string; markdown: string };
export type FlashcardRow = { id: string; document_id: string; front: string; back: string; order_index: number };
export type QuizQuestionRow = {
  id: string;
  quiz_id: string;
  question: string;
  type: "mcq" | "short_answer" | "true_false";
  choices: string[] | null;
  correct: string;
  explanation: string | null;
  order_index: number;
};
export type QuizRow = { id: string; document_id: string; title: string; questions: QuizQuestionRow[] };
export type PodcastRow = { id: string; document_id: string; script: string | null; audio_url: string | null; status: string };

