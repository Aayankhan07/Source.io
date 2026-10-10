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
  Maximize2, Minimize2, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, Search, Copy, Check, Share2,
  ListTree, X, Printer
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
import NotesSettingsPopover from "@/features/documents/components/NotesSettingsPopover";
import { useSettings } from "@/features/settings/context/SettingsContext";
import { AiFeedbackButtons } from "@/components/common/AiFeedbackButtons";

type DocumentAssets = {
  note: NoteRow | null;
  cards: FlashcardRow[];
  quiz: QuizRow | null;
  podcast: PodcastRow | null;
};

type TabId = "notes" | "cards" | "quiz" | "podcast";

export default function DocumentWorkspace() {
  const params = useParams();
  const docId = Array.isArray(params.docId) ? params.docId[0] : params.docId;
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const { openMobileNav, setCopilotOpen } = useAppShell();
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
  const { settings, notesSettings } = useSettings();

  // Active workspace tab state
  const [currentTab, setCurrentTab] = useState<TabId>("notes");

  // Sync Copilot open state to global app shell for collision-free quota pill placement
  useEffect(() => {
    setCopilotOpen(currentTab === "notes" && askPanelOpen && !focusMode);
    return () => setCopilotOpen(false);
  }, [currentTab, askPanelOpen, focusMode, setCopilotOpen]);

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
        supabase
          .from("notes")
          .select("id,document_id,markdown")
          .eq("document_id", docId!)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("flashcards")
          .select("id,document_id,front,back,order_index")
          .eq("document_id", docId!)
          .order("order_index"),
        supabase
          .from("quizzes")
          .select("id,document_id,title")
          .eq("document_id", docId!)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("podcasts")
          .select("id,document_id,title,script,audio_url,status")
          .eq("document_id", docId!)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      if (n.error) console.error("Error loading note:", n.error);
      if (f.error) console.error("Error loading flashcards:", f.error);
      if (q.error) console.error("Error loading quiz:", q.error);
      if (p.error) console.error("Error loading podcast:", p.error);

      let quiz: QuizRow | null = null;
      if (q.data) {
        const { data: questions, error: qErr } = await supabase
          .from("quiz_questions")
          .select("id,quiz_id,question,type,choices,correct,explanation,order_index")
          .eq("quiz_id", q.data.id)
          .order("order_index");
        if (qErr) console.error("Error loading quiz questions:", qErr);
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
    const wpm = settings?.readingTargetWpm || 200;
    return Math.max(1, Math.round(wordCount / wpm));
  }, [note?.markdown, settings?.readingTargetWpm]);

  const generate = async () => {
    if (!docId || streaming) return;
    setStreaming(true);
    setDraftMarkdown("");
    try {
      const streamed = await streamNotes({
        documentId: docId,
        tone: notesSettings.regenerationTone,
        notesDepth: settings.notesDepth,
        model: settings.preferredModel,
        apiKey: settings.apiKeys.gemini || settings.apiKeys.groq,
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
      const finalMarkdown = (streamed || pendingNotesRef.current || draftMarkdown || "").trim();
      pendingNotesRef.current = "";

      if (finalMarkdown) {
        // 1. Immediately ensure cache has the final note to prevent ANY flicker or blank screen
        const completedNote: NoteRow = {
          id: persistedNote?.id ?? crypto.randomUUID(),
          document_id: docId,
          markdown: finalMarkdown,
        };

        queryClient.setQueryData<DocumentAssets>(queryKeys.assets(docId), (prev) => ({
          note: completedNote,
          cards: prev?.cards ?? [],
          quiz: prev?.quiz ?? null,
          podcast: prev?.podcast ?? null,
        }));

        // 2. Persist to Supabase notes table directly as guaranteed backup
        if (user?.id && !isDemo) {
          try {
            const { data: existing } = await supabase
              .from("notes")
              .select("id")
              .eq("document_id", docId)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();

            if (existing) {
              await supabase
                .from("notes")
                .update({ markdown: finalMarkdown })
                .eq("id", existing.id);
            } else {
              await supabase
                .from("notes")
                .insert({ document_id: docId, user_id: user.id, markdown: finalMarkdown });
            }
          } catch (persistErr) {
            console.error("Client-side note persistence fallback error:", persistErr);
          }
        }

        // 3. Clear draft now that persisted note is safely in React Query cache
        setDraftMarkdown(null);

        // 4. Invalidate to sync server IDs in background
        await queryClient.invalidateQueries({ queryKey: queryKeys.assets(docId) });
      } else {
        setDraftMarkdown(null);
      }
    } catch (e: unknown) {
      setDraftMarkdown(null);
      toast({ title: "Notes generation failed", description: errorMessage(e), variant: "destructive" });
    } finally {
      setStreaming(false);
    }
  };

  const [derivLoading, setDerivLoading] = useState(false);
  const [podcastLoading, setPodcastLoading] = useState(false);

  const runDerivatives = async () => {
    if (!docId || derivLoading) return;
    setDerivLoading(true);
    try {
      await generateDerivatives(docId, {
        flashcardCount: settings.flashcardBatchSize,
        quizDifficulty: settings.quizDifficulty,
      });
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
      await generatePodcast(docId, { voiceDuo: settings.podcastVoiceDuo });
      await queryClient.invalidateQueries({ queryKey: queryKeys.assets(docId) });
      toast({ title: "Podcast ready", description: "Your audio recap is ready to play." });
    } catch (e: unknown) {
      await queryClient.invalidateQueries({ queryKey: queryKeys.assets(docId) });
      toast({ title: "Podcast generation failed", description: errorMessage(e), variant: "destructive" });
    } finally {
      setPodcastLoading(false);
    }
  };

  useEffect(() => {
    if (!docId || assetsQuery.isLoading) return;
    if (docStatus === "ready" && !note?.markdown && autoStartedRef.current !== docId && !streaming) {
      autoStartedRef.current = docId;
      generate();
    }
    // Auto-generate podcast if user enabled setting and no podcast exists yet
    if (
      settings.autoGeneratePodcast &&
      docStatus === "ready" &&
      note?.markdown &&
      !pod &&
      !podcastLoading &&
      !isDemo
    ) {
      runPodcast();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docId, docStatus, note?.markdown, assetsQuery.isLoading, settings.autoGeneratePodcast, pod, podcastLoading, isDemo]);

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

  const handleExportPdf = () => {
    if (!note?.markdown) return;
    window.print();
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
    { id: "cards", label: "Flashcards", count: cards.length },
    { id: "quiz", label: "Quiz" },
    { id: "podcast", label: "Podcast" },
  ];

  return (
    <div className="h-full flex flex-col bg-tactile-canvas overflow-hidden">
      {/* Workspace Floating Tactile Capsule Bar (Centered, Matches sc 3) */}
      <div className="px-4 sm:px-8 pt-4 pb-2.5 flex items-center justify-center relative shrink-0 z-10 select-none no-print">
        {openMobileNav && (
          <button
            className="md:hidden absolute left-4 size-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground bg-card/90 border border-border shrink-0 cursor-pointer shadow-xs"
            onClick={openMobileNav}
            aria-label="Open navigation"
          >
            <Menu className="size-4" />
          </button>
        )}

        <div className="inline-flex items-center gap-1 p-1 sm:p-1.5 rounded-full bg-card/95 backdrop-blur-md border border-border shadow-[0_2px_16px_rgba(0,0,0,0.04)] overflow-x-auto scrollbar-none max-w-full">
          {tabs.map((t) => {
            const isActive = currentTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setCurrentTab(t.id)}
                className={cn(
                  "h-8 sm:h-9 px-3.5 sm:px-5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 shrink-0 flex items-center gap-2 cursor-pointer select-none",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-xs scale-[1.01]"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <span>{t.label}</span>
                {t.count !== undefined && t.count > 0 && (
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold leading-none",
                      isActive
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Main Workspace Content */}
      <div className="flex-1 overflow-hidden relative">
        {currentTab === "notes" && (
          <>
            {/* Desktop View (>= 1024px, force active in print) */}
            <div className="hidden lg:block print:block h-full w-full relative">
              <ResizablePanelGroup direction="horizontal" className="h-full w-full">
                {/* Left Rail: Retractable Document Outline */}
                {outlineOpen && !focusMode && (
                  <>
                    <ResizablePanel
                      id="workspace-outline-panel"
                      order={1}
                      defaultSize={outlineRetracted ? 4 : 20}
                      minSize={outlineRetracted ? 4 : 14}
                      maxSize={outlineRetracted ? 5 : 28}
                      className="no-print"
                    >
                      <div className="h-full p-2.5 pl-3 pr-1">
                        <WorkspaceOutline
                          markdown={note?.markdown}
                          activeHeadingId={activeHeadingId}
                          onSelectHeading={(id) => setActiveHeadingId(id)}
                          isRetracted={outlineRetracted}
                          onToggleRetract={() => setOutlineRetracted(!outlineRetracted)}
                          onClose={() => setOutlineOpen(false)}
                        />
                      </div>
                    </ResizablePanel>
                    <ResizableHandle className="w-1.5 bg-transparent hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-col-resize no-print" />
                  </>
                )}

                {/* Center Stage: Notes Reading Content */}
                <ResizablePanel
                  id="workspace-notes-stage"
                  order={2}
                  defaultSize={outlineOpen ? (outlineRetracted ? (askPanelOpen ? 72 : 96) : (askPanelOpen ? 56 : 80)) : (askPanelOpen ? 76 : 100)}
                >
                  <main className="h-full overflow-y-auto relative bg-tactile-canvas p-2.5 px-2">
                    <div className="max-w-4xl mx-auto space-y-6 pb-16">
                      {/* "On this page: ..." Summary Banner (Wireframe Badge 4) */}
                      {headings.length > 0 && notesSettings.showPageSummaryBanner && (
                        <div className="flex items-center gap-2 px-4 py-2.5 rounded-[18px] bg-card/80 backdrop-blur-md border border-border text-xs text-muted-foreground shadow-2xs animate-fade-in no-print">
                          <span className="font-bold text-foreground shrink-0 font-display">On this page:</span>
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
                              <span className="shrink-0 text-muted-foreground">+{headings.length - 6} more</span>
                            )}
                          </div>
                        </div>
                      )}

                      {assetsQuery.isLoading ? (
                        <div className="flex items-center justify-center py-24">
                          <Loader2 className="size-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : note?.markdown ? (
                        <div className="space-y-6 animate-fade-in pb-16">
                          <div id="printable-notes-section" className="rounded-[32px] bg-card border border-border shadow-tactile-card p-6 sm:p-10 lg:p-12 printable-note-card">
                            {/* Print-Only Header (Publication Title & Metadata) */}
                            <div className="print-only mb-6 pb-4 border-b border-slate-300">
                              <div className="flex items-center justify-between text-xs text-slate-500 font-mono mb-2">
                                <span className="uppercase tracking-wider font-bold">Source.io Study Engine</span>
                                <span>{new Date(doc.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                              </div>
                              <h1 className="text-2xl font-bold font-display text-slate-900 tracking-tight mb-2">
                                {doc.title}
                              </h1>
                              <div className="flex items-center gap-3 text-xs text-slate-600 font-mono">
                                <span className="uppercase font-bold px-2 py-0.5 rounded bg-slate-100 border border-slate-300">
                                  {doc.source_type}
                                </span>
                                <span>{readTimeMinutes} min read</span>
                              </div>
                            </div>

                            {/* Document metadata & Action Bar (Screen Only) */}
                            <div className="flex flex-wrap items-center justify-between gap-3 pb-6 mb-8 border-b border-border no-print">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="text-[10px] font-mono uppercase px-2.5 py-1 rounded-full bg-muted text-foreground font-bold border border-border shrink-0">
                                  {doc.source_type}
                                </span>
                                <span className="text-xs text-muted-foreground font-mono shrink-0">
                                  {readTimeMinutes} min read
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  onClick={handleCopyNotes}
                                  className="h-8 px-3 text-xs font-semibold text-foreground bg-muted hover:bg-accent rounded-full inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                                >
                                  {copiedNotes ? <Check className="size-3 text-emerald-500 stroke-[2.5]" /> : <Copy className="size-3" />}
                                  <span>{copiedNotes ? "Copied" : "Copy"}</span>
                                </button>

                                <button
                                  onClick={handleExportPdf}
                                  title="Export or print publication-ready notes as PDF"
                                  className="h-8 px-3 text-xs font-semibold text-foreground bg-muted hover:bg-accent rounded-full inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                                >
                                  <Printer className="size-3.5 text-muted-foreground" />
                                  <span>Export PDF</span>
                                </button>

                                {note?.markdown && (
                                  <button
                                    onClick={generate}
                                    disabled={streaming}
                                    className="h-8 px-3 text-xs font-semibold text-foreground bg-muted hover:bg-accent rounded-full inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                                  >
                                    <RefreshCw className={cn("size-3", streaming && "animate-spin text-sky-500")} />
                                    <span>Regenerate</span>
                                  </button>
                                )}

                                <NotesSettingsPopover />

                                <button
                                  onClick={() => setDeleteOpen(true)}
                                  title="Delete document"
                                  className="size-8 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              </div>
                            </div>

                            <MarkdownView>{note.markdown}</MarkdownView>

                            {/* Product Feedback on generated notes (Screen Only) */}
                            <div className="pt-6 mt-8 border-t border-border flex items-center justify-between no-print">
                              <AiFeedbackButtons
                                documentId={doc.id}
                                feature="notes"
                                model={settings.preferredModel}
                              />
                              <span className="text-[11px] text-muted-foreground font-mono">
                                Source.io Study Engine
                              </span>
                            </div>
                          </div>
                          {streaming && (
                            <div className="flex items-center gap-2 text-xs text-sky-600 dark:text-sky-400 font-mono bg-sky-50 dark:bg-sky-950/40 p-3 rounded-full border border-sky-200 dark:border-sky-800 max-w-max no-print">
                              <Loader2 className="size-3.5 animate-spin" /> Stream compiling notes…
                            </div>
                          )}
                        </div>
                      ) : doc.status === "ready" ? (
                        <div className="rounded-[28px] border border-border p-10 text-center space-y-4 max-w-md mx-auto mt-12 bg-card shadow-tactile-card animate-fade-in no-print">
                          <div className="size-12 rounded-2xl bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center text-amber-700 dark:text-amber-400 mx-auto">
                            <Sparkles className="size-6" />
                          </div>
                          <div className="space-y-1">
                            <h3 className="font-bold text-foreground font-display text-base">Generate study notes</h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              We've indexed your material. Generate structured teaching notes to begin.
                            </p>
                          </div>
                          <button onClick={generate} disabled={streaming} className="h-10 px-5 rounded-full text-xs font-bold bg-primary text-primary-foreground hover:scale-105 active:scale-95 transition-all shadow-tactile-pill cursor-pointer flex items-center gap-2 mx-auto">
                            {streaming ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
                            <span>Generate Notes</span>
                          </button>
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
                    <ResizableHandle className="w-1.5 bg-transparent hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-col-resize no-print" />
                    <ResizablePanel
                      id="workspace-ask-panel"
                      order={3}
                      defaultSize={24}
                      minSize={18}
                      maxSize={35}
                      className="no-print"
                    >
                      <div className="h-full p-2.5 pr-3 pl-1">
                        <AskPanel
                          documentId={doc.id}
                          noteMarkdown={note?.markdown}
                          headings={headings}
                          onScrollToHeading={(id) => setActiveHeadingId(id)}
                          onClose={() => setAskPanelOpen(false)}
                        />
                      </div>
                    </ResizablePanel>
                  </>
                )}
              </ResizablePanelGroup>

              {/* Floating Re-open Triggers when collapsed */}
              {!outlineOpen && !focusMode && (
                <div className="absolute left-4 top-4 z-30 animate-fade-in no-print">
                  <button
                    onClick={() => {
                      setOutlineOpen(true);
                      setOutlineRetracted(false);
                    }}
                    className="h-9 px-3.5 rounded-full shadow-tactile-pill bg-card/95 backdrop-blur-md border border-border text-foreground hover:bg-accent text-xs font-semibold flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                    title="Open Outline"
                  >
                    <ListTree className="size-3.5 text-sky-600 dark:text-sky-400" />
                    <span>Outline</span>
                  </button>
                </div>
              )}

              {!askPanelOpen && !focusMode && (
                <div className="absolute right-4 top-4 z-30 animate-fade-in no-print">
                  <button
                    onClick={() => setAskPanelOpen(true)}
                    className="h-9 px-3.5 rounded-full shadow-tactile-pill bg-card/95 backdrop-blur-md border border-border text-foreground hover:bg-accent text-xs font-semibold flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                    title="Open Ask Copilot"
                  >
                    <Sparkles className="size-3.5 text-purple-600 dark:text-purple-400" />
                    <span>Ask Copilot</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Viewport (< 1024px) */}
            <div className="lg:hidden h-full overflow-y-auto no-print">
              <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-4">
                {headings.length > 0 && notesSettings.showPageSummaryBanner && (
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
        <div className="bg-card p-8 rounded-3xl border border-border text-center space-y-4 shadow-tactile-card">
          <div className="size-12 rounded-2xl bg-muted border border-border flex items-center justify-center text-muted-foreground mx-auto mb-2 shadow-tactile-pill">
            <Headphones className="size-6 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-foreground font-display text-base">No podcast yet</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Generate an engaging 2-host audio walkthrough grounded directly in your notes and formulas.
          </p>
          <Button onClick={onGenerate} disabled={loading} className="rounded-full text-xs h-9 px-4">
            {loading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1.5" />}
            Generate Socratic Podcast
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
      <div className="bg-card p-8 rounded-3xl border border-border text-center space-y-4 shadow-tactile-card">
        <div className="size-12 rounded-2xl bg-muted border border-border flex items-center justify-center text-muted-foreground mx-auto mb-2 shadow-tactile-pill">
          <Layers className="size-6 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-foreground font-display text-base">No flashcards yet</h3>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          Generate an active spaced-repetition card deck mapped directly to key definitions and proof steps.
        </p>
        <Button onClick={onRegenerate} disabled={loading} className="rounded-full text-xs h-9 px-4">
          {loading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1.5" />}
          Generate Flashcard Deck
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
      <div className="bg-card p-8 rounded-3xl border border-border text-center space-y-4 shadow-tactile-card">
        <div className="size-12 rounded-2xl bg-muted border border-border flex items-center justify-center text-muted-foreground mx-auto mb-2 shadow-tactile-pill">
          <ListChecks className="size-6 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-foreground font-display text-base">No quiz yet</h3>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          Generate a retrieval-practice quiz with proof references and diagnostic explanations.
        </p>
        <Button onClick={onRegenerate} disabled={loading} className="rounded-full text-xs h-9 px-4">
          {loading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1.5" />}
          Generate Practice Quiz
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
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setPlaying(true);
          })
          .catch((err) => {
            console.warn("Audio playback not supported or interrupted:", err);
            setPlaying(false);
          });
      }
    }
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