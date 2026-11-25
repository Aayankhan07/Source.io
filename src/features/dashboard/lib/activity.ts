/** Pure date helpers for dashboard telemetry. Kept free of React/Supabase so they are unit-testable. */

export interface DayBucket {
  /** Local-midnight ISO date (YYYY-MM-DD). */
  date: string;
  /** Short label, e.g. "Mon" or "12 Nov". */
  label: string;
  count: number;
}

function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Monday 00:00 local time of the week containing `now`. */
export function startOfWeek(now: Date): Date {
  const day = startOfLocalDay(now);
  const offset = (day.getDay() + 6) % 7; // Monday = 0
  day.setDate(day.getDate() - offset);
  return day;
}

/** Counts timestamps per local calendar day for the last `days` days, oldest first, ending today. */
export function bucketByDay(timestamps: string[], days: number, now: Date = new Date()): DayBucket[] {
  const today = startOfLocalDay(now);
  const buckets: DayBucket[] = [];
  const index = new Map<string, DayBucket>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const bucket: DayBucket = {
      date: localDateKey(d),
      label:
        days <= 7
          ? d.toLocaleDateString("en-US", { weekday: "short" })
          : d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
      count: 0,
    };
    buckets.push(bucket);
    index.set(bucket.date, bucket);
  }
  for (const ts of timestamps) {
    const bucket = index.get(localDateKey(new Date(ts)));
    if (bucket) bucket.count += 1;
  }
  return buckets;
}

/** Compact relative time, e.g. "5m ago", "3h ago", "2d ago". */
export function relativeTime(iso: string, now: Date = new Date()): string {
  const diff = Math.max(0, now.getTime() - new Date(iso).getTime());
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const daysAgo = Math.floor(hours / 24);
  return `${daysAgo}d ago`;
}
