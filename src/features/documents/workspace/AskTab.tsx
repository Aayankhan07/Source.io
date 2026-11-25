"use client";

import { AskPanel } from "@/features/documents/components/AskPanel";
import type { OutlineHeading } from "@/features/documents/components/WorkspaceOutline";

/**
 * The grounded "Ask Copilot" chat for a document. Rendered once: as the right rail on
 * desktop, or below the notes on phones.
 */
export function AskTab({
  documentId,
  noteMarkdown,
  headings,
  onJumpToHeading,
  onClose,
}: {
  documentId: string;
  noteMarkdown: string | null | undefined;
  headings: OutlineHeading[];
  onJumpToHeading: (id: string) => void;
  onClose?: () => void;
}) {
  return (
    <AskPanel
      documentId={documentId}
      noteMarkdown={noteMarkdown}
      headings={headings}
      onScrollToHeading={onJumpToHeading}
      onClose={onClose}
    />
  );
}
