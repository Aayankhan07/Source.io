"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, Loader2, Printer, RefreshCw, Sparkles, Trash2 } from "lucide-react";
import MarkdownView from "@/components/common/MarkdownView";
import { AiFeedbackButtons } from "@/components/common/AiFeedbackButtons";
import NotesSettingsPopover from "@/features/documents/components/NotesSettingsPopover";
import type { OutlineHeading } from "@/features/documents/components/WorkspaceOutline";
import type { DocumentRow, NoteRow } from "@/features/documents/types";
import { useSettings } from "@/features/settings/context/SettingsContext";
import type { NotesProgress } from "@/lib/services/pipeline";
import { calculateReadTime, cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { NotesSkeleton, Placeholder } from "./StatusStates";

export interface NotesDocumentProps {
  doc: DocumentRow;
  note: NoteRow | null;
  assetsLoading: boolean;
  streaming: boolean;
  progress: NotesProgress | null;
  incomplete: string | null;
  onGenerate: (opts?: { force?: boolean }) => void;
  onRequestDelete: () => void;
  headings: OutlineHeading[];
  /** Show the "On this page" strip (desktop hides it while the outline rail is open). */
  showSummaryBanner: boolean;
  onJumpToHeading: (id: string) => void;
  /** Tighter padding for phones. */
  compact?: boolean;
}

const ACTION_BTN =
  "h-9 px-3 text-xs font-semibold text-foreground bg-muted hover:bg-accent rounded-full inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50";

function progressLabel(progress: NotesProgress | null): string {
  return progress && progress.total > 0
    ? `Generating notes… Section ${progress.section} of ${progress.total}`
    : "Generating notes…";
}

/** The notes card and every notes state (loading, generating, paused, processing, failed). */
export function NotesDocument({
  doc,
  note,
  assetsLoading,
  streaming,
  progress,
  incomplete,
  onGenerate,
  onRequestDelete,
  headings,
  showSummaryBanner,
  onJumpToHeading,
  compact = false,
}: NotesDocumentProps) {
  const { settings, notesSettings } = useSettings();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<number | null>(null);
  useEffect(() => () => {
    if (copiedTimer.current !== null) window.clearTimeout(copiedTimer.current);
  }, []);

  const markdown = note?.markdown ?? "";
  const readTimeMinutes = calculateReadTime(markdown, settings?.readingTargetWpm || 200).readMinutes;
  const isProcessing = doc.status === "pending" || doc.status === "processing";

  const handleCopy = async () => {
    if (!markdown) return;
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      toast({ title: "Copied to clipboard", description: "Study notes markdown copied." });
      copiedTimer.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Couldn't copy", description: "Your browser blocked clipboard access.", variant: "destructive" });
    }
  };

  let body: React.ReactNode;
  if (assetsLoading) {
    body = <NotesSkeleton />;
  } else if (markdown) {
    body = (
      <div className="space-y-6 animate-fade-in pb-16">
        <div
          id="printable-notes-section"
          className={cn(
            "bg-card border border-border shadow-tactile-card printable-note-card",
            compact ? "rounded-2xl p-5 sm:p-8" : "rounded-[32px] p-6 sm:p-10 lg:p-12",
          )}
        >
          {/* Print-only header */}
          <div className="print-only mb-6 pb-4 border-b border-slate-300">
            <div className="flex items-center justify-between text-xs text-slate-500 font-mono mb-2">
              <span className="uppercase tracking-wider font-bold">Source.io Study Engine</span>
              <span>{new Date(doc.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
            </div>
            <h1 className="text-2xl font-bold font-display text-slate-900 tracking-tight mb-2">{doc.title}</h1>
            <div className="flex items-center gap-3 text-xs text-slate-600 font-mono">
              <span className="uppercase font-bold px-2 py-0.5 rounded bg-slate-100 border border-slate-300">{doc.source_type}</span>
              <span>{readTimeMinutes} min read</span>
            </div>
          </div>

          {/* Metadata + actions (screen only) */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-6 mb-8 border-b border-border no-print">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-xs font-mono uppercase px-2.5 py-1 rounded-full bg-muted text-foreground font-bold border border-border shrink-0">
                {doc.source_type}
              </span>
              <span className="text-xs text-muted-foreground font-mono shrink-0">{readTimeMinutes} min read</span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button type="button" onClick={handleCopy} className={ACTION_BTN}>
                {copied ? <Check className="size-3.5 text-emerald-500 stroke-[2.5]" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
                <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                title="Export or print publication-ready notes as PDF"
                className={ACTION_BTN}
              >
                <Printer className="size-3.5 text-muted-foreground" aria-hidden="true" />
                <span>Export PDF</span>
              </button>
              <button type="button" onClick={() => onGenerate({ force: true })} disabled={streaming} className={ACTION_BTN}>
                <RefreshCw className={cn("size-3.5", streaming && "animate-spin text-sky-500")} aria-hidden="true" />
                <span>Regenerate</span>
              </button>
              <NotesSettingsPopover onRegenerate={() => onGenerate({ force: true })} isStreaming={streaming} />
              <button
                type="button"
                onClick={onRequestDelete}
                title="Delete document"
                aria-label="Delete document"
                className="size-9 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <MarkdownView>{markdown}</MarkdownView>

          <div className="pt-6 mt-8 border-t border-border flex flex-wrap items-center justify-between gap-2 no-print">
            <AiFeedbackButtons documentId={doc.id} feature="notes" model={settings.preferredModel} />
            <span className="text-xs text-muted-foreground font-mono">Source.io Study Engine</span>
          </div>
        </div>
        {streaming && <GeneratingStatus progress={progress} />}
      </div>
    );
  } else if (streaming) {
    body = (
      <div className="space-y-4">
        <GeneratingStatus progress={progress} />
        <NotesSkeleton label={progressLabel(progress)} />
      </div>
    );
  } else if (doc.status === "ready") {
    body = (
      <div className="rounded-[28px] border border-border p-10 text-center space-y-4 max-w-md mx-auto mt-12 bg-card shadow-tactile-card animate-fade-in no-print">
        <div className="size-12 rounded-2xl bg-muted border border-border flex items-center justify-center text-foreground mx-auto">
          <Sparkles className="size-6" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-foreground font-display text-base">Generate study notes</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            We&apos;ve indexed your material. Generate structured teaching notes to begin.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onGenerate()}
          className="h-10 px-5 rounded-full text-xs font-bold bg-primary text-primary-foreground hover:scale-105 active:scale-95 transition-all shadow-tactile-pill cursor-pointer flex items-center gap-2 mx-auto"
        >
          <Sparkles className="size-3.5" aria-hidden="true" />
          <span>Generate Notes</span>
        </button>
      </div>
    );
  } else if (isProcessing) {
    body = <Placeholder title="Parsing source file..." desc="We're compiling the documents. The study dashboard will start shortly." loading />;
  } else if (doc.status === "failed") {
    body = <Placeholder title="Ingestion failed" desc={doc.error_code ?? "Something went wrong while parsing the source."} />;
  } else {
    body = <Placeholder title="Pending workspace" desc="Waiting for the background compiler to finish processing." />;
  }

  return (
    <div className={cn("max-w-4xl mx-auto", compact ? "space-y-4" : "space-y-6 pb-16")}>
      {showSummaryBanner && notesSettings.showPageSummaryBanner && headings.length > 0 && (
        <nav
          aria-label="On this page"
          className="flex items-center gap-2 px-4 py-2.5 rounded-[18px] bg-card/80 backdrop-blur-md border border-border text-xs text-muted-foreground shadow-2xs animate-fade-in no-print"
        >
          <span className="font-bold text-foreground shrink-0 font-display">On this page:</span>
          <div className="flex items-center gap-1.5 overflow-x-auto truncate scrollbar-none">
            {headings.slice(0, 6).map((h, idx) => (
              <button
                key={h.id}
                type="button"
                onClick={() => onJumpToHeading(h.id)}
                className="hover:text-foreground hover:underline transition-colors shrink-0 text-left cursor-pointer"
              >
                {h.text}
                {idx < Math.min(headings.length, 6) - 1 ? " · " : ""}
              </button>
            ))}
            {headings.length > 6 && <span className="shrink-0 text-muted-foreground">+{headings.length - 6} more</span>}
          </div>
        </nav>
      )}

      {incomplete && !streaming && (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300/70 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/40 px-4 py-3 text-xs text-amber-900 dark:text-amber-200 no-print"
        >
          <p className="leading-relaxed min-w-0 flex-1">{incomplete}</p>
          <button
            type="button"
            onClick={() => onGenerate()}
            className="h-9 px-4 rounded-full text-xs font-bold bg-primary text-primary-foreground inline-flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <RefreshCw className="size-3.5" aria-hidden="true" />
            Continue generating
          </button>
        </div>
      )}

      {body}
    </div>
  );
}

function GeneratingStatus({ progress }: { progress: NotesProgress | null }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-2 text-xs text-sky-700 dark:text-sky-300 font-mono bg-sky-50 dark:bg-sky-950/40 px-3.5 py-2.5 rounded-full border border-sky-200 dark:border-sky-800 max-w-max no-print"
    >
      <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
      {progressLabel(progress)}
    </div>
  );
}
