"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Bot, 
  Key, 
  Eye, 
  EyeOff, 
  Check, 
  BookOpen, 
  Layers, 
  AlertTriangle, 
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
import { testProviderApiKey, ByokTestResult } from "@/lib/services/byokTest";

export default function AIModelSettings() {
  const { settings, updateSettings } = useSettings();
  const { toast } = useToast();

  const [showGroq, setShowGroq] = useState(false);
  const [showGemini, setShowGemini] = useState(false);
  const [showOpenAI, setShowOpenAI] = useState(false);

  const [groqKey, setGroqKey] = useState(settings.apiKeys.groq || "");
  const [geminiKey, setGeminiKey] = useState(settings.apiKeys.gemini || "");
  const [openaiKey, setOpenaiKey] = useState(settings.apiKeys.openai || "");

  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, ByokTestResult | null>>({});
  const [showGuide, setShowGuide] = useState(false);

  const handleTestKey = async (provider: "groq" | "gemini" | "openai", key: string) => {
    if (!key.trim()) {
      toast({
        title: "Key missing",
        description: "Please enter an API key first before testing connection.",
        variant: "destructive",
      });
      return;
    }

    setTestingProvider(provider);
    try {
      const result = await testProviderApiKey(provider, key);
      setTestResults((prev) => ({ ...prev, [provider]: result }));
      toast({
        title: result.ok ? "Connection Successful" : "Provider Test Failed",
        description: result.message,
        variant: result.ok ? "default" : "destructive",
      });
    } finally {
      setTestingProvider(null);
    }
  };

  const handleRemoveKey = (provider: "groq" | "gemini" | "openai") => {
    if (provider === "groq") {
      setGroqKey("");
      updateSettings({ apiKeys: { ...settings.apiKeys, groq: undefined } });
    } else if (provider === "gemini") {
      setGeminiKey("");
      updateSettings({ apiKeys: { ...settings.apiKeys, gemini: undefined } });
    } else if (provider === "openai") {
      setOpenaiKey("");
      updateSettings({ apiKeys: { ...settings.apiKeys, openai: undefined } });
    }
    setTestResults((prev) => ({ ...prev, [provider]: null }));
    toast({
      title: "Key Removed",
      description: `Your ${provider.toUpperCase()} key was cleared from browser memory.`,
    });
  };

  const handleSaveKeys = () => {
    updateSettings({
      apiKeys: {
        groq: groqKey.trim() || undefined,
        gemini: geminiKey.trim() || undefined,
        openai: openaiKey.trim() || undefined,
      },
    });
    toast({
      title: "API Keys Saved",
      description: "Custom provider keys updated securely in your local browser session.",
    });
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
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-lg bg-sky-100 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300">
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
                  <p className={cn("text-[11px] leading-relaxed", isSelected ? "text-slate-300 dark:text-slate-600" : "text-slate-500 dark:text-slate-400")}>
                    {opt.desc}
                  </p>
                </div>
                {isSelected && (
                  <div className="mt-3 flex items-center gap-1 text-[10.5px] font-mono font-bold text-amber-400 dark:text-amber-600">
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
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-lg bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300">
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
                      "text-[10px] font-mono px-2 py-0.5 rounded-md border shrink-0",
                      isSelected
                        ? "bg-white/20 dark:bg-slate-950/10 border-white/20 text-white dark:text-slate-950"
                        : "bg-slate-100 dark:bg-white/10 border-slate-200 dark:border-white/10 text-slate-500"
                    )}>
                      {m.provider}
                    </span>
                  </div>
                  <p className={cn("text-[11px]", isSelected ? "text-slate-300 dark:text-slate-600" : "text-slate-500 dark:text-slate-400")}>
                    {m.desc}
                  </p>
                </div>
                {isSelected && <Check className="size-4 shrink-0 mt-0.5 text-amber-400 dark:text-amber-600 stroke-[2.5]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Study Derivative Defaults */}
      <div className="rounded-[28px] bg-white dark:bg-slate-900/90 border border-black/[0.04] dark:border-white/10 shadow-tactile-card p-6 sm:p-7 space-y-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">
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

      {/* 4. BYOK API Keys & Non-Technical Setup Guide */}
      <div className="rounded-[28px] bg-white dark:bg-slate-900/90 border border-black/[0.04] dark:border-white/10 shadow-tactile-card p-6 sm:p-7 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1 rounded-lg bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300">
                <Key className="size-4" />
              </span>
              <h3 className="text-base sm:text-lg font-bold font-display text-slate-900 dark:text-white">
                Use Your Own AI Provider (Optional BYOK)
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Supply your own provider keys to bypass daily question limits. Held strictly in your current browser session.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowGuide(!showGuide)}
              className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <HelpCircle className="size-3.5" />
              <span>{showGuide ? "Hide Setup Guide" : "View Setup Guide"}</span>
            </button>
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 font-semibold">
              Advanced Mode (Self-Managed)
            </span>
          </div>
        </div>

        {/* BYOK Warning & Security Notice Banner */}
        <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 space-y-2 leading-relaxed">
          <div className="flex items-center gap-2 font-bold">
            <AlertTriangle className="size-4 text-amber-600 shrink-0" />
            <span>Important BYOK Billing & Security Precautions</span>
          </div>
          <p className="text-[11px] text-amber-800 dark:text-amber-300">
            • <strong>No Billing Control:</strong> Source.io does not control provider billing, pricing, quotas, or rate limits. Adding billing or paid models to your provider account may incur charges from that provider.
          </p>
          <p className="text-[11px] text-amber-800 dark:text-amber-300">
            • <strong>Browser Environment Disclosure:</strong> Keys are kept only in your local browser memory for this session and disappear on refresh or logout. However, browser extensions, compromised devices, or scripts can inspect browser memory. Never paste a production or unrestricted key.
          </p>
          <p className="text-[11px] text-amber-800 dark:text-amber-300">
            • <strong>Revoking Leaked Keys:</strong> If you ever suspect a key was exposed, open your provider dashboard immediately and revoke/delete it.
          </p>
        </div>

        {/* Non-Technical Setup Guide */}
        {showGuide && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-white/5 space-y-3.5 text-xs text-slate-700 dark:text-slate-300">
            <div className="flex items-center gap-2 font-bold font-display text-slate-900 dark:text-white">
              <Sparkles className="size-4 text-purple-600" />
              <span>How API Keys Work (Student Plain-Language Guide)</span>
            </div>
            
            <p className="leading-relaxed">
              An <strong>API key</strong> is a digital access pass for an AI company. When you provide your own key, Source.io sends requests directly using your personal allowance instead of Source.io's shared daily quota.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 space-y-1.5 flex flex-col justify-between">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">1. Groq Cloud</span>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Groq may provide free, rate-limited API access for eligible accounts. Check current terms before use.
                  </p>
                </div>
                <div className="space-y-1 pt-1 border-t border-border/50 text-[10.5px]">
                  <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" className="text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-1 hover:underline">
                    <span>Create key: console.groq.com</span>
                    <ExternalLink className="size-2.5" />
                  </a>
                  <a href="https://groq.com/pricing" target="_blank" rel="noreferrer" className="text-slate-500 dark:text-slate-400 flex items-center gap-1 hover:underline">
                    <span>Groq Pricing</span>
                    <ExternalLink className="size-2.5" />
                  </a>
                  <a href="https://console.groq.com/docs/rate-limits" target="_blank" rel="noreferrer" className="text-slate-500 dark:text-slate-400 flex items-center gap-1 hover:underline">
                    <span>Groq Rate Limits & Quotas</span>
                    <ExternalLink className="size-2.5" />
                  </a>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 space-y-1.5 flex flex-col justify-between">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">2. Google AI Studio</span>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Google may offer free rate-limited developer access for Gemini models. Check eligibility.
                  </p>
                </div>
                <div className="space-y-1 pt-1 border-t border-border/50 text-[10.5px]">
                  <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-1 hover:underline">
                    <span>Create key: aistudio.google.com</span>
                    <ExternalLink className="size-2.5" />
                  </a>
                  <a href="https://ai.google.dev/pricing" target="_blank" rel="noreferrer" className="text-slate-500 dark:text-slate-400 flex items-center gap-1 hover:underline">
                    <span>Gemini Pricing & Limits</span>
                    <ExternalLink className="size-2.5" />
                  </a>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 space-y-1.5 flex flex-col justify-between">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">3. OpenAI</span>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Requires a paid account with credit. Powers GPT-4o Mini and other OpenAI models.
                  </p>
                </div>
                <div className="space-y-1 pt-1 border-t border-border/50 text-[10.5px]">
                  <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-1 hover:underline">
                    <span>Create key: platform.openai.com</span>
                    <ExternalLink className="size-2.5" />
                  </a>
                  <a href="https://openai.com/pricing" target="_blank" rel="noreferrer" className="text-slate-500 dark:text-slate-400 flex items-center gap-1 hover:underline">
                    <span>OpenAI Pricing & Usage</span>
                    <ExternalLink className="size-2.5" />
                  </a>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-800/40 text-[11px] space-y-1 text-purple-900 dark:text-purple-200">
              <span className="font-bold block">Quick 4-Step Instructions:</span>
              <p>1. Open the provider's official console link above and sign in.</p>
              <p>2. Create a restricted API key and copy it.</p>
              <p>3. Paste the key into the matching box below.</p>
              <p>4. Press <strong>"Test Key"</strong> to verify connectivity with a minimal 5-token check (no document cost).</p>
            </div>
          </div>
        )}

        <div className="space-y-4 pt-1">
          {/* Groq Key */}
          <div className="space-y-1.5 p-3.5 rounded-2xl bg-slate-50/60 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <span>Groq API Key (gsk_...)</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-semibold">
                  Open Models
                </span>
              </Label>
              {groqKey && (
                <button
                  type="button"
                  onClick={() => handleRemoveKey("groq")}
                  className="text-[11px] text-rose-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="size-3" />
                  <span>Remove key</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 flex items-center">
                <Input
                  type={showGroq ? "text" : "password"}
                  placeholder="gsk_..."
                  value={groqKey}
                  onChange={(e) => setGroqKey(e.target.value)}
                  className="pr-10 text-xs font-mono rounded-[16px] bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 h-10"
                />
                <button
                  type="button"
                  onClick={() => setShowGroq(!showGroq)}
                  className="absolute right-3 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showGroq ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleTestKey("groq", groqKey)}
                disabled={testingProvider === "groq" || !groqKey.trim()}
                className="h-10 px-3.5 rounded-[16px] text-xs font-semibold bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {testingProvider === "groq" ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <ShieldCheck className="size-3.5" />
                )}
                <span>Test Key</span>
              </button>
            </div>

            {testResults["groq"] && (
              <p className={cn(
                "text-[11px] font-medium pt-1",
                testResults["groq"].ok ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
              )}>
                {testResults["groq"].message}
              </p>
            )}
          </div>

          {/* Gemini Key */}
          <div className="space-y-1.5 p-3.5 rounded-2xl bg-slate-50/60 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <span>Google Gemini API Key (AIzaSy...)</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 font-semibold">
                  Free Tier
                </span>
              </Label>
              {geminiKey && (
                <button
                  type="button"
                  onClick={() => handleRemoveKey("gemini")}
                  className="text-[11px] text-rose-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="size-3" />
                  <span>Remove key</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 flex items-center">
                <Input
                  type={showGemini ? "text" : "password"}
                  placeholder="AIzaSy..."
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  className="pr-10 text-xs font-mono rounded-[16px] bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 h-10"
                />
                <button
                  type="button"
                  onClick={() => setShowGemini(!showGemini)}
                  className="absolute right-3 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showGemini ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleTestKey("gemini", geminiKey)}
                disabled={testingProvider === "gemini" || !geminiKey.trim()}
                className="h-10 px-3.5 rounded-[16px] text-xs font-semibold bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {testingProvider === "gemini" ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <ShieldCheck className="size-3.5" />
                )}
                <span>Test Key</span>
              </button>
            </div>

            {testResults["gemini"] && (
              <p className={cn(
                "text-[11px] font-medium pt-1",
                testResults["gemini"].ok ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
              )}>
                {testResults["gemini"].message}
              </p>
            )}
          </div>

          {/* OpenAI Key */}
          <div className="space-y-1.5 p-3.5 rounded-2xl bg-slate-50/60 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <span>OpenAI API Key (sk-...)</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-semibold">
                  Paid Credit
                </span>
              </Label>
              {openaiKey && (
                <button
                  type="button"
                  onClick={() => handleRemoveKey("openai")}
                  className="text-[11px] text-rose-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="size-3" />
                  <span>Remove key</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 flex items-center">
                <Input
                  type={showOpenAI ? "text" : "password"}
                  placeholder="sk-..."
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  className="pr-10 text-xs font-mono rounded-[16px] bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 h-10"
                />
                <button
                  type="button"
                  onClick={() => setShowOpenAI(!showOpenAI)}
                  className="absolute right-3 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showOpenAI ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleTestKey("openai", openaiKey)}
                disabled={testingProvider === "openai" || !openaiKey.trim()}
                className="h-10 px-3.5 rounded-[16px] text-xs font-semibold bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {testingProvider === "openai" ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <ShieldCheck className="size-3.5" />
                )}
                <span>Test Key</span>
              </button>
            </div>

            {testResults["openai"] && (
              <p className={cn(
                "text-[11px] font-medium pt-1",
                testResults["openai"].ok ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
              )}>
                {testResults["openai"].message}
              </p>
            )}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={handleSaveKeys}
              className="h-10 px-5 rounded-full bg-slate-950 text-white dark:bg-white dark:text-slate-950 font-bold text-xs shadow-tactile-pill hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              Save Credentials to Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
