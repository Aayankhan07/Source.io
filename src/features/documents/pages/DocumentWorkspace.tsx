import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DocumentRow, FlashcardRow, NoteRow, PodcastRow, QuizQuestionRow, QuizRow } from "@/features/documents/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import MarkdownView from "@/components/common/MarkdownView";
import { AlertCircle, FileText, Layers, ListChecks, Headphones, MessagesSquare, Loader2, Trash2, ChevronLeft, Sparkles, RefreshCw, Menu, HeadphonesIcon } from "lucide-react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { streamNotes, generateDerivatives } from "@/lib/services/pipeline";
import { generatePodcast } from "@/lib/services/podcast";
import FlashcardsDeck from "@/features/flashcards/components/FlashcardsDeck";
import QuizPlayer from "@/features/quiz/components/QuizPlayer";
import ChatPanel from "@/features/chat/components/ChatPanel";
import { cn, errorMessage } from "@/lib/utils";
import { queryKeys } from "@/lib/queryKeys";

type DocumentAssets = {
  note: NoteRow | null;
  cards: FlashcardRow[];
  quiz: QuizRow | null;
  podcast: PodcastRow | null;
};

export default function DocumentWorkspace() {
  const { docId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const outlet = useOutletContext<{ openMobileNav?: () => void }>();
  const queryClient = useQueryClient();

  const [streaming, setStreaming] = useState(false);
  const autoStartedRef = useRef<string | null>(null);

  // Notes arrive token-by-token. Holding the in-flight draft locally keeps the
  // query cache authoritative for what is actually persisted.
  const [draftMarkdown, setDraftMarkdown] = useState<string | null>(null);
  const pendingNotesRef = useRef("");
  const notesFlushRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (notesFlushRef.current !== null) cancelAnimationFrame(notesFlushRef.current);
  }, []);

  // Custom audio cassette spinning state
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const docQuery = useQuery({
    queryKey: queryKeys.document(docId ?? ""),
    enabled: !!docId && !!user,
    queryFn: async () => {
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
      const [n, f, q, p] = await Promise.all([
        supabase.from("notes").select("id,document_id,markdown").eq("document_id", docId!).maybeSingle(),
        supabase.from("flashcards").select("id,document_id,front,back,order_index").eq("document_id", docId!).order("order_index"),
        supabase.from("quizzes").select("id,document_id,title").eq("document_id", docId!).maybeSingle(),
        supabase.from("podcasts").select("id,document_id,script,audio_url,status").eq("document_id", docId!).maybeSingle(),
      ]);
      // Supabase resolves rather than throws, so a dropped error here would render
      // as "no content yet" and invite the user to overwrite work that exists.
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

  // Realtime: document status and podcast progress write into the same cache the
  // queries above own, so there is never a second copy to fall out of sync.
  useEffect(() => {
    if (!docId || !user) return;

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
  }, [docId, user, queryClient]);

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

  const generate = async () => {
    if (!docId || streaming) return;
    setStreaming(true);
    setDraftMarkdown("");
    try {
      await streamNotes({
        documentId: docId,
        // Each state change re-parses the whole accumulated markdown through
        // KaTeX + GFM, so flush on a frame rather than once per token.
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
      // The edge function persists the note; refetch so the cache holds the saved
      // row rather than the locally accumulated draft.
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
      // Refetching is authoritative and avoids a second hand-rolled read path.
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
    // Optimistic: show the generating state immediately.
    queryClient.setQueryData<DocumentAssets>(queryKeys.assets(docId), (prev) =>
      prev
        ? {
            ...prev,
            podcast: {
              id: prev.podcast?.id ?? "draft",
              document_id: docId,
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
    navigate("/app");
  };

  if (docQuery.isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  // A failed lookup is not the same as a missing document — saying "not found"
  // here would tell the user their work is gone when the request merely failed.
  if (docQuery.isError) {
    return (
      <div className="h-full flex items-center justify-center bg-background px-6">
        <div className="text-center p-8 border border-dashed border-destructive/20 rounded-2xl max-w-sm glass-panel space-y-4">
          <div className="h-10 w-10 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive mx-auto">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-white font-display text-sm">Couldn't load this document</h3>
            <p className="text-sm text-neutral-400 leading-relaxed">{errorMessage(docQuery.error)}</p>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Button onClick={() => docQuery.refetch()} className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold text-xs">
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Retry
            </Button>
            <Button variant="outline" onClick={() => navigate("/app")} className="border-white/10 text-white hover:bg-white/5 text-xs">
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
        <div className="text-center p-8 border border-dashed border-white/10 rounded-2xl max-w-sm glass-panel">
          <p className="text-neutral-400 text-sm mb-4">Study document was not found.</p>
          <Button variant="outline" onClick={() => navigate("/app")} className="border-white/10 text-white hover:bg-white/5">
            <ChevronLeft className="h-4 w-4 mr-1 shrink-0" /> Go to library
          </Button>
        </div>
      </div>
    );
  }

  const isProcessing = doc.status === "pending" || doc.status === "processing";

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Workspace Header Panel */}
      <div className="border-b border-white/5 bg-sidebar px-6 py-4 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {outlet?.openMobileNav && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden -ml-2 text-neutral-400 hover:text-white"
              onClick={outlet.openMobileNav}
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <Badge variant="outline" className="text-xs uppercase font-mono tracking-wider border-white/10 text-neutral-400">{doc.source_type}</Badge>
              {doc.status === "ready" && (
                <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Ready
                </span>
              )}
              {isProcessing && (
                <span className="flex items-center gap-1 text-xs text-primary font-medium bg-primary/5 px-2 py-0.5 rounded border border-primary/10">
                  <Loader2 className="h-2.5 w-2.5 animate-spin" /> Ingesting...
                </span>
              )}
              {doc.status === "failed" && (
                <span className="flex items-center gap-1 text-xs text-destructive font-medium bg-destructive/5 px-2 py-0.5 rounded border border-destructive/10">
                  {doc.error_code ?? "Failed"}
                </span>
              )}
            </div>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight truncate font-display">{doc.title}</h1>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDeleteOpen(true)}
          title="Delete document"
          aria-label="Delete document"
          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/20 shrink-0 transition-all"
        >
          <Trash2 className="h-4 w-4" />
        </Button>

        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent className="bg-card border-white/10 text-white rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-display">Delete this document?</AlertDialogTitle>
              <AlertDialogDescription className="text-neutral-400">
                <span className="text-white font-medium">{doc.title}</span> and everything generated from
                it — notes, flashcards, quiz and podcast — will be permanently removed. This can't be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-white/10 bg-white/5 text-white hover:bg-white/10">
                Keep it
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete document
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Tabs Layout */}
      <Tabs defaultValue="notes" className="flex-1 flex flex-col overflow-hidden">
        {/* Editor-console tabs bar */}
        <div className="border-b border-white/5 bg-sidebar px-4 shrink-0 overflow-x-auto">
          <TabsList className="bg-transparent h-12 p-0 gap-1 flex justify-start items-stretch">
            {[
              { val: "notes", label: "Study Notes", icon: FileText },
              { val: "flashcards", label: "Flashcards", icon: Layers },
              { val: "quiz", label: "Quiz Practice", icon: ListChecks },
              { val: "podcast", label: "Podcast Recap", icon: Headphones },
              { val: "chat", label: "AI Grounded Chat", icon: MessagesSquare }
            ].map((tab) => {
              const TabIcon = tab.icon;
              return (
                <TabsTrigger 
                  key={tab.val}
                  value={tab.val} 
                  className="rounded-none border-b-2 border-transparent bg-transparent px-4 text-xs font-medium text-neutral-400 hover:text-neutral-200 data-[state=active]:border-primary data-[state=active]:text-primary transition-all flex items-center gap-1.5"
                >
                  <TabIcon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {/* Tab content screens */}
        <div className="flex-1 overflow-y-auto bg-background/30">
          {/* One gate for every tab: a failed asset read must never fall through to
              the "generate" states, which would invite overwriting existing work. */}
          {assetsQuery.isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : assetsQuery.isError ? (
            <div className="border border-dashed border-destructive/20 bg-destructive/5 glass-panel rounded-2xl p-10 text-center max-w-md mx-auto mt-12 space-y-4">
              <div className="h-10 w-10 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive mx-auto">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-white font-display text-sm">Couldn't load this document's content</h3>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  Your notes, cards and quiz are safe — we just couldn't fetch them.
                  <span className="block text-neutral-500 mt-1">{errorMessage(assetsQuery.error)}</span>
                </p>
              </div>
              <Button onClick={() => assetsQuery.refetch()} className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold text-xs">
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Retry
              </Button>
            </div>
          ) : (
          <>
          {/* Notes screen */}
          <TabsContent value="notes" className="m-0 p-6 max-w-3xl mx-auto focus-visible:outline-none">
            {note?.markdown ? (
              <div className="space-y-6 animate-fade-in">
                <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/5">
                  <MarkdownView>{note.markdown}</MarkdownView>
                </div>
                {streaming && (
                  <div className="flex items-center gap-2 text-xs text-primary font-mono bg-primary/5 p-3 rounded-lg border border-primary/10 max-w-max">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Stream compiling notes…
                  </div>
                )}
              </div>
            ) : doc.status === "ready" ? (
              <div className="border border-dashed border-white/10 rounded-2xl p-10 text-center space-y-4 max-w-md mx-auto mt-12 bg-card/40 glass-panel animate-fade-in">
                <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-white font-display text-sm">Generate study notes</h3>
                  <p className="text-sm text-neutral-400 leading-relaxed">
                    We've read your source. Generate notes to get started.
                  </p>
                </div>
                <Button onClick={generate} disabled={streaming} className="bg-primary hover:bg-primary-glow text-primary-foreground font-semibold px-4 py-2 text-xs">
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
          </TabsContent>

          {/* Flashcards screen */}
          <TabsContent value="flashcards" className="m-0 p-6 max-w-3xl mx-auto focus-visible:outline-none">
            {cards.length === 0 ? (
              <DerivativesEmpty
                kind="flashcards"
                noteReady={!!note?.markdown}
                loading={derivLoading}
                onGenerate={runDerivatives}
              />
            ) : (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">{cards.length} cards</h2>
                  <Button variant="ghost" size="sm" onClick={runDerivatives} disabled={derivLoading} className="text-neutral-400 hover:text-white text-xs">
                    {derivLoading ? <Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> : <RefreshCw className="h-3 w-3 mr-1.5" />}
                    Regenerate
                  </Button>
                </div>
                <FlashcardsDeck cards={cards} />
              </div>
            )}
          </TabsContent>

          {/* Quiz screen */}
          <TabsContent value="quiz" className="m-0 p-6 max-w-3xl mx-auto focus-visible:outline-none">
            {!qz || qz.questions.length === 0 ? (
              <DerivativesEmpty
                kind="quiz"
                noteReady={!!note?.markdown}
                loading={derivLoading}
                onGenerate={runDerivatives}
              />
            ) : (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">{qz.title} · {qz.questions.length} questions</h2>
                  <Button variant="ghost" size="sm" onClick={runDerivatives} disabled={derivLoading} className="text-neutral-400 hover:text-white text-xs">
                    {derivLoading ? <Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> : <RefreshCw className="h-3 w-3 mr-1.5" />}
                    Regenerate
                  </Button>
                </div>
                <QuizPlayer quiz={qz} />
              </div>
            )}
          </TabsContent>

          {/* Podcast recap screen */}
          <TabsContent value="podcast" className="m-0 p-6 max-w-3xl mx-auto focus-visible:outline-none">
            {!note?.markdown ? (
              <Placeholder title="Podcast unavailable" desc="Generate study notes first, then compile the conversational recap dialogue." />
            ) : pod?.audio_url ? (
              <div className="space-y-6 animate-fade-in">
                {/* Cassette layout box */}
                <div className="glass-panel p-8 rounded-2xl border border-white/5 flex flex-col items-center justify-center space-y-6 relative overflow-hidden shadow-2xl">
                  {/* Decorative background grid */}
                  <div className="absolute inset-0 bg-[radial-gradient(#ffffff03_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

                  {/* Retro Cassette Graphic */}
                  <div className="cassette-shell z-10">
                    <div className="cassette-label">
                      <div className="cassette-window">
                        <div className={cn("cassette-spindle", audioPlaying && "spindle-spinning")} />
                        <div className={cn("cassette-spindle", audioPlaying && "spindle-spinning-reverse")} />
                      </div>
                    </div>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[8px] font-mono text-neutral-500 uppercase tracking-widest">
                      AUDIO RECAP
                    </div>
                  </div>

                  <div className="text-center z-10 space-y-1">
                    <h3 className="font-bold text-white font-display text-sm flex items-center gap-1 justify-center">
                      <HeadphonesIcon className="h-4 w-4 text-primary" /> Audio recap summary
                    </h3>
                    <p className="text-xs text-neutral-400">Play below to listen to the dialogue recap between the two AI hosts.</p>
                  </div>

                  <div className="w-full max-w-md z-10">
                    <audio 
                      controls 
                      src={pod.audio_url} 
                      className="w-full accent-primary rounded-lg" 
                      onPlay={() => setAudioPlaying(true)}
                      onPause={() => setAudioPlaying(false)}
                      onEnded={() => setAudioPlaying(false)}
                    />
                  </div>
                  
                  <Button variant="ghost" size="sm" onClick={runPodcast} disabled={podcastLoading} className="text-neutral-400 hover:text-white border border-white/5 hover:bg-white/5 text-xs">
                    {podcastLoading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5 mr-1.5" />}
                    Regenerate Podcast
                  </Button>
                </div>

                {pod.script ? (
                  <div className="border border-white/5 rounded-2xl p-6 bg-card/40 space-y-3 glass-panel">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Conversational Script</h3>
                    <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-neutral-400 max-h-96 overflow-y-auto p-4 bg-background border border-white/5 rounded-xl">{pod.script}</pre>
                  </div>
                ) : null}
              </div>
            ) : pod?.status === "generating" || podcastLoading ? (
              <div className="border border-dashed border-white/10 bg-card/40 glass-panel rounded-2xl p-12 text-center space-y-4 max-w-md mx-auto mt-12 animate-pulse-slow">
                <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                <div className="space-y-1">
                  <h4 className="font-bold text-white text-sm">Generating Audio Podcast...</h4>
                  <p className="text-sm text-neutral-400 leading-relaxed">
                    We're compiling the conversation script and generating speech files. This can take a minute.
                  </p>
                </div>
              </div>
            ) : pod?.status === "failed" ? (
              <div className="border border-dashed border-white/10 bg-card/40 glass-panel rounded-2xl p-10 text-center space-y-4 max-w-md mx-auto mt-12">
                <div className="h-10 w-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mx-auto">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-white text-sm">Podcast Generation Failed</h3>
                  <p className="text-xs text-neutral-400">Try rebuilding the recap audio files from your notes.</p>
                </div>
                <Button onClick={runPodcast} disabled={podcastLoading} className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-4 py-2 text-xs">
                  {podcastLoading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Headphones className="h-3.5 w-3.5 mr-1.5" />}
                  Retry Generator
                </Button>
              </div>
            ) : (
              <div className="border border-dashed border-white/10 bg-card/40 glass-panel rounded-2xl p-10 text-center space-y-4 max-w-md mx-auto mt-12">
                <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto">
                  <Headphones className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-white font-display text-sm">Generate recap audio podcast</h3>
                  <p className="text-sm text-neutral-400 leading-relaxed">
                    Create a simulated two-host conversational review file based on your generated notes.
                  </p>
                </div>
                <Button onClick={runPodcast} disabled={podcastLoading} className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-4 py-2 text-xs">
                  {podcastLoading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Headphones className="h-3.5 w-3.5 mr-1.5" />}
                  Generate Podcast
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Grounded QA Chat screen. `h-full` + flex lets ChatPanel size itself
              from this container instead of guessing at the viewport. */}
          <TabsContent
            value="chat"
            className="m-0 p-6 max-w-3xl mx-auto w-full h-full flex flex-col data-[state=inactive]:hidden focus-visible:outline-none"
          >
            <ChatPanel documentId={doc.id} noteReady={!!note?.markdown} />
          </TabsContent>
          </>
          )}
        </div>
      </Tabs>
    </div>
  );
}

function Placeholder({ title, desc, loading = false }: { title: string; desc: string; loading?: boolean }) {
  return (
    <div className="border border-dashed border-white/10 bg-card/40 glass-panel rounded-2xl p-10 text-center max-w-md mx-auto mt-12 space-y-3">
      {loading ? (
        <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
      ) : (
        <div className="h-8 w-8 rounded-lg bg-neutral-900 border border-white/5 flex items-center justify-center text-neutral-500 mx-auto">
          <FileText className="h-4 w-4" />
        </div>
      )}
      <h3 className="font-bold text-white font-display text-sm">{title}</h3>
      <p className="text-sm text-neutral-400 leading-relaxed">{desc}</p>
    </div>
  );
}

function DerivativesEmpty({
  kind, noteReady, loading, onGenerate,
}: { kind: "flashcards" | "quiz"; noteReady: boolean; loading: boolean; onGenerate: () => void }) {
  if (!noteReady) {
    return <Placeholder title={`No ${kind} generated yet`} desc="Generate study notes first, then compile flashcard & quiz modules." />;
  }
  return (
    <div className="border border-dashed border-white/10 bg-card/40 glass-panel rounded-2xl p-10 text-center max-w-md mx-auto mt-12 space-y-4">
      <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto">
        <Sparkles className="h-5 w-5" />
      </div>
      <div className="space-y-1">
        <h3 className="font-bold text-white font-display text-sm">Generate {kind} sets</h3>
        <p className="text-sm text-neutral-400 leading-relaxed">
          We will analyze your compiled study notes to create {kind === "flashcards" ? "revision card sets" : "assessment quiz modules"}.
        </p>
      </div>
      <Button onClick={onGenerate} disabled={loading} className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-4 py-2 text-xs">
        {loading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1.5" />}
        Generate Now
      </Button>
    </div>
  );
}
