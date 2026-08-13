import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Narrow an unknown thrown value to a displayable message. */
export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
