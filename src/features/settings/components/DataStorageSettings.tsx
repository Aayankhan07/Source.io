"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Trash2, RotateCcw, Database, HardDrive, AlertTriangle } from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import { useToast } from "@/hooks/use-toast";
import { DEMO_DOCUMENTS } from "@/features/documents/data/mockDocuments";

export default function DataStorageSettings() {
  const { resetSettings } = useSettings();
  const { toast } = useToast();

  const handleExportLibrary = () => {
    try {
      const exportData = {
        exportedAt: new Date().toISOString(),
        version: "1.0",
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
    } catch (err) {
      toast({
        title: "Export Failed",
        description: "Could not compile library export data.",
        variant: "destructive",
      });
    }
  };

  const handleClearCache = () => {
    // Clear ephemeral draft buffers from sessionStorage/localStorage
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
    } catch (e) {
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
      <Card className="rounded-2xl border-border/80 bg-card shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">Export Study Library</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Download an offline backup package of all study notes, generated flashcards, and quizzes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-muted/30 border border-border/60">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-foreground">Portable JSON Archive</span>
              <p className="text-[11px] text-muted-foreground">
                Contains complete Markdown notes, LaTeX equations, flashcard decks, and quiz questions.
              </p>
            </div>
            <Button
              onClick={handleExportLibrary}
              variant="outline"
              size="sm"
              className="rounded-full text-xs shrink-0 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 mr-1.5 text-primary" />
              Download Archive
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 2. Storage & Temporary Buffers */}
      <Card className="rounded-2xl border-border/80 bg-card shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">Storage & Cache Maintenance</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Manage local browser memory and reset configuration back to clean factory state.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Clear Cache */}
          <div className="flex items-center justify-between gap-4 p-3 rounded-xl border border-border/60">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-foreground">Clear Temporary KaTeX & Draft Caches</span>
              <p className="text-[11px] text-muted-foreground">
                Frees up browser memory without deleting your saved documents.
              </p>
            </div>
            <Button
              onClick={handleClearCache}
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground shrink-0 rounded-full cursor-pointer"
            >
              Clear Cache
            </Button>
          </div>

          {/* Reset Settings */}
          <div className="flex items-center justify-between gap-4 p-3 rounded-xl border border-destructive/20 bg-destructive/5">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-destructive" /> Reset All Preferences
              </span>
              <p className="text-[11px] text-muted-foreground">
                Restores AI models, audio voices, typography, and layout settings to initial defaults.
              </p>
            </div>
            <Button
              onClick={handleResetSettings}
              variant="outline"
              size="sm"
              className="border-destructive/30 text-destructive hover:bg-destructive/10 text-xs shrink-0 rounded-full cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Reset Defaults
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
