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
  AlertCircle, FileText, Layers, ListChecks, Headphones, MessagesSquare,
  Loader2, Trash2, ChevronLeft, Sparkles, RefreshCw, Menu,
  Maximize2, Minimize2, PanelLeftClose, PanelLeftOpen,
  PanelRightClose, PanelRightOpen, Search, Copy, Check, Share2
} from "lucide-react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { streamNotes, generateDerivatives } from "@/lib/services/pipeline";
import { generatePodcast } from "@/lib/services/podcast";
import { cn, errorMessage } from "@/lib/utils";
import { queryKeys } from "@/lib/queryKeys";
import { DEMO_DOCUMENTS } from "@/features/documents/data/mockDocuments";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import WorkspaceOutline, { extractHeadings } from "@/features/documents/components/WorkspaceOutline";
import WorkspaceCompanion, { CompanionTab } from "@/features/documents/components/WorkspaceCompanion";
import WorkspaceCommandMenu from "@/features/documents/components/WorkspaceCommandMenu";

type DocumentAssets = {
  note: NoteRow | null;
  cards: FlashcardRow[];
  quiz: QuizRow | null;
  podcast: PodcastRow | null;
};

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
  const [commandOpen, setCommandOpen] = useState(false);

  // Multi-Pane Linear Studio layout state
  const [outlineOpen, setOutlineOpen] = useState(true);
  const [companionOpen, setCompanionOpen] = useState(true);
  const [companionTab, setCompanionTab] = useState<CompanionTab>("chat");
  const [companionExpanded, setCompanionExpanded] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);
  const [copiedNotes, setCopiedNotes] = useState(false);

  // Mobile fallback tab
  const [mobileTab, setMobileTab] = useState<"notes" | "outline" | "chat" | "podcast" | "cards" | "quiz">("notes");

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
        supabase.from("podcasts").select("id,document_id,script,audio_url,status").eq("document_id", docId!).maybeSingle(),
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
        podcast: (p.data as PodcastRow) ?? null,
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

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      {/* 1. Linear Workbench Top Header */}
      <header className="border-b border-border/80 bg-background/95 backdrop-blur-md px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 shrink-0 z-20">
        {/* Left: Mobile Trigger & Breadcrumb Hierarchy */}
        <div className="flex items-center gap-3 min-w-0">
          {openMobileNav && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden -ml-2 text-muted-foreground hover:text-foreground"
              onClick={openMobileNav}
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}

          <div className="flex items-center gap-2 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/app")}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground rounded-full hidden sm:inline-flex"
            >
              <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Library
            </Button>
            <span className="text-muted-foreground/40 hidden sm:inline">/</span>
            <Badge variant="outline" className="text-[10px] uppercase font-mono tracking-wider border-border/80 text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full shrink-0">
              {doc.source_type}
            </Badge>
            <h1 className="text-xs sm:text-sm font-semibold text-foreground tracking-tight truncate max-w-xs sm:max-w-md md:max-w-lg font-display">
              {doc.title}
            </h1>
          </div>
        </div>

        {/* Center: Command Omnibar Trigger */}
        <div className="hidden md:flex items-center">
          <button
            onClick={() => setCommandOpen(true)}
            className="flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-surface-sunken/80 border border-border/80 hover:border-primary/40 text-xs text-muted-foreground hover:text-foreground transition-[border-color,background-color] shadow-2xs group"
          >
            <Search className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="text-xs">Search document & commands...</span>
            <kbd className="text-[10px] font-mono bg-muted/80 px-1.5 py-0.5 rounded border border-border/70 text-muted-foreground">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right: Studio Controls (Outline Toggle, Focus Mode, Companion Toggle, Actions) */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Outline Panel Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOutlineOpen(!outlineOpen)}
            className={cn(
              "h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hidden lg:inline-flex",
              outlineOpen && "bg-muted/60 text-foreground"
            )}
            title={outlineOpen ? "Collapse Outline (TOC)" : "Expand Outline (TOC)"}
          >
            {outlineOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
          </Button>

          {/* Focus Mode (distraction-free single view) */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (!focusMode) {
                setOutlineOpen(false);
                setCompanionOpen(false);
                setFocusMode(true);
              } else {
                setOutlineOpen(true);
                setCompanionOpen(true);
                setFocusMode(false);
              }
            }}
            className={cn(
              "h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hidden lg:inline-flex",
              focusMode && "bg-primary/10 text-primary"
            )}
            title={focusMode ? "Exit Focus Mode" : "Enter Focus Mode (Full Width)"}
          >
            {focusMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>

          {/* Companion Panel Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCompanionOpen(!companionOpen)}
            className={cn(
              "h-8 px-2.5 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground gap-1.5 border border-border/70 hidden lg:inline-flex",
              companionOpen && "bg-muted/80 text-foreground border-primary/30"
            )}
            title="Toggle Companion Dock (Cmd+\)"
          >
            {companionOpen ? <PanelRightClose className="h-3.5 w-3.5" /> : <PanelRightOpen className="h-3.5 w-3.5" />}
            <span>Dock</span>
            <kbd className="text-[9px] font-mono opacity-60">⌘\</kbd>
          </Button>

          {/* Delete Document */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeleteOpen(true)}
            title="Delete document"
            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full shrink-0"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* 2. Mobile Responsive Sub-Nav Bar (< 1024px) */}
      <div className="lg:hidden border-b border-border/80 bg-muted/40 px-4 py-2 flex items-center gap-1 overflow-x-auto shrink-0 z-10">
        {[
          { id: "notes" as const, label: "Notes", icon: FileText },
          { id: "outline" as const, label: "Outline", icon: ListChecks },
          { id: "chat" as const, label: "Chat", icon: MessagesSquare },
          { id: "podcast" as const, label: "Audio", icon: Headphones },
          { id: "cards" as const, label: "Cards", icon: Layers },
          { id: "quiz" as const, label: "Quiz", icon: Check },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = mobileTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setMobileTab(t.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors shrink-0",
                isActive
                  ? "bg-card text-foreground shadow-2xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-3 w-3" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Main Multi-Pane Studio Body (Desktop: ResizablePanels / Mobile: Active View) */}
      <div className="flex-1 overflow-hidden relative">
        {/* Desktop View (>= 1024px) with ResizablePanelGroup */}
        <div className="hidden lg:block h-full w-full">
          <ResizablePanelGroup direction="horizontal" className="h-full w-full">
            {/* Left Rail: Document Outline */}
            {outlineOpen && !focusMode && (
              <>
                <ResizablePanel defaultSize={18} minSize={14} maxSize={26}>
                  <WorkspaceOutline
                    markdown={note?.markdown}
                    activeHeadingId={activeHeadingId}
                    onSelectHeading={(id) => setActiveHeadingId(id)}
                  />
                </ResizablePanel>
                <ResizableHandle withHandle />
              </>
            )}

            {/* Center Stage: The Teaching Notes */}
            <ResizablePanel defaultSize={outlineOpen && companionOpen ? 50 : outlineOpen || companionOpen ? 70 : 100}>
              <main className="h-full overflow-y-auto relative bg-background/50">
                {/* Notes Toolbar */}
                <div className="sticky top-0 z-10 backdrop-blur-md bg-background/80 border-b border-border/60 px-6 py-2 flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground font-mono text-[11px]">
                    <span className="font-semibold text-foreground">Teaching Notes</span>
                    {note?.markdown && <span>· {headings.length} sections</span>}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyNotes}
                      className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground rounded-full"
                    >
                      {copiedNotes ? <Check className="h-3 w-3 mr-1 text-emerald-500" /> : <Copy className="h-3 w-3 mr-1" />}
                      <span>{copiedNotes ? "Copied" : "Copy"}</span>
                    </Button>

                    {note?.markdown && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={generate}
                        disabled={streaming}
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground rounded-full"
                      >
                        <RefreshCw className={cn("h-3 w-3 mr-1", streaming && "animate-spin text-primary")} />
                        <span>Regenerate</span>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Notes Content Body */}
                <div className="p-6 sm:p-10 max-w-4xl mx-auto space-y-6">
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

            {/* Right Split: Companion Dock */}
            {companionOpen && !focusMode && (
              <>
                <ResizableHandle withHandle />
                <ResizablePanel
                  defaultSize={companionExpanded ? 55 : 32}
                  minSize={24}
                  maxSize={60}
                >
                  <WorkspaceCompanion
                    documentId={doc.id}
                    noteReady={!!note?.markdown}
                    activeTab={companionTab}
                    onTabChange={setCompanionTab}
                    onClose={() => setCompanionOpen(false)}
                    podcast={pod}
                    onGeneratePodcast={runPodcast}
                    cards={cards}
                    onRegenerateDerivatives={runDerivatives}
                    quiz={qz}
                    isExpanded={companionExpanded}
                    onToggleExpanded={() => setCompanionExpanded(!companionExpanded)}
                  />
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        </div>

        {/* Mobile Viewport (< 1024px) */}
        <div className="lg:hidden h-full overflow-y-auto">
          {mobileTab === "notes" && (
            <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-4">
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
            </div>
          )}

          {mobileTab === "outline" && (
            <WorkspaceOutline
              markdown={note?.markdown}
              activeHeadingId={activeHeadingId}
              onSelectHeading={(id) => {
                setActiveHeadingId(id);
                setMobileTab("notes");
              }}
            />
          )}

          {mobileTab === "chat" && (
            <div className="h-full flex flex-col">
              <WorkspaceCompanion
                documentId={doc.id}
                noteReady={!!note?.markdown}
                activeTab="chat"
                onTabChange={setCompanionTab}
                onClose={() => setMobileTab("notes")}
                podcast={pod}
                onGeneratePodcast={runPodcast}
                cards={cards}
                onRegenerateDerivatives={runDerivatives}
                quiz={qz}
              />
            </div>
          )}

          {mobileTab === "podcast" && (
            <div className="p-4">
              <WorkspaceCompanion
                documentId={doc.id}
                noteReady={!!note?.markdown}
                activeTab="podcast"
                onTabChange={setCompanionTab}
                onClose={() => setMobileTab("notes")}
                podcast={pod}
                onGeneratePodcast={runPodcast}
                cards={cards}
                onRegenerateDerivatives={runDerivatives}
                quiz={qz}
              />
            </div>
          )}

          {mobileTab === "cards" && (
            <div className="p-4">
              <WorkspaceCompanion
                documentId={doc.id}
                noteReady={!!note?.markdown}
                activeTab="cards"
                onTabChange={setCompanionTab}
                onClose={() => setMobileTab("notes")}
                podcast={pod}
                onGeneratePodcast={runPodcast}
                cards={cards}
                onRegenerateDerivatives={runDerivatives}
                quiz={qz}
              />
            </div>
          )}

          {mobileTab === "quiz" && (
            <div className="p-4">
              <WorkspaceCompanion
                documentId={doc.id}
                noteReady={!!note?.markdown}
                activeTab="quiz"
                onTabChange={setCompanionTab}
                onClose={() => setMobileTab("notes")}
                podcast={pod}
                onGeneratePodcast={runPodcast}
                cards={cards}
                onRegenerateDerivatives={runDerivatives}
                quiz={qz}
              />
            </div>
          )}
        </div>
      </div>

      {/* 4. Global Omnibar Command Menu (<kbd>Cmd+K</kbd>) */}
      <WorkspaceCommandMenu
        open={commandOpen}
        onOpenChange={setCommandOpen}
        headings={headings}
        onSelectHeading={(id) => {
          setActiveHeadingId(id);
          const el = document.getElementById(id);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
        companionTab={companionTab}
        onSelectCompanionTab={(tab) => {
          setCompanionTab(tab);
          setCompanionOpen(true);
          setFocusMode(false);
        }}
        companionOpen={companionOpen}
        onToggleCompanion={() => setCompanionOpen(!companionOpen)}
        focusMode={focusMode}
        onToggleFocusMode={() => setFocusMode(!focusMode)}
        onRegenerateNotes={generate}
        onRegenerateDerivatives={runDerivatives}
        onRegeneratePodcast={runPodcast}
        notesMarkdown={note?.markdown}
        onNavigateHome={() => router.push("/app")}
      />

      {/* 5. Delete Document Confirmation Dialog */}
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
