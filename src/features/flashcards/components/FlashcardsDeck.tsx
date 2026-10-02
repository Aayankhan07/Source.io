"use client";

import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Shuffle, RotateCcw, Keyboard, CheckCircle, Layers } from "lucide-react";
import type { FlashcardRow } from "@/features/documents/types";
import { useToast } from "@/hooks/use-toast";

function shuffleArr<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function FlashcardsDeck({ cards }: { cards: FlashcardRow[] }) {
  const { toast } = useToast();
  const [order, setOrder] = useState<number[]>(() => cards.map((_, i) => i));
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [viewMode, setViewMode] = useState<"study" | "grid">("study");
  
  // Track ratings for stats
  const [ratings, setRatings] = useState<Record<string, string>>({});

  const ordered = useMemo(() => order.map((i) => cards[i]).filter(Boolean), [order, cards]);
  const total = ordered.length;
  const card = ordered[idx];

  // `order` is seeded once by useState, but `cards` is replaced in place when the
  // deck is regenerated. Re-seed it so indices never point past the new array —
  // otherwise `card` becomes undefined and the deck renders nothing.
  const cardIds = cards.map((c) => c.id).join(",");
  useEffect(() => {
    setOrder(cards.map((_, i) => i));
    setIdx(0);
    setFlipped(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardIds]);

  const go = useCallback((delta: number) => {
    setFlipped(false);
    setIdx((i) => Math.max(0, Math.min(total - 1, i + delta)));
  }, [total]);

  const rate = useCallback((quality: "again" | "hard" | "good" | "easy") => {
    if (!card) return;
    setRatings(prev => ({ ...prev, [card.id]: quality }));
    toast({
      title: `Rated ${quality.toUpperCase()}`,
      description: "Card scheduled for review.",
      duration: 1000,
    });
    // Auto-advance if not at the end
    if (idx < total - 1) {
      setTimeout(() => {
        go(1);
      }, 300);
    }
  }, [card, idx, total, go, toast]);

  // Keyboard shortcuts, scoped to the deck.
  const deckRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewMode !== "study") return;
      const active = document.activeElement;
      if (active?.tagName === "INPUT" || active?.tagName === "TEXTAREA") return;

      const deck = deckRef.current;
      if (!deck || !active || !deck.contains(active)) return;

      if (e.code === "Space") {
        if (active === cardRef.current || active.tagName === "BUTTON") return;
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        go(-1);
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        go(1);
      } else if (flipped) {
        if (e.key === "1") rate("again");
        else if (e.key === "2") rate("hard");
        else if (e.key === "3") rate("good");
        else if (e.key === "4") rate("easy");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [flipped, go, rate, viewMode]);

  if (!card) {
    return (
      <div className="border border-dashed border-border bg-card rounded-2xl p-10 text-center max-w-md mx-auto mt-12 space-y-3 shadow-sm">
        <div className="h-10 w-10 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-500 mx-auto">
          <Layers className="h-5 w-5" />
        </div>
        <h3 className="font-bold text-slate-900 font-display text-base">No cards to show</h3>
        <p className="text-sm text-slate-500 leading-relaxed">Regenerate the deck to create a new set of cards.</p>
      </div>
    );
  }

  const reviewedCount = Object.keys(ratings).length;

  return (
    <div ref={deckRef} className="space-y-6 animate-fade-in text-left">
      {/* Action Header controls */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-full border border-border/80 bg-card text-foreground shadow-2xs">
            {viewMode === "study" ? `${idx + 1} / ${total}` : `${total} Cards`}
          </span>
          {reviewedCount > 0 && (
            <span className="text-xs text-emerald-700 font-mono bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/80">
              {reviewedCount}/{total} Reviewed
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="xs"
            className="border-border text-foreground hover:bg-slate-100 bg-card text-xs py-1 rounded-full shadow-2xs"
            onClick={() => setViewMode((m) => (m === "study" ? "grid" : "study"))}
          >
            <Layers className="h-3.5 w-3.5 mr-1" /> {viewMode === "study" ? "Grid View" : "Study Deck"}
          </Button>
          <Button
            variant="outline"
            size="xs"
            className="border-border text-foreground hover:bg-slate-100 bg-card text-xs py-1 rounded-full shadow-2xs"
            onClick={() => { setOrder(shuffleArr(order)); setIdx(0); setFlipped(false); }}
          >
            <Shuffle className="h-3.5 w-3.5 mr-1" /> Shuffle
          </Button>
          <Button
            variant="outline"
            size="xs"
            className="border-border text-foreground hover:bg-slate-100 bg-card text-xs py-1 rounded-full shadow-2xs"
            onClick={() => { setOrder(cards.map((_, i) => i)); setIdx(0); setFlipped(false); setRatings({}); }}
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset
          </Button>
        </div>
      </div>

      {viewMode === "grid" ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {cards.map((c, i) => (
            <div key={c.id || i} className="bg-card border border-border/80 p-5 rounded-2xl shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <span className="text-xs font-mono text-muted-foreground">Card #{i + 1}</span>
                {ratings[c.id] && (
                  <Badge variant="outline" className="text-[10px] font-mono uppercase bg-sky-50 text-sky-700 border-sky-200">
                    {ratings[c.id]}
                  </Badge>
                )}
              </div>
              <div>
                <h4 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-1">Question</h4>
                <p className="text-sm font-semibold text-foreground font-display">{c.front}</p>
              </div>
              <div className="pt-2 border-t border-border/40">
                <h4 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-1">Answer</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{c.back}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Card stack layout wrapper */}
          <div className="relative w-full h-80 sm:h-80 select-none pb-4">
            {/* Background stack card shadows to simulate deck */}
            {total - idx > 2 && (
              <div className="absolute inset-x-4 bottom-0 h-72 rounded-2xl border border-border/70 bg-card/60 translate-y-4 scale-95 pointer-events-none transition-transform shadow-xs" />
            )}
            {total - idx > 1 && (
              <div className="absolute inset-x-2 bottom-1 h-72 rounded-2xl border border-border/80 bg-card/90 translate-y-2 scale-[0.98] pointer-events-none transition-transform shadow-sm" />
            )}

            {/* Floating Flip Card */}
            <div
              ref={cardRef}
              className="relative w-full h-72 cursor-pointer rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              style={{ perspective: "1200px" }}
              onClick={() => setFlipped((f) => !f)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setFlipped((f) => !f);
                }
              }}
              role="button"
              tabIndex={0}
              aria-pressed={flipped}
              aria-label={flipped ? "Show question" : "Reveal answer"}
            >
              <div
                className="absolute inset-0 transition-transform duration-500"
                style={{
                  transformStyle: "preserve-3d",
                  transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
                }}
              >
                {/* Front Question Face */}
                <div
                  className="absolute inset-0 rounded-3xl border border-border/90 glass-card glass-highlight p-6 sm:p-8 flex flex-col items-center justify-center text-center shadow-lg relative"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <span className="mb-4 text-xs uppercase tracking-wider font-bold bg-sky-50 dark:bg-zinc-800 text-sky-700 dark:text-zinc-200 border border-sky-200 dark:border-zinc-700 px-3 py-1 rounded-full">
                    Question
                  </span>
                  <p className="text-base sm:text-lg font-bold text-foreground leading-relaxed max-w-lg font-display">
                    {card.front}
                  </p>
                  
                  {ratings[card.id] && (
                    <div className="absolute top-4 right-4 flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400 font-mono bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/40">
                      <CheckCircle className="h-3 w-3" /> Reviewed
                    </div>
                  )}
                  <p className="absolute bottom-4 text-xs text-muted-foreground">
                    Tap card or press <kbd className="bg-muted border border-border px-1.5 py-0.5 rounded text-[11px] font-mono text-muted-foreground">Space</kbd> to reveal answer
                  </p>
                </div>

                {/* Back Answer Face */}
                <div
                  className="absolute inset-0 rounded-3xl border border-slate-300 dark:border-zinc-700 glass-card glass-highlight p-6 sm:p-8 flex flex-col items-center justify-center text-center shadow-xl"
                  style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                >
                  <span className="mb-4 text-xs uppercase tracking-wider font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40 px-3 py-1 rounded-full">
                    Answer Explanation
                  </span>
                  <p className="text-base sm:text-lg text-foreground leading-relaxed max-w-lg font-sans">
                    {card.back}
                  </p>
                  <p className="absolute bottom-4 text-xs text-muted-foreground">Tap to flip back</p>
                </div>
              </div>
            </div>
          </div>

          {/* Progress navigation & Spaced Repetition Feedback Controls */}
          <div className="space-y-4">
            {flipped && (
              <div className="glass-card p-4 rounded-2xl border border-border/80 shadow-md flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in">
                <span className="text-xs text-muted-foreground font-mono">How well did you recall this?</span>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button 
                    onClick={(e) => { e.stopPropagation(); rate("again"); }} 
                    className="flex-1 sm:flex-none text-xs bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40 py-1 rounded-xl font-medium"
                    size="sm"
                  >
                    Again (1)
                  </Button>
                  <Button 
                    onClick={(e) => { e.stopPropagation(); rate("hard"); }} 
                    className="flex-1 sm:flex-none text-xs bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40 py-1 rounded-xl font-medium"
                    size="sm"
                  >
                    Hard (2)
                  </Button>
                  <Button 
                    onClick={(e) => { e.stopPropagation(); rate("good"); }} 
                    className="flex-1 sm:flex-none text-xs bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 py-1 rounded-xl font-medium"
                    size="sm"
                  >
                    Good (3)
                  </Button>
                  <Button 
                    onClick={(e) => { e.stopPropagation(); rate("easy"); }} 
                    className="flex-1 sm:flex-none text-xs bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 py-1 rounded-xl font-medium"
                    size="sm"
                  >
                    Easy (4)
                  </Button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-4">
              <Button variant="outline" onClick={() => go(-1)} disabled={idx === 0} className="border-border text-foreground hover:bg-muted bg-card rounded-full px-4 shadow-2xs">
                <ChevronLeft className="h-4 w-4 mr-1 shrink-0" /> Prev
              </Button>
              <div className="flex-1">
                <div className="h-1.5 rounded-full bg-muted overflow-hidden shadow-inner">
                  <div
                    className="h-full bg-primary transition-all duration-300 rounded-full"
                    style={{ width: `${((idx + 1) / total) * 100}%` }}
                  />
                </div>
              </div>
              <Button variant="outline" onClick={() => go(1)} disabled={idx === total - 1} className="border-border text-foreground hover:bg-muted bg-card rounded-full px-4 shadow-2xs">
                Next <ChevronRight className="h-4 w-4 ml-1 shrink-0" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
