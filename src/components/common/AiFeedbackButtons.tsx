"use client";

import { useState } from "react";
import { ThumbsUp, ThumbsDown, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth/context/AuthContext";
import { cn } from "@/lib/utils";

interface AiFeedbackButtonsProps {
  documentId: string;
  feature: "notes" | "derivatives" | "chat";
  model?: string;
  className?: string;
}

export function AiFeedbackButtons({
  documentId,
  feature,
  model = "llama-3.3-70b",
  className,
}: AiFeedbackButtonsProps) {
  const { user } = useAuth();
  const [submitted, setSubmitted] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleFeedback = async (helpful: boolean) => {
    if (submitted !== null || submitting) return;
    setSubmitting(true);
    setSubmitted(helpful);

    try {
      await supabase.from("ai_feedback").insert({
        user_id: user?.id || null,
        document_id: documentId,
        feature,
        model,
        helpful,
      });
    } catch (err) {
      console.warn("Feedback recording notice:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted !== null) {
    return (
      <div className={cn("inline-flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 select-none", className)}>
        <Check className="size-3 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
        <span>Thanks for your feedback!</span>
      </div>
    );
  }

  return (
    <div className={cn("inline-flex items-center gap-2 select-none", className)}>
      <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Was this helpful?</span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => handleFeedback(true)}
          disabled={submitting}
          title="Helpful"
          className="p-1 rounded-full text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
        >
          <ThumbsUp className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={() => handleFeedback(false)}
          disabled={submitting}
          title="Not helpful"
          className="p-1 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
        >
          <ThumbsDown className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

export default AiFeedbackButtons;
