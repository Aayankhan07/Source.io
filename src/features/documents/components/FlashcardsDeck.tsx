"use client";

import { useState, useEffect, useCallback, useMemo, useRef, type KeyboardEvent as ReactKeyboardEvent } from "react";
import {
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  Sparkles,
  Layers,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  LayoutGrid,
  Download,
  CalendarClock,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import MarkdownView from "@/components/common/MarkdownView";
import type { FlashcardRow } from "@/features/documents/types";
import { countDue, intervalDaysForBox, nextBox, orderByDue, type ReviewResult } from "@/features/learning/leitner";
import { useFlashcardReviews } from "@/features/learning/useFlashcardReviews";

interface FlashcardsDeckProps {
  documentId: string;
  cards: FlashcardRow[];
  onRegenerate: () => void;
  loading?: boolean;
}

const GRADES: { result: ReviewResult; label: string; key: string }[] = [
  { result: "again", label: "Again", key: "1" },
  { result: "good", label: "Good", key: "2" },
  { result: "easy", label: "Easy", key: "3" },
];

/** True when the key event comes from somewhere the user is typing. */
function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}

/** True for controls that handle Space / Enter themselves (buttons, links, inputs...). */
function isInteractiveTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  if (isTypingTarget(el)) return true;
  const tag = el.tagName;
  if (tag === "BUTTON" || tag === "A" || tag === "SUMMARY") return true;
  const role = el.getAttribute("role");
  return role === "button" || role === "link" || role === "checkbox" || role === "switch" || role === "menuitem";
}

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

export function FlashcardsDeck({
  documentId,
  cards,
  onRegenerate,
  loading = false,
}: FlashcardsDeckProps) {
  const [deck, setDeck] = useState<FlashcardRow[]>(cards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredIds, setMasteredIds] = useState<Set<string>>(new Set());
  const [learningIds, setLearningIds] = useState<Set<string>>(new Set());
  const [showGridView, setShowGridView] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [reviewDueMode, setReviewDueMode] = useState(false);

  const { enabled: persistReviews, reviews, recordReview } = useFlashcardReviews(documentId);
  const stageRef = useRef<HTMLDivElement>(null);

  /**
   * Keep keyboard focus inside the deck after a control that is about to unmount
   * (Show answer / grade buttons) is clicked, so the scoped shortcuts keep working.
   */
  const focusStageSoon = useCallback(() => {
    requestAnimationFrame(() => stageRef.current?.focus({ preventScroll: true }));
  }, []);

  // Sync deck when external cards change
  useEffect(() => {
    setDeck(cards);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsCompleted(false);
    setReviewDueMode(false);
    setMasteredIds(new Set());
    setLearningIds(new Set());
  }, [cards]);

  const currentCard = deck[currentIndex];

  const dueCount = useMemo(() => countDue(cards, reviews, new Date()), [cards, reviews]);

  const handleNext = useCallback(() => {
    if (currentIndex < deck.length - 1) {
      setIsFlipped(false);
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsCompleted(true);
    }
  }, [currentIndex, deck.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  /** Grade the current card (only after its answer is revealed), save the Leitner state, advance. */
  const grade = useCallback(
    (result: ReviewResult) => {
      if (!currentCard || !isFlipped) return;
      const id = currentCard.id;
      if (result === "again") {
        setLearningIds((prev) => new Set(prev).add(id));
        setMasteredIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      } else {
        setMasteredIds((prev) => new Set(prev).add(id));
        setLearningIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
      recordReview(id, result);
      handleNext();
    },
    [currentCard, isFlipped, recordReview, handleNext],
  );

  const handleShuffle = () => {
    const shuffled = [...deck].sort(() => Math.random() - 0.5);
    setDeck(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsCompleted(false);
  };

  const handleRestart = (studyOnlyHard = false) => {
    if (studyOnlyHard && learningIds.size > 0) {
      const filtered = deck.filter((c) => learningIds.has(c.id));
      setDeck(filtered);
    } else {
      setDeck(cards);
    }
    setReviewDueMode(false);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsCompleted(false);
  };

  const startDueReview = () => {
    setDeck(orderByDue(cards, reviews, new Date()));
    setReviewDueMode(true);
    setShowGridView(false);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsCompleted(false);
  };

  const handleExportAnki = useCallback(() => {
    if (!deck.length) return;
    const rows = deck.map((card) => {
      const cleanFront = card.front.replace(/\t/g, " ").replace(/\r?\n/g, "<br>");
      const cleanBack = card.back.replace(/\t/g, " ").replace(/\r?\n/g, "<br>");
      return `${cleanFront}\t${cleanBack}\tSource.io`;
    });
    const tsvContent = rows.join("\n");
    const blob = new Blob([tsvContent], { type: "text/tab-separated-values;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `flashcards-${documentId || "deck"}.tsv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [deck, documentId]);

  /**
   * Keyboard shortcuts, scoped to the deck (only fire while focus is inside it).
   * Space / Enter flip only from the card itself or non-interactive deck areas, so
   * focused buttons, inputs and contenteditable regions keep their native behaviour.
   */
  const handleDeckKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    if (isTypingTarget(e.target)) return;
    if (showGridView || isCompleted) return;

    const isFlipKey = e.key === " " || e.key === "Enter";
    if (isFlipKey) {
      const target = e.target as HTMLElement;
      const isStage = target.dataset?.flipStage === "true";
      if (!isStage && isInteractiveTarget(target)) return;
      e.preventDefault();
      handleFlip();
      return;
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      handleNext();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      handlePrev();
    } else if (isFlipped) {
      const g = GRADES.find((x) => x.key === e.key);
      if (g) {
        e.preventDefault();
        grade(g.result);
      }
    }
  };

  const progressPercent = useMemo(() => {
    if (!deck.length) return 0;
    return Math.round(((currentIndex + 1) / deck.length) * 100);
  }, [currentIndex, deck.length]);

  // Empty state
  if (!cards || cards.length === 0) {
    return (
      <div className="bg-card p-10 sm:p-12 rounded-[32px] border border-border text-center space-y-4 shadow-tactile-card max-w-lg mx-auto mt-6">
        <div className="size-14 rounded-2xl bg-muted border border-border flex items-center justify-center text-muted-foreground mx-auto shadow-tactile-pill">
          <Layers className="size-7 text-muted-foreground" aria-hidden="true" />
        </div>
        <div className="space-y-1.5">
          <h3 className="font-bold text-foreground font-display text-lg">No flashcards yet</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
            Generate an interactive spaced-repetition card deck grounded directly in your document definitions and formulas.
          </p>
        </div>
        <Button
          onClick={onRegenerate}
          disabled={loading}
          className="rounded-full text-xs h-10 px-6 font-semibold bg-primary text-primary-foreground hover:scale-105 active:scale-95 transition-all shadow-tactile-pill"
        >
          {loading ? <Sparkles className="size-4 mr-2 animate-spin text-sky-400" /> : <Sparkles className="size-4 mr-2" />}
          <span>Generate Flashcard Deck</span>
        </Button>
      </div>
    );
  }

  // Completion Screen
  if (isCompleted) {
    return (
      <div className="bg-card p-8 sm:p-12 rounded-[32px] border border-border text-center space-y-6 shadow-tactile-card max-w-xl mx-auto mt-6 animate-fade-in">
        <div className="size-16 rounded-3xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-tactile-pill">
          <CheckCircle2 className="size-8" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h2 className="font-bold text-foreground font-display text-2xl tracking-tight">
            Deck Completed!
          </h2>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Great work! You reviewed all {deck.length} flashcards in this set.
            {persistReviews && " Your progress is saved and each card is scheduled for its next review."}
          </p>
        </div>

        {/* Stats card */}
        <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
          <div className="p-4 rounded-2xl bg-muted/40 border border-border text-center space-y-1">
            <span className="text-xs uppercase font-mono text-muted-foreground font-bold">Remembered</span>
            <p className="text-2xl font-bold font-display text-emerald-600 dark:text-emerald-400">
              {masteredIds.size}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-muted/40 border border-border text-center space-y-1">
            <span className="text-xs uppercase font-mono text-muted-foreground font-bold">Needs Review</span>
            <p className="text-2xl font-bold font-display text-amber-600 dark:text-amber-400">
              {learningIds.size}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button
            onClick={() => handleRestart(false)}
            variant="outline"
            className="rounded-full text-xs h-10 px-5 gap-2 border-border text-foreground hover:bg-muted"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            <span>Review Full Deck</span>
          </Button>

          {persistReviews && dueCount > 0 && (
            <Button
              onClick={startDueReview}
              variant="outline"
              className="rounded-full text-xs h-10 px-5 gap-2 border-border text-foreground hover:bg-muted"
            >
              <CalendarClock className="size-3.5" aria-hidden="true" />
              <span>Review due cards ({dueCount})</span>
            </Button>
          )}

          <Button
            onClick={handleExportAnki}
            variant="outline"
            className="rounded-full text-xs h-10 px-5 gap-2 border-border text-foreground hover:bg-muted cursor-pointer"
          >
            <Download className="size-3.5" aria-hidden="true" />
            <span>Export to Anki (.tsv)</span>
          </Button>

          {learningIds.size > 0 && (
            <Button
              onClick={() => handleRestart(true)}
              className="rounded-full text-xs h-10 px-5 gap-2 bg-primary text-primary-foreground hover:scale-105 transition-all shadow-tactile-pill"
            >
              <span>Practice Difficult Cards ({learningIds.size})</span>
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  const currentReview = currentCard ? reviews.get(currentCard.id) : undefined;

  return (
    <div
      className="max-w-2xl mx-auto space-y-5 outline-none"
      onKeyDown={handleDeckKeyDown}
      role="region"
      aria-label="Flashcard deck"
    >
      {/* Top Deck Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-muted border border-border text-foreground">
            Card {currentIndex + 1} of {deck.length}
          </span>
          <span className="text-xs text-muted-foreground font-mono">
            {masteredIds.size} remembered
          </span>
          {persistReviews && (
            <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-700 dark:text-sky-300">
              Due today: {dueCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {persistReviews && dueCount > 0 && !reviewDueMode && (
            <Button
              variant="outline"
              size="sm"
              onClick={startDueReview}
              className="rounded-full text-xs h-8 px-3 gap-1.5 border-border text-foreground hover:bg-muted"
            >
              <CalendarClock className="size-3.5" aria-hidden="true" />
              <span>Review due cards</span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShuffle}
            title="Shuffle deck"
            aria-label="Shuffle deck"
            className="size-8 p-0 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
          >
            <Shuffle className="size-3.5" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExportAnki}
            title="Export deck to Anki (.tsv)"
            aria-label="Export deck to Anki (.tsv)"
            className="size-8 p-0 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
          >
            <Download className="size-3.5" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowGridView(!showGridView)}
            title={showGridView ? "Show card runner" : "Show card grid"}
            aria-label={showGridView ? "Show card runner" : "Show card grid"}
            aria-pressed={showGridView}
            className="size-8 p-0 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
          >
            <LayoutGrid className="size-3.5" aria-hidden="true" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onRegenerate}
            disabled={loading}
            className="rounded-full text-xs h-8 px-3 gap-1.5 border-border text-foreground hover:bg-muted"
          >
            <Sparkles className="size-3 text-sky-500" aria-hidden="true" />
            <span>Regenerate</span>
          </Button>
        </div>
      </div>

      {reviewDueMode && (
        <p className="text-xs text-muted-foreground font-mono">
          Review mode: due cards first ({plural(dueCount, "card")} due today).
        </p>
      )}

      {/* Progress Track */}
      <div
        className="h-1.5 bg-muted rounded-full overflow-hidden"
        role="progressbar"
        aria-label="Deck progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progressPercent}
      >
        <div
          className="h-full bg-primary rounded-full transition-all duration-200"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Grid Overview or Runner Mode */}
      {showGridView ? (
        <div className="grid gap-3.5 sm:grid-cols-2 pt-2 animate-fade-in">
          {deck.map((card, idx) => {
            const isMastered = masteredIds.has(card.id);
            const isLearning = learningIds.has(card.id);
            const review = reviews.get(card.id);
            return (
              <button
                type="button"
                key={card.id}
                onClick={() => {
                  setCurrentIndex(idx);
                  setIsFlipped(false);
                  setShowGridView(false);
                }}
                aria-label={`Open card ${idx + 1}`}
                className={cn(
                  "p-5 rounded-2xl border transition-all cursor-pointer space-y-2.5 text-left bg-card hover:bg-muted/30 shadow-xs",
                  idx === currentIndex ? "border-primary ring-1 ring-primary/40" : "border-border",
                  isMastered && "border-emerald-500/40 bg-emerald-500/5",
                  isLearning && "border-amber-500/40 bg-amber-500/5"
                )}
              >
                <span className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                  <span className="font-bold">#{idx + 1}</span>
                  {review && <span>Box {review.box}</span>}
                  {isMastered && <span className="text-emerald-600 dark:text-emerald-400 font-bold">Remembered</span>}
                  {isLearning && <span className="text-amber-600 dark:text-amber-400 font-bold">Review</span>}
                </span>
                <span className="block text-xs font-semibold text-foreground line-clamp-2">{card.front}</span>
                <span className="block text-xs text-muted-foreground line-clamp-2 border-t border-border/40 pt-2">{card.back}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <>
          {/* Main 3D Flippable Card Stage */}
          <div
            className="perspective-1000 w-full min-h-[320px] sm:min-h-[360px] cursor-pointer select-none rounded-[32px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            ref={stageRef}
            onClick={handleFlip}
            role="button"
            tabIndex={0}
            data-flip-stage="true"
            aria-pressed={isFlipped}
            aria-label={isFlipped ? "Show question" : "Reveal answer"}
          >
            <div
              className={cn(
                "relative w-full min-h-[320px] sm:min-h-[360px] transition-transform duration-500 transform-style-3d",
                isFlipped && "rotate-y-180"
              )}
            >
              {/* Card FRONT */}
              <div
                aria-hidden={isFlipped}
                className={cn(
                  "absolute inset-0 w-full h-full p-8 sm:p-10 rounded-[32px] bg-card border border-border shadow-tactile-card flex flex-col justify-between backface-hidden",
                  "hover:border-primary/40 transition-colors"
                )}
              >
                <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                  <span className="uppercase font-bold tracking-wider text-xs px-2 py-0.5 rounded bg-muted border border-border">
                    Prompt / Term
                  </span>
                  <span className="text-xs flex items-center gap-1 text-muted-foreground">
                    <RotateCw className="size-3" aria-hidden="true" /> Click or <kbd className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs">Space</kbd> to flip
                  </span>
                </div>

                <div className="my-auto py-6">
                  <div className="text-base sm:text-xl font-bold font-display text-foreground leading-relaxed">
                    <MarkdownView>{currentCard.front}</MarkdownView>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border/40 text-xs font-mono text-muted-foreground">
                  <span>Press Space to reveal answer</span>
                  <span>
                    {currentReview ? `Box ${currentReview.box} · ` : ""}#{currentIndex + 1}
                  </span>
                </div>
              </div>

              {/* Card BACK */}
              <div
                aria-hidden={!isFlipped}
                className={cn(
                  "absolute inset-0 w-full h-full p-8 sm:p-10 rounded-[32px] bg-muted/40 border border-border shadow-tactile-card flex flex-col justify-between backface-hidden rotate-y-180",
                  "hover:border-primary/40 transition-colors"
                )}
              >
                <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                  <span className="uppercase font-bold tracking-wider text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700">
                    Answer / Definition
                  </span>
                  <span className="text-xs flex items-center gap-1 text-muted-foreground">
                    <RotateCw className="size-3" aria-hidden="true" /> Flip back
                  </span>
                </div>

                <div className="my-auto py-6">
                  <div className="text-sm sm:text-base text-foreground/95 leading-relaxed">
                    <MarkdownView>{currentCard.back}</MarkdownView>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border/40 text-xs font-mono text-muted-foreground">
                  <span>How well did you remember it?</span>
                  <span>Answer</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom navigation & Leitner grading */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="rounded-full text-xs h-9 px-3.5 gap-1 border-border text-foreground hover:bg-muted"
                aria-label="Previous card"
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
                <span>Prev</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNext}
                disabled={currentIndex === deck.length - 1}
                className="rounded-full text-xs h-9 px-3.5 gap-1 border-border text-foreground hover:bg-muted"
                aria-label="Next card"
              >
                <span>Next</span>
                <ChevronRight className="size-4" aria-hidden="true" />
              </Button>
            </div>

            {isFlipped ? (
              <div className="flex items-center gap-2" role="group" aria-label="Rate your recall">
                {GRADES.map((g) => {
                  const box = nextBox(currentReview?.box ?? null, g.result);
                  const days = intervalDaysForBox(box);
                  const when = `${days} day${days === 1 ? "" : "s"}`;
                  return (
                    <Button
                      key={g.result}
                      size="sm"
                      variant={g.result === "good" ? "default" : "outline"}
                      onClick={() => {
                        grade(g.result);
                        focusStageSoon();
                      }}
                      aria-label={`${g.label}: next review in ${when} (key ${g.key})`}
                      title={`${g.label}: next review in ${when} (key ${g.key})`}
                      aria-keyshortcuts={g.key}
                      className={cn(
                        "rounded-full text-xs h-9 px-4 gap-1.5 shadow-2xs cursor-pointer font-medium",
                        g.result === "good"
                          ? "bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 border border-slate-900 dark:border-white"
                          : "bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700"
                      )}
                    >
                      {g.result === "again" && <RotateCw className="size-3.5" aria-hidden="true" />}
                      {g.result === "good" && <CheckCircle2 className="size-3.5" aria-hidden="true" />}
                      {g.result === "easy" && <Zap className="size-3.5" aria-hidden="true" />}
                      <span>{g.label}</span>
                      <kbd
                        aria-hidden="true"
                        className="rounded px-1.5 py-0.5 font-mono text-xs font-bold bg-black/5 dark:bg-white/10"
                      >
                        {g.key}
                      </kbd>
                    </Button>
                  );
                })}
              </div>
            ) : (
              <Button
                size="sm"
                onClick={() => {
                  handleFlip();
                  focusStageSoon();
                }}
                className="rounded-full text-xs h-9 px-4 gap-1.5 cursor-pointer font-medium"
              >
                <RotateCw className="size-3.5" aria-hidden="true" />
                <span>Show answer</span>
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
