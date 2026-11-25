"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, RotateCcw, HardDrive, AlertTriangle, Trash2, Loader2 } from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth/context/AuthContext";
import { createSupabaseExportSource, exportLibrary } from "@/lib/export/exportLibrary";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function DataStorageSettings() {
  const { resetSettings } = useSettings();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isGuest = !user;

  const handleExportLibrary = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const result = await exportLibrary(createSupabaseExportSource(supabase));
      const n = result.counts.documents;
      toast({
        title: "Library exported",
        description: `${n} document${n === 1 ? "" : "s"} with notes, cards, quizzes, podcasts, and chat history downloaded.`,
      });
    } catch (err) {
      toast({
        title: "Export failed",
        description: err instanceof Error ? err.message : "Could not export your library.",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      const { error } = await supabase.functions.invoke("delete_account");
      if (error) throw error;
      toast({ title: "Account deleted", description: "Your account and all study data have been removed." });
      try {
        await signOut();
      } catch {
        // the session is already invalid once the account is gone
      }
      router.push("/");
    } catch (err) {
      toast({
        title: "Could not delete account",
        description: err instanceof Error ? err.message : "Please try again or contact support.",
        variant: "destructive",
      });
      setDeleting(false);
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
          <div className="flex items-center gap-2.5 mb-1">
            <span className="p-1.5 rounded-xl bg-muted text-foreground border border-border/80">
              <Download className="size-4" />
            </span>
            <h3 className="text-base sm:text-lg font-bold font-display text-slate-900 dark:text-white">
              Export Study Library
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Download everything in your account as a single JSON file.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-[20px] bg-slate-50/70 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-slate-900 dark:text-white">Portable JSON Archive</span>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Sources and their extracted text, notes, flashcards, quizzes, podcast scripts and audio links, and chat
              history.
            </p>
          </div>
          <button
            type="button"
            onClick={handleExportLibrary}
            disabled={exporting || isGuest}
            title={isGuest ? "Sign in to export your library" : undefined}
            className="h-9 px-4 rounded-full bg-slate-950 text-white dark:bg-white dark:text-slate-950 text-xs font-semibold flex items-center gap-1.5 shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0 disabled:opacity-50 disabled:pointer-events-none"
          >
            {exporting ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
            <span>{exporting ? "Preparing…" : "Download Archive"}</span>
          </button>
        </div>
      </div>

      {/* 2. Storage & Temporary Buffers */}
      <div className="rounded-[28px] bg-white dark:bg-slate-900/90 border border-black/[0.04] dark:border-white/10 shadow-tactile-card p-6 sm:p-7 space-y-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="p-1.5 rounded-xl bg-muted text-foreground border border-border/80">
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
              <p className="text-xs text-slate-500 dark:text-slate-400">
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
              <p className="text-xs text-rose-700/80 dark:text-rose-300/70">
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

      {/* 3. Danger Zone */}
      {!isGuest && (
        <div className="rounded-[28px] bg-white dark:bg-slate-900/90 border border-rose-200 dark:border-rose-900/40 shadow-tactile-card p-6 sm:p-7 space-y-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <span className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50">
                <AlertTriangle className="size-4" />
              </span>
              <h3 className="text-base sm:text-lg font-bold font-display text-slate-900 dark:text-white">Danger Zone</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Export your library first. Deleting your account cannot be undone.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-[20px] border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-rose-900 dark:text-rose-200">Delete account</span>
              <p className="text-xs text-rose-700/80 dark:text-rose-300/70">
                Permanently removes your account, documents, notes, flashcards, quizzes, podcasts, and chat history.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  type="button"
                  disabled={deleting}
                  className="h-9 px-4 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 disabled:opacity-50"
                >
                  {deleting ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                  <span>{deleting ? "Deleting…" : "Delete account"}</span>
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This permanently deletes your account and every document, note, flashcard, quiz, podcast, and chat
                    message in it. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAccount} className="bg-rose-600 text-white hover:bg-rose-700">
                    Delete permanently
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}
    </div>
  );
}
