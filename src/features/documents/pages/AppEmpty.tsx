"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { queryKeys } from "@/lib/queryKeys";
import { useAuth } from "@/features/auth/context/AuthContext";
import { DocumentRow } from "@/features/documents/types";
import { DEMO_DOCUMENT_LIST } from "@/features/documents/data/mockDocuments";
import BentoTelemetry from "@/features/documents/components/BentoTelemetry";
import DocumentCardBento from "@/features/documents/components/DocumentCardBento";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAppShell } from "@/features/documents/context/AppShellContext";
import {
  Plus,
  Menu,
  Search,
  Filter,
  Layers,
  Sparkles,
  BookOpen,
  ArrowRight,
  FolderOpen,
  X,
  FileText,
  Mic,
  Video,
  Youtube,
  Clock,
} from "lucide-react";

export default function AppEmpty() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { openUpload, openMobileNav } = useAppShell();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");

  // Query documents
  const { data: documents = [], isLoading } = useQuery({
    queryKey: queryKeys.documents,
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("id,title,source_type,status,error_code,created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as DocumentRow[];
    },
  });

  const isDemoFallback = !isLoading && documents.length === 0;
  const rawList = documents.length > 0 ? documents : DEMO_DOCUMENT_LIST;

  // Filtered documents
  const filteredDocs = useMemo(() => {
    return rawList.filter((doc) => {
      const matchesSearch =
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.source_type.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter =
        activeFilter === "all" || doc.source_type.toLowerCase() === activeFilter.toLowerCase();
      return matchesSearch && matchesFilter;
    });
  }, [rawList, searchQuery, activeFilter]);

  // Handle Document Delete
  const handleDeleteDocument = async (id: string) => {
    if (id.startsWith("demo-")) {
      toast({
        title: "Demo material",
        description: "Sample study sets are read-only.",
      });
      return;
    }

    try {
      const { error } = await supabase.from("documents").delete().eq("id", id);
      if (error) throw error;

      queryClient.setQueryData<DocumentRow[]>(queryKeys.documents, (prev) =>
        (prev ?? []).filter((d) => d.id !== id)
      );
      queryClient.removeQueries({ queryKey: queryKeys.document(id) });
      queryClient.removeQueries({ queryKey: queryKeys.assets(id) });

      toast({
        title: "Document removed",
        description: "The document and its generated study assets were removed.",
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete document";
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: message,
      });
    }
  };

  // Greeting calculation
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Researcher";

  return (
    <div className="h-full flex flex-col bg-background relative overflow-y-auto">
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between border-b border-border bg-sidebar px-4 py-3 shrink-0 sticky top-0 z-20">
        <Button
          variant="ghost"
          size="icon"
          onClick={openMobileNav}
          aria-label="Open navigation"
          className="text-muted-foreground hover:text-foreground"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <span className="font-semibold text-foreground font-display text-sm">Source Command</span>
        <Button
          size="sm"
          onClick={openUpload}
          className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 text-white rounded-full text-xs h-8 px-3"
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          <span>New</span>
        </Button>
      </div>

      {/* Main Command Center Canvas */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/60 pb-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-card border border-border text-foreground text-[11px] font-mono uppercase tracking-wider shadow-2xs">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Source Studio Active</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-semibold text-foreground tracking-tight">
              {greeting}, <span className="text-primary">{userName}</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl leading-relaxed">
              Your autonomous study command center. Accelerate lecture comprehension, flashcard drills, and audio summaries with Groq Llama 3.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              onClick={openUpload}
              size="lg"
              className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 text-white font-semibold rounded-full shadow-sm text-xs sm:text-sm px-6 h-11"
            >
              <Plus className="h-4 w-4 mr-2 shrink-0" />
              <span>Import Material</span>
            </Button>
          </div>
        </div>

        {/* 1. Bento Telemetry Row */}
        <section aria-label="Study Telemetry and Direct Upload">
          <BentoTelemetry
            documents={rawList}
            onDropFiles={() => openUpload()}
            onOpenUpload={openUpload}
          />
        </section>

        {/* 2. Knowledge Base Shelf */}
        <section className="space-y-4" aria-label="Knowledge Base Library">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg sm:text-xl font-display font-semibold text-foreground tracking-tight">
                Indexed Materials
              </h2>
              <Badge
                variant="outline"
                className="font-mono text-xs border-border/80 text-muted-foreground bg-card"
              >
                {filteredDocs.length} {filteredDocs.length === 1 ? "source" : "sources"}
              </Badge>
              {isDemoFallback && (
                <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 px-2 py-0.5 rounded-full">
                  Sample sets shown
                </span>
              )}
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              {/* Search Box */}
              <div className="relative min-w-[200px] sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search materials or topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-7 h-9 text-xs rounded-full bg-card border-border/80 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                    aria-label="Clear search"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Source Filter Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
                {[
                  { id: "all", label: "All" },
                  { id: "pdf", label: "PDFs" },
                  { id: "audio", label: "Audio" },
                  { id: "youtube", label: "YouTube" },
                  { id: "text", label: "Text" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors shrink-0 ${
                      activeFilter === tab.id
                        ? "bg-slate-900 dark:bg-white text-white dark:text-zinc-950 font-semibold shadow-2xs"
                        : "bg-card text-muted-foreground hover:text-foreground border border-border/70 hover:bg-muted/40"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Cards Grid */}
          {filteredDocs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDocs.map((doc) => (
                <DocumentCardBento
                  key={doc.id}
                  document={doc}
                  onDelete={handleDeleteDocument}
                />
              ))}
            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl sm:rounded-3xl border border-dashed border-border/80 bg-card/60 flex flex-col items-center justify-center space-y-3">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                <FolderOpen className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">
                No matching study materials found
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                No indexed files matched &ldquo;{searchQuery}&rdquo;. Try another search keyword or clear filters.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setActiveFilter("all");
                  }}
                  className="rounded-full text-xs"
                >
                  Clear Filters
                </Button>
                <Button
                  size="sm"
                  onClick={openUpload}
                  className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 text-white rounded-full text-xs"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Upload Material
                </Button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
