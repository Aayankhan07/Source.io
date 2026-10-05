"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Loader2, ArrowUpRight, Copy, Check, PanelRightClose } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { streamChat } from "@/lib/services/pipeline";
import { useToast } from "@/hooks/use-toast";
import MarkdownView from "@/components/common/MarkdownView";

interface AskPanelProps {
  documentId: string;
  noteMarkdown?: string | null;
  headings?: { id: string; text: string; level: number }[];
  onScrollToHeading?: (id: string) => void;
  onClose?: () => void;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: { chunk_id: string; similarity: number; content: string }[];
  pending?: boolean;
}

const SUGGESTED_QUESTIONS = [
  "Explain this simply",
  "Why does this matter?",
  "Quiz me on this section",
  "Key formulas",
  "Real-world example",
];

export function AskPanel({ documentId, noteMarkdown, headings = [], onScrollToHeading, onClose }: AskPanelProps) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [suggestedExpanded, setSuggestedExpanded] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pendingDeltaRef = useRef("");
  const flushHandleRef = useRef<number | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
          m.id === assistantId ? { ...m, content: `_Error: ${msg}_`, pending: false } : m,
        ),
      );
      toast({ title: "Ask failed", description: msg, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "Message copied to clipboard" });
  };

  return (
    <div className="flex flex-col h-full w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-l border-black/[0.04] dark:border-white/10 shrink-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-black/[0.04] dark:border-white/10 shrink-0 bg-slate-50/50 dark:bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-lg bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0">
            <Sparkles className="size-3.5" />
          </div>
          <span className="text-xs font-bold text-slate-900 dark:text-white tracking-tight font-display">
            Ask Copilot
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            className="size-7 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 flex items-center justify-center transition-colors cursor-pointer"
            onClick={() => setSuggestedExpanded(!suggestedExpanded)}
            title={suggestedExpanded ? "Collapse suggestions" : "Expand suggestions"}
            aria-label={suggestedExpanded ? "Collapse suggestions" : "Expand suggestions"}
          >
            <Sparkles className={cn("size-3.5 transition-transform", suggestedExpanded && "rotate-180")} />
          </button>
          {onClose && (
            <button
              className="size-7 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 flex items-center justify-center transition-colors cursor-pointer"
              onClick={onClose}
              title="Collapse Ask panel"
              aria-label="Collapse Ask panel"
            >
              <PanelRightClose className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Suggested Questions */}
      <div className={cn("px-3.5 py-2.5 border-b border-black/[0.04] dark:border-white/10 transition-all duration-200 overflow-hidden", !suggestedExpanded && "max-h-0 p-0 opacity-0")}>
        <div className="flex flex-wrap gap-1.5" role="list" aria-label="Suggested questions">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => void send(q)}
              className="h-7 px-3 text-[11px] font-medium rounded-full bg-slate-100/80 dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Chat History */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-3 space-y-4" style={{ minHeight: "100%" }}>
          {messages.length === 0 && suggestedExpanded && (
            <div className="text-center py-8 text-sm text-muted-foreground space-y-2">
              <p>Start by asking a question above,</p>
              <p className="font-mono text-xs">or type your own below.</p>
            </div>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn("flex gap-2.5 max-w-full", msg.role === "user" && "flex-row-reverse")}
            >
              <div
                className={cn(
                  "flex-1 max-w-[calc(100%-28px)] space-y-1.5",
                  msg.role === "user" ? "text-right" : "text-left"
                )}
              >
                <div
                  className={cn(
                    "inline-block max-w-full px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-md"
                      : "bg-surface-2 text-foreground rounded-tl-md"
                  )}
                >
                  <MarkdownView>{msg.content}</MarkdownView>
                  {msg.pending && <Loader2 className="inline h-3 w-3 animate-spin text-muted-foreground ml-1" />}
                </div>

                {msg.citations && msg.citations.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1" role="list" aria-label="Citations">
                    {msg.citations.map((c) => (
                      <Button
                        key={c.chunk_id}
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-[11px] font-mono text-primary hover:text-primary/80 border-transparent rounded-full"
                        role="listitem"
                        onClick={() => onScrollToHeading?.(c.chunk_id)}
                        title="Jump to passage"
                      >
                        <ArrowUpRight className="h-2.5 w-2.5 mr-1" />
                        {c.chunk_id}
                      </Button>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-[11px] text-muted-foreground">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 p-0"
                    onClick={() => copyToClipboard(msg.content)}
                    aria-label="Copy message"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-medium">
                {msg.role === "user" ? (
                  <div className="w-full h-full rounded-full bg-primary/20 text-primary flex items-center justify-center" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3.5 border-t border-black/[0.04] dark:border-white/10 shrink-0 bg-slate-50/50 dark:bg-white/[0.02] space-y-2">
        {messages.length === 0 && (
          <div className="px-3 py-1.5 rounded-[12px] bg-slate-100/70 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/10 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-mono">
            <ArrowUpRight className="size-3 text-purple-600 dark:text-purple-400 shrink-0" />
            <span>Answer cites ↗ highlights passage in notes</span>
          </div>
        )}
        <div className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about this lecture…"
            className="flex-1 min-h-[44px] max-h-32 resize-none text-xs rounded-[16px] bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 pr-2 py-2.5 focus:ring-1 focus:ring-slate-950 dark:focus:ring-white"
            rows={1}
            disabled={sending}
          />
          <button
            onClick={() => void send()}
            disabled={!input.trim() || sending}
            className="size-9 rounded-full bg-slate-950 text-white dark:bg-white dark:text-slate-950 hover:scale-105 active:scale-95 transition-all shadow-tactile-pill flex items-center justify-center shrink-0 disabled:opacity-40 cursor-pointer"
            aria-label="Send"
          >
            {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}