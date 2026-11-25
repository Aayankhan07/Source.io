"use client";

import Link from "next/link";
import { BellRing, CalendarClock, ChevronRight } from "lucide-react";
import { useDueCards } from "@/features/learning/useDueCards";
import { dueReviewHref } from "@/features/learning/dueSummary";
import { useDocumentsList } from "../hooks/useDocumentsList";
import { useBrowserDueReminder } from "../hooks/useBrowserDueReminder";

const MAX_ROWS = 5;

function cards(n: number) {
  return `${n} card${n === 1 ? "" : "s"}`;
}

/** "N cards due today" with one review link per document. */
export function TactileDueReviews() {
  const { summary, isLoading, isError } = useDueCards();
  const { data: documents = [] } = useDocumentsList();
  const reminder = useBrowserDueReminder(summary.totalDue);

  const titleById = new Map(documents.map((d) => [d.id, d.title]));
  const rows = summary.documents.slice(0, MAX_ROWS);
  const hidden = summary.documents.length - rows.length;

  return (
    <div className="bg-card rounded-[32px] p-5 sm:p-6 border border-border shadow-tactile-card flex flex-col gap-4 h-full select-none">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold font-display text-foreground tracking-tight">
            {isLoading || isError
              ? "Due today"
              : summary.totalDue > 0
                ? `${cards(summary.totalDue)} due today`
                : "Nothing due today"}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isError
              ? "Could not load your review schedule. Try refreshing."
              : isLoading
                ? "Checking your review schedule…"
                : summary.totalDue > 0
                  ? "New cards and cards whose Leitner interval is up."
                  : "You are all caught up. New flashcards show up here once generated."}
          </p>
        </div>
        <CalendarClock className="size-5 text-muted-foreground shrink-0" aria-hidden="true" />
      </div>

      {rows.length > 0 && (
        <ul className="divide-y divide-border rounded-[20px] border border-border overflow-hidden bg-muted/20">
          {rows.map((row) => (
            <li key={row.documentId}>
              <Link
                href={dueReviewHref(row.documentId)}
                className="flex items-center justify-between gap-3 p-3 text-xs hover:bg-accent transition-colors"
              >
                <span className="font-medium text-foreground truncate">
                  {titleById.get(row.documentId) ?? "Untitled source"}
                </span>
                <span className="flex items-center gap-1 shrink-0 text-muted-foreground">
                  <span className="font-mono font-bold text-foreground">{row.due}</span>
                  <span>due</span>
                  <ChevronRight className="size-3.5" aria-hidden="true" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {hidden > 0 && <p className="text-xs text-muted-foreground">+ {hidden} more sources with due cards</p>}

      {summary.totalDue > 0 && reminder.supported && reminder.permission !== "denied" && (
        <div className="flex items-center justify-between gap-3 pt-1">
          <p className="text-xs text-muted-foreground">
            {reminder.active
              ? "We will remind you here once a day while this tab is open in the background."
              : "Get a reminder while this tab is open. No emails, no push."}
          </p>
          <button
            type="button"
            onClick={() => (reminder.active ? reminder.disable() : void reminder.enable())}
            className="h-8 px-3 rounded-full bg-muted hover:bg-accent text-xs font-semibold text-foreground flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
          >
            <BellRing className="size-3.5" aria-hidden="true" />
            {reminder.active ? "Turn off reminder" : "Remind me in this browser"}
          </button>
        </div>
      )}
      {summary.totalDue > 0 && reminder.permission === "denied" && (
        <p className="text-xs text-muted-foreground">
          Browser notifications are blocked for this site. Allow them in your browser settings to get reminders.
        </p>
      )}
    </div>
  );
}
