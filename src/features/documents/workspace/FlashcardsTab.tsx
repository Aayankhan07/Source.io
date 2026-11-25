"use client";

import { FlashcardsDeck } from "@/features/documents/components/FlashcardsDeck";
import type { FlashcardRow } from "@/features/documents/types";
import { TAB_PANE_CLASS } from "./tabPane";

export function FlashcardsTab({ documentId, cards, loading, onRegenerate }: {
  documentId: string;
  cards: FlashcardRow[];
  loading: boolean;
  onRegenerate: () => void;
}) {
  return (
    <div className={TAB_PANE_CLASS}>
      <FlashcardsDeck documentId={documentId} cards={cards} onRegenerate={onRegenerate} loading={loading} />
    </div>
  );
}
