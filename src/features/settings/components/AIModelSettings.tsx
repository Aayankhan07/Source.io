"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Key, Eye, EyeOff, Check, Sparkles, BookOpen, Layers, HelpCircle } from "lucide-react";
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
      <Card className="rounded-2xl border-border/80 bg-card shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">Notes Generation Depth</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Determines the structural density and explanatory depth of generated notes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {depthOptions.map((opt) => {
              const isSelected = settings.notesDepth === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => updateSettings({ notesDepth: opt.value })}
                  className={cn(
                    "p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between",
                    isSelected
                      ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary/30"
                      : "border-border/70 bg-background text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  )}
                >
                  <div className="space-y-1">
                    <span className={cn("text-xs font-semibold block", isSelected && "text-primary")}>
                      {opt.label}
                    </span>
                    <p className="text-[11px] text-muted-foreground leading-snug">{opt.desc}</p>
                  </div>
                  {isSelected && (
                    <div className="mt-3 flex items-center gap-1 text-[10.5px] font-mono text-primary font-medium">
                      <Check className="h-3 w-3" /> Active Default
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 2. Model & Reasoning Engine */}
      <Card className="rounded-2xl border-border/80 bg-card shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">Preferred AI Model Engine</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Select the primary LLM used for study notes compilation, quizzes, and grounded citations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {modelOptions.map((m) => {
              const isSelected = settings.preferredModel === m.value;
              return (
                <button
                  key={m.value}
                  onClick={() => updateSettings({ preferredModel: m.value })}
                  className={cn(
                    "p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-start justify-between gap-3",
                    isSelected
                      ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary/30"
                      : "border-border/70 bg-background text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  )}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={cn("text-xs font-semibold truncate", isSelected && "text-primary")}>
                        {m.label}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-muted text-muted-foreground border border-border/50 shrink-0">
                        {m.provider}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{m.desc}</p>
                  </div>
                  {isSelected && <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 3. Study Derivative Defaults */}
      <Card className="rounded-2xl border-border/80 bg-card shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">Derivative Study Assets Defaults</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Configure default quantity and rigor when creating study flashcards and quizzes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Flashcard batch size */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Default Flashcards Count</Label>
              <div className="flex items-center gap-1.5 p-1 bg-muted/40 rounded-xl border border-border/60">
                {cardCounts.map((count) => (
                  <button
                    key={count}
                    onClick={() => updateSettings({ flashcardBatchSize: count })}
                    className={cn(
                      "flex-1 py-1.5 text-xs font-mono font-medium rounded-lg transition-all cursor-pointer text-center",
                      settings.flashcardBatchSize === count
                        ? "bg-background text-foreground shadow-2xs font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {count} cards
                  </button>
                ))}
              </div>
            </div>

            {/* Quiz Difficulty */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Default Quiz Rigor</Label>
              <div className="flex items-center gap-1.5 p-1 bg-muted/40 rounded-xl border border-border/60">
                {difficulties.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => updateSettings({ quizDifficulty: d.value })}
                    className={cn(
                      "flex-1 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer text-center truncate px-1",
                      settings.quizDifficulty === d.value
                        ? "bg-background text-foreground shadow-2xs font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {d.label.split(" ")[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. BYOK API Keys */}
      <Card className="rounded-2xl border-border/80 bg-card shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold">Custom API Keys (BYOK)</CardTitle>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Optional
            </span>
          </div>
          <CardDescription className="text-xs">
            Supply your own API credentials to bypass platform rate limits. Keys are stored locally in your browser and never logged.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3.5">
          {/* Groq Key */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium flex items-center justify-between">
              <span>Groq API Key (gsk_...)</span>
              <span className="text-[10px] text-muted-foreground">For Llama 3.3 70B & Whisper</span>
            </Label>
            <div className="relative flex items-center">
              <Input
                type={showGroq ? "text" : "password"}
                placeholder="gsk_..."
                value={groqKey}
                onChange={(e) => setGroqKey(e.target.value)}
                className="pr-10 text-xs font-mono rounded-xl bg-background border-border/80"
              />
              <button
                type="button"
                onClick={() => setShowGroq(!showGroq)}
                className="absolute right-3 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                {showGroq ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {/* Gemini Key */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium flex items-center justify-between">
              <span>Google Gemini API Key (AIzaSy...)</span>
              <span className="text-[10px] text-muted-foreground">For Gemini 2.0 Flash</span>
            </Label>
            <div className="relative flex items-center">
              <Input
                type={showGemini ? "text" : "password"}
                placeholder="AIzaSy..."
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                className="pr-10 text-xs font-mono rounded-xl bg-background border-border/80"
              />
              <button
                type="button"
                onClick={() => setShowGemini(!showGemini)}
                className="absolute right-3 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                {showGemini ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {/* OpenAI Key */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium flex items-center justify-between">
              <span>OpenAI API Key (sk-...)</span>
              <span className="text-[10px] text-muted-foreground">For GPT-4o Mini</span>
            </Label>
            <div className="relative flex items-center">
              <Input
                type={showOpenAI ? "text" : "password"}
                placeholder="sk-..."
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                className="pr-10 text-xs font-mono rounded-xl bg-background border-border/80"
              />
              <button
                type="button"
                onClick={() => setShowOpenAI(!showOpenAI)}
                className="absolute right-3 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                {showOpenAI ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              onClick={handleSaveKeys}
              className="bg-primary hover:bg-primary/95 text-primary-foreground text-xs rounded-full px-4"
              size="sm"
            >
              Save Credentials
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
