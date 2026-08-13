import { cn } from "@/lib/utils";

/**
 * Magnitude dot.
 *
 * On a star chart importance is diameter on a fixed ramp, never a louder colour —
 * which is exactly what a citation similarity score needs to be. A reader scanning
 * a grounded answer should see which passages carry it without reading a single
 * percentage.
 *
 * `value` is 0..1 (the similarity Supabase already returns). It maps onto the five
 * magnitude steps declared in index.css, brightest first.
 */

export type MagnitudeStep = 1 | 2 | 3 | 4 | 5;

/** Map a 0..1 similarity onto the ramp. m1 is the strongest match. */
export function magnitudeOf(value: number): MagnitudeStep {
  if (value >= 0.85) return 1;
  if (value >= 0.7) return 2;
  if (value >= 0.55) return 3;
  if (value >= 0.4) return 4;
  return 5;
}

const SIZE: Record<MagnitudeStep, string> = {
  1: "var(--mag-1)",
  2: "var(--mag-2)",
  3: "var(--mag-3)",
  4: "var(--mag-4)",
  5: "var(--mag-5)",
};

// Fainter objects sit further back, exactly as on a plate.
const OPACITY: Record<MagnitudeStep, number> = {
  1: 1,
  2: 0.88,
  3: 0.72,
  4: 0.56,
  5: 0.42,
};

export default function Magnitude({
  value,
  className,
  title,
}: {
  value: number;
  className?: string;
  title?: string;
}) {
  const step = magnitudeOf(value);
  return (
    <span
      className={cn("magnitude", className)}
      style={{ width: SIZE[step], height: SIZE[step], opacity: OPACITY[step] }}
      title={title}
      aria-hidden="true"
    />
  );
}
