"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ListChecks,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Award,
  BookOpen,
  ChevronRight,
  Check,
  X,
  Layers,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import MarkdownView from "@/components/common/MarkdownView";
import type { QuizRow, QuizQuestionRow } from "@/features/documents/types";

interface QuizPlayerProps {
  documentId: string;
  quiz: QuizRow | null;
  onRegenerate: () => void;
  loading?: boolean;
}

export function QuizPlayer({
  documentId,
  quiz,
  onRegenerate,
  loading = false,
}: QuizPlayerProps) {
  const [questions, setQuestions] = useState<QuizQuestionRow[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [activeReviewId, setActiveReviewId] = useState<string | null>(null);

  // Sync state whenever quiz changes
  useEffect(() => {
    if (quiz && quiz.questions && quiz.questions.length > 0) {
      setQuestions(quiz.questions);
      setCurrentIndex(0);
      setSelectedAnswers({});
      setIsCompleted(false);
      setActiveReviewId(null);
    } else {
      setQuestions([]);
    }
  }, [quiz]);

  const currentQ = questions[currentIndex];
  const totalQuestions = questions.length;
  const currentAnswer = currentQ ? selectedAnswers[currentQ.id] : undefined;
  const isCurrentAnswered = currentAnswer !== undefined;

  // Compute normalized choices for any question type
  const activeChoices = useMemo(() => {
    if (!currentQ) return [];
    if (currentQ.choices && currentQ.choices.length > 0) {
      return currentQ.choices;
    }
    if (currentQ.type === "true_false") {
      return ["True", "False"];
    }
    return [];
  }, [currentQ]);

  // Overall score calculations
  const { score, correctCount, wrongCount } = useMemo(() => {
    let correct = 0;
    let wrong = 0;
    questions.forEach((q) => {
      const ans = selectedAnswers[q.id];
      if (ans !== undefined) {
        if (ans.trim().toLowerCase() === q.correct.trim().toLowerCase()) {
          correct++;
        } else {
          wrong++;
        }
      }
    });
    const percentage = totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0;
    return { score: percentage, correctCount: correct, wrongCount: wrong };
  }, [questions, selectedAnswers, totalQuestions]);

  const handleSelectChoice = (choice: string) => {
    if (!currentQ || isCurrentAnswered) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQ.id]: choice,
    }));
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsCompleted(true);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleRestart = () => {
    setSelectedAnswers({});
    setCurrentIndex(0);
    setIsCompleted(false);
    setActiveReviewId(null);
  };

  // Empty state when no quiz exists
  if (!quiz || questions.length === 0) {
    return (
      <div className="bg-card p-10 rounded-3xl border border-border text-center space-y-5 shadow-tactile-card max-w-xl mx-auto my-6">
        <div className="size-16 rounded-2xl bg-muted/60 border border-border/80 flex items-center justify-center text-foreground mx-auto shadow-tactile-pill">
          <ListChecks className="size-8 text-sky-600 dark:text-sky-400 stroke-[2]" />
        </div>
        <div className="space-y-1.5">
          <h3 className="font-bold text-foreground font-display text-lg tracking-tight">
            No quiz available yet
          </h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
            Generate an active-retrieval exam session with diagnostic explanations, proof citations, and immediate color-coded feedback.
          </p>
        </div>
        <Button
          onClick={onRegenerate}
          disabled={loading}
          className="rounded-full text-xs font-semibold h-9 px-6 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm cursor-pointer transition-all active:scale-95"
        >
          {loading ? (
            <RotateCcw className="size-3.5 mr-2 animate-spin" />
          ) : (
            <Sparkles className="size-3.5 mr-2 text-sky-300" />
          )}
          <span>{loading ? "Generating Quiz..." : "Generate Practice Quiz"}</span>
        </Button>
      </div>
    );
  }

  // Final Summary & Score Celebration Screen
  if (isCompleted) {
    const isPassing = score >= 70;

    return (
      <div className="max-w-2xl mx-auto my-4 space-y-6">
        {/* Score Hero Card */}
        <div className="bg-card rounded-3xl border border-border p-8 shadow-tactile-card text-center space-y-5 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-500" />

          <div
            className={cn(
              "size-20 rounded-full mx-auto flex items-center justify-center border shadow-tactile-pill",
              isPassing
                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                : "bg-amber-500/10 text-amber-500 border-amber-500/30",
            )}
          >
            {isPassing ? (
              <Award className="size-10 stroke-[2.2]" />
            ) : (
              <BarChart3 className="size-10 stroke-[2.2]" />
            )}
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-muted border border-border text-muted-foreground">
              Quiz Completed
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-display text-foreground tracking-tight">
              {isPassing ? "Mastery Achieved!" : "Good Practice Session!"}
            </h2>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              You scored <span className="font-semibold text-foreground font-mono">{score}%</span> on{" "}
              <span className="italic font-medium">{quiz.title}</span>. Review your answers below to solidify any missed concepts.
            </p>
          </div>

          {/* Metric Stats Pills */}
          <div className="grid grid-cols-3 gap-3 pt-2 max-w-md mx-auto">
            <div className="bg-muted/40 rounded-2xl p-3 border border-border/60 text-center">
              <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground block mb-0.5">
                Score
              </span>
              <span className="text-xl font-bold font-mono text-foreground">{score}%</span>
            </div>
            <div className="bg-emerald-500/10 rounded-2xl p-3 border border-emerald-500/20 text-center">
              <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-600 dark:text-emerald-400 block mb-0.5">
                Correct
              </span>
              <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {correctCount}
              </span>
            </div>
            <div className="bg-rose-500/10 rounded-2xl p-3 border border-rose-500/20 text-center">
              <span className="text-[10px] uppercase font-mono tracking-wider text-rose-600 dark:text-rose-400 block mb-0.5">
                Incorrect
              </span>
              <span className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400">
                {wrongCount}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <Button
              onClick={handleRestart}
              className="rounded-full text-xs font-semibold h-9 px-5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm cursor-pointer transition-all active:scale-95"
            >
              <RotateCcw className="size-3.5 mr-2" />
              <span>Retake Quiz</span>
            </Button>
            <Button
              onClick={onRegenerate}
              disabled={loading}
              variant="outline"
              className="rounded-full text-xs font-semibold h-9 px-5 bg-card hover:bg-muted border-border cursor-pointer transition-all active:scale-95"
            >
              <Sparkles className="size-3.5 mr-2 text-sky-500" />
              <span>Generate New Questions</span>
            </Button>
          </div>
        </div>

        {/* Detailed Question Review List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-muted-foreground">
              Question Breakdown ({totalQuestions})
            </h3>
            <span className="text-xs text-muted-foreground font-mono">
              {correctCount} / {totalQuestions} answered correctly
            </span>
          </div>

          <div className="space-y-3">
            {questions.map((q, idx) => {
              const userAns = selectedAnswers[q.id];
              const isCorrect = userAns && userAns.trim().toLowerCase() === q.correct.trim().toLowerCase();
              const isExpanded = activeReviewId === q.id;

              return (
                <div
                  key={q.id}
                  className={cn(
                    "rounded-2xl border transition-all bg-card overflow-hidden",
                    isCorrect
                      ? "border-emerald-500/25 hover:border-emerald-500/40"
                      : "border-rose-500/30 hover:border-rose-500/50",
                  )}
                >
                  <button
                    onClick={() => setActiveReviewId(isExpanded ? null : q.id)}
                    className="w-full text-left p-4 flex items-start justify-between gap-3 cursor-pointer select-none"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={cn(
                          "size-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold font-mono mt-0.5",
                          isCorrect
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            : "bg-rose-500/15 text-rose-600 dark:text-rose-400",
                        )}
                      >
                        {isCorrect ? <Check className="size-3.5 stroke-[3]" /> : <X className="size-3.5 stroke-[3]" />}
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono uppercase text-muted-foreground font-semibold">
                            Q{idx + 1}
                          </span>
                          <span
                            className={cn(
                              "text-[10px] font-mono px-2 py-0.5 rounded-full font-bold",
                              isCorrect
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : "bg-rose-500/10 text-rose-600 dark:text-rose-400",
                            )}
                          >
                            {isCorrect ? "Correct" : "Incorrect"}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-foreground line-clamp-2 leading-relaxed">
                          {q.question}
                        </p>
                      </div>
                    </div>

                    <ChevronRight
                      className={cn(
                        "size-4 text-muted-foreground shrink-0 transition-transform duration-200 mt-1",
                        isExpanded && "rotate-90",
                      )}
                    />
                  </button>

                  {/* Expanded Explanation Drawer */}
                  {isExpanded && (
                    <div className="p-4 pt-1 border-t border-border/50 bg-muted/20 space-y-3 text-xs">
                      <div className="grid gap-2 sm:grid-cols-2 pt-2">
                        <div className="p-2.5 rounded-xl bg-card border border-border/60">
                          <span className="text-[10px] font-mono uppercase text-muted-foreground block mb-1">
                            Your Answer
                          </span>
                          <span
                            className={cn(
                              "font-semibold",
                              isCorrect ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
                            )}
                          >
                            {userAns || "No answer recorded"}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-card border border-border/60">
                          <span className="text-[10px] font-mono uppercase text-muted-foreground block mb-1">
                            Correct Answer
                          </span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            {q.correct}
                          </span>
                        </div>
                      </div>

                      {q.explanation && (
                        <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-900 dark:text-sky-200">
                          <span className="font-semibold block mb-1 text-[11px] text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
                            <BookOpen className="size-3.5" />
                            Explanation & Reference
                          </span>
                          <MarkdownView className="text-xs leading-relaxed text-foreground/90 font-sans">
                            {q.explanation}
                          </MarkdownView>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Active Stepped Question Runner
  const isCorrect =
    isCurrentAnswered &&
    currentAnswer.trim().toLowerCase() === currentQ.correct.trim().toLowerCase();

  return (
    <div className="max-w-2xl mx-auto my-4 space-y-5">
      {/* Top Header: Progress & Question Count */}
      <div className="bg-card rounded-2xl border border-border p-4 shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-md bg-muted text-foreground border border-border">
              Question {currentIndex + 1} of {totalQuestions}
            </span>
            <span className="text-muted-foreground hidden sm:inline text-xs font-medium">
              {quiz.title}
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="size-3" />
              {correctCount}
            </span>
            <span className="text-muted-foreground/40">/</span>
            <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
              <XCircle className="size-3" />
              {wrongCount}
            </span>
          </div>
        </div>

        {/* Stepped Progress Bar */}
        <div className="w-full bg-muted/60 h-1.5 rounded-full overflow-hidden flex">
          {questions.map((q, idx) => {
            const ans = selectedAnswers[q.id];
            const answered = ans !== undefined;
            const correct = answered && ans.trim().toLowerCase() === q.correct.trim().toLowerCase();
            const isCurrent = idx === currentIndex;

            return (
              <div
                key={q.id}
                className={cn(
                  "h-full flex-1 border-r border-background/40 transition-all duration-300",
                  !answered && isCurrent && "bg-sky-500",
                  !answered && !isCurrent && "bg-transparent",
                  answered && correct && "bg-emerald-500",
                  answered && !correct && "bg-rose-500",
                )}
              />
            );
          })}
        </div>
      </div>

      {/* Main Question Card */}
      <div className="bg-card rounded-3xl border border-border p-6 sm:p-8 shadow-tactile-card space-y-6">
        {/* Question Text */}
        <div className="space-y-3">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
            <HelpCircle className="size-3.5 text-sky-500" />
            {currentQ.type === "true_false" ? "True or False" : "Multiple Choice Question"}
          </span>
          <div className="text-base sm:text-lg font-semibold font-display text-foreground leading-snug">
            <MarkdownView>{currentQ.question}</MarkdownView>
          </div>
        </div>

        {/* Choice Buttons List */}
        <div className="space-y-2.5 pt-2">
          {activeChoices.map((choice, idx) => {
            const choiceLabel = String.fromCharCode(65 + idx); // 'A', 'B', 'C', 'D'
            const isSelected = currentAnswer === choice;
            const isThisCorrect = choice.trim().toLowerCase() === currentQ.correct.trim().toLowerCase();

            // Status styles once answered
            let stateStyles = "hover:bg-muted/70 hover:border-border/90 border-border bg-card/50";
            let badgeStyles = "bg-muted text-muted-foreground border-border";

            if (isCurrentAnswered) {
              if (isThisCorrect) {
                // Correct answer glows green
                stateStyles =
                  "border-emerald-500/80 bg-emerald-500/10 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-100 ring-1 ring-emerald-500/40 shadow-sm";
                badgeStyles = "bg-emerald-500 text-white font-bold border-transparent";
              } else if (isSelected && !isThisCorrect) {
                // User picked wrong answer: glows red
                stateStyles =
                  "border-rose-500/80 bg-rose-500/10 dark:bg-rose-950/20 text-rose-900 dark:text-rose-100 ring-1 ring-rose-500/40";
                badgeStyles = "bg-rose-500 text-white font-bold border-transparent";
              } else {
                // Other unselected choices fade slightly
                stateStyles = "border-border/50 bg-card/30 opacity-50";
                badgeStyles = "bg-muted/60 text-muted-foreground/60 border-border/40";
              }
            }

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectChoice(choice)}
                disabled={isCurrentAnswered}
                className={cn(
                  "w-full text-left p-3.5 sm:p-4 rounded-2xl border text-xs sm:text-sm font-medium transition-all duration-150 flex items-center justify-between gap-3 group cursor-pointer",
                  stateStyles,
                  !isCurrentAnswered && "hover:scale-[1.008] active:scale-[0.995]",
                  isCurrentAnswered && "cursor-default",
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={cn(
                      "size-7 rounded-xl flex items-center justify-center font-mono text-xs border shrink-0 transition-colors",
                      badgeStyles,
                    )}
                  >
                    {choiceLabel}
                  </span>
                  <span className="leading-relaxed min-w-0 font-sans">{choice}</span>
                </div>

                {isCurrentAnswered && isThisCorrect && (
                  <CheckCircle2 className="size-5 text-emerald-500 shrink-0 animate-scale-in" />
                )}
                {isCurrentAnswered && isSelected && !isThisCorrect && (
                  <XCircle className="size-5 text-rose-500 shrink-0 animate-scale-in" />
                )}
              </button>
            );
          })}
        </div>

        {/* Immediate Diagnostic Explanation (Revealed once answered) */}
        {isCurrentAnswered && (
          <div
            className={cn(
              "rounded-2xl p-4 sm:p-5 border transition-all animate-fade-in space-y-2.5",
              isCorrect
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-100"
                : "bg-rose-500/10 border-rose-500/30 text-rose-950 dark:text-rose-100",
            )}
          >
            <div className="flex items-center gap-2">
              {isCorrect ? (
                <>
                  <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                  <span className="font-bold font-mono text-xs uppercase text-emerald-600 dark:text-emerald-400">
                    Correct Answer
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="size-4 text-rose-600 dark:text-rose-400 stroke-[2.5]" />
                  <span className="font-bold font-mono text-xs uppercase text-rose-600 dark:text-rose-400">
                    Incorrect — Correct choice is: {currentQ.correct}
                  </span>
                </>
              )}
            </div>

            {currentQ.explanation ? (
              <div className="text-xs leading-relaxed opacity-90 font-sans pt-1">
                <MarkdownView>{currentQ.explanation}</MarkdownView>
              </div>
            ) : (
              <p className="text-xs opacity-80 italic">
                Review this key point in the workspace notes tab for additional context.
              </p>
            )}
          </div>
        )}

        {/* Bottom Actions Bar */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-border/70">
          <Button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            variant="ghost"
            size="sm"
            className="rounded-full text-xs h-8 px-3 cursor-pointer"
          >
            <ArrowLeft className="size-3.5 mr-1" />
            <span>Previous</span>
          </Button>

          {isCurrentAnswered && (
            <Button
              onClick={handleNext}
              className="rounded-full text-xs font-semibold h-9 px-5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm cursor-pointer transition-all active:scale-95 animate-fade-in"
            >
              <span>{currentIndex === totalQuestions - 1 ? "Finish Quiz" : "Next Question"}</span>
              <ArrowRight className="size-3.5 ml-1.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
