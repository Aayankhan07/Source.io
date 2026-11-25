"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Send, Sparkles, Loader2, ArrowUpRight, Copy, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { streamChat, type Citation } from "@/lib/services/pipeline";
import { track } from "@/lib/analytics/track";
import { useToast } from "@/hooks/use-toast";
import MarkdownView from "@/components/common/MarkdownView";
import { AiFeedbackButtons } from "@/components/common/AiFeedbackButtons";
import { useChatHistory } from "@/features/learning/useChatHistory";

interface AskPanelProps {
  documentId: string;
  noteMarkdown?: string | null;
  headings?: { id: string; text: string; level: number }[];
  onScrollToHeading?: (id: string) => void;
  onClose?: () => void;
  className?: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  pending?: boolean;
}

const SUGGESTED_QUESTIONS = [
  "Explain this simply",
  "Why does this matter?",
  "Quiz me on this section",
  "Key formulas",
  "Real-world example",
];

export function AskPanel({ documentId, onClose, className }: AskPanelProps) {
  const { toast } = useToast();
  /** Turns sent during this visit; earlier turns come from the persisted history below. */
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const {
    enabled: historyEnabled,
    messages: history,
    isLoading: historyLoading,
    clearChat,
    clearing,
    markStale,
  } = useChatHistory(documentId);
  const allMessages = useMemo<ChatMessage[]>(
    () => [
      ...(history ?? []).map((m) => ({ id: m.id, role: m.role, content: m.content, citations: m.citations })),
      ...messages,
    ],
    [history, messages],
  );
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [suggestedExpanded, setSuggestedExpanded] = useState(true);
  /** Which source passage is expanded, per assistant message id. */
  const [openPassage, setOpenPassage] = useState<{ messageId: string; n: number } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pendingDeltaRef = useRef("");
  const flushHandleRef = useRef<number | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [allMessages]);

  // A new document starts a new thread.
  useEffect(() => {
    setMessages([]);
    setOpenPassage(null);
  }, [documentId]);

  const handleClearChat = async () => {
    if (sending || clearing) return;
    if (typeof window !== "undefined" && !window.confirm("Clear this chat history? This cannot be undone.")) return;
    try {
      if (historyEnabled) await clearChat();
      setMessages([]);
      setOpenPassage(null);
    } catch (e: unknown) {
      toast({
        title: "Couldn't clear chat",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
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
    track("chat_question_asked");

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
      // The server persisted this turn; refetch history on the next visit only
      // (refetching now would duplicate the turns held in local state).
      markStale();
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
    <div className={cn("flex flex-col h-full w-full rounded-[28px] bg-card border border-border shadow-tactile-card overflow-hidden", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0 bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200/80 dark:border-sky-800/50 flex items-center justify-center shrink-0">
            <Sparkles className="size-3.5" />
          </div>
          <span className="text-xs font-bold text-foreground tracking-tight font-display">
            Ask Copilot
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            className="size-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center transition-colors cursor-pointer"
            onClick={() => setSuggestedExpanded(!suggestedExpanded)}
            title={suggestedExpanded ? "Collapse suggestions" : "Expand suggestions"}
            aria-label={suggestedExpanded ? "Collapse suggestions" : "Expand suggestions"}
          >
            <Sparkles className={cn("size-3.5 transition-transform", suggestedExpanded && "rotate-180")} />
          </button>
          {allMessages.length > 0 && (
            <button
              type="button"
              className="size-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40"
              onClick={() => void handleClearChat()}
              disabled={sending || clearing}
              title="Clear chat"
              aria-label="Clear chat"
            >
              {clearing ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
            </button>
          )}
          {onClose && (
            <button
              className="size-7 rounded-full text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center justify-center transition-colors cursor-pointer"
              onClick={onClose}
              title="Close Ask Copilot"
              aria-label="Close Ask Copilot"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Suggested Questions */}
      <div className={cn("px-3.5 py-2.5 border-b border-border transition-all duration-200 overflow-hidden", !suggestedExpanded && "max-h-0 p-0 opacity-0")}>
        <div className="flex flex-wrap gap-1.5" role="list" aria-label="Suggested questions">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => void send(q)}
              className="h-7 px-3 text-xs font-medium rounded-full bg-muted/60 hover:bg-muted text-foreground/80 hover:text-foreground border border-border transition-colors cursor-pointer shrink-0"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Chat History */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-3 space-y-4" style={{ minHeight: "100%" }}>
          {historyLoading && allMessages.length === 0 && (
            <div className="flex items-center justify-center gap-2 py-8 text-xs text-muted-foreground" role="status">
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              <span>Loading previous messages…</span>
            </div>
          )}
          {!historyLoading && allMessages.length === 0 && suggestedExpanded && (
            <div className="text-center py-8 text-sm text-muted-foreground space-y-2">
              <p>Start by asking a question above,</p>
              <p className="font-mono text-xs">or type your own below.</p>
            </div>
          )}
          {allMessages.map((msg) => (
            <div
              key={msg.id}
              className={cn("group flex gap-2.5 max-w-full", msg.role === "user" && "flex-row-reverse")}
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
                      ? "bg-primary text-primary-foreground rounded-tr-md shadow-xs"
                      : "bg-muted/70 text-foreground border border-border/60 rounded-tl-md shadow-xs"
                  )}
                >
                  <MarkdownView
                    onCitationClick={
                      msg.role === "assistant" && msg.citations?.length
                        ? (n) => setOpenPassage((cur) => (cur?.messageId === msg.id && cur.n === n ? null : { messageId: msg.id, n }))
                        : undefined
                    }
                  >
                    {msg.content}
                  </MarkdownView>
                  {msg.pending && <Loader2 className="inline h-3 w-3 animate-spin text-muted-foreground ml-1" />}
                </div>

                {msg.citations && msg.citations.length > 0 && (
                  <div className="space-y-1.5 mt-1.5">
                    <div className="flex flex-wrap gap-1" role="list" aria-label="Source passages">
                      {msg.citations.map((c) => {
                        const isOpen = openPassage?.messageId === msg.id && openPassage.n === c.n;
                        return (
                          <button
                            key={c.n}
                            type="button"
                            role="listitem"
                            aria-expanded={isOpen}
                            onClick={() => setOpenPassage(isOpen ? null : { messageId: msg.id, n: c.n })}
                            className={cn(
                              "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-mono rounded-md border transition-colors",
                              isOpen
                                ? "bg-foreground text-background border-foreground"
                                : "bg-muted text-foreground border-border hover:bg-foreground hover:text-background",
                            )}
                            title="Show the source passage"
                          >
                            <ArrowUpRight className="h-3 w-3 opacity-70" aria-hidden="true" />
                            <span>[{c.n}]</span>
                            <span className="opacity-70">{Math.round(c.similarity * 100)}% match</span>
                          </button>
                        );
                      })}
                    </div>
                    {(() => {
                      if (openPassage?.messageId !== msg.id) return null;
                      const passage = msg.citations.find((c) => c.n === openPassage.n);
                      if (!passage) return null;
                      return (
                        <blockquote className="text-left text-sm leading-relaxed rounded-xl border border-border bg-card p-3 whitespace-pre-wrap break-words">
                          <div className="mb-1.5 flex items-center justify-between gap-2 text-xs text-muted-foreground font-mono">
                            <span>Source passage [{passage.n}] · {Math.round(passage.similarity * 100)}% match</span>
                            <button
                              type="button"
                              className="rounded p-0.5 hover:text-foreground"
                              onClick={() => setOpenPassage(null)}
                              aria-label="Close source passage"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          {passage.text}
                        </blockquote>
                      );
                    })()}
                  </div>
                )}

                <div className="flex items-center justify-between gap-1.5 text-xs text-muted-foreground pt-1">
                  <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
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
                  {msg.role === "assistant" && !msg.pending && (
                    <AiFeedbackButtons
                      documentId={documentId}
                      feature="chat"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  )}
                </div>
              </div>

              <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium">
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
      <div className="p-3.5 border-t border-border shrink-0 bg-muted/20 space-y-2">
        {allMessages.length === 0 && (
          <div className="px-3 py-1.5 rounded-[12px] bg-muted/50 border border-border text-xs text-muted-foreground flex items-center gap-1.5 font-mono">
            <ArrowUpRight className="size-3 text-sky-600 dark:text-sky-400 shrink-0" />
            <span>Answer cites ↗ highlights passage in notes</span>
          </div>
        )}
        <div className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about this lecture…"
            aria-label="Ask a question about this document"
            className="flex-1 min-h-[44px] max-h-32 resize-none text-xs rounded-[16px] bg-muted/40 border-border text-foreground placeholder:text-muted-foreground pr-2 py-2.5 focus-visible:ring-1 focus-visible:ring-ring"
            rows={1}
            disabled={sending}
          />
          <button
            onClick={() => void send()}
            disabled={!input.trim() || sending}
            className="size-9 rounded-full bg-primary text-primary-foreground hover:scale-105 active:scale-95 transition-all shadow-tactile-pill flex items-center justify-center shrink-0 disabled:opacity-40 cursor-pointer"
            aria-label="Send"
          >
            {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}