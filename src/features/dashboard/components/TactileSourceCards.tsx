"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Search, 
  Plus, 
  Calendar, 
  FileText, 
  Mic, 
  Video, 
  Youtube, 
  X,
  ArrowRight,
  Trash2,
  Layers,
  AlertTriangle,
  Sparkles
} from "lucide-react";
import { DocumentRow } from "@/features/documents/types";
import { DEMO_DOCUMENTS } from "@/features/documents/data/mockDocuments";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useUserPlan } from "../hooks/useProfileTier";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryKeys } from "@/lib/queryKeys";

interface TactileSourceCardsProps {
  documents: DocumentRow[];
  isLoading?: boolean;
  onNewSource?: () => void;
  onExpandView?: () => void;
  hideHeader?: boolean;
  /** Library view: render every document instead of the overview subset. */
  showAll?: boolean;
}

/** Sample documents bundled with the app (read-only demos). Only ids that exist in DEMO_DOCUMENTS are linked. */
const SAMPLE_SOURCES = Object.values(DEMO_DOCUMENTS).map((d) => ({
  id: d.document.id,
  title: d.document.title,
  source_type: d.document.source_type,
}));

/** Cards shown on the overview before "View all" is needed. */
const OVERVIEW_LIMIT = 8;

const STATUS_LABEL: Record<DocumentRow["status"], string> = {
  ready: "Ready to study",
  processing: "Processing…",
  pending: "Queued for processing",
  failed: "Processing failed",
};

export function TactileSourceCards({
  documents,
  isLoading,
  onNewSource,
  onExpandView,
  hideHeader = false,
  showAll = false,
}: TactileSourceCardsProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; title: string } | null>(null);
  const plan = useUserPlan();

  const hasDocuments = documents.length > 0;
  const activeCount = documents.length;
  const slotLimit = plan.documents;
  const isFull = activeCount >= slotLimit;
  const slotsRemaining = Math.max(0, slotLimit - activeCount);

  const displayList = documents.map((doc) => ({
    id: doc.id,
    title: doc.title,
    summary: STATUS_LABEL[doc.status] ?? doc.status,
    failed: doc.status === "failed",
    source_type: doc.source_type,
    date: new Date(doc.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
  }));

  const filteredList = displayList.filter((item) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = item.title.toLowerCase().includes(q);
    const matchesType = filterType === "all" || item.source_type.toLowerCase() === filterType.toLowerCase();
    return matchesSearch && matchesType;
  });
  const visibleList = showAll ? filteredList : filteredList.slice(0, OVERVIEW_LIMIT);
  const hiddenCount = filteredList.length - visibleList.length;

  const requestDelete = (e: React.MouseEvent, docId: string, title: string) => {
    e.stopPropagation();
    if (deletingId) return;
    setPendingDelete({ id: docId, title });
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const docId = pendingDelete.id;
    setPendingDelete(null);
    setDeletingId(docId);
    try {
      const { error } = await supabase.from("documents").delete().eq("id", docId);
      if (error) throw error;
      toast({
        title: "Document deleted",
        description: "1 document slot has been freed up.",
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.documents });
      queryClient.invalidateQueries({ queryKey: ["active_saved_documents_count"] });
    } catch (err: unknown) {
      toast({
        title: "Delete failed",
        description: err instanceof Error ? err.message : "Could not delete document",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const getSourceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "audio":
        return <Mic className="size-3.5" />;
      case "video":
        return <Video className="size-3.5" />;
      case "youtube":
        return <Youtube className="size-3.5" />;
      default:
        return <FileText className="size-3.5" />;
    }
  };

  const getFormatBadgeStyle = (type: string) => {
    switch (type.toLowerCase()) {
      case "pdf":
      case "audio":
      case "youtube":
      case "text":
      default:
        return "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700";
    }
  };

  const getCardStyle = () => {
    return {
      cardBg: "bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 shadow-xs hover:shadow-md",
      titleColor: "text-slate-950 dark:text-white",
      subColor: "text-slate-500 dark:text-slate-400",
      tagBg: "bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-700/60",
    };
  };

  return (
    <div className="bg-card rounded-[32px] p-5 sm:p-7 border border-border shadow-tactile-card flex flex-col gap-5 select-none w-full">
      {/* Header with Title, Slots Indicator, and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {!hideHeader ? (
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h2 className="text-xl sm:text-2xl font-bold font-display text-foreground tracking-tight">
                Study Sources
              </h2>
              {hasDocuments && (
                <span className={cn(
                  "text-xs font-mono px-2.5 py-0.5 rounded-full border font-semibold flex items-center gap-1.5",
                  isFull
                    ? "bg-slate-200 text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
                    : "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700"
                )}>
                  <Layers className="size-3" />
                  <span>{activeCount} / {slotLimit} slots used</span>
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {hasDocuments
                ? isFull
                  ? `${activeCount} of ${slotLimit} ${plan.name} document slots used. Delete an existing document to add another.`
                  : `${slotsRemaining} document slot${slotsRemaining === 1 ? "" : "s"} available on ${plan.name}. Click any source to study.`
                : `Your ${plan.name} plan includes ${slotLimit} document slot${slotLimit === 1 ? "" : "s"}.`}
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {hasDocuments && (
              <span className={cn(
                "text-xs font-mono px-2.5 py-1 rounded-full border font-semibold flex items-center gap-1.5",
                isFull
                  ? "bg-slate-200 text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
                  : "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700"
              )}>
                <Layers className="size-3" />
                <span>{activeCount} / {slotLimit} slots used</span>
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              Filter by format or search across all uploaded textbooks and papers.
            </span>
          </div>
        )}

        {/* Search Input Bar + New Source Quick Button */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <input
              type="text"
              placeholder="Search sources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-4 pr-16 rounded-[20px] bg-surface-sunken border border-input focus:border-ring text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none transition-all shadow-tactile-inset"
            />
            <div className="absolute right-1.5 top-1.5 flex items-center gap-1">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="size-7 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground transition-colors cursor-pointer"
                >
                  <X className="size-3" />
                </button>
              )}
              <div className="size-7 rounded-[12px] bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
                <Search className="size-3.5 stroke-[2.5]" />
              </div>
            </div>
          </div>

          {onNewSource && (
            <button
              onClick={onNewSource}
              title={isFull ? `Document limit reached (${activeCount}/${slotLimit}). Delete a document to add another.` : "Upload new study document"}
              className={cn(
                "h-10 px-4 rounded-[20px] text-xs font-semibold flex items-center gap-1.5 shadow-tactile-pill hover:scale-[1.02] active:scale-95 transition-all cursor-pointer shrink-0",
                isFull
                  ? "bg-amber-600 hover:bg-amber-700 text-white"
                  : "bg-primary hover:opacity-90 text-primary-foreground"
              )}
            >
              {isFull ? (
                <>
                  <AlertTriangle className="size-3.5 stroke-[2.5]" />
                  <span>{activeCount}/{slotLimit} Slots Full</span>
                </>
              ) : (
                <>
                  <Plus className="size-4 stroke-[2.5]" />
                  <span>Upload</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Filter Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        {[
          { id: "all", label: "All Formats" },
          { id: "pdf", label: "PDF Documents" },
          { id: "audio", label: "Audio Lectures" },
          { id: "youtube", label: "YouTube" },
          { id: "text", label: "Text / Markdown" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id)}
            className={cn(
              "px-3.5 py-1.5 rounded-full font-medium transition-all cursor-pointer whitespace-nowrap",
              filterType === tab.id
                ? "bg-primary text-primary-foreground font-bold shadow-2xs"
                : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Responsive Cards Grid */}
      {isLoading ? (
        <div className="w-full py-12 text-center text-xs text-muted-foreground">Loading sources…</div>
      ) : !hasDocuments ? (
        <div className="w-full py-10 px-4 rounded-[24px] border border-dashed border-border flex flex-col items-center justify-center text-center">
          <div className="size-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground mb-3 shadow-tactile-pill">
            <FileText className="size-6 text-muted-foreground" />
          </div>
          <h3 className="text-base font-bold text-foreground">No sources yet</h3>
          <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
            Upload a PDF, paste text, or add an audio lecture or YouTube link to generate notes, flashcards, and quizzes.
          </p>
          {onNewSource && (
            <button
              type="button"
              onClick={onNewSource}
              className="h-9 px-4 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 shadow-sm hover:scale-105 transition-all cursor-pointer"
            >
              <Plus className="size-3.5" />
              <span>Upload your first source</span>
            </button>
          )}

          {SAMPLE_SOURCES.length > 0 && (
            <div className="mt-8 w-full max-w-2xl text-left">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1 text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-border bg-muted text-foreground">
                  <Sparkles className="size-3" />
                  Sample
                </span>
                <span className="text-xs text-muted-foreground">
                  Explore a read-only example before uploading your own.
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {SAMPLE_SOURCES.map((sample) => (
                  <Link
                    key={sample.id}
                    href={`/app/doc/${sample.id}`}
                    className="p-3 rounded-[18px] border border-border bg-muted/30 hover:bg-muted transition-colors flex items-center gap-2 min-w-0"
                  >
                    <span className="size-7 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-950 flex items-center justify-center shrink-0">
                      {getSourceIcon(sample.source_type)}
                    </span>
                    <span className="text-xs font-semibold text-foreground line-clamp-2">Sample: {sample.title}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : filteredList.length === 0 ? (
        <div className="w-full py-12 px-4 rounded-[24px] border border-dashed border-border flex flex-col items-center justify-center text-center">
          <h3 className="text-base font-bold text-foreground">No matching sources</h3>
          <p className="text-xs text-muted-foreground max-w-sm mt-1">
            {searchQuery
              ? `No sources matched "${searchQuery}". Try a different term or format.`
              : "No sources in this format yet."}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {visibleList.map((item) => {
              const style = getCardStyle();
              const formatBadgeClass = getFormatBadgeStyle(item.source_type);

              return (
                <div
                  key={item.id}
                  role="link"
                  tabIndex={0}
                  onClick={() => router.push(`/app/doc/${item.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.target === e.currentTarget) router.push(`/app/doc/${item.id}`);
                  }}
                  className={cn(
                    "p-4 sm:p-5 rounded-[24px] border transition-all duration-200 cursor-pointer hover:-translate-y-1 active:scale-[0.99] select-none group flex flex-col justify-between min-h-[160px] relative",
                    style.cardBg
                  )}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className={cn("text-sm sm:text-base font-bold font-display leading-snug line-clamp-2 pr-6", style.titleColor)}>
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => requestDelete(e, item.id, item.title)}
                          onKeyDown={(e) => e.stopPropagation()}
                          disabled={deletingId === item.id}
                          title="Delete document to free up a slot"
                          aria-label={`Delete ${item.title}`}
                          className="p-1 rounded-full text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:text-slate-400 dark:hover:bg-rose-950/40 transition-colors opacity-0 group-hover:opacity-100 focus-visible:opacity-100 cursor-pointer"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                        <span className="p-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ArrowRight className="size-3.5" />
                        </span>
                      </div>
                    </div>

                    <p
                      className={cn(
                        "text-xs leading-relaxed line-clamp-2 mb-4",
                        item.failed ? "text-rose-600 dark:text-rose-400" : style.subColor
                      )}
                    >
                      {item.summary}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-white/5 text-xs">
                    <div className={cn("px-2.5 py-1 rounded-[14px] border font-medium flex items-center gap-1.5 shadow-2xs", style.tagBg)}>
                      <Calendar className="size-3 text-slate-400" />
                      <span className="text-xs font-mono">{item.date}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className={cn("text-xs font-mono font-bold uppercase px-2 py-0.5 rounded-full border shadow-2xs", formatBadgeClass)}>
                        {item.source_type}
                      </span>
                      <div className="size-6 rounded-full border border-border bg-slate-900 text-white dark:bg-white dark:text-slate-950 flex items-center justify-center shadow-2xs">
                        {getSourceIcon(item.source_type)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {!showAll && onExpandView && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={onExpandView}
                className="h-9 px-4 rounded-full bg-muted hover:bg-accent text-xs font-semibold text-foreground flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>{hiddenCount > 0 ? `View all ${filteredList.length} sources` : "Open library"}</span>
                <ArrowRight className="size-3.5" />
              </button>
            </div>
          )}
        </>
      )}

      <AlertDialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this source?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{pendingDelete?.title}&rdquo; and its notes, flashcards, quizzes, podcast, and chat history will be
              permanently removed. This frees up 1 document slot.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-rose-600 text-white hover:bg-rose-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
