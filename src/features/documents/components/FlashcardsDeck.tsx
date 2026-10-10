"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  RotateCcw,
  LayoutGrid,
  Maximize2,
  Minimize2,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import MarkdownView from "@/components/common/MarkdownView";
import type { FlashcardRow } from "@/features/documents/types";

interface FlashcardsDeckProps {
  documentId: string;
  cards: FlashcardRow[];
  onRegenerate: () => void;
  loading?: boolean;
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

  // Sync deck when external cards change
  useEffect(() => {
    setDeck(cards);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsCompleted(false);
    setMasteredIds(new Set());
    setLearningIds(new Set());
  }, [cards]);

  const currentCard = deck[currentIndex];

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

  const markMastered = useCallback(() => {
    if (!currentCard) return;
    setMasteredIds((prev) => new Set(prev).add(currentCard.id));
    setLearningIds((prev) => {
      const next = new Set(prev);
      next.delete(currentCard.id);
      return next;
    });
    handleNext();
  }, [currentCard, handleNext]);

  const markLearning = useCallback(() => {
    if (!currentCard) return;
    setLearningIds((prev) => new Set(prev).add(currentCard.id));
    handleNext();
  }, [currentCard, handleNext]);

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
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsCompleted(false);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (e.code === "Space") {
        e.preventDefault();
        handleFlip();
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        handleNext();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "1") {
        e.preventDefault();
        markLearning();
      } else if (e.key === "2" || e.key === "3") {
        e.preventDefault();
        markMastered();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleFlip, handleNext, handlePrev, markLearning, markMastered]);

  const progressPercent = useMemo(() => {
    if (!deck.length) return 0;
    return Math.round(((currentIndex + 1) / deck.length) * 100);
  }, [currentIndex, deck.length]);

  const masteryPercent = useMemo(() => {
    if (!cards.length) return 0;
    return Math.round((masteredIds.size / cards.length) * 100);
  }, [masteredIds.size, cards.length]);

  // Empty state
  if (!cards || cards.length === 0) {
    return (
      <div className="bg-card p-10 sm:p-12 rounded-[32px] border border-border text-center space-y-4 shadow-tactile-card max-w-lg mx-auto mt-6">
        <div className="size-14 rounded-2xl bg-muted border border-border flex items-center justify-center text-muted-foreground mx-auto shadow-tactile-pill">
          <Layers className="size-7 text-muted-foreground" />
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
          {loading ? <Sparkles className="size-4 mr-2 animate-spin text-purple-400" /> : <Sparkles className="size-4 mr-2" />}
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
          <CheckCircle2 className="size-8" />
        </div>
        <div className="space-y-2">
          <h2 className="font-bold text-foreground font-display text-2xl tracking-tight">
            Deck Completed!
          </h2>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Great work! You reviewed all {deck.length} flashcards in this set.
          </p>
        </div>

        {/* Stats card */}
        <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
          <div className="p-4 rounded-2xl bg-muted/40 border border-border text-center space-y-1">
            <span className="text-[10px] uppercase font-mono text-muted-foreground font-bold">Mastered</span>
            <p className="text-2xl font-bold font-display text-emerald-600 dark:text-emerald-400">
              {masteredIds.size}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-muted/40 border border-border text-center space-y-1">
            <span className="text-[10px] uppercase font-mono text-muted-foreground font-bold">Needs Review</span>
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
            <RotateCcw className="size-3.5" />
            <span>Review Full Deck</span>
          </Button>

          {learningIds.size > 0 && (
            <Button
              onClick={() => handleRestart(true)}
              className="rounded-full text-xs h-10 px-5 gap-2 bg-primary text-primary-foreground hover:scale-105 transition-all shadow-tactile-pill"
            >
              <span>Practice Difficult Cards ({learningIds.size})</span>
              <ArrowRight className="size-3.5" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Top Deck Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-muted border border-border text-foreground">
            Card {currentIndex + 1} of {deck.length}
          </span>
          <span className="text-xs text-muted-foreground font-mono">
            {masteredIds.size} mastered
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShuffle}
            title="Shuffle deck"
            className="size-8 p-0 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
          >
            <Shuffle className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowGridView(!showGridView)}
            title={showGridView ? "Show card runner" : "Show card grid"}
            className="size-8 p-0 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
          >
            <LayoutGrid className="size-3.5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onRegenerate}
            disabled={loading}
            className="rounded-full text-xs h-8 px-3 gap-1.5 border-border text-foreground hover:bg-muted"
          >
            <Sparkles className="size-3 text-purple-500" />
            <span>Regenerate</span>
          </Button>
        </div>
      </div>

      {/* Progress Track */}
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
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
            return (
              <div
                key={card.id}
                onClick={() => {
                  setCurrentIndex(idx);
                  setIsFlipped(false);
                  setShowGridView(false);
                }}
                className={cn(
                  "p-5 rounded-2xl border transition-all cursor-pointer space-y-2.5 text-left bg-card hover:bg-muted/30 shadow-xs",
                  idx === currentIndex ? "border-primary ring-1 ring-primary/40" : "border-border",
                  isMastered && "border-emerald-500/40 bg-emerald-500/5",
                  isLearning && "border-amber-500/40 bg-amber-500/5"
                )}
              >
                <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                  <span className="font-bold">#{idx + 1}</span>
                  {isMastered && <span className="text-emerald-500 font-bold">Mastered</span>}
                  {isLearning && <span className="text-amber-500 font-bold">Review</span>}
                </div>
                <p className="text-xs font-semibold text-foreground line-clamp-2">{card.front}</p>
                <p className="text-[11px] text-muted-foreground line-clamp-2 border-t border-border/40 pt-2">{card.back}</p>
              </div>
            );
          })}
        </div>
      ) : (
        <>
          {/* Main 3D Flippable Card Stage */}
          <div
            className="perspective-1000 w-full min-h-[320px] sm:min-h-[360px] cursor-pointer select-none"
            onClick={handleFlip}
          >
            <div
              className={cn(
                "relative w-full min-h-[320px] sm:min-h-[360px] transition-transform duration-500 transform-style-3d",
                isFlipped && "rotate-y-180"
              )}
            >
              {/* Card FRONT */}
              <div
                className={cn(
                  "absolute inset-0 w-full h-full p-8 sm:p-10 rounded-[32px] bg-card border border-border shadow-tactile-card flex flex-col justify-between backface-hidden",
                  "hover:border-primary/40 transition-colors"
                )}
              >
                <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                  <span className="uppercase font-bold tracking-wider text-[10px] px-2 py-0.5 rounded bg-muted border border-border">
                    Prompt / Term
                  </span>
                  <span className="text-[11px] flex items-center gap-1 text-muted-foreground">
                    <RotateCw className="size-3" /> Click or <kbd className="font-mono bg-muted px-1.5 py-0.5 rounded text-[10px]">Space</kbd> to flip
                  </span>
                </div>

                <div className="my-auto py-6">
                  <div className="text-base sm:text-xl font-bold font-display text-foreground leading-relaxed">
                    <MarkdownView>{currentCard.front}</MarkdownView>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border/40 text-[11px] font-mono text-muted-foreground">
                  <span>Press Space to reveal answer</span>
                  <span>#{currentIndex + 1}</span>
                </div>
              </div>

              {/* Card BACK */}
              <div
                className={cn(
                  "absolute inset-0 w-full h-full p-8 sm:p-10 rounded-[32px] bg-muted/40 border border-border shadow-tactile-card flex flex-col justify-between backface-hidden rotate-y-180",
                  "hover:border-primary/40 transition-colors"
                )}
              >
                <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                  <span className="uppercase font-bold tracking-wider text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                    Answer / Definition
                  </span>
                  <span className="text-[11px] flex items-center gap-1 text-muted-foreground">
                    <RotateCw className="size-3" /> Flip back
                  </span>
                </div>

                <div className="my-auto py-6">
                  <div className="text-sm sm:text-base text-foreground/95 leading-relaxed">
                    <MarkdownView>{currentCard.back}</MarkdownView>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border/40 text-[11px] font-mono text-muted-foreground">
                  <span>Rate retention below</span>
                  <span>Answer</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Review & Spaced-Repetition Actions */}
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
                <ChevronLeft className="size-4" />
                <span>Prev</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNext}
                className="rounded-full text-xs h-9 px-3.5 gap-1 border-border text-foreground hover:bg-muted"
                aria-label="Next card"
              >
                <span>Next</span>
                <ChevronRight className="size-4" />
              </Button>
            </div>

            {/* Spaced-Repetition Grading Buttons */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={markLearning}
                className="rounded-full text-xs h-9 px-4 gap-1.5 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/50"
                title="Mark for review (Key 1)"
              >
                <AlertCircle className="size-3.5" />
                <span>Again (<kbd className="font-mono text-[10px]">1</kbd>)</span>
              </Button>
              <Button
                size="sm"
                onClick={markMastered}
                className="rounded-full text-xs h-9 px-4 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                title="Mark mastered (Key 2 or 3)"
              >
                <CheckCircle2 className="size-3.5" />
                <span>Mastered (<kbd className="font-mono text-[10px]">2</kbd>)</span>
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
