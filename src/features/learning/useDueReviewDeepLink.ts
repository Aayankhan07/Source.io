"use client";

import { useEffect, useRef } from "react";
import { track } from "@/lib/analytics/track";
import { useSearchParams } from "next/navigation";

/** True when the URL asks to open the deck in "review due" mode (?review=due, see dueReviewHref). */
export function useReviewDueRequested(): boolean {
  const searchParams = useSearchParams();
  return searchParams?.get("review") === "due";
}

/**
 * Start a "review due" session once when the page was opened from a due-review
 * deep link. `ready` must be true only after cards and review state have
 * loaded and at least one card is due; `start` is the deck's own starter.
 */
export function useDueReviewDeepLink(ready: boolean, start: () => void): void {
  const requested = useReviewDueRequested();
  const started = useRef(false);

  useEffect(() => {
    if (!requested || !ready || started.current) return;
    started.current = true;
    track("due_review_opened");
    start();
  }, [requested, ready, start]);
}
