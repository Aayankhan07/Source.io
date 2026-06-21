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
import type { QuizRow } from "@/features/documents/store/workspace";

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
  const percentage = Math.round((score / total) * 100);

  const submit = async () => {
    setSubmitted(true);
    if (!user) return;
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
    } catch (e: any) {
      toast({ title: "Could not save attempt", description: e.message, variant: "destructive" });
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
        <div className="glass-panel rounded-2xl border border-white/10 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-glow shrink-0">
              <Award className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-widest text-primary font-mono">Quiz Completed</span>
              <h3 className="text-xl font-bold text-white font-display">
                {percentage === 100 ? "Perfect Score!" : percentage >= 70 ? "Excellent Work!" : "Keep practicing!"}
              </h3>
              <p className="text-xs text-neutral-400">
                You correctly answered <span className="font-semibold text-white">{score}</span> out of <span className="font-semibold text-white">{total}</span> questions ({percentage}%).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0 w-full sm:w-auto justify-end">
            <div className="h-12 w-12 rounded-full border-2 border-white/5 bg-[#171720] flex items-center justify-center font-mono text-sm font-bold text-white">
              {percentage}%
            </div>
            <Button onClick={reset} className="bg-white hover:bg-neutral-200 text-black font-semibold text-xs py-2 px-4 rounded-lg flex items-center gap-1.5 shrink-0">
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
                "p-5 rounded-2xl border transition-all glass-panel",
                submitted 
                  ? (correct ? "border-emerald-500/20 bg-emerald-500/[0.02]" : "border-destructive/20 bg-destructive/[0.02]") 
                  : "border-white/5 bg-card/40"
              )}
            >
              {/* Question metadata header */}
              <div className="flex items-start gap-3 mb-4">
                <Badge variant="outline" className="mt-0.5 text-[10px] font-mono border-white/10 text-white bg-white/5 shrink-0">
                  {String(i + 1).padStart(2, '0')}
                </Badge>
                <div className="flex-1">
                  <div className="font-bold text-white leading-relaxed text-sm font-display">{q.question}</div>
                  <div className="text-[9px] uppercase tracking-wider text-neutral-500 font-mono mt-1">
                    {q.type === "mcq" ? "Multiple choice question" : q.type === "true_false" ? "True / False" : "Short answer"}
                  </div>
                </div>
                {submitted && (correct ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="h-5 w-5 text-destructive shrink-0" />
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
                          "w-full text-left p-3.5 rounded-xl border text-xs transition-all relative flex items-center justify-between font-medium",
                          !submitted && "hover:border-primary/40 hover:bg-white/[0.02] border-white/5 text-neutral-300 hover:text-white",
                          selected && !submitted && "border-primary bg-primary/10 text-white",
                          submitted && isAnswer && "border-emerald-500/50 bg-emerald-500/10 text-emerald-300 font-semibold",
                          submitted && selected && !isAnswer && "border-destructive/50 bg-destructive/10 text-destructive-foreground font-semibold",
                          submitted && !selected && !isAnswer && "border-white/5 opacity-55 text-neutral-500"
                        )}
                      >
                        <span>{c}</span>
                        {submitted && isAnswer && <Check className="h-4 w-4 text-emerald-400 shrink-0" />}
                        {submitted && selected && !isAnswer && <X className="h-4 w-4 text-destructive shrink-0" />}
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
                          "p-3 rounded-xl border text-xs font-semibold text-center transition-all flex items-center justify-center gap-1.5",
                          !submitted && "hover:border-primary/40 hover:bg-white/[0.02] border-white/5 text-neutral-300 hover:text-white",
                          selected && !submitted && "border-primary bg-primary/10 text-white",
                          submitted && isAnswer && "border-emerald-500/50 bg-emerald-500/10 text-emerald-300",
                          submitted && selected && !isAnswer && "border-destructive/50 bg-destructive/10 text-destructive-foreground",
                          submitted && !selected && !isAnswer && "border-white/5 opacity-55 text-neutral-500"
                        )}
                      >
                        <span>{c}</span>
                        {submitted && isAnswer && <Check className="h-3.5 w-3.5 text-emerald-400" />}
                        {submitted && selected && !isAnswer && <X className="h-3.5 w-3.5 text-destructive" />}
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
                    className="bg-[#121217] border-white/10 focus:border-primary/50 text-white placeholder-neutral-600 rounded-lg text-xs"
                  />
                </div>
              )}

              {/* Submitted Feedback details */}
              {submitted && (
                <div className="mt-4 pt-3 border-t border-white/5 text-xs space-y-2 animate-fade-in">
                  {!correct && (
                    <div className="flex items-center gap-1.5 text-neutral-300 bg-white/5 p-2.5 rounded-lg border border-white/5">
                      <span className="text-neutral-500">Correct Answer:</span>
                      <span className="font-semibold text-emerald-400">{q.correct}</span>
                    </div>
                  )}
                  {q.explanation && (
                    <div className="text-neutral-400 bg-neutral-900/50 p-3 rounded-lg border border-white/5 leading-relaxed text-[11px]">
                      <span className="font-bold text-white block mb-1">Explanation:</span>
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
        <div className="sticky bottom-0 bg-background/80 backdrop-blur py-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 px-2">
          <div className="text-[10px] text-neutral-500 font-mono">
            {Object.keys(answers).length} of {total} answered.
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {!allAnswered && (
              <span className="text-[10px] text-neutral-500">Answer all questions to submit</span>
            )}
            <Button 
              onClick={submit} 
              disabled={!allAnswered || saving} 
              className="w-full sm:w-auto bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-6 py-2 text-xs"
            >
              {saving ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Recording...
                </span>
              ) : (
                <span>Submit Assessment</span>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
