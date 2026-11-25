import { isDue, type ReviewState } from "./leitner";

export interface DueDocument {
  documentId: string;
  /** Cards due today in this document (never-reviewed cards count as due). */
  due: number;
  /** All cards in this document. */
  total: number;
}

export interface DueSummary {
  totalDue: number;
  /** Documents with at least one due card, most due first. */
  documents: DueDocument[];
}

/**
 * Group cards due today by document. Reuses leitner.isDue, so the dashboard
 * count matches FlashcardsDeck's "Review due cards" count for each document.
 */
export function summarizeDueCards(
  cards: readonly { id: string; document_id: string }[],
  reviews: ReadonlyMap<string, Pick<ReviewState, "due_at">>,
  now: Date,
): DueSummary {
  const byDoc = new Map<string, DueDocument>();
  for (const card of cards) {
    let entry = byDoc.get(card.document_id);
    if (!entry) {
      entry = { documentId: card.document_id, due: 0, total: 0 };
      byDoc.set(card.document_id, entry);
    }
    entry.total += 1;
    if (isDue(reviews.get(card.id), now)) entry.due += 1;
  }
  const documents = [...byDoc.values()].filter((d) => d.due > 0).sort((a, b) => b.due - a.due);
  return { totalDue: documents.reduce((n, d) => n + d.due, 0), documents };
}

/** Deep link that opens a document's flashcards tab in "review due" mode. */
export function dueReviewHref(documentId: string): string {
  return `/app/doc/${documentId}?tab=cards&review=due`;
}
