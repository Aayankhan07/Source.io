/**
 * Leitner 5-box spaced-repetition scheduling (pure, clock-injected).
 *
 * Box intervals are exactly the ones we market: 1, 2, 4, 7, 14 days.
 *   again -> back to box 1
 *   good  -> up one box
 *   easy  -> up two boxes
 * capped at box 5. The next due date is `now + interval(box)` days.
 */

export type ReviewResult = "again" | "good" | "easy";

export const LEITNER_MIN_BOX = 1;
export const LEITNER_MAX_BOX = 5;
/** Days until the next review, indexed by box - 1. */
export const LEITNER_INTERVAL_DAYS = [1, 2, 4, 7, 14] as const;

const DAY_MS = 24 * 60 * 60 * 1000;

export interface ReviewState {
  box: number;
  due_at: string;
  review_count: number;
  last_result: ReviewResult | null;
}

export function clampBox(box: number): number {
  if (!Number.isFinite(box)) return LEITNER_MIN_BOX;
  return Math.min(LEITNER_MAX_BOX, Math.max(LEITNER_MIN_BOX, Math.trunc(box)));
}

export function intervalDaysForBox(box: number): number {
  return LEITNER_INTERVAL_DAYS[clampBox(box) - 1];
}

/** Next box after grading. `currentBox` is null for a card that has never been reviewed. */
export function nextBox(currentBox: number | null | undefined, result: ReviewResult): number {
  if (result === "again") return LEITNER_MIN_BOX;
  // A never-reviewed card sits in box 1 (the column default).
  const from = currentBox == null ? LEITNER_MIN_BOX : clampBox(currentBox);
  const step = result === "easy" ? 2 : 1;
  return clampBox(from + step);
}

/** Schedule a review. Pure: pass `now` explicitly. */
export function scheduleReview(
  previous: Pick<ReviewState, "box" | "review_count"> | null | undefined,
  result: ReviewResult,
  now: Date,
): ReviewState {
  const box = nextBox(previous?.box ?? null, result);
  return {
    box,
    due_at: new Date(now.getTime() + intervalDaysForBox(box) * DAY_MS).toISOString(),
    review_count: (previous?.review_count ?? 0) + 1,
    last_result: result,
  };
}

/** End of the local calendar day containing `now`. */
export function endOfDay(now: Date): Date {
  const d = new Date(now);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * A card is due today if it has never been reviewed, or its due date falls on
 * or before the end of today (local time).
 */
export function isDue(review: Pick<ReviewState, "due_at"> | null | undefined, now: Date): boolean {
  if (!review) return true;
  const due = Date.parse(review.due_at);
  if (Number.isNaN(due)) return true;
  return due <= endOfDay(now).getTime();
}

/**
 * Order cards for a "review due" session: due cards first (most overdue first,
 * never-reviewed cards after reviewed overdue ones), then the rest by due date.
 * Stable for equal keys, so the deck's own order breaks ties.
 */
export function orderByDue<T extends { id: string }>(
  cards: readonly T[],
  reviews: ReadonlyMap<string, Pick<ReviewState, "due_at">>,
  now: Date,
): T[] {
  const keyed = cards.map((card, index) => {
    const review = reviews.get(card.id);
    const due = review ? Date.parse(review.due_at) : Number.NaN;
    return {
      card,
      index,
      due: isDue(review, now),
      // Never-reviewed cards sort after overdue reviewed cards but before future ones.
      time: Number.isNaN(due) ? Number.POSITIVE_INFINITY : due,
    };
  });
  keyed.sort((a, b) => {
    if (a.due !== b.due) return a.due ? -1 : 1;
    if (a.time !== b.time) return a.time - b.time;
    return a.index - b.index;
  });
  return keyed.map((k) => k.card);
}

/** Count cards due today (unreviewed cards count as due). */
export function countDue(
  cards: readonly { id: string }[],
  reviews: ReadonlyMap<string, Pick<ReviewState, "due_at">>,
  now: Date,
): number {
  return cards.reduce((n, c) => n + (isDue(reviews.get(c.id), now) ? 1 : 0), 0);
}
