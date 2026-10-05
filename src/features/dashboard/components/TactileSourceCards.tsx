"use client";

import React, { useState } from "react";
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
  AlertTriangle
} from "lucide-react";
import { DocumentRow } from "@/features/documents/types";
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
}

// Fallback demo documents mapped to working mock sets in mockDocuments.ts
const DEMO_SOURCES = [
  {
    id: "demo-quantum",
    title: "Introduction to Quantum Computing",
    summary: "Qubit states, superposition equations, decoherence noise, and Shor's algorithm.",
    source_type: "pdf",
    date: "04 Oct 2026",
    color: "lavender", // purple
    collaborators: ["S", "AI"],
  },
  {
    id: "demo-linalg",
    title: "Linear Algebra & Eigenvalues",
    summary: "Matrix transformations, spectral decomposition, and high-dimensional projections.",
    source_type: "text",
    date: "03 Oct 2026",
    color: "sky", // blue
    collaborators: ["J", "AI"],
  },
  {
    id: "demo-biology",
    title: "Molecular Biology & Genetics",
    summary: "DNA replication helicase enzymes, transcription cascades, and RNA polymerases.",
    source_type: "audio",
    date: "29 Sep 2026",
    color: "mint", // green
    collaborators: ["A", "AI"],
  },
  {
    id: "demo-networking",
    title: "CSMA & Multiple Access Protocols",
    summary: "Slotted ALOHA collision domains, carrier sense throughput limits, and token rings.",
    source_type: "youtube",
    date: "25 Sep 2026",
    color: "lavender",
    collaborators: ["M", "AI"],
  },
];

export function TactileSourceCards({ documents, isLoading, onNewSource }: TactileSourceCardsProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isRealData = documents.length > 0;
  const activeCount = documents.length;
  const isFull = activeCount >= 3;
  const slotsRemaining = Math.max(0, 3 - activeCount);

  const displayList = isRealData
    ? documents.map((doc, idx) => ({
        id: doc.id,
        title: doc.title,
        summary: `Document processed • ${doc.source_type.toUpperCase()} study workspace.`,
        source_type: doc.source_type,
        date: new Date(doc.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        color: idx % 3 === 0 ? "lavender" : idx % 3 === 1 ? "sky" : "mint",
        collaborators: ["S", "AI"],
        isReal: true,
      }))
    : DEMO_SOURCES.map((d) => ({ ...d, isReal: false }));

  const filteredList = displayList.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || item.source_type.toLowerCase() === filterType.toLowerCase();
    return matchesSearch && matchesType;
  });

  const handleDelete = async (e: React.MouseEvent, docId: string, title: string) => {
    e.stopPropagation();
    if (deletingId) return;

    if (!confirm(`Delete "${title}"? This will free up 1 document slot. All associated notes and flashcards will be removed.`)) {
      return;
    }

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

  const getCardStyle = (color: string) => {
    switch (color) {
      case "lavender":
        return {
          cardBg: "bg-[#EEECFC] dark:bg-purple-950/35 border-[#DDD8FA] dark:border-purple-800/30",
          titleColor: "text-slate-900 dark:text-purple-100",
          subColor: "text-slate-600 dark:text-purple-300/80",
          tagBg: "bg-white/80 dark:bg-purple-900/60 text-purple-900 dark:text-purple-200 border-purple-200 dark:border-purple-700/50",
          avatarBg: "bg-[#7C3AED] text-white",
        };
      case "sky":
        return {
          cardBg: "bg-[#E7F3FE] dark:bg-sky-950/35 border-[#CDE5FC] dark:border-sky-800/30",
          titleColor: "text-slate-900 dark:text-sky-100",
          subColor: "text-slate-600 dark:text-sky-300/80",
          tagBg: "bg-white/80 dark:bg-sky-900/60 text-sky-900 dark:text-sky-200 border-sky-200 dark:border-sky-700/50",
          avatarBg: "bg-[#0284C7] text-white",
        };
      case "mint":
      default:
        return {
          cardBg: "bg-[#E7F7ED] dark:bg-emerald-950/35 border-[#C9EED6] dark:border-emerald-800/30",
          titleColor: "text-slate-900 dark:text-emerald-100",
          subColor: "text-slate-600 dark:text-emerald-300/80",
          tagBg: "bg-white/80 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-700/50",
          avatarBg: "bg-[#16A34A] text-white",
        };
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900/90 rounded-[32px] p-5 sm:p-7 border border-black/[0.04] dark:border-white/10 shadow-tactile-card flex flex-col gap-5 select-none w-full">
      {/* Header with Title, Slots Indicator, and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-white tracking-tight">
              Study Sources
            </h2>
            {isRealData && (
              <span className={cn(
                "text-xs font-mono px-2.5 py-0.5 rounded-full border font-semibold flex items-center gap-1.5",
                isFull
                  ? "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                  : "bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800"
              )}>
                <Layers className="size-3" />
                <span>{activeCount} / 3 slots used</span>
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {isRealData
              ? isFull
                ? "3 of 3 free document slots used. Delete an existing document to replace it."
                : `${slotsRemaining} document slot${slotsRemaining === 1 ? "" : "s"} available. Click any source to study.`
              : "Click any source to enter its 5 AI study lenses"}
          </p>
        </div>

        {/* Search Input Bar + New Source Quick Button */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <input
              type="text"
              placeholder="Search sources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-4 pr-16 rounded-[20px] bg-slate-100/80 dark:bg-slate-800/80 border border-transparent focus:border-slate-300 dark:focus:border-slate-600 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-all shadow-tactile-inset"
            />
            <div className="absolute right-1.5 top-1.5 flex items-center gap-1">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="size-7 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
                >
                  <X className="size-3" />
                </button>
              )}
              <div className="size-7 rounded-[12px] bg-[#1E232A] text-white dark:bg-white dark:text-slate-950 flex items-center justify-center shadow-xs">
                <Search className="size-3.5 stroke-[2.5]" />
              </div>
            </div>
          </div>

          {onNewSource && (
            <button
              onClick={onNewSource}
              title={isFull ? "Free limit reached (3/3). Delete a document to add another." : "Upload new study document"}
              className={cn(
                "h-10 px-4 rounded-[20px] text-xs font-semibold flex items-center gap-1.5 shadow-tactile-pill hover:scale-[1.02] active:scale-95 transition-all cursor-pointer shrink-0",
                isFull
                  ? "bg-amber-600 hover:bg-amber-700 text-white"
                  : "bg-[#1E232A] hover:bg-slate-800 text-white dark:bg-white dark:text-slate-950"
              )}
            >
              {isFull ? (
                <>
                  <AlertTriangle className="size-3.5 stroke-[2.5]" />
                  <span>3/3 Slots Full</span>
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
                ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950 font-bold shadow-2xs"
                : "bg-slate-100/70 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Responsive Cards Grid */}
      {filteredList.length === 0 ? (
        <div className="w-full py-12 px-4 rounded-[24px] border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-center">
          <div className="size-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3 shadow-tactile-pill">
            <FileText className="size-6 text-slate-400" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No study sources found</h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
            {searchQuery
              ? `No sources matched "${searchQuery}". Try a different term or format.`
              : "Upload your first PDF textbook, audio lecture, or YouTube video to synthesize 5 AI study lenses."}
          </p>
          {onNewSource && (
            <button
              onClick={onNewSource}
              className="h-9 px-4 rounded-full bg-slate-950 text-white dark:bg-white dark:text-slate-950 text-xs font-semibold flex items-center gap-1.5 shadow-sm hover:scale-105 transition-all cursor-pointer"
            >
              <Plus className="size-3.5" />
              <span>Upload First Source</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredList.map((item) => {
            const style = getCardStyle(item.color);

            return (
              <div
                key={item.id}
                onClick={() => router.push(`/app/doc/${item.id}`)}
                className={cn(
                  "p-4 sm:p-5 rounded-[24px] border transition-all duration-200 cursor-pointer hover:-translate-y-1 hover:shadow-tactile-pill active:scale-[0.99] select-none group flex flex-col justify-between min-h-[170px] relative",
                  style.cardBg
                )}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className={cn("text-sm sm:text-base font-bold font-display leading-snug line-clamp-2 pr-6", style.titleColor)}>
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Delete slot button for real user documents */}
                      {item.isReal && (
                        <button
                          type="button"
                          onClick={(e) => handleDelete(e, item.id, item.title)}
                          disabled={deletingId === item.id}
                          title="Delete document to free up a slot"
                          className="p-1 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                      <span className="p-1 rounded-full bg-white/60 dark:bg-white/10 text-slate-700 dark:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowRight className="size-3.5" />
                      </span>
                    </div>
                  </div>

                  <p className={cn("text-xs leading-relaxed line-clamp-2 mb-4", style.subColor)}>
                    {item.summary}
                  </p>
                </div>

                {/* Bottom Meta Pill & Format Badge */}
                <div className="flex items-center justify-between pt-2 border-t border-current/10 text-xs">
                  <div className={cn("px-2.5 py-1 rounded-[14px] border font-medium flex items-center gap-1.5 shadow-2xs", style.tagBg)}>
                    <Calendar className="size-3" />
                    <span className="text-[11px] font-mono">{item.date}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-mono font-semibold uppercase px-2 py-0.5 rounded-md bg-white/70 dark:bg-black/30 border border-current/10">
                      {item.source_type}
                    </span>
                    <div className="size-6 rounded-full border-2 border-white dark:border-slate-900 bg-amber-400 text-slate-950 flex items-center justify-center text-[10px] font-bold shadow-2xs">
                      {getSourceIcon(item.source_type)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
