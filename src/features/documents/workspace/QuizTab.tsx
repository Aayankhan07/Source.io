"use client";

import { QuizPlayer } from "@/features/documents/components/QuizPlayer";
import type { QuizRow } from "@/features/documents/types";
import { TAB_PANE_CLASS } from "./tabPane";

export function QuizTab({ documentId, quiz, loading, onRegenerate }: {
  documentId: string;
  quiz: QuizRow | null;
  loading: boolean;
  onRegenerate: () => void;
}) {
  return (
    <div className={TAB_PANE_CLASS}>
      <QuizPlayer documentId={documentId} quiz={quiz} onRegenerate={onRegenerate} loading={loading} />
    </div>
  );
}
