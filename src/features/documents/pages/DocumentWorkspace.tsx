"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppShell } from "@/features/documents/context/AppShellContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DocumentRow, FlashcardRow, NoteRow, PodcastRow, QuizQuestionRow, QuizRow } from "@/features/documents/types";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import MarkdownView from "@/components/common/MarkdownView";
import {
  AlertCircle, FileText, Layers, ListChecks, Headphones, Loader2, Trash2, ChevronLeft, Sparkles, RefreshCw, Menu,
  Maximize2, Minimize2, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, Search, Copy, Check, Share2
} from "lucide-react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { streamNotes, generateDerivatives } from "@/lib/services/pipeline";
import { generatePodcast } from "@/lib/services/podcast";
import { cn, errorMessage } from "@/lib/utils";
import { queryKeys } from "@/lib/queryKeys";
import { DEMO_DOCUMENTS } from "@/features/documents/data/mockDocuments";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import WorkspaceOutline, { extractHeadings } from "@/features/documents/components/WorkspaceOutline";
import { AskPanel } from "@/features/documents/components/AskPanel";

type DocumentAssets = {
  note: NoteRow | null;
  cards: FlashcardRow[];
  quiz: QuizRow | null;
  podcast: PodcastRow | null;
};

type TabId = "notes" | "podcast" | "cards" | "quiz";

export default function DocumentWorkspace() {
  const params = useParams();
  const docId = Array.isArray(params.docId) ? params.docId[0] : params.docId;
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const { openMobileNav } = useAppShell();
  const queryClient = useQueryClient();

  const [streaming, setStreaming] = useState(false);
  const autoStartedRef = useRef<string | null>(null);

  // In-flight draft buffering for KaTeX rendering
  const [draftMarkdown, setDraftMarkdown] = useState<string | null>(null);
  const pendingNotesRef = useRef("");
  const notesFlushRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (notesFlushRef.current !== null) cancelAnimationFrame(notesFlushRef.current);
  }, []);

  const [deleteOpen, setDeleteOpen] = useState(false);

  // Layout state
  const [outlineOpen, setOutlineOpen] = useState(true);
  const [outlineRetracted, setOutlineRetracted] = useState(false);
  const [askPanelOpen, setAskPanelOpen] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);
  const [copiedNotes, setCopiedNotes] = useState(false);

  // Active workspace tab state
  const [currentTab, setCurrentTab] = useState<TabId>("notes");

  const isDemo = Boolean(docId && DEMO_DOCUMENTS[docId]);

  const docQuery = useQuery({
    queryKey: queryKeys.document(docId ?? ""),
    enabled: !!docId && !!user,
    queryFn: async () => {
      if (docId && DEMO_DOCUMENTS[docId]) {
        return DEMO_DOCUMENTS[docId].document;
      }
      const { data, error } = await supabase
        .from("documents")
        .select("id,title,source_type,status,error_code,created_at")
        .eq("id", docId!)
        .maybeSingle();
      if (error) throw error;
      return (data as DocumentRow) ?? null;
    },
  });

  const assetsQuery = useQuery({
    queryKey: queryKeys.assets(docId ?? ""),
    enabled: !!docId && !!user,
    queryFn: async (): Promise<DocumentAssets> => {
      if (docId && DEMO_DOCUMENTS[docId]) {
        const d = DEMO_DOCUMENTS[docId];
        return {
          note: d.note,
          cards: d.cards,
          quiz: d.quiz,
          podcast: d.podcast,
        };
      }

      const [n, f, q, p] = await Promise.all([
        supabase.from("notes").select("id,document_id,markdown").eq("document_id", docId!).maybeSingle(),
        supabase.from("flashcards").select("id,document_id,front,back,order_index").eq("document_id", docId!).order("order_index"),
        supabase.from("quizzes").select("id,document_id,title").eq("document_id", docId!).maybeSingle(),
        supabase.from("podcasts").select("id,document_id,title,script,audio_url,status").eq("document_id", docId!).maybeSingle(),
      ]);

      for (const r of [n, f, q, p]) {
        if (r.error) throw r.error;
      }

      let quiz: QuizRow | null = null;
      if (q.data) {
        const { data: questions, error: qErr } = await supabase
          .from("quiz_questions")
          .select("id,quiz_id,question,type,choices,correct,explanation,order_index")
          .eq("quiz_id", q.data.id)
          .order("order_index");
        if (qErr) throw qErr;
        quiz = { ...(q.data as Omit<QuizRow, "questions">), questions: (questions ?? []) as QuizQuestionRow[] };
      }

      return {
        note: (n.data as NoteRow) ?? null,
        cards: (f.data as FlashcardRow[]) ?? [],
        quiz,
        podcast: (p.data as unknown as PodcastRow) ?? null,
      };
    },
  });

  // Realtime updates
  useEffect(() => {
    if (!docId || !user || isDemo) return;

    const channel = supabase
      .channel(`doc-${docId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "documents", filter: `id=eq.${docId}` },
        (payload) => {
          queryClient.setQueryData(queryKeys.document(docId), payload.new as DocumentRow);
          queryClient.invalidateQueries({ queryKey: queryKeys.documents });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "podcasts", filter: `document_id=eq.${docId}` },
        (payload) => {
          queryClient.setQueryData<DocumentAssets>(queryKeys.assets(docId), (prev) =>
            prev ? { ...prev, podcast: (payload.new as PodcastRow) ?? null } : prev,
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [docId, user, queryClient, isDemo]);

  const doc = docQuery.data ?? undefined;
  const persistedNote = assetsQuery.data?.note ?? null;
  const note: NoteRow | null =
    draftMarkdown !== null
      ? { id: "draft", document_id: docId ?? "", markdown: draftMarkdown }
      : persistedNote;
  const cards = assetsQuery.data?.cards ?? [];
  const qz = assetsQuery.data?.quiz ?? null;
  const pod = assetsQuery.data?.podcast ?? null;
  const docStatus = doc?.status;

  const headings = useMemo(() => extractHeadings(note?.markdown), [note?.markdown]);

  const readTimeMinutes = useMemo(() => {
    if (!note?.markdown) return 1;
    const wordCount = note.markdown.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(wordCount / 200));
  }, [note?.markdown]);

  const generate = async () => {
    if (!docId || streaming) return;
    setStreaming(true);
    setDraftMarkdown("");
    try {
      await streamNotes({
        documentId: docId,
        onDelta: (chunk) => {
          pendingNotesRef.current += chunk;
          if (notesFlushRef.current !== null) return;
          notesFlushRef.current = requestAnimationFrame(() => {
            notesFlushRef.current = null;
            const buffered = pendingNotesRef.current;
            if (!buffered) return;
            pendingNotesRef.current = "";
            setDraftMarkdown((cur) => (cur ?? "") + buffered);
          });
        },
      });

      if (notesFlushRef.current !== null) {
        cancelAnimationFrame(notesFlushRef.current);
        notesFlushRef.current = null;
      }
      pendingNotesRef.current = "";
      await queryClient.invalidateQueries({ queryKey: queryKeys.assets(docId) });
      setDraftMarkdown(null);
    } catch (e: unknown) {
      setDraftMarkdown(null);
      toast({ title: "Notes generation failed", description: errorMessage(e), variant: "destructive" });
    } finally {
      setStreaming(false);
    }
  };

  useEffect(() => {
    if (!docId) return;
    if (docStatus === "ready" && !note?.markdown && autoStartedRef.current !== docId && !streaming) {
      autoStartedRef.current = docId;
      generate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docId, docStatus, note?.markdown]);

  const [derivLoading, setDerivLoading] = useState(false);
  const [podcastLoading, setPodcastLoading] = useState(false);

  const runDerivatives = async () => {
    if (!docId || derivLoading) return;
    setDerivLoading(true);
    try {
      await generateDerivatives(docId);
      await queryClient.invalidateQueries({ queryKey: queryKeys.assets(docId) });
      toast({ title: "Flashcards & quiz ready" });
    } catch (e: unknown) {
      toast({ title: "Generation failed", description: errorMessage(e), variant: "destructive" });
    } finally {
      setDerivLoading(false);
    }
  };

  const runPodcast = async () => {
    if (!docId || podcastLoading) return;
    setPodcastLoading(true);
    queryClient.setQueryData<DocumentAssets>(queryKeys.assets(docId), (prev) =>
      prev
        ? {
            ...prev,
            podcast: {
              id: prev.podcast?.id ?? "draft",
              document_id: docId,
              title: "Generating...",
              script: prev.podcast?.script ?? null,
              audio_url: null,
              status: "generating",
            },
          }
        : prev,
    );
    try {
      await generatePodcast(docId);
      await queryClient.invalidateQueries({ queryKey: queryKeys.assets(docId) });
      toast({ title: "Podcast ready", description: "Your audio recap is ready to play." });
    } catch (e: unknown) {
      await queryClient.invalidateQueries({ queryKey: queryKeys.assets(docId) });
      toast({ title: "Podcast generation failed", description: errorMessage(e), variant: "destructive" });
    } finally {
      setPodcastLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!docId) return;
    setDeleteOpen(false);
    const { error } = await supabase.from("documents").delete().eq("id", docId);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      return;
    }
    queryClient.invalidateQueries({ queryKey: queryKeys.documents });
    queryClient.removeQueries({ queryKey: queryKeys.document(docId) });
    queryClient.removeQueries({ queryKey: queryKeys.assets(docId) });
    router.push("/app");
  };

  const handleCopyNotes = () => {
    if (!note?.markdown) return;
    navigator.clipboard.writeText(note.markdown);
    setCopiedNotes(true);
    toast({ title: "Copied to clipboard", description: "Study notes markdown copied." });
    setTimeout(() => setCopiedNotes(false), 2000);
  };

  if (docQuery.isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  if (docQuery.isError) {
    return (
      <div className="h-full flex items-center justify-center bg-background px-6">
        <div className="text-center p-8 border border-dashed border-destructive/20 rounded-2xl max-w-sm bg-card space-y-4 shadow-sm">
          <div className="h-10 w-10 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive mx-auto">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-foreground font-display text-sm">Couldn't load this document</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{errorMessage(docQuery.error)}</p>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Button onClick={() => docQuery.refetch()} className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold text-xs rounded-full">
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Retry
            </Button>
            <Button variant="outline" onClick={() => router.push("/app")} className="border-border text-foreground hover:bg-muted rounded-full text-xs">
              Go to library
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center p-8 border border-dashed border-border rounded-2xl max-w-sm bg-card shadow-sm">
          <p className="text-muted-foreground text-sm mb-4">Study document was not found.</p>
          <Button variant="outline" onClick={() => router.push("/app")} className="border-border text-foreground hover:bg-muted rounded-full text-xs">
            <ChevronLeft className="h-4 w-4 mr-1 shrink-0" /> Go to library
          </Button>
        </div>
      </div>
    );
  }

  const isProcessing = doc.status === "pending" || doc.status === "processing";

  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: "notes", label: "Notes" },
    { id: "cards", label: "Cards", count: cards.length },
    { id: "quiz", label: "Quiz" },
    { id: "podcast", label: "Podcast" },
  ];

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      {/* 1. Header (Wireframe clean style, no search) */}
      <header className="border-b border-border/80 bg-background/95 backdrop-blur-md px-3 sm:px-6 py-2 flex items-center justify-between gap-3 shrink-0 z-20">
        {/* Left: Sidebar Toggle, Library Back & Document Info */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {currentTab === "notes" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOutlineRetracted(!outlineRetracted)}
              className={cn(
                "h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hidden lg:inline-flex shrink-0",
                !outlineRetracted && "bg-muted/60 text-foreground"
              )}
              title={outlineRetracted ? "Expand outline" : "Retract outline"}
            >
              {outlineRetracted ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </Button>
          )}

          {openMobileNav && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden -ml-1 text-muted-foreground hover:text-foreground shrink-0"
              onClick={openMobileNav}
              aria-label="Open navigation"
            >
              <Menu className="h-4 w-4" />
            </Button>
          )}

          <div className="flex items-center gap-2 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/app")}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground rounded-full hidden sm:inline-flex shrink-0"
            >
              <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Library
            </Button>
            <span className="text-muted-foreground/40 hidden sm:inline">/</span>
            <h1 className="text-xs sm:text-sm font-semibold text-foreground tracking-tight truncate max-w-xs sm:max-w-sm md:max-w-md font-display">
              {doc.title}
            </h1>
            <Badge variant="outline" className="text-[10px] uppercase font-mono tracking-wider border-border/80 text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full shrink-0">
              {doc.source_type}
            </Badge>
            <span className="text-xs text-muted-foreground hidden md:inline shrink-0 font-mono">
              {readTimeMinutes} min read
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {currentTab === "notes" && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyNotes}
                className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground rounded-full hidden sm:inline-flex border-border/80"
              >
                {copiedNotes ? <Check className="h-3 w-3 mr-1 text-emerald-500" /> : <Copy className="h-3 w-3 mr-1" />}
                <span>{copiedNotes ? "Copied" : "Copy"}</span>
              </Button>

              {note?.markdown && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generate}
                  disabled={streaming}
                  className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground rounded-full hidden sm:inline-flex border-border/80"
                >
                  <RefreshCw className={cn("h-3 w-3 mr-1", streaming && "animate-spin text-primary")} />
                  <span>Regenerate</span>
                </Button>
              )}

              {/* Focus Mode */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (!focusMode) {
                    setOutlineOpen(false);
                    setAskPanelOpen(false);
                    setFocusMode(true);
                  } else {
                    setOutlineOpen(true);
                    setAskPanelOpen(true);
                    setFocusMode(false);
                  }
                }}
                className={cn(
                  "h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hidden lg:inline-flex",
                  focusMode && "bg-primary/10 text-primary"
                )}
                title={focusMode ? "Exit Focus Mode" : "Enter Focus Mode"}
              >
                {focusMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>

              {/* Ask Panel Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAskPanelOpen(!askPanelOpen)}
                className={cn(
                  "h-7 px-2.5 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground gap-1.5 border border-border/70 hidden lg:inline-flex",
                  askPanelOpen && "bg-muted/80 text-foreground border-primary/30"
                )}
                title="Toggle Ask Panel"
              >
                {askPanelOpen ? <PanelRightClose className="h-3.5 w-3.5" /> : <PanelRightOpen className="h-3.5 w-3.5" />}
                <span>Ask</span>
              </Button>
            </>
          )}

          {/* Delete Document */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeleteOpen(true)}
            title="Delete document"
            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full shrink-0"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </header>

      {/* 2. Workspace Horizontal Tab Bar (Wireframe Style) */}
      <div className="border-b border-border/80 bg-background/95 backdrop-blur-md px-3 sm:px-6 flex items-center gap-1 sm:gap-2 overflow-x-auto shrink-0 z-10">
        {tabs.map((t) => {
          const isActive = currentTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setCurrentTab(t.id)}
              className={cn(
                "px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors shrink-0 relative flex items-center gap-1.5 cursor-pointer",
                isActive
                  ? "text-foreground font-semibold border-b-2 border-foreground"
                  : "text-muted-foreground hover:text-foreground border-b-2 border-transparent"
              )}
            >
              <span>{t.label}</span>
              {t.count !== undefined && t.count > 0 && (
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full font-mono",
                    isActive ? "bg-primary/10 text-primary font-bold" : "bg-muted text-muted-foreground"
                  )}
                >
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Main Workspace Content */}
      <div className="flex-1 overflow-hidden relative">
        {currentTab === "notes" && (
          <>
            {/* Desktop View (>= 1024px) */}
            <div className="hidden lg:block h-full w-full">
              <ResizablePanelGroup direction="horizontal" className="h-full w-full">
                {/* Left Rail: Retractable Document Outline */}
                {outlineOpen && !focusMode && (
                  <>
                    <ResizablePanel
                      defaultSize={outlineRetracted ? 4 : 18}
                      minSize={outlineRetracted ? 4 : 14}
                      maxSize={outlineRetracted ? 5 : 28}
                    >
                      <WorkspaceOutline
                        markdown={note?.markdown}
                        activeHeadingId={activeHeadingId}
                        onSelectHeading={(id) => setActiveHeadingId(id)}
                        isRetracted={outlineRetracted}
                        onToggleRetract={() => setOutlineRetracted(!outlineRetracted)}
                      />
                    </ResizablePanel>
                    <ResizableHandle withHandle />
                  </>
                )}

                {/* Center Stage: Notes Reading Content */}
                <ResizablePanel defaultSize={outlineRetracted ? (askPanelOpen ? 72 : 96) : (askPanelOpen ? 58 : 82)}>
                  <main className="h-full overflow-y-auto relative bg-background/50">
                    <div className="p-6 sm:p-10 max-w-4xl mx-auto space-y-6">
                      {/* "On this page: ..." Summary Banner (Wireframe Badge 4) */}
                      {headings.length > 0 && (
                        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-muted/40 border border-border/70 text-xs text-muted-foreground animate-fade-in">
                          <span className="font-semibold text-foreground shrink-0 font-display">On this page:</span>
                          <div className="flex items-center gap-1.5 overflow-x-auto truncate scrollbar-none">
                            {headings.slice(0, 6).map((h, idx) => (
                              <button
                                key={h.id}
                                onClick={() => setActiveHeadingId(h.id)}
                                className="hover:text-foreground hover:underline transition-colors shrink-0 text-left cursor-pointer"
                              >
                                {h.text}{idx < Math.min(headings.length, 6) - 1 ? " · " : ""}
                              </button>
                            ))}
                            {headings.length > 6 && (
                              <span className="shrink-0 text-muted-foreground/60">+{headings.length - 6} more</span>
                            )}
                          </div>
                        </div>
                      )}

                      {assetsQuery.isLoading ? (
                        <div className="flex items-center justify-center py-24">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      ) : note?.markdown ? (
                        <div className="space-y-6 animate-fade-in pb-16">
                          <div className="bg-card p-8 sm:p-12 rounded-3xl border border-border/80 shadow-sm leading-relaxed">
                            <MarkdownView>{note.markdown}</MarkdownView>
                          </div>
                          {streaming && (
                            <div className="flex items-center gap-2 text-xs text-primary font-mono bg-primary/10 p-3 rounded-full border border-primary/20 max-w-max">
                              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Stream compiling notes…
                            </div>
                          )}
                        </div>
                      ) : doc.status === "ready" ? (
                        <div className="border border-border rounded-2xl p-10 text-center space-y-4 max-w-md mx-auto mt-12 bg-card shadow-sm animate-fade-in">
                          <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto">
                            <Sparkles className="h-5 w-5" />
                          </div>
                          <div className="space-y-1">
                            <h3 className="font-semibold text-foreground font-display text-sm">Generate study notes</h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              We've indexed your material. Generate structured teaching notes to begin.
                            </p>
                          </div>
                          <Button onClick={generate} disabled={streaming} className="rounded-full text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90">
                            {streaming ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1.5" />}
                            Generate Notes
                          </Button>
                        </div>
                      ) : isProcessing ? (
                        <Placeholder title="Parsing source file..." desc="We're compiling the documents. The study dashboard will start shortly." loading />
                      ) : doc.status === "failed" ? (
                        <Placeholder title="Ingestion failed" desc={doc.error_code ?? "Something went wrong while parsing the source."} />
                      ) : (
                        <Placeholder title="Pending workspace" desc="Waiting for the background compiler to finish processing." />
                      )}
                    </div>
                  </main>
                </ResizablePanel>

                {/* Right Rail: Ask Panel */}
                {askPanelOpen && !focusMode && (
                  <>
                    <ResizableHandle withHandle />
                    <ResizablePanel defaultSize={24} minSize={18} maxSize={35}>
                      <AskPanel
                        documentId={doc.id}
                        noteMarkdown={note?.markdown}
                        headings={headings}
                        onScrollToHeading={(id) => setActiveHeadingId(id)}
                      />
                    </ResizablePanel>
                  </>
                )}
              </ResizablePanelGroup>
            </div>

            {/* Mobile Viewport (< 1024px) */}
            <div className="lg:hidden h-full overflow-y-auto">
              <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-4">
                {headings.length > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/40 border border-border/70 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground shrink-0">On this page:</span>
                    <div className="flex items-center gap-1.5 overflow-x-auto truncate">
                      {headings.slice(0, 5).map((h, idx) => (
                        <button
                          key={h.id}
                          onClick={() => setActiveHeadingId(h.id)}
                          className="hover:text-foreground hover:underline transition-colors shrink-0 text-left"
                        >
                          {h.text}{idx < Math.min(headings.length, 5) - 1 ? " · " : ""}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {note?.markdown ? (
                  <div className="bg-card p-6 rounded-2xl border border-border shadow-xs">
                    <MarkdownView>{note.markdown}</MarkdownView>
                  </div>
                ) : (
                  <div className="p-8 text-center bg-card rounded-2xl border border-border">
                    <Button onClick={generate} disabled={streaming} className="rounded-full text-xs">
                      Generate Notes
                    </Button>
                  </div>
                )}
                {/* Ask Panel */}
                <div className="mt-4 border-t border-border/60 pt-4">
                  <AskPanel
                    documentId={doc.id}
                    noteMarkdown={note?.markdown}
                    headings={headings}
                    onScrollToHeading={(id) => setActiveHeadingId(id)}
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {currentTab === "cards" && (
          <div className="h-full overflow-y-auto p-4 sm:p-8 max-w-4xl mx-auto">
            <FlashcardsDeck documentId={doc.id} cards={cards} onRegenerate={runDerivatives} loading={derivLoading} />
          </div>
        )}

        {currentTab === "quiz" && (
          <div className="h-full overflow-y-auto p-4 sm:p-8 max-w-4xl mx-auto">
            <QuizPlayer documentId={doc.id} quiz={qz} onRegenerate={runDerivatives} loading={derivLoading} />
          </div>
        )}

        {currentTab === "podcast" && (
          <div className="h-full overflow-y-auto p-4 sm:p-8 max-w-4xl mx-auto">
            <PodcastPlayer documentId={doc.id} podcast={pod} onGenerate={runPodcast} loading={podcastLoading} />
          </div>
        )}
      </div>

      {/* 4. Delete Document Confirmation Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="bg-card border-border text-foreground rounded-2xl shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-lg">Delete this document?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-xs sm:text-sm">
              <span className="text-foreground font-medium">{doc.title}</span> and everything generated from
              it — notes, flashcards, quiz and podcast — will be permanently removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="border-border bg-card text-foreground hover:bg-muted rounded-full text-xs">
              Keep it
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-full text-xs"
            >
              Delete document
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// --- Helper Components ---

function Placeholder({ title, desc, loading = false }: { title: string; desc: string; loading?: boolean }) {
  return (
    <div className="bg-card border border-border/80 rounded-2xl p-10 text-center max-w-md mx-auto mt-12 space-y-3 shadow-sm">
      {loading ? (
        <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
      ) : (
        <div className="h-8 w-8 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground mx-auto">
          <FileText className="h-4 w-4" />
        </div>
      )}
      <h3 className="font-semibold text-foreground font-display text-sm">{title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}

// Podcast Player Component
function PodcastPlayer({
  documentId,
  podcast,
  onGenerate,
  loading,
}: {
  documentId: string;
  podcast: PodcastRow | null;
  onGenerate: () => void;
  loading: boolean;
}) {
  return (
    <div className="space-y-4">
      {podcast?.status === "ready" && podcast.audio_url ? (
        <CustomAudioPlayer audioUrl={podcast.audio_url} script={podcast.script} title={podcast.title} />
      ) : (
        <div className="bg-card p-8 rounded-2xl border border-border text-center space-y-4">
          <Headphones className="h-10 w-10 text-muted-foreground mx-auto" />
          <h3 className="font-semibold text-foreground">No podcast yet</h3>
          <p className="text-xs text-muted-foreground">Generate an audio recap of this document</p>
          <Button onClick={onGenerate} disabled={loading} className="rounded-full text-xs">
            {loading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1.5" />}
            Generate Podcast
          </Button>
        </div>
      )}
    </div>
  );
}

// Flashcards Deck Component (simplified)
function FlashcardsDeck({
  documentId,
  cards,
  onRegenerate,
  loading,
}: {
  documentId: string;
  cards: FlashcardRow[];
  onRegenerate: () => void;
  loading: boolean;
}) {
  if (cards.length === 0) {
    return (
      <div className="bg-card p-8 rounded-2xl border border-border text-center space-y-4">
        <Layers className="h-10 w-10 text-muted-foreground mx-auto" />
        <h3 className="font-semibold text-foreground">No flashcards yet</h3>
        <p className="text-xs text-muted-foreground">Generate flashcards from your notes</p>
        <Button onClick={onRegenerate} disabled={loading} className="rounded-full text-xs">
          {loading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1.5" />}
          Generate Flashcards
        </Button>
      </div>
    );
  }
  return (
    <div className="p-4">
      <p className="text-sm text-muted-foreground mb-4">{cards.length} cards generated</p>
      <div className="grid gap-4 md:grid-cols-2">
        {cards.slice(0, 6).map((card) => (
          <div key={card.id} className="bg-card p-4 rounded-xl border border-border">
            <p className="font-medium text-sm">{card.front}</p>
            <p className="text-xs text-muted-foreground mt-2">{card.back}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Quiz Player Component (simplified)
function QuizPlayer({
  documentId,
  quiz,
  onRegenerate,
  loading,
}: {
  documentId: string;
  quiz: QuizRow | null;
  onRegenerate: () => void;
  loading: boolean;
}) {
  if (!quiz) {
    return (
      <div className="bg-card p-8 rounded-2xl border border-border text-center space-y-4">
        <ListChecks className="h-10 w-10 text-muted-foreground mx-auto" />
        <h3 className="font-semibold text-foreground">No quiz yet</h3>
        <p className="text-xs text-muted-foreground">Generate a practice quiz from your notes</p>
        <Button onClick={onRegenerate} disabled={loading} className="rounded-full text-xs">
          {loading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1.5" />}
          Generate Quiz
        </Button>
      </div>
    );
  }
  return (
    <div className="p-4 space-y-4">
      <h3 className="font-semibold">{quiz.title}</h3>
      <p className="text-xs text-muted-foreground">{quiz.questions.length} questions</p>
      <div className="space-y-3">
        {quiz.questions.slice(0, 3).map((q) => (
          <div key={q.id} className="bg-card p-4 rounded-xl border border-border">
            <p className="text-sm font-medium">{q.question}</p>
            {q.type === "mcq" && q.choices && (
              <div className="mt-2 space-y-1">
                {q.choices.map((c, i) => (
                  <label key={i} className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                    <input type="radio" name={q.id} className="h-3 w-3" />
                    {c}
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Custom Audio Player (inline version)
function CustomAudioPlayer({
  audioUrl,
  script,
  title,
}: {
  audioUrl: string;
  script: string | null;
  title: string;
}) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    const onTimeUpdate = () => setProgress(audio.currentTime / audio.duration);
    const onEnded = () => setPlaying(false);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
      audio.pause();
    };
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) audioRef.current.pause();
    else audioRef.current.play();
    setPlaying(!playing);
  };

  return (
    <div className="bg-card p-6 rounded-2xl border border-border space-y-4">
      <div className="flex items-center gap-2">
        <Headphones className="h-5 w-5 text-primary" />
        <span className="font-medium text-sm">{title}</span>
      </div>
      <button onClick={togglePlay} className="w-full h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center gap-2 font-medium hover:bg-primary/90 transition-colors">
        {playing ? <span>⏸ Pause</span> : <span>▶ Play</span>}
      </button>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all duration-100" style={{ width: `${progress * 100}%` }} />
      </div>
      {script && (
        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer mb-1">Show transcript</summary>
          <pre className="whitespace-pre-wrap text-left p-2 bg-muted/50 rounded">{script}</pre>
        </details>
      )}
    </div>
  );
}