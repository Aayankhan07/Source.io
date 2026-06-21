import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace, DocumentRow, FlashcardRow, NoteRow, PodcastRow, QuizQuestionRow, QuizRow } from "@/features/documents/store/workspace";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import MarkdownView from "@/components/common/MarkdownView";
import { FileText, Layers, ListChecks, Headphones, MessagesSquare, Loader2, Trash2, ChevronLeft, Sparkles, RefreshCw, Menu, ArrowLeft, HeadphonesIcon } from "lucide-react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { streamNotes, generateDerivatives } from "@/lib/services/pipeline";
import { generatePodcast } from "@/lib/services/podcast";
import FlashcardsDeck from "@/features/flashcards/components/FlashcardsDeck";
import QuizPlayer from "@/features/quiz/components/QuizPlayer";
import ChatPanel from "@/features/chat/components/ChatPanel";
import { cn } from "@/lib/utils";

export default function DocumentWorkspace() {
  const { docId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const outlet = useOutletContext<{ openMobileNav?: () => void }>();
  const {
    documents, upsertDocument, removeDocument,
    notes, flashcards, quiz, podcast,
    setNote, setFlashcards, setQuiz, setPodcast,
  } = useWorkspace();

  const doc = useMemo<DocumentRow | undefined>(
    () => documents.find((d) => d.id === docId),
    [documents, docId]
  );
  const [loading, setLoading] = useState(true);
  const [streaming, setStreaming] = useState(false);
  const autoStartedRef = useRef<string | null>(null);

  // Custom audio cassette spinning state
  const [audioPlaying, setAudioPlaying] = useState(false);

  useEffect(() => {
    if (!docId || !user) return;
    let mounted = true;
    setLoading(true);

    (async () => {
      const { data: docRow } = await supabase
        .from("documents")
        .select("id,title,source_type,status,error_code,created_at")
        .eq("id", docId)
        .maybeSingle();
      if (docRow && mounted) upsertDocument(docRow as DocumentRow);

      const [n, f, q, p] = await Promise.all([
        supabase.from("notes").select("id,document_id,markdown").eq("document_id", docId).maybeSingle(),
        supabase.from("flashcards").select("id,document_id,front,back,order_index").eq("document_id", docId).order("order_index"),
        supabase.from("quizzes").select("id,document_id,title").eq("document_id", docId).maybeSingle(),
        supabase.from("podcasts").select("id,document_id,script,audio_url,status").eq("document_id", docId).maybeSingle(),
      ]);

      if (!mounted) return;
      setNote(docId, (n.data as NoteRow) ?? null);
      setFlashcards(docId, (f.data as FlashcardRow[]) ?? []);
      if (q.data) {
        const qq = await supabase
          .from("quiz_questions")
          .select("id,quiz_id,question,type,choices,correct,explanation,order_index")
          .eq("quiz_id", q.data.id)
          .order("order_index");
        setQuiz(docId, { ...(q.data as any), questions: (qq.data ?? []) as QuizQuestionRow[] } as QuizRow);
      } else {
        setQuiz(docId, null);
      }
      setPodcast(docId, (p.data as PodcastRow) ?? null);
      setLoading(false);
    })();

    // Realtime: document status updates
    const channel = supabase
      .channel(`doc-${docId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "documents", filter: `id=eq.${docId}` },
        (payload) => upsertDocument(payload.new as DocumentRow),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "podcasts", filter: `document_id=eq.${docId}` },
        (payload) => setPodcast(docId, (payload.new as PodcastRow) ?? null),
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [docId, user, upsertDocument, setNote, setFlashcards, setQuiz, setPodcast]);

  const noteForDoc = docId ? notes[docId] ?? null : null;
  const docStatus = docId ? documents.find((d) => d.id === docId)?.status : undefined;

  const generate = async () => {
    if (!docId || streaming) return;
    setStreaming(true);
    setNote(docId, { id: "draft", document_id: docId, markdown: "" } as NoteRow);
    try {
      const final = await streamNotes({
        documentId: docId,
        onDelta: (chunk) => {
          const cur = (useWorkspace.getState().notes[docId]?.markdown ?? "") + chunk;
          setNote(docId, { id: "draft", document_id: docId, markdown: cur } as NoteRow);
        },
      });
      const { data: fresh } = await supabase
        .from("notes")
        .select("id,document_id,markdown")
        .eq("document_id", docId)
        .maybeSingle();
      setNote(docId, (fresh as NoteRow) ?? { id: "draft", document_id: docId, markdown: final });
    } catch (e: any) {
      toast({ title: "Notes generation failed", description: e.message, variant: "destructive" });
    } finally {
      setStreaming(false);
    }
  };

  useEffect(() => {
    if (!docId) return;
    if (docStatus === "ready" && !noteForDoc?.markdown && autoStartedRef.current !== docId && !streaming) {
      autoStartedRef.current = docId;
      generate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docId, docStatus, noteForDoc?.markdown]);

  const [derivLoading, setDerivLoading] = useState(false);
  const [podcastLoading, setPodcastLoading] = useState(false);
  const runDerivatives = async () => {
    if (!docId || derivLoading) return;
    setDerivLoading(true);
    try {
      await generateDerivatives(docId);
      const [{ data: f }, { data: qq }] = await Promise.all([
        supabase.from("flashcards").select("id,document_id,front,back,order_index").eq("document_id", docId).order("order_index"),
        supabase.from("quizzes").select("id,document_id,title").eq("document_id", docId).maybeSingle(),
      ]);
      setFlashcards(docId, (f as FlashcardRow[]) ?? []);
      if (qq) {
        const { data: questions } = await supabase
          .from("quiz_questions")
          .select("id,quiz_id,question,type,choices,correct,explanation,order_index")
          .eq("quiz_id", qq.id)
          .order("order_index");
        setQuiz(docId, { ...(qq as any), questions: (questions ?? []) as QuizQuestionRow[] } as QuizRow);
      } else {
        setQuiz(docId, null);
      }
      toast({ title: "Flashcards & quiz ready" });
    } catch (e: any) {
      toast({ title: "Generation failed", description: e.message, variant: "destructive" });
    } finally {
      setDerivLoading(false);
    }
  };

  const refreshPodcast = async () => {
    if (!docId) return;
    const { data } = await supabase
      .from("podcasts")
      .select("id,document_id,script,audio_url,status")
      .eq("document_id", docId)
      .maybeSingle();
    setPodcast(docId, (data as PodcastRow) ?? null);
  };

  const runPodcast = async () => {
    if (!docId || podcastLoading) return;
    setPodcastLoading(true);
    setPodcast(docId, {
      id: pod?.id ?? "draft",
      document_id: docId,
      script: pod?.script ?? null,
      audio_url: null,
      status: "generating",
    });
    try {
      await generatePodcast(docId);
      await refreshPodcast();
      toast({ title: "Podcast ready", description: "Your audio recap is ready to play." });
    } catch (e: any) {
      await refreshPodcast();
      toast({ title: "Podcast generation failed", description: e.message, variant: "destructive" });
    } finally {
      setPodcastLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!docId) return;
    if (!confirm("Delete this document and all its assets?")) return;
    const { error } = await supabase.from("documents").delete().eq("id", docId);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      return;
    }
    removeDocument(docId);
    navigate("/app");
  };

  if (!doc) {
    return (
      <div className="h-full flex items-center justify-center bg-[#09090b]">
        {loading ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : (
          <div className="text-center p-8 border border-dashed border-white/10 rounded-2xl max-w-sm glass-panel">
            <p className="text-neutral-400 text-sm mb-4">Study document was not found.</p>
            <Button variant="outline" onClick={() => navigate("/app")} className="border-white/10 text-white hover:bg-white/5">
              <ChevronLeft className="h-4 w-4 mr-1 shrink-0" /> Go to library
            </Button>
          </div>
        )}
      </div>
    );
  }

  const note = notes[doc.id] ?? null;
  const cards = flashcards[doc.id] ?? [];
  const qz = quiz[doc.id] ?? null;
  const pod = podcast[doc.id] ?? null;
  const isProcessing = doc.status === "pending" || doc.status === "processing";

  return (
    <div className="h-full flex flex-col bg-[#09090b]">
      {/* Workspace Header Panel */}
      <div className="border-b border-white/5 bg-[#0b0b0e] px-6 py-4 flex items-center justify-between gap-4 shrink-0">
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
              <Badge variant="outline" className="text-[10px] uppercase font-mono tracking-wider border-white/10 text-neutral-400">{doc.source_type}</Badge>
              {doc.status === "ready" && (
                <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Ready
                </span>
              )}
              {isProcessing && (
                <span className="flex items-center gap-1 text-[10px] text-primary font-medium bg-primary/5 px-2 py-0.5 rounded border border-primary/10">
                  <Loader2 className="h-2.5 w-2.5 animate-spin" /> Ingesting...
                </span>
              )}
              {doc.status === "failed" && (
                <span className="flex items-center gap-1 text-[10px] text-destructive font-medium bg-destructive/5 px-2 py-0.5 rounded border border-destructive/10">
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
          onClick={handleDelete} 
          title="Delete document" 
          className="h-8 w-8 text-neutral-500 hover:text-red-400 hover:bg-red-500/5 border border-transparent hover:border-red-500/10 shrink-0 transition-all"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs Layout */}
      <Tabs defaultValue="notes" className="flex-1 flex flex-col overflow-hidden">
        {/* Editor-console tabs bar */}
        <div className="border-b border-white/5 bg-[#0b0b0e] px-4 shrink-0 overflow-x-auto scrollbar-none">
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
        <div className="flex-1 overflow-y-auto bg-[#09090b]/30">
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
                  <h3 className="font-bold text-white font-display text-sm">Synthesize Study Notes</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Source file text parsed. Click below to stream formatted AI learning notes.
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
                  <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">{cards.length} revision cards</h2>
                  <Button variant="ghost" size="sm" onClick={runDerivatives} disabled={derivLoading} className="text-neutral-400 hover:text-white text-xs">
                    {derivLoading ? <Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> : <RefreshCw className="h-3 w-3 mr-1.5" />}
                    Recompile Deck
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
                  <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">{qz.title} · {qz.questions.length} queries</h2>
                  <Button variant="ghost" size="sm" onClick={runDerivatives} disabled={derivLoading} className="text-neutral-400 hover:text-white text-xs">
                    {derivLoading ? <Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> : <RefreshCw className="h-3 w-3 mr-1.5" />}
                    Regenerate Quiz
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
                      AUDIO RECUP
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
                      className="w-full focus:outline-none accent-primary rounded-lg" 
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
                    <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-neutral-400 max-h-96 overflow-y-auto p-4 bg-[#0a0a0d] border border-white/5 rounded-xl">{pod.script}</pre>
                  </div>
                ) : null}
              </div>
            ) : pod?.status === "generating" || podcastLoading ? (
              <div className="border border-dashed border-white/10 bg-card/40 glass-panel rounded-2xl p-12 text-center space-y-4 max-w-md mx-auto mt-12 animate-pulse-slow">
                <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                <div className="space-y-1">
                  <h4 className="font-bold text-white text-sm">Generating Audio Podcast...</h4>
                  <p className="text-xs text-neutral-400 leading-relaxed">
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
                  <p className="text-xs text-neutral-400 leading-relaxed">
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

          {/* Grounded QA Chat screen */}
          <TabsContent value="chat" className="m-0 p-6 max-w-3xl mx-auto focus-visible:outline-none">
            <ChatPanel documentId={doc.id} noteReady={!!note?.markdown} />
          </TabsContent>
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
      <p className="text-xs text-neutral-400 leading-relaxed">{desc}</p>
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
        <p className="text-xs text-neutral-400 leading-relaxed">
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
