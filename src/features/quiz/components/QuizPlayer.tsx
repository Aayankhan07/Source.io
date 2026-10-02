"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, RotateCcw, Loader2, Award, Check, X, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { QuizRow } from "@/features/documents/types";

type Answer = string;

function normalize(s: string) {
  return s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

function isCorrect(userAns: string, correct: string, type: string): boolean {
  if (!userAns) return false;
  if (type === "short_answer") {
    const u = normalize(userAns);
    const c = normalize(correct);
    if (!u || !c) return false;
    return u === c || u.includes(c) || c.includes(u);
  }
  return userAns === correct;
}

export default function QuizPlayer({ quiz }: { quiz: QuizRow }) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const total = quiz.questions.length;
  const score = useMemo(() => {
    return quiz.questions.reduce((acc, q) => acc + (isCorrect(answers[q.id] ?? "", q.correct, q.type) ? 1 : 0), 0);
  }, [answers, quiz.questions]);
  
  const allAnswered = quiz.questions.every((q) => (answers[q.id] ?? "").trim().length > 0);
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

  const submit = async () => {
    setSubmitted(true);
    if (!user) {
      // Scored locally, but there is no session to attribute the attempt to.
      // Say so rather than letting the completed UI imply it was saved.
      toast({
        title: "Attempt not saved",
        description: "You're signed out, so this result wasn't recorded.",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      const payload = quiz.questions.map((q) => ({
        question_id: q.id,
        answer: answers[q.id] ?? "",
        correct: isCorrect(answers[q.id] ?? "", q.correct, q.type),
      }));
      const { error } = await supabase.from("quiz_attempts").insert({
        user_id: user.id,
        quiz_id: quiz.id,
        answers: payload,
        score,
        total,
      });
      if (error) throw error;
      toast({ title: "Attempt recorded", description: `Scored ${score} / ${total}` });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast({ title: "Could not save attempt", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setAnswers({});
    setSubmitted(false);
  };

  return (
    <div className="space-y-6 text-left animate-fade-in">
      {/* Gamified Celebration Score card */}
      {submitted && (
        <div className="glass-card glass-highlight rounded-2xl border border-border/80 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-md">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-sky-50 dark:bg-zinc-800/80 border border-sky-100 dark:border-zinc-700 flex items-center justify-center text-sky-700 dark:text-zinc-200 shrink-0">
              <Award className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <span className="text-xs uppercase font-semibold tracking-wider text-sky-700 dark:text-zinc-400 font-mono">Quiz Completed</span>
              <h3 className="text-xl font-semibold text-foreground font-display">
                {percentage === 100 ? "Perfect Score!" : percentage >= 70 ? "Excellent Work!" : "Keep practicing!"}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                You correctly answered <span className="font-semibold text-foreground">{score}</span> out of <span className="font-semibold text-foreground">{total}</span> questions ({percentage}%).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0 w-full sm:w-auto justify-end">
            <div className="h-12 w-12 rounded-full border border-border bg-muted flex items-center justify-center font-mono text-sm font-bold text-foreground shadow-2xs">
              {percentage}%
            </div>
            <Button onClick={reset} className="font-semibold text-xs py-2 px-5 rounded-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 text-white flex items-center gap-1.5 shrink-0 shadow-sm">
              <RotateCcw className="h-3.5 w-3.5" /> Try again
            </Button>
          </div>
        </div>
      )}

      {/* Questions list */}
      <div className="space-y-4">
        {quiz.questions.map((q, i) => {
          const userAns = answers[q.id] ?? "";
          const correct = isCorrect(userAns, q.correct, q.type);
          return (
            <div
              key={q.id}
              className={cn(
                "glass-card p-6 rounded-2xl border transition-all shadow-2xs",
                submitted 
                  ? (correct ? "border-emerald-500/40 bg-emerald-50/30 dark:bg-emerald-950/30" : "border-rose-500/40 bg-rose-50/30 dark:bg-rose-950/30") 
                  : "border-border/80"
              )}
            >
              {/* Question metadata header */}
              <div className="flex items-start gap-3 mb-4">
                <Badge variant="outline" className="mt-0.5 text-xs font-mono border-border text-muted-foreground bg-muted rounded-md shrink-0">
                  {String(i + 1).padStart(2, '0')}
                </Badge>
                <div className="flex-1">
                  <div className="font-semibold text-foreground leading-relaxed text-sm font-display">{q.question}</div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono mt-0.5">
                    {q.type === "mcq" ? "Multiple choice question" : q.type === "true_false" ? "True / False" : "Short answer"}
                  </div>
                </div>
                {submitted && (correct ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                ) : (
                  <XCircle className="h-5 w-5 text-rose-500 shrink-0" />
                ))}
              </div>

              {/* Multiple Choice Option Buttons */}
              {q.type === "mcq" && q.choices && (
                <div className="grid gap-2">
                  {q.choices.map((c, j) => {
                    const selected = userAns === c;
                    const isAnswer = c === q.correct;
                    return (
                      <button
                        key={j}
                        type="button"
                        onClick={() => !submitted && setAnswers((a) => ({ ...a, [q.id]: c }))}
                        disabled={submitted}
                        className={cn(
                          "w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm transition-all relative flex items-center justify-between font-medium focus-ring",
                          !submitted && "hover:border-slate-400 dark:hover:border-slate-600 hover:bg-muted/60 border-border text-foreground",
                          selected && !submitted && "border-slate-900 bg-slate-100 dark:border-white dark:bg-zinc-800 text-foreground ring-2 ring-primary/20",
                          submitted && isAnswer && "border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-semibold",
                          submitted && selected && !isAnswer && "border-rose-500 bg-rose-50/70 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 font-semibold",
                          submitted && !selected && !isAnswer && "border-border opacity-50 text-muted-foreground"
                        )}
                      >
                        <span>{c}</span>
                        {submitted && isAnswer && <Check className="h-4 w-4 text-emerald-500 shrink-0" />}
                        {submitted && selected && !isAnswer && <X className="h-4 w-4 text-rose-500 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* True/False Buttons */}
              {q.type === "true_false" && (
                <div className="grid grid-cols-2 gap-3">
                  {["True", "False"].map((c) => {
                    const selected = userAns === c;
                    const isAnswer = c === q.correct;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => !submitted && setAnswers((a) => ({ ...a, [q.id]: c }))}
                        disabled={submitted}
                        className={cn(
                          "p-3 rounded-xl border text-xs sm:text-sm font-semibold text-center transition-all flex items-center justify-center gap-1.5 focus-ring",
                          !submitted && "hover:border-slate-400 dark:hover:border-slate-600 hover:bg-muted/60 border-border text-foreground",
                          selected && !submitted && "border-slate-900 bg-slate-100 dark:border-white dark:bg-zinc-800 text-foreground ring-2 ring-primary/20",
                          submitted && isAnswer && "border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300",
                          submitted && selected && !isAnswer && "border-rose-500 bg-rose-50/70 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300",
                          submitted && !selected && !isAnswer && "border-border opacity-50 text-muted-foreground"
                        )}
                      >
                        <span>{c}</span>
                        {submitted && isAnswer && <Check className="h-3.5 w-3.5 text-emerald-500" />}
                        {submitted && selected && !isAnswer && <X className="h-3.5 w-3.5 text-rose-500" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Short Answer Input Field */}
              {q.type === "short_answer" && (
                <div className="space-y-2">
                  <Label htmlFor={`sa-${q.id}`} className="sr-only">Your answer</Label>
                  <Input
                    id={`sa-${q.id}`}
                    value={userAns}
                    onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                    disabled={submitted}
                    placeholder="Type your answer explanation here..."
                    className="bg-card border-border focus:border-primary/50 text-foreground placeholder:text-muted-foreground rounded-xl text-sm"
                  />
                </div>
              )}

              {/* Submitted Feedback details */}
              {submitted && (
                <div className="mt-4 pt-3 border-t border-border/60 text-sm space-y-2 animate-fade-in">
                  {!correct && (
                    <div className="flex items-center gap-1.5 text-foreground bg-muted/60 p-2.5 rounded-xl border border-border">
                      <span className="text-muted-foreground">Correct Answer:</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">{q.correct}</span>
                    </div>
                  )}
                  {q.explanation && (
                    <div className="text-muted-foreground bg-muted/30 p-3 rounded-xl border border-border leading-relaxed text-sm">
                      <span className="font-bold text-foreground block mb-1">Explanation:</span>
                      {q.explanation}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Floating Action Submit footer bar */}
      {!submitted && (
        <div className="sticky bottom-0 bg-background/80 backdrop-blur py-4 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3 px-2">
          <div className="text-xs text-muted-foreground font-mono">
            {Object.keys(answers).length} of {total} answered.
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {!allAnswered && (
              <span className="text-xs text-muted-foreground">Answer all questions to submit</span>
            )}
            <Button 
              onClick={submit} 
              disabled={!allAnswered || saving} 
              className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 text-white font-semibold px-6 py-2 text-xs rounded-full shadow-sm"
            >
              {saving ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Recording...
                </span>
              ) : (
                <span>Submit answers</span>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
