"use client";

import { useMemo } from "react";
import { DocumentRow } from "@/features/documents/types";
import { Upload, Sparkles, BookOpen, Clock, Layers, ArrowRight, Zap, FileText } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface BentoTelemetryProps {
  documents: DocumentRow[];
  onDropFiles?: (files: File[]) => void;
  onOpenUpload: () => void;
}

export default function BentoTelemetry({
  documents,
  onDropFiles,
  onOpenUpload,
}: BentoTelemetryProps) {
  const router = useRouter();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple: true,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0 && onDropFiles) {
        onDropFiles(acceptedFiles);
      } else {
        onOpenUpload();
      }
    },
  });

  const stats = useMemo(() => {
    const totalDocs = documents.length;
    const readyDocs = documents.filter((d) => d.status === "ready").length;
    const estTimeSavedMinutes = totalDocs * 45; // ~45 mins per document
    const estHours = (estTimeSavedMinutes / 60).toFixed(1);
    return { totalDocs, readyDocs, estHours };
  }, [documents]);

  const recentDoc = documents[0];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4 mb-6 sm:mb-8">
      {/* 1. Knowledge Base & Study Velocity */}
      <div className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-card border border-border/80 shadow-xs flex flex-col justify-between relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 dark:bg-white/[0.03] rounded-full blur-2xl pointer-events-none" />
        
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold">
              Study Velocity
            </span>
            <span className="flex items-center gap-1 text-[11px] font-mono text-sky-700 dark:text-zinc-200 font-bold bg-sky-50 dark:bg-zinc-800/80 border border-sky-200/80 dark:border-zinc-700 px-2 py-0.5 rounded-full">
              <Zap className="h-3 w-3" /> Groq Llama 3
            </span>
          </div>

          <div className="space-y-1 mb-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-bold font-display text-foreground">
                {stats.totalDocs}
              </span>
              <span className="text-xs text-muted-foreground font-medium">materials indexed</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              ~{stats.estHours} hours of reading and active recall study accelerated.
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>{stats.readyDocs} ready to review</span>
          </div>
          <span className="font-mono text-[11px]">Instant synthesis</span>
        </div>
      </div>

      {/* 2. Direct Ingestion Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          "p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-dashed transition-[border-color,background-color] flex flex-col items-center justify-center text-center cursor-pointer relative overflow-hidden group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          isDragActive
            ? "border-sky-500 bg-sky-500/10 dark:border-zinc-400 dark:bg-zinc-800/40 shadow-glow"
            : "border-border/90 hover:border-sky-500/50 dark:hover:border-zinc-500 bg-card hover:bg-muted/30 shadow-xs"
        )}
      >
        <input {...getInputProps()} />
        <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-3 group-active:scale-95 transition-transform">
          <Upload className="h-5 w-5" />
        </div>
        <h4 className="text-xs sm:text-sm font-semibold text-foreground mb-1">
          {isDragActive ? "Drop your files here!" : "Drag & drop new lecture or PDF"}
        </h4>
        <p className="text-[11px] text-muted-foreground mb-3 max-w-[220px] leading-normal">
          PDF, Audio, YouTube transcript, or notes up to 50MB.
        </p>
        <span className="text-[10px] font-mono uppercase tracking-wider text-primary font-semibold bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
          Drop or click to browse
        </span>
      </div>

      {/* 3. Continue Last Session / Quick Resume */}
      <div className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-card border border-border/80 shadow-xs flex flex-col justify-between relative overflow-hidden">
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold">
              Active Focus
            </span>
            <span className="text-[11px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              Recent Set
            </span>
          </div>

          {recentDoc ? (
            <div className="space-y-2 mb-4">
              <span className="text-[10px] uppercase font-mono font-bold text-sky-600 dark:text-zinc-400">
                {recentDoc.source_type} material
              </span>
              <h4 className="text-sm sm:text-base font-semibold text-foreground truncate font-display">
                {recentDoc.title}
              </h4>
              <p className="text-xs text-muted-foreground line-clamp-1">
                Notes, interactive flashcards, diagnostic quiz and audio recap.
              </p>
            </div>
          ) : (
            <div className="space-y-1 mb-4">
              <h4 className="text-sm font-semibold text-foreground font-display">Ready for first source</h4>
              <p className="text-xs text-muted-foreground">Upload your syllabus or lecture recording to begin.</p>
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-border/60">
          {recentDoc ? (
            <Button
              onClick={() => router.push(`/app/doc/${recentDoc.id}`)}
              className="w-full rounded-full text-xs font-semibold bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 text-white shadow-2xs group justify-between"
            >
              <span>Resume Study Session</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          ) : (
            <Button
              onClick={onOpenUpload}
              className="w-full rounded-full text-xs font-semibold bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 text-white"
            >
              <span>Import Your First Material</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
