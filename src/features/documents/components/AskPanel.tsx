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
    <div className="flex flex-col h-full w-full bg-card/60 backdrop-blur-sm shrink-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border/60 shrink-0 bg-background/50">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground tracking-tight font-display">
            Ask this lecture
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-full"
            onClick={() => setSuggestedExpanded(!suggestedExpanded)}
            title={suggestedExpanded ? "Collapse suggestions" : "Expand suggestions"}
            aria-label={suggestedExpanded ? "Collapse suggestions" : "Expand suggestions"}
          >
            <Sparkles className={cn("h-3.5 w-3.5 transition-transform", suggestedExpanded && "rotate-180")} />
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-full"
              onClick={onClose}
              title="Collapse Ask panel"
              aria-label="Collapse Ask panel"
            >
              <PanelRightClose className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Suggested Questions */}
      <div className={cn("px-3 py-2 border-b border-border/60 transition-all duration-200 overflow-hidden", !suggestedExpanded && "max-h-0 p-0 opacity-0")}>
        <div className="flex flex-wrap gap-1.5" role="list" aria-label="Suggested questions">
          {SUGGESTED_QUESTIONS.map((q) => (
            <Button
              key={q}
              variant="outline"
              size="sm"
              className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground border-border/60 hover:border-primary/40 rounded-full"
              role="listitem"
              onClick={() => void send(q)}
              disabled={sending}
            >
              {q}
            </Button>
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

                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-muted-foreground">
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

              <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium">
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
      <div className="p-3 border-t border-border/60 shrink-0 bg-background/40 space-y-2">
        {messages.length === 0 && (
          <div className="px-2.5 py-1.5 rounded-lg bg-muted/40 border border-border/50 text-[10px] text-muted-foreground flex items-center gap-1.5 font-mono">
            <ArrowUpRight className="h-3 w-3 text-primary shrink-0" />
            <span>Answer cites ↗ highlights passage in notes</span>
          </div>
        )}
        <div className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question…"
            className="flex-1 min-h-[44px] max-h-32 resize-none text-xs pr-8"
            rows={1}
            disabled={sending}
          />
          <Button
            onClick={() => void send()}
            disabled={!input.trim() || sending}
            size="icon"
            className="h-8 w-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
            aria-label="Send"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}