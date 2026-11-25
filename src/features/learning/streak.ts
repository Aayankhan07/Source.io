/**
 * Study streak from real activity (pure, clock- and timezone-injected).
 *
 * A "study day" is a calendar day, in the user's own timezone, on which at
 * least one activity timestamp falls. The current streak counts consecutive
 * study days ending today; if today has no activity yet, a streak that ended
 * yesterday is still alive (the user has until local midnight to extend it).
 *
 * Data limitation: flashcard_reviews keeps ONE row per (user, card), so its
 * created_at is the day of the first review and updated_at the day of the
 * latest one. Review days in between are overwritten and cannot be recovered
 * from that table alone. To narrow the gap the caller also feeds in
 * quiz_attempts.created_at (one row per attempt) and chat rows from
 * ai_usage_logs. A day on which the user only re-reviewed cards that were
 * reviewed again later can still be missed, so the streak may undercount but
 * never overcounts. A per-review event log would remove this limitation.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

export interface StudyStreak {
  /** Consecutive study days ending today (or yesterday, if today has no activity yet). */
  current: number;
  /** Longest run of consecutive study days in the supplied history. */
  longest: number;
  /** True when there is activity on the current local day. */
  activeToday: boolean;
  /** Local date (YYYY-MM-DD) of the most recent study day, or null when there is none. */
  lastStudyDay: string | null;
}

/** The runtime's IANA timezone (the user's, in the browser). */
export function defaultTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let f = formatters.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" });
    formatters.set(timeZone, f);
  }
  return f;
}

/** Local calendar date (YYYY-MM-DD) of an instant in `timeZone`. */
export function localDayKey(instant: Date, timeZone: string): string {
  const parts = formatterFor(timeZone).formatToParts(instant);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** Day number for a YYYY-MM-DD key, so consecutive calendar days differ by exactly 1. */
function dayIndex(key: string): number {
  const [y, m, d] = key.split("-").map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / DAY_MS);
}

/**
 * Compute current and longest streak (in days) from activity timestamps.
 * Invalid timestamps are ignored. Future timestamps (clock skew) are ignored.
 */
export function computeStudyStreak(
  timestamps: Iterable<string | Date | null | undefined>,
  now: Date,
  timeZone: string = defaultTimeZone(),
): StudyStreak {
  const nowMs = now.getTime();
  const days = new Set<number>();
  const keyByIndex = new Map<number, string>();
  for (const ts of timestamps) {
    if (ts == null) continue;
    const date = ts instanceof Date ? ts : new Date(ts);
    const ms = date.getTime();
    if (Number.isNaN(ms) || ms > nowMs) continue;
    const key = localDayKey(date, timeZone);
    const idx = dayIndex(key);
    days.add(idx);
    keyByIndex.set(idx, key);
  }

  if (days.size === 0) return { current: 0, longest: 0, activeToday: false, lastStudyDay: null };

  const sorted = [...days].sort((a, b) => a - b);
  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    run = sorted[i] === sorted[i - 1] + 1 ? run + 1 : 1;
    if (run > longest) longest = run;
  }

  const today = dayIndex(localDayKey(now, timeZone));
  const activeToday = days.has(today);
  let current = 0;
  let cursor = activeToday ? today : today - 1;
  while (days.has(cursor)) {
    current += 1;
    cursor -= 1;
  }

  const last = sorted[sorted.length - 1];
  return { current, longest, activeToday, lastStudyDay: keyByIndex.get(last) ?? null };
}
