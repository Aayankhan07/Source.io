"use client";

import { useEffect } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  MessagesSquare,
  Headphones,
  Layers,
  ListChecks,
  Maximize2,
  Minimize2,
  Copy,
  RefreshCw,
  SunMoon,
  Library,
  Hash,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";
import { OutlineHeading } from "./WorkspaceOutline";
import { useTheme } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";

interface WorkspaceCommandMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  headings: OutlineHeading[];
  onSelectHeading: (id: string) => void;
  companionTab: string;
  onSelectCompanionTab: (tab: "chat" | "podcast" | "cards" | "quiz") => void;
  companionOpen: boolean;
  onToggleCompanion: () => void;
  focusMode: boolean;
  onToggleFocusMode: () => void;
  onRegenerateNotes?: () => void;
  onRegenerateDerivatives?: () => void;
  onRegeneratePodcast?: () => void;
  notesMarkdown?: string | null;
  onNavigateHome: () => void;
}

export default function WorkspaceCommandMenu({
  open,
  onOpenChange,
  headings,
  onSelectHeading,
  onSelectCompanionTab,
  companionOpen,
  onToggleCompanion,
  focusMode,
  onToggleFocusMode,
  onRegenerateNotes,
  onRegenerateDerivatives,
  onRegeneratePodcast,
  notesMarkdown,
  onNavigateHome,
}: WorkspaceCommandMenuProps) {
  const { toggleTheme } = useTheme();
  const { toast } = useToast();

  // Global keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === "\\" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onToggleCompanion();
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange, onToggleCompanion]);

  const handleCopyNotes = () => {
    if (!notesMarkdown) return;
    navigator.clipboard.writeText(notesMarkdown);
    toast({ title: "Copied to clipboard", description: "Study notes markdown copied." });
    onOpenChange(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or jump to section..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Companion Tools */}
        <CommandGroup heading="Companion Tools">
          <CommandItem
            onSelect={() => {
              onSelectCompanionTab("chat");
              onOpenChange(false);
            }}
          >
            <MessagesSquare className="mr-2 h-4 w-4 text-sky-500" />
            <span>Open Grounded AI Chat</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              onSelectCompanionTab("podcast");
              onOpenChange(false);
            }}
          >
            <Headphones className="mr-2 h-4 w-4 text-amber-500" />
            <span>Open Audio Recap Podcast</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              onSelectCompanionTab("cards");
              onOpenChange(false);
            }}
          >
            <Layers className="mr-2 h-4 w-4 text-rose-500" />
            <span>Review Flashcards Deck</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              onSelectCompanionTab("quiz");
              onOpenChange(false);
            }}
          >
            <ListChecks className="mr-2 h-4 w-4 text-emerald-500" />
            <span>Take Diagnostic Quiz</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* View & Layout Controls */}
        <CommandGroup heading="Workspace Layout">
          <CommandItem
            onSelect={() => {
              onToggleFocusMode();
              onOpenChange(false);
            }}
          >
            {focusMode ? (
              <>
                <Minimize2 className="mr-2 h-4 w-4 text-primary" />
                <span>Exit Fullscreen Focus Mode</span>
              </>
            ) : (
              <>
                <Maximize2 className="mr-2 h-4 w-4 text-primary" />
                <span>Enter Focus Mode (Full Width)</span>
              </>
            )}
          </CommandItem>
          <CommandItem
            onSelect={() => {
              onToggleCompanion();
              onOpenChange(false);
            }}
          >
            {companionOpen ? (
              <>
                <PanelRightClose className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>Collapse Companion Dock (Cmd+\)</span>
              </>
            ) : (
              <>
                <PanelRightOpen className="mr-2 h-4 w-4 text-primary" />
                <span>Expand Companion Dock (Cmd+\)</span>
              </>
            )}
          </CommandItem>
          <CommandItem
            onSelect={() => {
              toggleTheme();
              onOpenChange(false);
            }}
          >
            <SunMoon className="mr-2 h-4 w-4 text-amber-400" />
            <span>Toggle Theme (Light / Dark)</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              onNavigateHome();
              onOpenChange(false);
            }}
          >
            <Library className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Return to Document Library</span>
          </CommandItem>
        </CommandGroup>

        {/* Action Commands */}
        <CommandSeparator />
        <CommandGroup heading="Document Actions">
          <CommandItem onSelect={handleCopyNotes}>
            <Copy className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Copy Notes Markdown</span>
          </CommandItem>
          {onRegenerateNotes && (
            <CommandItem
              onSelect={() => {
                onRegenerateNotes();
                onOpenChange(false);
              }}
            >
              <RefreshCw className="mr-2 h-4 w-4 text-sky-400" />
              <span>Regenerate Study Notes</span>
            </CommandItem>
          )}
          {onRegenerateDerivatives && (
            <CommandItem
              onSelect={() => {
                onRegenerateDerivatives();
                onOpenChange(false);
              }}
            >
              <RefreshCw className="mr-2 h-4 w-4 text-rose-400" />
              <span>Regenerate Flashcards & Quiz</span>
            </CommandItem>
          )}
          {onRegeneratePodcast && (
            <CommandItem
              onSelect={() => {
                onRegeneratePodcast();
                onOpenChange(false);
              }}
            >
              <RefreshCw className="mr-2 h-4 w-4 text-amber-400" />
              <span>Synthesize Audio Podcast</span>
            </CommandItem>
          )}
        </CommandGroup>

        {/* Headings / Sections Navigation */}
        {headings.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Jump to Section">
              {headings.slice(0, 15).map((h) => (
                <CommandItem
                  key={h.id}
                  onSelect={() => {
                    onSelectHeading(h.id);
                    onOpenChange(false);
                  }}
                >
                  <Hash className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                  <span className="truncate">{h.text}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
