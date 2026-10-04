"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  SlidersHorizontal,
  Type,
  Sigma,
  Layout,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettings } from "@/features/settings/context/SettingsContext";
import {
  NotesFontSize,
  NotesFontFamily,
  NotesLineHeight,
  RegenerationTone,
} from "@/features/settings/types";

interface NotesSettingsPopoverProps {
  className?: string;
}

export default function NotesSettingsPopover({ className }: NotesSettingsPopoverProps) {
  const { notesSettings, updateNotesSettings } = useSettings();

  const fontSizes: { value: NotesFontSize; label: string; desc: string }[] = [
    { value: "compact", label: "Compact", desc: "14px" },
    { value: "regular", label: "Default", desc: "16px" },
    { value: "large", label: "Large", desc: "18px" },
  ];

  const fontFamilies: { value: NotesFontFamily; label: string; preview: string }[] = [
    { value: "sans", label: "Sans", preview: "Geist / Inter" },
    { value: "serif", label: "Serif", preview: "Editorial" },
    { value: "mono", label: "Mono", preview: "Technical" },
  ];

  const lineHeights: { value: NotesLineHeight; label: string }[] = [
    { value: "tight", label: "Tight" },
    { value: "normal", label: "Normal" },
    { value: "relaxed", label: "Spacious" },
  ];

  const tones: { value: RegenerationTone; label: string; desc: string }[] = [
    { value: "academic", label: "Academic & Rigorous", desc: "Deep theory & formulas" },
    { value: "simplified", label: "Simplified (Feynman)", desc: "Intuitive analogies" },
    { value: "exam-prep", label: "Exam-Prep Highlights", desc: "Key facts & anchors" },
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 px-2.5 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/80 gap-1.5 transition-colors cursor-pointer",
            className
          )}
          title="Notes & Reading Preferences"
          aria-label="Notes & Reading Preferences"
        >
          <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="hidden xl:inline">Notes Settings</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-80 p-0 rounded-xl border border-border bg-card shadow-lg text-foreground overflow-hidden"
      >
        {/* Header */}
        <div className="p-3.5 border-b border-border/70 flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center">
              <SlidersHorizontal className="h-3.5 w-3.5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-foreground font-display leading-tight">
                Notes preferences
              </h4>
              <p className="text-[11px] text-muted-foreground">Reading typography & layout</p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              updateNotesSettings({
                fontSize: "regular",
                fontFamily: "sans",
                lineHeight: "normal",
                renderKaTeX: true,
                showPageSummaryBanner: true,
                autoScrollOutline: true,
                regenerationTone: "academic",
              })
            }
            title="Reset to defaults"
            className="h-6 w-6 rounded-md text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
        </div>

        {/* Content Body */}
        <div className="p-3.5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {/* 1. Typography */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 font-medium text-[11px] text-muted-foreground font-mono">
              <Type className="h-3 w-3 text-primary" />
              <span>Typography</span>
            </div>

            {/* Font Size */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>Font size</span>
                <span className="font-mono text-[11px]">
                  {fontSizes.find((f) => f.value === notesSettings.fontSize)?.desc}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1 p-0.5 bg-muted/50 rounded-lg border border-border/60">
                {fontSizes.map((f) => {
                  const isActive = notesSettings.fontSize === f.value;
                  return (
                    <button
                      key={f.value}
                      onClick={() => updateNotesSettings({ fontSize: f.value })}
                      className={cn(
                        "py-1 px-2 text-xs font-medium rounded-md transition-all text-center cursor-pointer",
                        isActive
                          ? "bg-background text-foreground shadow-2xs font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Font Family */}
            <div className="space-y-1.5">
              <span className="text-[11px] text-muted-foreground">Typeface</span>
              <div className="grid grid-cols-3 gap-1 p-0.5 bg-muted/50 rounded-lg border border-border/60">
                {fontFamilies.map((ff) => {
                  const isActive = notesSettings.fontFamily === ff.value;
                  return (
                    <button
                      key={ff.value}
                      onClick={() => updateNotesSettings({ fontFamily: ff.value })}
                      className={cn(
                        "py-1 px-2 text-xs rounded-md transition-all text-center cursor-pointer",
                        ff.value === "serif" && "font-serif",
                        ff.value === "mono" && "font-mono",
                        isActive
                          ? "bg-background text-foreground shadow-2xs font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {ff.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Line Spacing */}
            <div className="space-y-1.5">
              <span className="text-[11px] text-muted-foreground">Line spacing</span>
              <div className="grid grid-cols-3 gap-1 p-0.5 bg-muted/50 rounded-lg border border-border/60">
                {lineHeights.map((lh) => {
                  const isActive = notesSettings.lineHeight === lh.value;
                  return (
                    <button
                      key={lh.value}
                      onClick={() => updateNotesSettings({ lineHeight: lh.value })}
                      className={cn(
                        "py-1 px-2 text-xs font-medium rounded-md transition-all text-center cursor-pointer",
                        isActive
                          ? "bg-background text-foreground shadow-2xs font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {lh.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="h-px bg-border/60" />

          {/* 2. Math & Formulas */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 font-medium text-[11px] text-muted-foreground font-mono">
              <Sigma className="h-3 w-3 text-sky-500" />
              <span>Formulas & math</span>
            </div>

            <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/30 border border-border/50">
              <div className="space-y-0.5">
                <Label htmlFor="katex-switch" className="text-xs font-medium cursor-pointer">
                  Render KaTeX equations
                </Label>
                <p className="text-[11px] text-muted-foreground">Format LaTeX math symbols and proofs</p>
              </div>
              <Switch
                id="katex-switch"
                checked={notesSettings.renderKaTeX}
                onCheckedChange={(checked) => updateNotesSettings({ renderKaTeX: checked })}
              />
            </div>
          </div>

          <div className="h-px bg-border/60" />

          {/* 3. Document Workspace Layout */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 font-medium text-[11px] text-muted-foreground font-mono">
              <Layout className="h-3 w-3 text-emerald-500" />
              <span>Layout & rails</span>
            </div>

            {/* Banner Toggle */}
            <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/30 border border-border/50">
              <div className="space-y-0.5">
                <Label htmlFor="banner-switch" className="text-xs font-medium cursor-pointer">
                  "On this page" summary
                </Label>
                <p className="text-[11px] text-muted-foreground">Show top chapter overview banner</p>
              </div>
              <Switch
                id="banner-switch"
                checked={notesSettings.showPageSummaryBanner}
                onCheckedChange={(checked) => updateNotesSettings({ showPageSummaryBanner: checked })}
              />
            </div>

            {/* Auto-scroll Outline Spy Toggle */}
            <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/30 border border-border/50">
              <div className="space-y-0.5">
                <Label htmlFor="spy-switch" className="text-xs font-medium cursor-pointer">
                  Auto-scroll outline
                </Label>
                <p className="text-[11px] text-muted-foreground">Sync outline highlight to scroll</p>
              </div>
              <Switch
                id="spy-switch"
                checked={notesSettings.autoScrollOutline}
                onCheckedChange={(checked) => updateNotesSettings({ autoScrollOutline: checked })}
              />
            </div>
          </div>

          <div className="h-px bg-border/60" />

          {/* 4. Generation Tone */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 font-medium text-[11px] text-muted-foreground font-mono">
              <Sparkles className="h-3 w-3 text-amber-500" />
              <span>Regeneration style</span>
            </div>

            <div className="space-y-1">
              {tones.map((t) => {
                const isActive = notesSettings.regenerationTone === t.value;
                return (
                  <button
                    key={t.value}
                    onClick={() => updateNotesSettings({ regenerationTone: t.value })}
                    className={cn(
                      "w-full text-left p-2 rounded-lg border text-xs transition-all cursor-pointer flex flex-col",
                      isActive
                        ? "border-primary/40 bg-primary/5 text-foreground font-medium shadow-2xs"
                        : "border-border/50 bg-background text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    )}
                  >
                    <span className={cn(isActive && "text-primary font-semibold")}>{t.label}</span>
                    <span className="text-[11px] text-muted-foreground">{t.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
