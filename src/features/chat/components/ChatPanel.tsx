import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, Sparkles, BookOpen, AlertCircle, Cpu, User } from "lucide-react";
import MarkdownView from "@/components/common/MarkdownView";
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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [chunkCount, setChunkCount] = useState<number | null>(null);
  const [indexing, setIndexing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoIndexedRef = useRef<string | null>(null);

  // Load history + chunk count on mount.
  useEffect(() => {
    let mounted = true;
    (async () => {
      const [{ data: msgs }, { count }] = await Promise.all([
        supabase
          .from("chat_messages")
          .select("id,role,content,created_at")
          .eq("document_id", documentId)
          .order("created_at"),
        supabase
          .from("document_chunks")
          .select("id", { count: "exact", head: true })
          .eq("document_id", documentId),
      ]);
      if (!mounted) return;
      setMessages(
        (msgs ?? []).map((m) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      );
      setChunkCount(count ?? 0);
    })();
    return () => { mounted = false; };
  }, [documentId]);

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
        onDelta: (chunk) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: m.content + chunk, pending: false } : m,
            ),
          );
        },
      });
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
      <div className="border border-dashed border-white/10 bg-card/40 glass-panel rounded-2xl p-10 text-center max-w-md mx-auto mt-12 space-y-4 animate-fade-in">
        <div className="h-10 w-10 rounded-lg bg-neutral-900 border border-white/5 flex items-center justify-center text-neutral-500 mx-auto">
          <AlertCircle className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-white font-display text-sm">Grounded chat unavailable</h3>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Please generate notes for the document first before opening the chatbot helper.
          </p>
        </div>
      </div>
    );
  }

  if (chunkCount === null) {
    return (
      <div className="flex items-center justify-center py-20 bg-[#09090b]">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (chunkCount === 0) {
    return (
      <div className="border border-dashed border-white/10 bg-card/40 glass-panel rounded-2xl p-10 text-center max-w-md mx-auto mt-12 space-y-4 animate-fade-in">
        <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-white font-display text-sm">Index document for RAG chat</h3>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Split the notes into searchable vector chunks so the AI agent can answer queries with citations.
          </p>
        </div>
        <Button onClick={runIndex} disabled={indexing} className="bg-primary hover:bg-primary-glow text-primary-foreground font-semibold px-4 py-2 text-xs">
          {indexing ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1.5" />}
          Index passages
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-210px)] min-h-[400px] bg-[#09090b] text-left">
      {/* Scrollable Chat messages box */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-5 pr-2 scrollbar-thin pb-4">
        {messages.length === 0 && (
          <div className="text-center py-20 space-y-3 max-w-sm mx-auto animate-fade-in">
            <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto">
              <Sparkles className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-white font-display text-sm">Ask your Study Buddy</h4>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Query the uploaded document and receive responses grounded in verified passage excerpts.
            </p>
          </div>
        )}
        
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
      </div>

      {/* Inputs panel */}
      <div className="border-t border-white/5 pt-4 bg-[#09090b] shrink-0">
        {/* Quick Suggestion Action Chips */}
        {messages.length === 0 && (
          <div className="flex gap-2 flex-wrap mb-4 animate-fade-in">
            {[
              "Summarize the key takeaways.",
              "List 3 potential practice questions.",
              "Explain the core terms used."
            ].map((suggest, sIdx) => (
              <button
                key={sIdx}
                onClick={() => handleQuickAction(suggest)}
                disabled={sending}
                className="text-[10px] px-3 py-1.5 rounded-full bg-white/5 border border-white/5 hover:border-primary/30 text-neutral-400 hover:text-white transition-all font-mono"
              >
                {suggest}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <div className="glass-panel p-2.5 rounded-xl border border-white/10 bg-[#0d0d11]/80 shadow-2xl flex items-end gap-2 focus-within:border-primary/50 transition-colors">
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
            rows={2}
            className="flex-1 bg-transparent border-none focus-visible:ring-0 text-white placeholder-neutral-600 text-xs resize-none p-1 shadow-none focus-visible:outline-none min-h-[40px] max-h-[120px] focus:ring-0 focus:outline-none"
            disabled={sending}
          />
          <Button 
            onClick={() => send()} 
            disabled={sending || !input.trim()} 
            size="icon" 
            className="h-9 w-9 bg-primary hover:bg-primary-glow text-primary-foreground rounded-lg shadow-glow shrink-0"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>

        {/* Grounded Indicator bar */}
        <div className="flex items-center justify-between text-[9px] text-neutral-500 font-mono mt-2 px-1">
          <span className="flex items-center gap-1"><BookOpen className="h-3 w-3 text-primary" /> Grounded in {chunkCount} vector passages</span>
          <span>Press Enter to send</span>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
      {/* Icon Avatar */}
      {!isUser && (
        <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-inner">
          <Cpu className="h-4 w-4" />
        </div>
      )}

      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3 relative border",
          isUser
            ? "bg-primary border-primary/10 text-primary-foreground font-medium rounded-tr-none shadow-md"
            : "bg-[#101014] border-white/5 text-neutral-200 rounded-tl-none shadow-sm glass-panel"
        )}
      >
        {message.pending && !message.content ? (
          <div className="flex items-center gap-2 text-xs text-neutral-500 font-mono">
            <Loader2 className="h-3 w-3 animate-spin text-primary" /> Synthesizing grounded response…
          </div>
        ) : isUser ? (
          <p className="text-xs whitespace-pre-wrap leading-relaxed">{message.content}</p>
        ) : (
          <div className="text-xs leading-relaxed">
            <RenderWithCitations text={message.content} citations={message.citations ?? []} />
          </div>
        )}
        
        {!isUser && message.citations && message.citations.length > 0 && (
          <div className="mt-3 pt-2.5 border-t border-white/5 flex flex-wrap gap-1.5">
            {message.citations.map((c) => (
              <CitationChip key={c.n} citation={c} />
            ))}
          </div>
        )}
      </div>

      {isUser && (
        <div className="h-8 w-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-neutral-300 shrink-0">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}

function RenderWithCitations({ text, citations }: { text: string; citations: Citation[] }) {
  const map = new Map(citations.map((c) => [c.n, c]));
  const parts = text.split(/(\[\d+\])/g);
  return (
    <div className="prose prose-sm prose-invert max-w-none">
      <MarkdownView>
        {parts
          .map((p) => {
            const m = p.match(/^\[(\d+)\]$/);
            if (m && map.has(Number(m[1]))) {
              return ` **[${m[1]}]**`;
            }
            return p;
          })
          .join("")}
      </MarkdownView>
    </div>
  );
}

function CitationChip({ citation }: { citation: Citation }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-900 border border-white/5 hover:border-primary/40 hover:text-white transition-colors"
        >
          <AlertCircle className="h-2.5 w-2.5 text-primary" />
          [{citation.n}] · {(citation.similarity * 100).toFixed(0)}% Match
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 text-xs bg-[#0b0b0f] border-white/10 text-white rounded-xl shadow-2xl p-4 max-h-60 overflow-y-auto">
        <div className="font-bold mb-1.5 text-neutral-400 font-mono text-[10px] uppercase tracking-wider">
          Passage fragment #{citation.order_index + 1}
        </div>
        <p className="whitespace-pre-wrap leading-relaxed text-neutral-300 font-sans text-xs">{citation.text}</p>
      </PopoverContent>
    </Popover>
  );
}
