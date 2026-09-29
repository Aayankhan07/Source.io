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
      if (documentId.startsWith("demo-")) {
        return {
          messages: [
            {
              id: "msg-welcome",
              role: "assistant" as const,
              content: "I am ready to answer any questions about this study material. Every answer cites the exact passage from the source.",
              citations: [
                { chunk_id: "demo-c1", similarity: 0.96, content: "Passage §1.1 — Fundamental Quantum Mechanics & State Vectors" }
              ],
            },
          ],
          chunkCount: 8,
        };
      }

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
    if (documentId.startsWith("demo-")) return;
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

    if (documentId.startsWith("demo-")) {
      setTimeout(() => {
        let answer = "In quantum computation, qubits exploit superposition to exist in combinations of |0⟩ and |1⟩, while entanglement locks non-local correlations across distances.";
        let sim = 0.94;
        let cite = "Passage §1.1 — Quantum Superposition and Linear State Amplitudes";
        if (text.toLowerCase().includes("decoherence") || text.toLowerCase().includes("noise")) {
          answer = "Environmental decoherence occurs when thermal noise and electromagnetic radiation interact with physical qubits, collapsing their coherent phase within microseconds.";
          sim = 0.98;
          cite = "Passage §1.3 — Decoherence Engineering Barriers";
        } else if (text.toLowerCase().includes("algorithm") || text.toLowerCase().includes("shor") || text.toLowerCase().includes("grover")) {
          answer = "Shor's algorithm achieves polynomial time factoring of large integers, while Grover's algorithm provides quadratic acceleration for unstructured search.";
          sim = 0.92;
          cite = "Passage §2.4 — Computational Complexity Advantages";
        }
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content: answer,
                  pending: false,
                  citations: [{ chunk_id: "demo-c1", similarity: sim, content: cite }],
                }
              : m,
          ),
        );
        setSending(false);
      }, 700);
      return;
    }

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
      <div className="border border-border bg-card rounded-2xl p-10 text-center max-w-md mx-auto mt-12 space-y-4 shadow-sm animate-fade-in">
        <div className="h-10 w-10 rounded-xl bg-sky-50 dark:bg-sky-500/10 border border-sky-100 dark:border-sky-500/30 flex items-center justify-center text-sky-700 dark:text-sky-400 mx-auto">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <h3 className="font-semibold text-foreground font-display text-sm">Prepare this document for chat</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            We'll index your notes so answers can cite the exact passages they came from.
          </p>
        </div>
        <Button onClick={runIndex} disabled={indexing} className="bg-slate-900 hover:bg-slate-800 dark:bg-sky-500 dark:hover:bg-sky-400 text-white font-semibold px-5 py-2 text-xs rounded-full shadow-sm">
          {indexing ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin text-white" /> : <Sparkles className="h-3.5 w-3.5 mr-1.5 text-white" />}
          Prepare for chat
        </Button>
      </div>
    );
  }

  // Height comes from the flex parent, not a hardcoded viewport calculation.
  return (
    <div className="flex flex-col h-full min-h-[24rem] text-left">
      {/* Scrollable Chat messages box */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-2 pb-4">
        {messages.length === 0 && (
          <div className="text-center py-16 space-y-3 max-w-sm mx-auto animate-fade-in">
            <div className="h-10 w-10 rounded-xl bg-sky-50 dark:bg-sky-500/10 border border-sky-100 dark:border-sky-500/30 flex items-center justify-center text-sky-700 dark:text-sky-400 mx-auto">
              <Sparkles className="h-5 w-5" />
            </div>
            <h4 className="font-semibold text-foreground font-display text-sm">Ask your Research Assistant</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Query the uploaded document and receive responses grounded in verified passage excerpts.
            </p>
          </div>
        )}
        
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
      </div>

      {/* Inputs panel */}
      <div className="border-t border-border/80 pt-4 shrink-0">
        {/* Quick Suggestion Action Chips */}
        {messages.length === 0 && (
          <div className="flex gap-2 flex-wrap mb-3 animate-fade-in">
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
                className="text-xs px-3 py-1.5 rounded-full bg-card border border-border hover:bg-muted text-foreground transition-all font-medium flex items-center gap-1 shadow-2xs"
              >
                <Sparkles className="h-3 w-3 text-sky-600 dark:text-sky-400" /> {suggest}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <div className="p-2.5 rounded-2xl border border-border/80 glass-dock shadow-md flex items-end gap-2 transition-colors focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500/20">
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
            className="flex-1 bg-transparent border-none focus-visible:ring-0 text-foreground placeholder:text-muted-foreground text-xs sm:text-sm resize-none p-1 shadow-none focus-visible:outline-none min-h-[40px] max-h-[120px] focus:ring-0 focus:outline-none"
            disabled={sending}
          />
          <Button
            onClick={() => send()}
            disabled={sending || !input.trim()}
            size="icon"
            aria-label={sending ? "Sending message" : "Send message"}
            className="h-9 w-9 bg-slate-900 hover:bg-slate-800 dark:bg-sky-500 dark:hover:bg-sky-400 text-white rounded-full shrink-0 shadow-2xs"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <Send className="h-3.5 w-3.5" />}
          </Button>
        </div>

        {/* Grounded Indicator bar */}
        <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono mt-2 px-1">
          <span className="flex items-center gap-1"><BookOpen className="h-3 w-3 text-sky-600 dark:text-sky-400" /> Answers cite {chunkCount} passages</span>
          <span>Press Enter to send</span>
        </div>
      </div>
    </div>
  );
}

// Memoized: while a response streams, only the last bubble changes.
const MessageBubble = memo(function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex gap-2.5", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="h-7 w-7 rounded-full bg-slate-900 dark:bg-card border border-transparent dark:border-border text-white flex items-center justify-center shrink-0 shadow-2xs mt-1">
          <Cpu className="h-3.5 w-3.5 text-sky-300 dark:text-sky-400" />
        </div>
      )}

      <div
        className={cn(
          "max-w-[90%] sm:max-w-[85%] rounded-2xl px-4 py-3 relative border",
          isUser
            ? "bg-slate-900 dark:bg-sky-600 border-transparent text-white font-medium shadow-sm"
            : "glass-card border-border text-foreground shadow-xs"
        )}
      >
        {message.pending && !message.content ? (
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <Loader2 className="h-3 w-3 animate-spin text-sky-600" /> Synthesizing grounded response…
          </div>
        ) : isUser ? (
          <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
        ) : (
          <div className="text-xs sm:text-sm leading-relaxed">
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
        <div className="h-7 w-7 rounded-full bg-slate-900 dark:bg-card border border-transparent dark:border-border flex items-center justify-center text-white shrink-0 mt-1 shadow-2xs">
          <User className="h-3.5 w-3.5" />
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
