import { describe, it, expect } from "vitest";
import {
  LEITNER_INTERVAL_DAYS,
  clampBox,
  countDue,
  intervalDaysForBox,
  isDue,
  nextBox,
  orderByDue,
  scheduleReview,
} from "./leitner";

const NOW = new Date("2026-11-26T10:00:00.000Z");
const DAY = 24 * 60 * 60 * 1000;
const plusDays = (d: number) => new Date(NOW.getTime() + d * DAY).toISOString();

describe("leitner intervals", () => {
  it("uses exactly the marketed 1, 2, 4, 7, 14 day schedule", () => {
    expect([...LEITNER_INTERVAL_DAYS]).toEqual([1, 2, 4, 7, 14]);
    expect([1, 2, 3, 4, 5].map(intervalDaysForBox)).toEqual([1, 2, 4, 7, 14]);
  });

  it("clamps out-of-range boxes", () => {
    expect(clampBox(0)).toBe(1);
    expect(clampBox(9)).toBe(5);
    expect(clampBox(Number.NaN)).toBe(1);
    expect(clampBox(2.7)).toBe(2);
  });
});

describe("nextBox", () => {
  it("again always resets to box 1", () => {
    for (const b of [null, 1, 2, 3, 4, 5]) expect(nextBox(b, "again")).toBe(1);
  });

  it("good moves up one box, capped at 5", () => {
    expect(nextBox(null, "good")).toBe(2);
    expect(nextBox(1, "good")).toBe(2);
    expect(nextBox(4, "good")).toBe(5);
    expect(nextBox(5, "good")).toBe(5);
  });

  it("easy moves up two boxes, capped at 5", () => {
    expect(nextBox(null, "easy")).toBe(3);
    expect(nextBox(1, "easy")).toBe(3);
    expect(nextBox(3, "easy")).toBe(5);
    expect(nextBox(4, "easy")).toBe(5);
    expect(nextBox(5, "easy")).toBe(5);
  });
});

describe("scheduleReview", () => {
  it("again -> box 1, due in 1 day", () => {
    const s = scheduleReview({ box: 4, review_count: 3 }, "again", NOW);
    expect(s).toEqual({ box: 1, due_at: plusDays(1), review_count: 4, last_result: "again" });
  });

  it("good on a new card -> box 2, due in 2 days", () => {
    const s = scheduleReview(null, "good", NOW);
    expect(s).toEqual({ box: 2, due_at: plusDays(2), review_count: 1, last_result: "good" });
  });

  it("good from box 3 -> box 4, due in 7 days", () => {
    expect(scheduleReview({ box: 3, review_count: 2 }, "good", NOW).due_at).toBe(plusDays(7));
  });

  it("easy from box 2 -> box 4, due in 7 days", () => {
    const s = scheduleReview({ box: 2, review_count: 1 }, "easy", NOW);
    expect(s.box).toBe(4);
    expect(s.due_at).toBe(plusDays(7));
  });

  it("caps at box 5 with a 14 day interval", () => {
    const s = scheduleReview({ box: 5, review_count: 10 }, "easy", NOW);
    expect(s.box).toBe(5);
    expect(s.due_at).toBe(plusDays(14));
    expect(s.review_count).toBe(11);
  });
});

describe("due tracking", () => {
  it("treats unreviewed cards and anything due by end of today as due", () => {
    expect(isDue(null, NOW)).toBe(true);
    expect(isDue({ due_at: plusDays(-3) }, NOW)).toBe(true);
    expect(isDue({ due_at: NOW.toISOString() }, NOW)).toBe(true);
    expect(isDue({ due_at: plusDays(3) }, NOW)).toBe(false);
  });

  it("counts and orders due cards first", () => {
    const cards = [{ id: "future" }, { id: "new" }, { id: "overdue" }, { id: "today" }];
    const reviews = new Map([
      ["future", { due_at: plusDays(5) }],
      ["overdue", { due_at: plusDays(-2) }],
      ["today", { due_at: NOW.toISOString() }],
    ]);
    expect(countDue(cards, reviews, NOW)).toBe(3);
    expect(orderByDue(cards, reviews, NOW).map((c) => c.id)).toEqual(["overdue", "today", "new", "future"]);
  });
});
