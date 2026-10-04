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
  Maximize2,
  X,
  ArrowRight
} from "lucide-react";
import { DocumentRow } from "@/features/documents/types";
import { cn } from "@/lib/utils";

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

export function TactileSourceCards({ documents, isLoading, onNewSource, onExpandView }: TactileSourceCardsProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  const displayList = documents.length > 0
    ? documents.map((doc, idx) => ({
        id: doc.id,
        title: doc.title,
        summary: `Document processed • ${doc.source_type.toUpperCase()} study workspace.`,
        source_type: doc.source_type,
        date: new Date(doc.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        color: idx % 3 === 0 ? "lavender" : idx % 3 === 1 ? "sky" : "mint",
        collaborators: ["S", "AI"],
      }))
    : DEMO_SOURCES;

  const filteredList = displayList.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || item.source_type.toLowerCase() === filterType.toLowerCase();
    return matchesSearch && matchesType;
  });

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
    <div className="bg-white dark:bg-slate-900/90 rounded-[32px] p-5 sm:p-6 border border-black/[0.04] dark:border-white/10 shadow-tactile-card flex flex-col gap-4 select-none">
      {/* Header with Title and Expand Icon */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-bold font-display text-slate-900 dark:text-white tracking-tight">
            Select a course
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Click any source to enter its AI study workspace
          </p>
        </div>

        <button 
          onClick={onExpandView}
          title="View All Sources"
          className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
        >
          <Maximize2 className="size-3.5" />
        </button>
      </div>

      {/* Search Input Bar + New Source Quick Button */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search sources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-4 pr-16 rounded-[20px] bg-slate-100/80 dark:bg-slate-800/80 border border-transparent focus:border-slate-300 dark:focus:border-slate-600 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-all shadow-tactile-inset"
          />
          <div className="absolute right-1.5 top-1.5 flex items-center gap-1">
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="size-8 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
              >
                <X className="size-3.5" />
              </button>
            )}
            <button 
              type="button"
              className="size-8 rounded-[14px] bg-[#1E232A] text-white dark:bg-white dark:text-slate-950 flex items-center justify-center shadow-xs cursor-pointer hover:opacity-90 transition-opacity"
            >
              <Search className="size-3.5 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {onNewSource && (
          <button
            onClick={onNewSource}
            title="Upload new source"
            className="h-11 px-3 sm:px-4 rounded-[20px] bg-[#1E232A] hover:bg-slate-800 text-white dark:bg-white dark:text-slate-950 text-xs font-semibold flex items-center gap-1.5 shadow-tactile-pill hover:scale-[1.02] active:scale-95 transition-all cursor-pointer shrink-0"
          >
            <Plus className="size-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Upload</span>
          </button>
        )}
      </div>

      {/* Filter Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        {["all", "pdf", "audio", "youtube"].map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={cn(
              "px-3 py-1 rounded-full font-medium transition-all cursor-pointer whitespace-nowrap",
              filterType === type
                ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950 font-bold shadow-2xs"
                : "bg-slate-100/70 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
            )}
          >
            {type === "all" ? "All Formats" : type.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Pastel Cards Stack */}
      <div className="flex flex-col gap-3.5 overflow-y-auto max-h-[460px] pr-0.5">
        {filteredList.map((item) => {
          const style = getCardStyle(item.color);

          return (
            <div
              key={item.id}
              onClick={() => router.push(`/app/doc/${item.id}`)}
              className={cn(
                "p-4 sm:p-4.5 rounded-[24px] border transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-tactile-pill active:scale-[0.99] select-none group",
                style.cardBg
              )}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <h3 className={cn("text-sm sm:text-base font-bold font-display leading-snug line-clamp-1", style.titleColor)}>
                  {item.title}
                </h3>
                <span className="p-1 rounded-full bg-white/60 dark:bg-white/10 text-slate-700 dark:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <ArrowRight className="size-3.5" />
                </span>
              </div>

              <p className={cn("text-xs leading-relaxed line-clamp-2 mb-3.5", style.subColor)}>
                {item.summary}
              </p>

              {/* Bottom Meta Pill & Collaborators */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <div className={cn("px-2.5 py-1 rounded-[14px] border font-medium flex items-center gap-1.5 shadow-2xs", style.tagBg)}>
                  <Calendar className="size-3" />
                  <span className="text-[11px] font-mono">{item.date}</span>
                </div>

                {/* Avatar Stack */}
                <div className="flex items-center -space-x-1.5">
                  {item.collaborators.map((initial, i) => (
                    <div
                      key={i}
                      className={cn(
                        "size-6 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-bold shadow-2xs",
                        i === 0 ? style.avatarBg : "bg-slate-800 text-white"
                      )}
                    >
                      {initial}
                    </div>
                  ))}
                  <div className="size-6 rounded-full border-2 border-white dark:border-slate-900 bg-amber-400 text-slate-950 flex items-center justify-center text-[9px] font-bold shadow-2xs">
                    {getSourceIcon(item.source_type)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
