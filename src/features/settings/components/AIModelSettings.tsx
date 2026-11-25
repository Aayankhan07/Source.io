"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Bot,
  Key,
  Check,
  BookOpen,
  Layers,
  ShieldCheck,
  ExternalLink,
  HelpCircle,
  Loader2,
  Trash2,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettings } from "../context/SettingsContext";
import { NotesDepth, PreferredModel, QuizDifficulty } from "../types";
import { useToast } from "@/hooks/use-toast";
import {
  deleteApiKey,
  saveApiKey,
  testApiKey,
  type ApiKeyProvider,
} from "@/lib/services/apiKeys";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { accountKeys } from "@/lib/queryKeys";
import { useStoredApiKeys } from "../hooks/useStoredApiKeys";
import { SCHOLAR_CHECKOUT_BASE, openScholarCheckout } from "../checkout";

const PROVIDER_LABELS: Record<ApiKeyProvider, string> = { groq: "Groq", gemini: "Gemini", openai: "OpenAI" };

const BYOK_PROVIDERS: {
  id: ApiKeyProvider;
  label: string;
  badge: string;
  placeholder: string;
  consoleUrl: string;
}[] = [
  { id: "gemini", label: "Google Gemini API key", badge: "Free tier", placeholder: "AIza...", consoleUrl: "https://aistudio.google.com/apikey" },
  { id: "groq", label: "Groq API key", badge: "Free tier", placeholder: "gsk_...", consoleUrl: "https://console.groq.com/keys" },
  { id: "openai", label: "OpenAI API key", badge: "Paid credit", placeholder: "sk-...", consoleUrl: "https://platform.openai.com/api-keys" },
];

export default function AIModelSettings() {
  const { user } = useAuth();
  const { settings, updateSettings } = useSettings();
  const { toast } = useToast();

  const { data: userProfile } = useQuery({
    queryKey: accountKeys.profileQuotas(user?.id),
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("tier, daily_quota_limit, daily_tts_quota_limit")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const isScholarPass = userProfile?.tier === "pro";

  // Saved keys: provider + last 4 characters only (the server never returns a key).
  const queryClient = useQueryClient();
  const savedKeysQuery = useStoredApiKeys();
  const savedFor = savedKeysQuery.keyFor;

  const [busy, setBusy] = useState<{ provider: ApiKeyProvider; action: "save" | "test" | "delete" } | null>(null);
  const [testResults, setTestResults] = useState<Partial<Record<ApiKeyProvider, { ok: boolean; message: string }>>>({});
  const [showGuide, setShowGuide] = useState(false);

  const refreshSavedKeys = () => queryClient.invalidateQueries({ queryKey: accountKeys.apiKeys(user?.id) });

  /** Reads the key straight from the submitted form, so it never lives in component state. */
  const handleSaveKey = async (provider: ApiKeyProvider, form: HTMLFormElement) => {
    const input = form.elements.namedItem("apiKey") as HTMLInputElement | null;
    const key = input?.value.trim() ?? "";
    if (!key) {
      toast({ title: "Key missing", description: "Paste an API key first.", variant: "destructive" });
      return;
    }
    setBusy({ provider, action: "save" });
    try {
      const saved = await saveApiKey(provider, key);
      if (input) input.value = "";
      setTestResults((prev) => ({ ...prev, [provider]: { ok: true, message: `Key ending in ${saved.last4} works and is saved.` } }));
      toast({ title: "Key saved", description: `Your ${PROVIDER_LABELS[provider]} key was checked and stored encrypted.` });
      await refreshSavedKeys();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Could not save the key.";
      setTestResults((prev) => ({ ...prev, [provider]: { ok: false, message } }));
      toast({ title: "Key not saved", description: message, variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  const handleTestKey = async (provider: ApiKeyProvider) => {
    setBusy({ provider, action: "test" });
    try {
      const res = await testApiKey(provider);
      setTestResults((prev) => ({ ...prev, [provider]: { ok: true, message: `Key ending in ${res.last4} works.` } }));
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "The key test failed.";
      setTestResults((prev) => ({ ...prev, [provider]: { ok: false, message } }));
    } finally {
      setBusy(null);
    }
  };

  const handleDeleteKey = async (provider: ApiKeyProvider) => {
    setBusy({ provider, action: "delete" });
    try {
      await deleteApiKey(provider);
      setTestResults((prev) => ({ ...prev, [provider]: undefined }));
      toast({ title: "Key deleted", description: `Your ${PROVIDER_LABELS[provider]} key was removed from Source.io.` });
      await refreshSavedKeys();
    } catch (e: unknown) {
      toast({
        title: "Could not delete key",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setBusy(null);
    }
  };

  const depthOptions: { value: NotesDepth; label: string; desc: string }[] = [
    { value: "comprehensive", label: "Comprehensive Textbook", desc: "Exhaustive theory, rigorous formulas, KaTeX equations" },
    { value: "concise", label: "Concise Study Guide", desc: "High-yield summary, core definitions, quick review" },
    { value: "feynman", label: "Feynman Intuition (ELI5)", desc: "Analogies, plain language, conceptual breakdowns" },
  ];

  const modelOptions: { value: PreferredModel; label: string; provider: string; desc: string }[] = [
    { value: "llama-3.3-70b", label: "Llama 3.3 70B Versatile", provider: "Groq Cloud", desc: "Default high-speed reasoning engine" },
    { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash", provider: "Google DeepMind", desc: "Ultra-fast multimodal context processor" },
    { value: "gpt-4o-mini", label: "GPT-4o Mini", provider: "OpenAI", desc: "Balanced performance & structured output" },
    { value: "llama-3.1-8b", label: "Llama 3.1 8B Instant", provider: "Groq Cloud", desc: "Sub-second low latency inference" },
  ];

  const difficulties: { value: QuizDifficulty; label: string }[] = [
    { value: "easy", label: "Easy (Foundations)" },
    { value: "moderate", label: "Moderate (Standard)" },
    { value: "challenging", label: "Challenging (Deep Recall)" },
  ];

  const cardCounts = [10, 15, 20, 30];

  return (
    <div className="space-y-6">
      {/* 1. Default Notes Depth */}
      <div className="rounded-[28px] bg-white dark:bg-slate-900/90 border border-black/[0.04] dark:border-white/10 shadow-tactile-card p-6 sm:p-7 space-y-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="p-1.5 rounded-xl bg-muted text-foreground border border-border/80">
              <BookOpen className="size-4" />
            </span>
            <h3 className="text-base sm:text-lg font-bold font-display text-slate-900 dark:text-white">
              Notes Generation Depth
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Determines the structural density and explanatory depth of generated notes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {depthOptions.map((opt) => {
            const isSelected = settings.notesDepth === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => updateSettings({ notesDepth: opt.value })}
                className={cn(
                  "p-4 rounded-[20px] border text-left transition-all cursor-pointer flex flex-col justify-between select-none",
                  isSelected
                    ? "bg-[#1E232A] text-white dark:bg-white dark:text-slate-950 shadow-tactile-pill border-transparent scale-[1.01]"
                    : "bg-slate-50/70 dark:bg-white/[0.03] border-slate-200/80 dark:border-white/10 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5"
                )}
              >
                <div className="space-y-1">
                  <span className={cn("text-xs font-bold block", isSelected ? "text-white dark:text-slate-950" : "text-slate-900 dark:text-white")}>
                    {opt.label}
                  </span>
                  <p className={cn("text-xs leading-relaxed", isSelected ? "text-slate-300 dark:text-slate-600" : "text-slate-500 dark:text-slate-400")}>
                    {opt.desc}
                  </p>
                </div>
                {isSelected && (
                  <div className="mt-3 flex items-center gap-1 text-xs font-mono font-bold text-white dark:text-slate-950">
                    <Check className="size-3 stroke-[2.5]" /> Active Default
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Model & Reasoning Engine */}
      <div className="rounded-[28px] bg-white dark:bg-slate-900/90 border border-black/[0.04] dark:border-white/10 shadow-tactile-card p-6 sm:p-7 space-y-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="p-1.5 rounded-xl bg-muted text-foreground border border-border/80">
              <Bot className="size-4" />
            </span>
            <h3 className="text-base sm:text-lg font-bold font-display text-slate-900 dark:text-white">
              Preferred AI Model Engine
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Select the primary LLM used for study notes compilation, quizzes, and grounded citations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {modelOptions.map((m) => {
            const isSelected = settings.preferredModel === m.value;
            return (
              <button
                key={m.value}
                onClick={() => updateSettings({ preferredModel: m.value })}
                className={cn(
                  "p-4 rounded-[20px] border text-left transition-all cursor-pointer flex items-start justify-between gap-3 select-none",
                  isSelected
                    ? "bg-[#1E232A] text-white dark:bg-white dark:text-slate-950 shadow-tactile-pill border-transparent scale-[1.01]"
                    : "bg-slate-50/70 dark:bg-white/[0.03] border-slate-200/80 dark:border-white/10 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5"
                )}
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn("text-xs font-bold truncate", isSelected ? "text-white dark:text-slate-950" : "text-slate-900 dark:text-white")}>
                      {m.label}
                    </span>
                    <span className={cn(
                      "text-xs font-mono px-2 py-0.5 rounded-md border shrink-0",
                      isSelected
                        ? "bg-white/20 dark:bg-slate-950/10 border-white/20 text-white dark:text-slate-950"
                        : "bg-slate-100 dark:bg-white/10 border-slate-200 dark:border-white/10 text-slate-500"
                    )}>
                      {m.provider}
                    </span>
                  </div>
                  <p className={cn("text-xs", isSelected ? "text-slate-300 dark:text-slate-600" : "text-slate-500 dark:text-slate-400")}>
                    {m.desc}
                  </p>
                </div>
                {isSelected && <Check className="size-4 shrink-0 mt-0.5 text-white dark:text-slate-950 stroke-[2.5]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Study Derivative Defaults */}
      <div className="rounded-[28px] bg-white dark:bg-slate-900/90 border border-black/[0.04] dark:border-white/10 shadow-tactile-card p-6 sm:p-7 space-y-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="p-1.5 rounded-xl bg-muted text-foreground border border-border/80">
              <Layers className="size-4" />
            </span>
            <h3 className="text-base sm:text-lg font-bold font-display text-slate-900 dark:text-white">
              Derivative Study Defaults
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Configure default quantity and rigor when creating study flashcards and adaptive quizzes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Flashcard batch size */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Default Flashcards Count</Label>
            <div className="flex items-center gap-1.5 p-1 bg-slate-100/70 dark:bg-white/[0.04] rounded-[16px] border border-slate-200/80 dark:border-white/10">
              {cardCounts.map((count) => (
                <button
                  key={count}
                  onClick={() => updateSettings({ flashcardBatchSize: count })}
                  className={cn(
                    "flex-1 py-2 text-xs font-mono font-medium rounded-[12px] transition-all cursor-pointer text-center",
                    settings.flashcardBatchSize === count
                      ? "bg-[#1E232A] text-white dark:bg-white dark:text-slate-950 shadow-2xs font-bold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  {count} cards
                </button>
              ))}
            </div>
          </div>

          {/* Quiz Difficulty */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Default Quiz Rigor</Label>
            <div className="flex items-center gap-1.5 p-1 bg-slate-100/70 dark:bg-white/[0.04] rounded-[16px] border border-slate-200/80 dark:border-white/10">
              {difficulties.map((d) => (
                <button
                  key={d.value}
                  onClick={() => updateSettings({ quizDifficulty: d.value })}
                  className={cn(
                    "flex-1 py-2 text-xs font-medium rounded-[12px] transition-all cursor-pointer text-center truncate px-1",
                    settings.quizDifficulty === d.value
                      ? "bg-[#1E232A] text-white dark:bg-white dark:text-slate-950 shadow-2xs font-bold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  {d.label.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3.5 Scholar Pass Subscription Tier */}
      <div className="rounded-[28px] bg-card border-2 border-border p-6 sm:p-7 shadow-tactile-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-muted text-foreground">
                <Sparkles className="size-4" />
              </span>
              <h3 className="text-base sm:text-lg font-bold font-display text-foreground">
                Scholar Pass ($9/mo)
              </h3>
              {isScholarPass ? (
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                  Active Pro
                </span>
              ) : (
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold">
                  Free Tier (25 actions/day)
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
              For heavy academic semesters and exam preparation. Unlocks 200 daily generation actions, 50 studio audio podcast renders, unlimited saved document slots, and priority high-throughput GPU queuing.
            </p>
          </div>

          <div>
            {isScholarPass ? (
              <span className="h-10 px-4 rounded-full bg-muted text-xs font-semibold text-foreground flex items-center gap-1.5 select-none">
                <Check className="size-3.5 text-emerald-500" />
                <span>Scholar Pass Active</span>
              </span>
            ) : (
              <a
                href={SCHOLAR_CHECKOUT_BASE}
                onClick={(e) => openScholarCheckout(user, "ai_model_settings", e)}
                target="_blank"
                rel="noreferrer"
                className="h-10 px-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center gap-2 hover:opacity-90 shadow-tactile-pill transition-all cursor-pointer whitespace-nowrap"
              >
                <span>Upgrade to Scholar Pass</span>
                <ExternalLink className="size-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* 4. Your own API keys: stored encrypted on the server; only the last 4 characters are shown */}
      <div className="rounded-[28px] bg-white dark:bg-slate-900/90 border border-black/[0.04] dark:border-white/10 shadow-tactile-card p-6 sm:p-7 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <span className="p-1.5 rounded-xl bg-muted text-foreground border border-border/80">
                <Key className="size-4" />
              </span>
              <h3 className="text-base sm:text-lg font-bold font-display text-slate-900 dark:text-white">
                Use Your Own AI Key (Optional)
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              With your own key there is no daily action cap and documents can be up to 300 pages. Source.io works fully without one.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            className="text-xs font-semibold text-foreground hover:underline flex items-center gap-1 cursor-pointer"
          >
            <HelpCircle className="size-3.5" />
            <span>{showGuide ? "Hide details" : "How keys are stored"}</span>
          </button>
        </div>

        {/* Short guide: free Gemini key */}
        <div className="p-4 rounded-2xl bg-muted/40 border border-border text-xs text-foreground space-y-2 leading-relaxed">
          <div className="flex items-center gap-2 font-bold">
            <Sparkles className="size-4 shrink-0" />
            <span>Get a free Gemini key in Google AI Studio (about 2 minutes)</span>
          </div>
          <ol className="list-decimal pl-5 space-y-0.5 text-[12px] text-muted-foreground">
            <li>
              Open{" "}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-foreground font-semibold underline inline-flex items-center gap-0.5"
              >
                aistudio.google.com/apikey
                <ExternalLink className="size-3" />
              </a>{" "}
              and sign in with your Google account.
            </li>
            <li>Click <strong>Create API key</strong> and copy it (it starts with &quot;AIza&quot;).</li>
            <li>Paste it into the Gemini box below and press <strong>Save</strong>. We check it before saving.</li>
          </ol>
          <p className="text-[12px] text-muted-foreground">
            Google&apos;s free-tier terms apply to your own account, and Google may use free-tier data to improve its products.
          </p>
        </div>

        {showGuide && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-white/5 space-y-2 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            <p>
              An <strong>API key</strong> is an access pass for an AI company. When you save one, Source.io sends your requests to that company with your key instead of using Source.io&apos;s shared daily allowance.
            </p>
            <p>
              • <strong>How it&apos;s stored:</strong> we check the key with the provider, then encrypt it on our server. It is never kept in your browser, and we only ever show its last 4 characters.
            </p>
            <p>
              • <strong>Billing:</strong> the provider&apos;s own limits and prices apply. Groq and Gemini offer free, rate-limited access; OpenAI needs paid credit.
            </p>
            <p>
              • <strong>Leaked key?</strong> Delete it here and revoke it in the provider&apos;s dashboard.
            </p>
          </div>
        )}

        <div className="space-y-4 pt-1">
          {BYOK_PROVIDERS.map((p) => {
            const saved = savedFor(p.id);
            const result = testResults[p.id];
            const isBusy = busy?.provider === p.id;
            return (
              <div
                key={p.id}
                className="space-y-1.5 p-3.5 rounded-2xl bg-slate-50/60 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10"
              >
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor={`byok-${p.id}`} className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <span>{p.label}</span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-semibold">
                      {p.badge}
                    </span>
                  </Label>
                  <a
                    href={p.consoleUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[12px] text-slate-500 dark:text-slate-400 hover:underline flex items-center gap-1"
                  >
                    <span>Create key</span>
                    <ExternalLink className="size-3" />
                  </a>
                </div>

                {saved ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="h-10 px-3.5 flex-1 min-w-[10rem] rounded-[16px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-xs font-mono flex items-center">
                      Saved key ending in •••• {saved.last4}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleTestKey(p.id)}
                      disabled={isBusy}
                      className="h-10 px-3.5 rounded-[16px] text-xs font-semibold bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isBusy && busy?.action === "test" ? <Loader2 className="size-3.5 animate-spin" /> : <ShieldCheck className="size-3.5" />}
                      <span>Test</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteKey(p.id)}
                      disabled={isBusy}
                      className="h-10 px-3.5 rounded-[16px] text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isBusy && busy?.action === "delete" ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                      <span>Delete</span>
                    </button>
                  </div>
                ) : (
                  <form
                    className="flex items-center gap-2"
                    autoComplete="off"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void handleSaveKey(p.id, e.currentTarget);
                    }}
                  >
                    <Input
                      id={`byok-${p.id}`}
                      name="apiKey"
                      type="password"
                      autoComplete="off"
                      spellCheck={false}
                      placeholder={p.placeholder}
                      disabled={isBusy}
                      className="flex-1 text-xs font-mono rounded-[16px] bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 h-10"
                    />
                    <button
                      type="submit"
                      disabled={isBusy}
                      className="h-10 px-4 rounded-[16px] text-xs font-bold bg-slate-950 text-white dark:bg-white dark:text-slate-950 flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isBusy && busy?.action === "save" ? <Loader2 className="size-3.5 animate-spin" /> : <ShieldCheck className="size-3.5" />}
                      <span>Save</span>
                    </button>
                  </form>
                )}

                {result && (
                  <p
                    role="status"
                    className={cn(
                      "text-[12px] font-medium pt-1",
                      result.ok ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                    )}
                  >
                    {result.message}
                  </p>
                )}
              </div>
            );
          })}
          {savedKeysQuery.isError && (
            <p className="text-[12px] text-rose-600 dark:text-rose-400">Could not load your saved keys. Refresh to try again.</p>
          )}
        </div>
      </div>
    </div>
  );
}
