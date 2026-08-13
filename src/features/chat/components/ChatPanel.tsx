import { memo, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryKeys } from "@/lib/queryKeys";
import { errorMessage } from "@/lib/utils";
import { Loader2, Send, Sparkles, BookOpen, AlertCircle, Cpu, User, RefreshCw } from "lucide-react";
import MarkdownView from "@/components/common/MarkdownView";
import Magnitude from "@/components/common/Magnitude";
import { embedChunks, streamChat, type Citation } from "@/lib/services/pipeline";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  pending?: boolean;
};

export default function ChatPanel({
  documentId,
  noteReady,
}: { documentId: string; noteReady: boolean }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [indexing, setIndexing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoIndexedRef = useRef<string | null>(null);
  // Buffer for streamed tokens between animation frames.
  const pendingDeltaRef = useRef("");
  const flushHandleRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (flushHandleRef.current !== null) cancelAnimationFrame(flushHandleRef.current);
  }, []);

  // History and chunk count are server state; a failed read must be reported, not
  // rendered as "no history" or "never indexed".
  const historyQuery = useQuery({
    queryKey: queryKeys.chat(documentId),
    queryFn: async () => {
      const [msgs, chunks] = await Promise.all([
        supabase
          .from("chat_messages")
          .select("id,role,content,created_at")
          .eq("document_id", documentId)
          .order("created_at", { ascending: false })
          .limit(200),
        supabase
          .from("document_chunks")
          .select("id", { count: "exact", head: true })
          .eq("document_id", documentId),
      ]);
      if (msgs.error) throw msgs.error;
      if (chunks.error) throw chunks.error;
      return {
        // Fetched newest-first for the limit; flip back to reading order.
        messages: (msgs.data ?? []).slice().reverse().map((m) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
        })) satisfies ChatMessage[],
        chunkCount: chunks.count ?? 0,
      };
    },
  });

  // Seed the local transcript once the server history arrives. Live streaming
  // appends to this local copy rather than round-tripping every token.
  useEffect(() => {
    if (historyQuery.data) setMessages(historyQuery.data.messages);
  }, [historyQuery.data]);

  const chunkCount = historyQuery.data?.chunkCount ?? null;
  const setChunkCount = (n: number) => {
    queryClient.setQueryData<{ messages: ChatMessage[]; chunkCount: number }>(
      queryKeys.chat(documentId),
      (prev) => (prev ? { ...prev, chunkCount: n } : prev),
    );
  };

  // Auto-index once notes are ready.
  useEffect(() => {
    if (!noteReady) return;
    if (chunkCount === null) return;
    if (chunkCount > 0) return;
    if (autoIndexedRef.current === documentId) return;
    if (indexing) return;
    autoIndexedRef.current = documentId;
    void runIndex();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteReady, chunkCount, documentId]);

  // Autoscroll on new content.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const runIndex = async () => {
    setIndexing(true);
    try {
      const r = await embedChunks(documentId);
      setChunkCount(r.chunks ?? 0);
      if (!r.cached) toast({ title: "Document indexed", description: `${r.chunks} passages ready for chat.` });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast({ title: "Indexing failed", description: msg, variant: "destructive" });
    } finally {
      setIndexing(false);
    }
  };

  const send = async (textToSend?: string) => {
    const text = (textToSend ?? input).trim();
    if (!text || sending) return;
    setInput("");
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: text };
    const assistantId = crypto.randomUUID();
    const assistantMsg: ChatMessage = { id: assistantId, role: "assistant", content: "", pending: true };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setSending(true);

    try {
      await streamChat({
        documentId,
        message: text,
        onCitations: (cites) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, citations: cites } : m)),
          );
        },
        // Tokens arrive far faster than the UI needs to repaint, and each state
        // change re-renders every bubble through the full markdown pipeline.
        // Accumulate and flush on a frame instead of once per character.
        onDelta: (chunk) => {
          pendingDeltaRef.current += chunk;
          if (flushHandleRef.current !== null) return;
          flushHandleRef.current = requestAnimationFrame(() => {
            flushHandleRef.current = null;
            const buffered = pendingDeltaRef.current;
            if (!buffered) return;
            pendingDeltaRef.current = "";
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: m.content + buffered, pending: false } : m,
              ),
            );
          });
        },
      });

      // Flush whatever the last frame didn't cover.
      if (flushHandleRef.current !== null) {
        cancelAnimationFrame(flushHandleRef.current);
        flushHandleRef.current = null;
      }
      if (pendingDeltaRef.current) {
        const tail = pendingDeltaRef.current;
        pendingDeltaRef.current = "";
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + tail, pending: false } : m)),
        );
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: `_Error: ${msg}_`, pending: false }
            : m,
        ),
      );
      toast({ title: "Chat failed", description: msg, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  // Quick action buttons click handler
  const handleQuickAction = (actionText: string) => {
    if (sending) return;
    void send(actionText);
  };

  if (!noteReady) {
    return (
      <div className="border border-dashed border-border bg-card/40 plate rounded-sm p-10 text-center max-w-md mx-auto mt-12 space-y-4 animate-fade-in">
        <div className="h-10 w-10 rounded-sm bg-surface-sunken border border-border/60 flex items-center justify-center text-muted-foreground mx-auto">
          <AlertCircle className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-foreground font-display text-sm">Grounded chat unavailable</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Please generate notes for the document first before opening the chatbot helper.
          </p>
        </div>
      </div>
    );
  }

  if (historyQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-20 bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  // Without this branch a failed read renders the "index this document" CTA, as
  // if the conversation had never happened.
  if (historyQuery.isError) {
    return (
      <div className="border border-dashed border-destructive/20 bg-destructive/5 plate rounded-sm p-10 text-center max-w-md mx-auto mt-12 space-y-4">
        <div className="h-10 w-10 rounded-sm bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive mx-auto">
          <AlertCircle className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-foreground font-display text-sm">Couldn't load this conversation</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your chat history is still saved.
            <span className="block text-muted-foreground mt-1">{errorMessage(historyQuery.error)}</span>
          </p>
        </div>
        <Button onClick={() => historyQuery.refetch()} className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold text-xs">
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Retry
        </Button>
      </div>
    );
  }

  if (chunkCount === 0) {
    return (
      <div className="border border-dashed border-border bg-card/40 plate rounded-sm p-10 text-center max-w-md mx-auto mt-12 space-y-4 animate-fade-in">
        <div className="h-10 w-10 rounded-sm bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-foreground font-display text-sm">Prepare this document for chat</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We'll index your notes so answers can cite the exact passages they came from.
          </p>
        </div>
        <Button onClick={runIndex} disabled={indexing} className="bg-primary hover:bg-primary-glow text-primary-foreground font-semibold px-4 py-2 text-xs">
          {indexing ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1.5" />}
          Prepare for chat
        </Button>
      </div>
    );
  }

  // Height comes from the flex parent, not a hardcoded viewport calculation — the
  // old `100vh-210px` guessed at the chrome and was wrong once the header wrapped
  // on mobile, producing a second nested scrollbar.
  return (
    <div className="flex flex-col h-full min-h-[24rem] bg-background text-left">
      {/* Scrollable Chat messages box */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-5 pr-2 pb-4">
        {messages.length === 0 && (
          <div className="text-center py-20 space-y-3 max-w-sm mx-auto animate-fade-in">
            <div className="h-10 w-10 rounded-sm bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto">
              <Sparkles className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-foreground font-display text-sm">Ask your Study Buddy</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Query the uploaded document and receive responses grounded in verified passage excerpts.
            </p>
          </div>
        )}
        
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
      </div>

      {/* Inputs panel */}
      <div className="border-t border-border/60 pt-4 bg-background shrink-0">
        {/* Quick Suggestion Action Chips */}
        {messages.length === 0 && (
          <div className="flex gap-2 flex-wrap mb-4 animate-fade-in">
            {[
              "Summarize key takeaways",
              "List 3 practice questions",
              "Explain core terms & formulas",
              "What are the main arguments?"
            ].map((suggest, sIdx) => (
              <button
                key={sIdx}
                onClick={() => handleQuickAction(suggest)}
                disabled={sending}
                className="text-xs px-3 py-1.5 rounded-full bg-surface-raised border border-border/60 hover:border-primary/40 hover:bg-primary/5 text-muted-foreground hover:text-foreground transition-all font-mono focus-ring flex items-center gap-1"
              >
                <Sparkles className="h-3 w-3 text-primary" /> {suggest}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        {/* The textarea intentionally has no ring of its own; the wrapper carries a
            focus-within ring so the whole composer reads as one focused control. */}
        <div className="plate p-2.5 rounded-sm border border-border bg-card/80 shadow-plate flex items-end gap-2 transition-colors focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            placeholder="Ask a question grounded in this document..."
            aria-label="Ask a question about this document"
            rows={2}
            className="flex-1 bg-transparent border-none focus-visible:ring-0 text-foreground placeholder:text-muted-foreground/70 text-xs resize-none p-1 shadow-none focus-visible:outline-none min-h-[40px] max-h-[120px] focus:ring-0 focus:outline-none"
            disabled={sending}
          />
          <Button
            onClick={() => send()}
            disabled={sending || !input.trim()}
            size="icon"
            aria-label={sending ? "Sending message" : "Send message"}
            className="h-9 w-9 bg-primary hover:bg-primary-glow text-primary-foreground rounded-sm shrink-0"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>

        {/* Grounded Indicator bar */}
        <div className="flex items-center justify-between text-xs text-muted-foreground font-mono mt-2 px-1">
          <span className="flex items-center gap-1"><BookOpen className="h-3 w-3 text-primary" /> Answers cite {chunkCount} passages</span>
          <span>Press Enter to send</span>
        </div>
      </div>
    </div>
  );
}

// Memoized: while a response streams, only the last bubble changes — without this
// every message in the history re-runs the markdown/KaTeX pipeline each frame.
const MessageBubble = memo(function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
      {/* Icon Avatar */}
      {!isUser && (
        <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-sm bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-inner">
          <Cpu className="h-4 w-4" />
        </div>
      )}

      <div
        className={cn(
          "max-w-[92%] sm:max-w-[85%] rounded-sm px-3.5 sm:px-4 py-3 relative border",
          isUser
            ? "bg-primary border-primary/10 text-primary-foreground font-medium rounded-tr-none shadow-md"
            : "bg-card border-border/60 text-foreground rounded-tl-none shadow-sm plate"
        )}
      >
        {message.pending && !message.content ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <Loader2 className="h-3 w-3 animate-spin text-primary" /> Synthesizing grounded response…
          </div>
        ) : isUser ? (
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
        ) : (
          <div className="text-sm leading-relaxed">
            <RenderWithCitations text={message.content} citations={message.citations ?? []} />
          </div>
        )}
        
        {!isUser && message.citations && message.citations.length > 0 && (
          <div className="mt-3 pt-2.5 border-t border-border/60 flex flex-wrap gap-1.5">
            {message.citations.map((c) => (
              <CitationChip key={c.n} citation={c} />
            ))}
          </div>
        )}
      </div>

      {isUser && (
        <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-sm bg-surface-raised border border-border flex items-center justify-center text-foreground/90 shrink-0">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  );
});

function RenderWithCitations({ text, citations }: { text: string; citations: Citation[] }) {
  // Rebuilding the map and re-splitting on every render was pure waste — this runs
  // inside the streaming path, where the component re-renders constantly.
  const rendered = useMemo(() => {
    const known = new Set(citations.map((c) => c.n));
    return text
      .split(/(\[\d+\])/g)
      .map((p) => {
        const m = p.match(/^\[(\d+)\]$/);
        return m && known.has(Number(m[1])) ? ` **[${m[1]}]**` : p;
      })
      .join("");
  }, [text, citations]);

  return (
    <div className="max-w-none">
      <MarkdownView>{rendered}</MarkdownView>
    </div>
  );
}

function CitationChip({ citation }: { citation: Citation }) {
  const pct = (citation.similarity * 100).toFixed(0);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          // Strength reads as diameter first and a figure second, so a glance
          // across the citations shows which passages carry the answer.
          className="inline-flex items-center gap-1.5 text-xs font-mono px-2 py-0.5 rounded-sm bg-surface-sunken border border-border text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors focus-ring"
          aria-label={`Source ${citation.n}, ${pct} percent match`}
        >
          <Magnitude value={citation.similarity} className="text-primary" />
          [{citation.n}]
          <span className="text-muted-foreground/70">{pct}%</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 text-xs bg-popover border-border text-foreground rounded-sm shadow-plate p-4 max-h-60 overflow-y-auto">
        <div className="font-bold mb-1.5 text-muted-foreground font-mono text-xs uppercase tracking-wider">
          Passage fragment #{citation.order_index + 1}
        </div>
        <p className="whitespace-pre-wrap leading-relaxed text-foreground/90 font-sans text-xs">{citation.text}</p>
      </PopoverContent>
    </Popover>
  );
}
