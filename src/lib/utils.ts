import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Narrow an unknown thrown value to a displayable message. */
export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

/** Calculate unified reading time and word count for study documents. */
export function calculateReadTime(text: string | null | undefined, wpm = 200): { words: number; readMinutes: number } {
  if (!text) return { words: 0, readMinutes: 1 };
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const readMinutes = Math.max(1, Math.ceil(words / Math.max(1, wpm)));
  return { words, readMinutes };
}
