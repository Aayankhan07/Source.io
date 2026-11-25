import { describe, expect, it } from "vitest";
import { dueReviewHref, summarizeDueCards } from "./dueSummary";

describe("summarizeDueCards", () => {
  const now = new Date(2026, 10, 26, 12, 0, 0); // local noon

  it("counts unreviewed and overdue cards per document, most due first", () => {
    const cards = [
      { id: "a1", document_id: "A" },
      { id: "a2", document_id: "A" },
      { id: "b1", document_id: "B" },
      { id: "b2", document_id: "B" },
      { id: "b3", document_id: "B" },
      { id: "c1", document_id: "C" },
    ];
    const reviews = new Map([
      ["a1", { due_at: new Date(2026, 10, 30).toISOString() }], // future: not due
      ["b1", { due_at: new Date(2026, 10, 20).toISOString() }], // overdue
      ["b2", { due_at: new Date(2026, 10, 26, 22, 0).toISOString() }], // later today: due
      ["c1", { due_at: new Date(2026, 10, 28).toISOString() }], // future
    ]);
    const summary = summarizeDueCards(cards, reviews, now);
    expect(summary.totalDue).toBe(4);
    expect(summary.documents).toEqual([
      { documentId: "B", due: 3, total: 3 },
      { documentId: "A", due: 1, total: 2 },
    ]);
  });

  it("returns an empty summary when nothing is due", () => {
    expect(summarizeDueCards([], new Map(), now)).toEqual({ totalDue: 0, documents: [] });
  });

  it("builds the review deep link", () => {
    expect(dueReviewHref("doc-1")).toBe("/app/doc/doc-1?tab=cards&review=due");
  });
});
