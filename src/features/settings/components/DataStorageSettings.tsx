"use client";

import { Download, RotateCcw, HardDrive, AlertTriangle } from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import { useToast } from "@/hooks/use-toast";
import { DEMO_DOCUMENTS } from "@/features/documents/data/mockDocuments";

export default function DataStorageSettings() {
  const { settings, notesSettings, resetSettings } = useSettings();
  const { toast } = useToast();

  const handleExportLibrary = () => {
    try {
      const exportData = {
        exportedAt: new Date().toISOString(),
        version: "1.0",
        userPreferences: {
          general: settings,
          notes: notesSettings,
        },
        documents: Object.values(DEMO_DOCUMENTS).map((d) => ({
          id: d.document.id,
          title: d.document.title,
          source_type: d.document.source_type,
          markdown: d.note.markdown,
          flashcards: d.cards,
          quiz: d.quiz,
        })),
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `source-io-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Library Exported",
        description: "Your study documents, notes, cards, and quizzes have been downloaded.",
      });
    } catch {
      toast({
        title: "Export Failed",
        description: "Could not compile library export data.",
        variant: "destructive",
      });
    }
  };

  const handleClearCache = () => {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith("source_draft_") || k.startsWith("katex_cache_"))) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));

      toast({
        title: "Cache Cleared",
        description: "Temporary draft buffers and formula render caches removed.",
      });
    } catch {
      toast({
        title: "Clear Failed",
        description: "Could not access browser storage.",
        variant: "destructive",
      });
    }
  };

  const handleResetSettings = () => {
    resetSettings();
    toast({
      title: "Settings Reset",
      description: "All general and notes preferences restored to default values.",
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Export Data */}
      <div className="rounded-[28px] bg-white dark:bg-slate-900/90 border border-black/[0.04] dark:border-white/10 shadow-tactile-card p-6 sm:p-7 space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">
              <Download className="size-4" />
            </span>
            <h3 className="text-base sm:text-lg font-bold font-display text-slate-900 dark:text-white">
              Export Study Library
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Download an offline backup package of all study notes, generated flashcards, and quizzes.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-[20px] bg-slate-50/70 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-slate-900 dark:text-white">Portable JSON Archive</span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Contains complete Markdown notes, LaTeX equations, flashcard decks, and quiz questions.
            </p>
          </div>
          <button
            onClick={handleExportLibrary}
            className="h-9 px-4 rounded-full bg-slate-950 text-white dark:bg-white dark:text-slate-950 text-xs font-semibold flex items-center gap-1.5 shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
          >
            <Download className="size-3.5" />
            <span>Download Archive</span>
          </button>
        </div>
      </div>

      {/* 2. Storage & Temporary Buffers */}
      <div className="rounded-[28px] bg-white dark:bg-slate-900/90 border border-black/[0.04] dark:border-white/10 shadow-tactile-card p-6 sm:p-7 space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-lg bg-sky-100 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300">
              <HardDrive className="size-4" />
            </span>
            <h3 className="text-base sm:text-lg font-bold font-display text-slate-900 dark:text-white">
              Storage & Cache Maintenance
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage local browser memory and reset configuration back to clean initial state.
          </p>
        </div>

        <div className="space-y-3">
          {/* Clear Cache */}
          <div className="flex items-center justify-between gap-4 p-4 rounded-[20px] bg-slate-50/70 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-900 dark:text-white">Clear Temporary KaTeX & Draft Caches</span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Frees up browser memory without deleting your saved documents.
              </p>
            </div>
            <button
              onClick={handleClearCache}
              className="h-8 px-3.5 rounded-full bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 text-xs font-semibold transition-all cursor-pointer shrink-0"
            >
              Clear Cache
            </button>
          </div>

          {/* Reset Settings */}
          <div className="flex items-center justify-between gap-4 p-4 rounded-[20px] border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
                <AlertTriangle className="size-3.5 text-rose-600 dark:text-rose-400" /> Reset All Preferences
              </span>
              <p className="text-[11px] text-rose-700/80 dark:text-rose-300/70">
                Restores AI models, audio voices, typography, and layout settings to initial defaults.
              </p>
            </div>
            <button
              onClick={handleResetSettings}
              className="h-8 px-3.5 rounded-full border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-xs font-semibold transition-all cursor-pointer shrink-0 flex items-center gap-1.5"
            >
              <RotateCcw className="size-3.5" />
              <span>Reset Defaults</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
