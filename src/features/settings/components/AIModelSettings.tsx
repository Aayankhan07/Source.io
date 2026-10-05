"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Bot, Key, Eye, EyeOff, Check, BookOpen, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettings } from "../context/SettingsContext";
import { NotesDepth, PreferredModel, QuizDifficulty } from "../types";
import { useToast } from "@/hooks/use-toast";

export default function AIModelSettings() {
  const { settings, updateSettings } = useSettings();
  const { toast } = useToast();

  const [showGroq, setShowGroq] = useState(false);
  const [showGemini, setShowGemini] = useState(false);
  const [showOpenAI, setShowOpenAI] = useState(false);

  const [groqKey, setGroqKey] = useState(settings.apiKeys.groq || "");
  const [geminiKey, setGeminiKey] = useState(settings.apiKeys.gemini || "");
  const [openaiKey, setOpenaiKey] = useState(settings.apiKeys.openai || "");

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

      {/* 4. BYOK API Keys */}
      <div className="rounded-[28px] bg-white dark:bg-slate-900/90 border border-black/[0.04] dark:border-white/10 shadow-tactile-card p-6 sm:p-7 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1 rounded-lg bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300">
                <Key className="size-4" />
              </span>
              <h3 className="text-base sm:text-lg font-bold font-display text-slate-900 dark:text-white">
                Custom API Keys (BYOK)
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Supply your own provider keys to bypass rate limits. Stored securely in your browser.
            </p>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-semibold">
            Optional
          </span>
        </div>

        <div className="space-y-4 pt-1">
          {/* Groq Key */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Groq API Key (gsk_...)</span>
              <span className="text-[11px] text-slate-400 font-normal">For Llama 3.3 70B & Whisper</span>
            </Label>
            <div className="relative flex items-center">
              <Input
                type={showGroq ? "text" : "password"}
                placeholder="gsk_..."
                value={groqKey}
                onChange={(e) => setGroqKey(e.target.value)}
                className="pr-10 text-xs font-mono rounded-[16px] bg-slate-50/70 dark:bg-white/[0.04] border-slate-200 dark:border-white/10 h-10"
              />
              <button
                type="button"
                onClick={() => setShowGroq(!showGroq)}
                className="absolute right-3 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                {showGroq ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {/* Gemini Key */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Google Gemini API Key (AIzaSy...)</span>
              <span className="text-[11px] text-slate-400 font-normal">For Gemini 2.0 Flash</span>
            </Label>
            <div className="relative flex items-center">
              <Input
                type={showGemini ? "text" : "password"}
                placeholder="AIzaSy..."
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                className="pr-10 text-xs font-mono rounded-[16px] bg-slate-50/70 dark:bg-white/[0.04] border-slate-200 dark:border-white/10 h-10"
              />
              <button
                type="button"
                onClick={() => setShowGemini(!showGemini)}
                className="absolute right-3 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                {showGemini ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {/* OpenAI Key */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>OpenAI API Key (sk-...)</span>
              <span className="text-[11px] text-slate-400 font-normal">For GPT-4o Mini</span>
            </Label>
            <div className="relative flex items-center">
              <Input
                type={showOpenAI ? "text" : "password"}
                placeholder="sk-..."
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                className="pr-10 text-xs font-mono rounded-[16px] bg-slate-50/70 dark:bg-white/[0.04] border-slate-200 dark:border-white/10 h-10"
              />
              <button
                type="button"
                onClick={() => setShowOpenAI(!showOpenAI)}
                className="absolute right-3 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                {showOpenAI ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={handleSaveKeys}
              className="h-10 px-5 rounded-full bg-slate-950 text-white dark:bg-white dark:text-slate-950 font-bold text-xs shadow-tactile-pill hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              Save Credentials
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
