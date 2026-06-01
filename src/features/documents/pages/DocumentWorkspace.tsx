import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace, DocumentRow, FlashcardRow, NoteRow, PodcastRow, QuizQuestionRow, QuizRow } from "@/features/documents/store/workspace";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import MarkdownView from "@/components/common/MarkdownView";
import { FileText, Layers, ListChecks, Headphones, MessagesSquare, Loader2, Trash2, ChevronLeft, Sparkles, RefreshCw, Menu } from "lucide-react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { streamNotes, generateDerivatives } from "@/lib/services/pipeline";
import { generatePodcast } from "@/lib/services/podcast";
import FlashcardsDeck from "@/features/flashcards/components/FlashcardsDeck";
import QuizPlayer from "@/features/quiz/components/QuizPlayer";
import ChatPanel from "@/features/chat/components/ChatPanel";

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
      <div className="h-full flex items-center justify-center">
        {loading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : (
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Document not found.</p>
            <Button variant="outline" onClick={() => navigate("/app")}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
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
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-border px-4 sm:px-6 py-3 sm:py-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          {outlet?.openMobileNav && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden -ml-2 mt-0.5 shrink-0"
              onClick={outlet.openMobileNav}
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge variant="outline" className="text-[10px] uppercase tracking-wide">{doc.source_type}</Badge>
              {doc.status === "ready" && <Badge variant="secondary" className="text-[10px]">Ready</Badge>}
              {isProcessing && <Badge className="text-[10px] bg-primary/20 text-primary border-primary/30">Processing…</Badge>}
              {doc.status === "failed" && <Badge variant="destructive" className="text-[10px]">{doc.error_code ?? "Failed"}</Badge>}
            </div>
            <h1 className="text-lg sm:text-xl font-semibold tracking-tight truncate">{doc.title}</h1>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={handleDelete} title="Delete" className="shrink-0">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="notes" className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b border-border px-2 sm:px-6 overflow-x-auto">
          <TabsList className="bg-transparent h-11 p-0 gap-1">
            <TabsTrigger value="notes" className="data-[state=active]:bg-muted"><FileText className="h-3.5 w-3.5 mr-1.5" /> Notes</TabsTrigger>
            <TabsTrigger value="flashcards" className="data-[state=active]:bg-muted"><Layers className="h-3.5 w-3.5 mr-1.5" /> Flashcards</TabsTrigger>
            <TabsTrigger value="quiz" className="data-[state=active]:bg-muted"><ListChecks className="h-3.5 w-3.5 mr-1.5" /> Quiz</TabsTrigger>
            <TabsTrigger value="podcast" className="data-[state=active]:bg-muted"><Headphones className="h-3.5 w-3.5 mr-1.5" /> Podcast</TabsTrigger>
            <TabsTrigger value="chat" className="data-[state=active]:bg-muted"><MessagesSquare className="h-3.5 w-3.5 mr-1.5" /> Chat</TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-y-auto">
          <TabsContent value="notes" className="m-0 p-4 sm:p-6 max-w-3xl mx-auto animate-fade-in">
            {note?.markdown ? (
              <div className="space-y-4">
                <MarkdownView>{note.markdown}</MarkdownView>
                {streaming && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating…
                  </div>
                )}
              </div>
            ) : doc.status === "ready" ? (
              <div className="border border-dashed border-border rounded-xl p-10 text-center space-y-3">
                <h3 className="font-medium">Ready to generate</h3>
                <p className="text-sm text-muted-foreground">
                  Click below to stream AI-generated study notes.
                </p>
                <Button onClick={generate} disabled={streaming}>
                  {streaming ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  Generate notes
                </Button>
              </div>
            ) : isProcessing ? (
              <Placeholder title="Extracting content…" desc="We're parsing your source. Notes will appear here automatically." />
            ) : doc.status === "failed" ? (
              <Placeholder title="Ingestion failed" desc={doc.error_code ?? "Something went wrong while parsing the source."} />
            ) : (
              <Placeholder title="No notes yet" desc="Waiting for the source to be processed." />
            )}
          </TabsContent>

          <TabsContent value="flashcards" className="m-0 p-4 sm:p-6 max-w-3xl mx-auto animate-fade-in">
            {cards.length === 0 ? (
              <DerivativesEmpty
                kind="flashcards"
                noteReady={!!note?.markdown}
                loading={derivLoading}
                onGenerate={runDerivatives}
              />
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-medium text-muted-foreground">{cards.length} flashcards</h2>
                  <Button variant="ghost" size="sm" onClick={runDerivatives} disabled={derivLoading}>
                    {derivLoading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5 mr-1.5" />}
                    Regenerate
                  </Button>
                </div>
                <FlashcardsDeck cards={cards} />
              </div>
            )}
          </TabsContent>

          <TabsContent value="quiz" className="m-0 p-4 sm:p-6 max-w-3xl mx-auto animate-fade-in">
            {!qz || qz.questions.length === 0 ? (
              <DerivativesEmpty
                kind="quiz"
                noteReady={!!note?.markdown}
                loading={derivLoading}
                onGenerate={runDerivatives}
              />
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-medium text-muted-foreground">{qz.title} — {qz.questions.length} questions</h2>
                  <Button variant="ghost" size="sm" onClick={runDerivatives} disabled={derivLoading}>
                    {derivLoading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5 mr-1.5" />}
                    Regenerate
                  </Button>
                </div>
                <QuizPlayer quiz={qz} />
              </div>
            )}
          </TabsContent>

          <TabsContent value="podcast" className="m-0 p-4 sm:p-6 max-w-3xl mx-auto animate-fade-in">
            {!note?.markdown ? (
              <Placeholder title="No podcast yet" desc="Generate notes first, then create a two-host audio recap here." />
            ) : pod?.audio_url ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-medium">Audio summary ready</h2>
                    <p className="text-sm text-muted-foreground">Listen now or regenerate it from your latest notes.</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={runPodcast} disabled={podcastLoading}>
                    {podcastLoading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5 mr-1.5" />}
                    Regenerate
                  </Button>
                </div>
                <audio controls src={pod.audio_url} className="w-full" />
                {pod.script ? (
                  <div className="border border-border rounded-xl p-4 space-y-2">
                    <h3 className="text-sm font-medium">Script</h3>
                    <pre className="whitespace-pre-wrap font-sans text-sm text-muted-foreground">{pod.script}</pre>
                  </div>
                ) : null}
              </div>
            ) : pod?.status === "generating" || podcastLoading ? (
              <div className="border border-dashed border-border rounded-xl p-10 text-center space-y-3">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Generating podcast audio…
                </div>
                <p className="text-sm text-muted-foreground">This can take a minute depending on the script length.</p>
              </div>
            ) : pod?.status === "failed" ? (
              <div className="border border-dashed border-border rounded-xl p-10 text-center space-y-3">
                <h3 className="font-medium">Podcast generation failed</h3>
                <p className="text-sm text-muted-foreground">Try again to rebuild the two-host audio version.</p>
                <Button onClick={runPodcast} disabled={podcastLoading}>
                  {podcastLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Headphones className="h-4 w-4 mr-2" />}
                  Retry podcast
                </Button>
              </div>
            ) : (
              <div className="border border-dashed border-border rounded-xl p-10 text-center space-y-3">
                <h3 className="font-medium">Generate podcast</h3>
                <p className="text-sm text-muted-foreground">Create a two-host audio recap from your generated notes.</p>
                <Button onClick={runPodcast} disabled={podcastLoading}>
                  {podcastLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Headphones className="h-4 w-4 mr-2" />}
                  Generate podcast
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="chat" className="m-0 p-4 sm:p-6 max-w-3xl mx-auto animate-fade-in">
            <ChatPanel documentId={doc.id} noteReady={!!note?.markdown} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

function Placeholder({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="border border-dashed border-border rounded-xl p-10 text-center">
      <h3 className="font-medium mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

function DerivativesEmpty({
  kind, noteReady, loading, onGenerate,
}: { kind: "flashcards" | "quiz"; noteReady: boolean; loading: boolean; onGenerate: () => void }) {
  if (!noteReady) {
    return <Placeholder title={`No ${kind} yet`} desc="Generate notes first, then come back here." />;
  }
  return (
    <div className="border border-dashed border-border rounded-xl p-10 text-center space-y-3">
      <h3 className="font-medium">Generate {kind}</h3>
      <p className="text-sm text-muted-foreground">
        We'll use your notes to create {kind === "flashcards" ? "study flashcards" : "a multi-format quiz"}.
      </p>
      <Button onClick={onGenerate} disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
        Generate
      </Button>
    </div>
  );
}
