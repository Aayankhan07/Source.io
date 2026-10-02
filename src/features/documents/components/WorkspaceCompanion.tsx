"use client";

import { useState } from "react";
import { MessagesSquare, Headphones, Layers, ListChecks, X, Maximize2, Minimize2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import ChatPanel from "@/features/chat/components/ChatPanel";
import CustomAudioPlayer from "@/features/documents/components/CustomAudioPlayer";
import FlashcardsDeck from "@/features/flashcards/components/FlashcardsDeck";
import QuizPlayer from "@/features/quiz/components/QuizPlayer";
import { FlashcardRow, PodcastRow, QuizRow } from "@/features/documents/types";
import { cn } from "@/lib/utils";

export type CompanionTab = "chat" | "podcast" | "cards" | "quiz";

interface WorkspaceCompanionProps {
  documentId: string;
  noteReady: boolean;
  activeTab: CompanionTab;
  onTabChange: (tab: CompanionTab) => void;
  onClose: () => void;
  podcast: PodcastRow | null;
  onGeneratePodcast: () => void;
  cards: FlashcardRow[];
  onRegenerateDerivatives: () => void;
  quiz: QuizRow | null;
  className?: string;
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
}

export default function WorkspaceCompanion({
  documentId,
  noteReady,
  activeTab,
  onTabChange,
  onClose,
  podcast,
  onGeneratePodcast,
  cards,
  onRegenerateDerivatives,
  quiz,
  className,
  isExpanded,
  onToggleExpanded,
}: WorkspaceCompanionProps) {
  const tabs = [
    {
      id: "chat" as const,
      label: "Grounded Chat",
      shortLabel: "Chat",
      icon: MessagesSquare,
      color: "text-sky-500",
      activeBg: "data-[state=active]:text-sky-600 dark:data-[state=active]:text-white",
    },
    {
      id: "podcast" as const,
      label: "Audio Recap",
      shortLabel: "Recap",
      icon: Headphones,
      color: "text-amber-500",
      badge: podcast?.status === "ready" ? "Ready" : undefined,
    },
    {
      id: "cards" as const,
      label: "Flashcards",
      shortLabel: "Cards",
      icon: Layers,
      color: "text-rose-500",
      badge: cards.length > 0 ? `${cards.length}` : undefined,
    },
    {
      id: "quiz" as const,
      label: "Diagnostic Quiz",
      shortLabel: "Quiz",
      icon: ListChecks,
      color: "text-emerald-500",
      badge: quiz?.questions?.length ? `${quiz.questions.length}Q` : undefined,
    },
  ];

  return (
    <aside className={cn("flex flex-col h-full bg-card border-l border-border/80 text-foreground overflow-hidden", className)}>
      {/* Companion Header & Tab Rail */}
      <div className="p-2 border-b border-border/70 flex items-center justify-between gap-1.5 shrink-0 bg-muted/20">
        {/* Switcher Pills */}
        <div className="flex items-center gap-1 overflow-x-auto p-0.5 rounded-full bg-muted/60 border border-border/60">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors shrink-0",
                  isActive
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/40"
                )}
                title={tab.label}
              >
                <Icon className={cn("h-3.5 w-3.5", isActive ? tab.color : "text-muted-foreground")} />
                <span>{tab.shortLabel}</span>
                {tab.badge && (
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold leading-tight",
                    isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Panel controls (Maximize & Close) */}
        <div className="flex items-center gap-0.5 shrink-0">
          {onToggleExpanded && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleExpanded}
              className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
              title={isExpanded ? "Collapse to side panel" : "Maximize companion"}
            >
              {isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
            title="Close companion panel (Cmd+\)"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Companion Body Viewport */}
      <div className="flex-1 overflow-y-auto relative">
        {activeTab === "chat" && (
          <div className="h-full flex flex-col">
            <ChatPanel documentId={documentId} noteReady={noteReady} />
          </div>
        )}

        {activeTab === "podcast" && (
          <div className="p-4 sm:p-5 h-full overflow-y-auto space-y-4">
            {podcast?.audio_url || podcast?.script ? (
              <CustomAudioPlayer
                audioUrl={podcast.audio_url}
                script={podcast.script}
                title="Audio Recap"
              />
            ) : (
              <div className="p-6 text-center border border-dashed border-border rounded-2xl bg-card space-y-3 mt-4">
                <Headphones className="h-8 w-8 text-amber-500 mx-auto" />
                <h4 className="text-sm font-semibold text-foreground">Podcast not generated yet</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Synthesize a 2-host audio discussion from your study notes.
                </p>
                <Button
                  onClick={onGeneratePodcast}
                  className="rounded-full text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Synthesize Audio Recap
                </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === "cards" && (
          <div className="p-4 sm:p-5 h-full overflow-y-auto space-y-4">
            {cards.length > 0 ? (
              <FlashcardsDeck cards={cards} />
            ) : (
              <div className="p-6 text-center border border-dashed border-border rounded-2xl bg-card space-y-3 mt-4">
                <Layers className="h-8 w-8 text-rose-500 mx-auto" />
                <h4 className="text-sm font-semibold text-foreground">No flashcards yet</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Generate active recall cards with spaced repetition intervals.
                </p>
                <Button
                  onClick={onRegenerateDerivatives}
                  className="rounded-full text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Generate Flashcards
                </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === "quiz" && (
          <div className="p-4 sm:p-5 h-full overflow-y-auto space-y-4">
            {quiz && quiz.questions && quiz.questions.length > 0 ? (
              <QuizPlayer quiz={quiz} />
            ) : (
              <div className="p-6 text-center border border-dashed border-border rounded-2xl bg-card space-y-3 mt-4">
                <ListChecks className="h-8 w-8 text-emerald-500 mx-auto" />
                <h4 className="text-sm font-semibold text-foreground">No quiz generated yet</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Generate an adaptive quiz with diagnostic explanations.
                </p>
                <Button
                  onClick={onRegenerateDerivatives}
                  className="rounded-full text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Generate Quiz
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
