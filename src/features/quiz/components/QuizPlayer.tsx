import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, RotateCcw, Loader2 } from "lucide-react";
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
      toast({ title: "Attempt saved", description: `Scored ${score} / ${total}` });
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
    <div className="space-y-5">
      {submitted && (
        <div className="rounded-xl border border-border bg-card p-5 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Your score</div>
            <div className="text-2xl font-semibold">
              {score} <span className="text-muted-foreground text-base font-normal">/ {total}</span>
            </div>
          </div>
          <Button variant="outline" onClick={reset}>
            <RotateCcw className="h-4 w-4 mr-2" /> Retry
          </Button>
        </div>
      )}

      {quiz.questions.map((q, i) => {
        const userAns = answers[q.id] ?? "";
        const correct = isCorrect(userAns, q.correct, q.type);
        return (
          <div
            key={q.id}
            className={cn(
              "p-5 rounded-xl border bg-card transition-colors",
              submitted ? (correct ? "border-emerald-500/40" : "border-destructive/40") : "border-border",
            )}
          >
            <div className="flex items-start gap-2 mb-3">
              <Badge variant="outline" className="mt-0.5 text-[10px]">
                {i + 1}
              </Badge>
              <div className="flex-1">
                <div className="font-medium leading-relaxed">{q.question}</div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground mt-1">
                  {q.type === "mcq" ? "Multiple choice" : q.type === "true_false" ? "True / False" : "Short answer"}
                </div>
              </div>
              {submitted && (correct ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive shrink-0" />
              ))}
            </div>

            {q.type === "mcq" && q.choices && (
              <div className="space-y-2">
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
                        "w-full text-left p-3 rounded-lg border transition-colors text-sm",
                        !submitted && "hover:border-primary/50 hover:bg-muted/50",
                        selected && !submitted && "border-primary bg-primary/10",
                        submitted && isAnswer && "border-emerald-500/50 bg-emerald-500/10",
                        submitted && selected && !isAnswer && "border-destructive/50 bg-destructive/10",
                        !submitted && !selected && "border-border",
                      )}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            )}

            {q.type === "true_false" && (
              <div className="grid grid-cols-2 gap-2">
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
                        "p-3 rounded-lg border transition-colors text-sm font-medium",
                        !submitted && "hover:border-primary/50 hover:bg-muted/50",
                        selected && !submitted && "border-primary bg-primary/10",
                        submitted && isAnswer && "border-emerald-500/50 bg-emerald-500/10",
                        submitted && selected && !isAnswer && "border-destructive/50 bg-destructive/10",
                        !submitted && !selected && "border-border",
                      )}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            )}

            {q.type === "short_answer" && (
              <div className="space-y-1.5">
                <Label htmlFor={`sa-${q.id}`} className="sr-only">Your answer</Label>
                <Input
                  id={`sa-${q.id}`}
                  value={userAns}
                  onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                  disabled={submitted}
                  placeholder="Type your answer…"
                />
              </div>
            )}

            {submitted && (
              <div className="mt-3 text-sm space-y-1">
                {!correct && (
                  <div>
                    <span className="text-muted-foreground">Correct answer: </span>
                    <span className="font-medium">{q.correct}</span>
                  </div>
                )}
                {q.explanation && (
                  <div className="text-muted-foreground">{q.explanation}</div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {!submitted && (
        <div className="sticky bottom-0 bg-background/80 backdrop-blur py-3 -mx-1 px-1">
          <Button onClick={submit} disabled={!allAnswered || saving} className="w-full">
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Submit answers
          </Button>
          {!allAnswered && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              Answer all {total} questions to submit.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
