import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, Sparkles, BookOpen, AlertCircle } from "lucide-react";
import MarkdownView from "@/components/common/MarkdownView";
import { embedChunks, streamChat, type Citation } from "@/lib/services/pipeline";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";

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

  const send = async () => {
    const text = input.trim();
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

  if (!noteReady) {
    return (
      <div className="border border-dashed border-border rounded-xl p-10 text-center">
        <h3 className="font-medium mb-1">Chat unavailable</h3>
        <p className="text-sm text-muted-foreground">
          Generate notes first — chat needs the document to be processed.
        </p>
      </div>
    );
  }

  if (chunkCount === null) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (chunkCount === 0) {
    return (
      <div className="border border-dashed border-border rounded-xl p-10 text-center space-y-3">
        <h3 className="font-medium">Index this document for chat</h3>
        <p className="text-sm text-muted-foreground">
          We'll split it into searchable passages so the assistant can cite the source.
        </p>
        <Button onClick={runIndex} disabled={indexing}>
          {indexing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
          Index for chat
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-220px)] min-h-[420px]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-2">
        {messages.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-12">
            Ask anything about this document — answers will cite the source passages.
          </div>
        )}
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
      </div>

      <div className="border-t border-border pt-3 mt-3">
        <div className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            placeholder="Ask a question about this document…"
            rows={2}
            className="resize-none"
            disabled={sending}
          />
          <Button onClick={send} disabled={sending || !input.trim()} size="icon" className="h-10 w-10 shrink-0">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1">
          <BookOpen className="h-3 w-3" /> Grounded in {chunkCount} indexed passages.
        </p>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground border border-border"
        }`}
      >
        {message.pending && !message.content ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> Thinking…
          </div>
        ) : isUser ? (
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="text-sm">
            <RenderWithCitations text={message.content} citations={message.citations ?? []} />
          </div>
        )}
        {!isUser && message.citations && message.citations.length > 0 && (
          <div className="mt-2 pt-2 border-t border-border/50 flex flex-wrap gap-1.5">
            {message.citations.map((c) => (
              <CitationChip key={c.n} citation={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RenderWithCitations({ text, citations }: { text: string; citations: Citation[] }) {
  // Wrap [n] tokens in clickable popovers when n maps to a citation.
  const map = new Map(citations.map((c) => [c.n, c]));
  const parts = text.split(/(\[\d+\])/g);
  return (
    <div className="prose prose-sm prose-invert max-w-none">
      <MarkdownView>
        {parts
          .map((p) => {
            const m = p.match(/^\[(\d+)\]$/);
            if (m && map.has(Number(m[1]))) {
              // Mark inline citations with a sup-style marker; popovers render below in chip strip.
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
          className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-background border border-border hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <AlertCircle className="h-2.5 w-2.5" />
          [{citation.n}] · {(citation.similarity * 100).toFixed(0)}%
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 text-xs max-h-64 overflow-y-auto">
        <div className="font-medium mb-1.5 text-muted-foreground">
          Passage #{citation.order_index + 1}
        </div>
        <p className="whitespace-pre-wrap leading-relaxed">{citation.text}</p>
      </PopoverContent>
    </Popover>
  );
}
