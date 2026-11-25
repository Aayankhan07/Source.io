"use client";

import { useCallback, useEffect, useState } from "react";
import { ListTree, Sparkles } from "lucide-react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import WorkspaceOutline, { type OutlineHeading } from "@/features/documents/components/WorkspaceOutline";
import { useAppShell } from "@/features/documents/context/AppShellContext";
import { AskTab } from "./AskTab";
import { NotesDocument, type NotesDocumentProps } from "./NotesDocument";
import { DESKTOP_NOTES_QUERY, useMediaQuery } from "./useMediaQuery";

type NotesTabProps = Omit<NotesDocumentProps, "showSummaryBanner" | "onJumpToHeading" | "compact"> & {
  headings: OutlineHeading[];
};

const FLOATING_BTN =
  "h-9 px-3.5 rounded-full shadow-tactile-pill bg-card/95 backdrop-blur-md border border-border text-foreground hover:bg-accent text-xs font-semibold flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer";

/**
 * Notes + outline + Ask Copilot. Exactly one layout is mounted (chosen by a media query),
 * so MarkdownView and AskPanel render once and the chat keeps a single state.
 */
export function NotesTab(props: NotesTabProps) {
  const isDesktop = useMediaQuery(DESKTOP_NOTES_QUERY);
  const { setCopilotOpen } = useAppShell();
  const [outlineOpen, setOutlineOpen] = useState(true);
  const [outlineRetracted, setOutlineRetracted] = useState(false);
  const [askPanelOpen, setAskPanelOpen] = useState(true);
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);

  // Lets the app shell place the quota pill clear of the Ask rail.
  useEffect(() => {
    setCopilotOpen(isDesktop && askPanelOpen);
    return () => setCopilotOpen(false);
  }, [isDesktop, askPanelOpen, setCopilotOpen]);

  /** Scrolls the notes to a heading (summary strip, Ask citations). */
  const jumpToHeading = useCallback((id: string) => {
    setActiveHeadingId(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const ask = (onClose?: () => void) => (
    <AskTab
      documentId={props.doc.id}
      noteMarkdown={props.note?.markdown}
      headings={props.headings}
      onJumpToHeading={jumpToHeading}
      onClose={onClose}
    />
  );

  if (!isDesktop) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-4">
          <NotesDocument {...props} showSummaryBanner onJumpToHeading={jumpToHeading} compact />
          <section aria-label="Ask Copilot" className="mt-4 border-t border-border/60 pt-4 no-print">
            {ask()}
          </section>
        </div>
      </div>
    );
  }

  const stageSize = outlineOpen
    ? outlineRetracted
      ? askPanelOpen ? 72 : 96
      : askPanelOpen ? 56 : 80
    : askPanelOpen ? 76 : 100;

  return (
    <div className="h-full w-full relative">
      <ResizablePanelGroup direction="horizontal" className="h-full w-full">
        {outlineOpen && (
          <>
            <ResizablePanel
              id="workspace-outline-panel"
              order={1}
              defaultSize={outlineRetracted ? 4 : 20}
              minSize={outlineRetracted ? 4 : 14}
              maxSize={outlineRetracted ? 5 : 28}
              className="no-print"
            >
              <div className="h-full p-2.5 pl-3 pr-1">
                <WorkspaceOutline
                  markdown={props.note?.markdown}
                  activeHeadingId={activeHeadingId}
                  onSelectHeading={setActiveHeadingId}
                  isRetracted={outlineRetracted}
                  onToggleRetract={() => setOutlineRetracted((v) => !v)}
                  onClose={() => setOutlineOpen(false)}
                />
              </div>
            </ResizablePanel>
            <ResizableHandle className="w-1.5 bg-transparent hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-col-resize no-print" />
          </>
        )}

        <ResizablePanel id="workspace-notes-stage" order={2} defaultSize={stageSize}>
          <div className="h-full overflow-y-auto relative bg-tactile-canvas p-2.5 px-2">
            <NotesDocument
              {...props}
              showSummaryBanner={!outlineOpen || outlineRetracted}
              onJumpToHeading={jumpToHeading}
            />
          </div>
        </ResizablePanel>

        {askPanelOpen && (
          <>
            <ResizableHandle className="w-1.5 bg-transparent hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-col-resize no-print" />
            <ResizablePanel id="workspace-ask-panel" order={3} defaultSize={24} minSize={18} maxSize={35} className="no-print">
              <div className="h-full p-2.5 pr-3 pl-1">{ask(() => setAskPanelOpen(false))}</div>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>

      {!outlineOpen && (
        <div className="absolute left-4 top-4 z-30 animate-fade-in no-print">
          <button
            type="button"
            onClick={() => {
              setOutlineOpen(true);
              setOutlineRetracted(false);
            }}
            className={FLOATING_BTN}
          >
            <ListTree className="size-3.5 text-sky-600 dark:text-sky-400" aria-hidden="true" />
            <span>Outline</span>
          </button>
        </div>
      )}

      {!askPanelOpen && (
        <div className="absolute right-4 top-4 z-30 animate-fade-in no-print">
          <button type="button" onClick={() => setAskPanelOpen(true)} className={FLOATING_BTN}>
            <Sparkles className="size-3.5 text-sky-600 dark:text-sky-400" aria-hidden="true" />
            <span>Ask Copilot</span>
          </button>
        </div>
      )}
    </div>
  );
}
