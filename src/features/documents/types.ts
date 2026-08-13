import { create } from "zustand";

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

type WorkspaceState = {
  documents: DocumentRow[];
  setDocuments: (d: DocumentRow[]) => void;
  upsertDocument: (d: DocumentRow) => void;
  removeDocument: (id: string) => void;

  activeDocumentId: string | null;
  setActiveDocumentId: (id: string | null) => void;

  // Per-document cached assets
  notes: Record<string, NoteRow | null>;
  flashcards: Record<string, FlashcardRow[]>;
  quiz: Record<string, QuizRow | null>;
  podcast: Record<string, PodcastRow | null>;

  setNote: (docId: string, n: NoteRow | null) => void;
  setFlashcards: (docId: string, f: FlashcardRow[]) => void;
  setQuiz: (docId: string, q: QuizRow | null) => void;
  setPodcast: (docId: string, p: PodcastRow | null) => void;

  reset: () => void;
};

export const useWorkspace = create<WorkspaceState>((set) => ({
  documents: [],
  setDocuments: (documents) => set({ documents }),
  upsertDocument: (d) =>
    set((s) => {
      const idx = s.documents.findIndex((x) => x.id === d.id);
      if (idx === -1) return { documents: [d, ...s.documents] };
      const next = [...s.documents];
      next[idx] = d;
      return { documents: next };
    }),
  removeDocument: (id) =>
    set((s) => ({ documents: s.documents.filter((d) => d.id !== id) })),

  activeDocumentId: null,
  setActiveDocumentId: (activeDocumentId) => set({ activeDocumentId }),

  notes: {},
  flashcards: {},
  quiz: {},
  podcast: {},

  setNote: (docId, n) => set((s) => ({ notes: { ...s.notes, [docId]: n } })),
  setFlashcards: (docId, f) => set((s) => ({ flashcards: { ...s.flashcards, [docId]: f } })),
  setQuiz: (docId, q) => set((s) => ({ quiz: { ...s.quiz, [docId]: q } })),
  setPodcast: (docId, p) => set((s) => ({ podcast: { ...s.podcast, [docId]: p } })),

  reset: () =>
    set({
      documents: [],
      activeDocumentId: null,
      notes: {},
      flashcards: {},
      quiz: {},
      podcast: {},
    }),
}));
