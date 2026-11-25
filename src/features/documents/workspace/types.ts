import type { FlashcardRow, NoteRow, PodcastRow, QuizRow } from "@/features/documents/types";

export type TabId = "notes" | "cards" | "quiz" | "podcast";

/** Everything generated from one document, cached under queryKeys.assets(docId). */
export type DocumentAssets = {
  note: NoteRow | null;
  cards: FlashcardRow[];
  quiz: QuizRow | null;
  podcast: PodcastRow | null;
};

/** Maps a `?tab=` value (including legacy aliases) to a workspace tab. */
export function tabFromQuery(value: string | null | undefined): TabId | null {
  switch (value) {
    case "cards":
    case "flashcards":
      return "cards";
    case "quiz":
      return "quiz";
    case "podcast":
      return "podcast";
    case "notes":
    case "chat":
      return "notes";
    default:
      return null;
  }
}
