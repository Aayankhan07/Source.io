"use client";

import { useState } from "react";
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
  GraduationCap,
  BookMarked,
  RefreshCw,
  Sliders,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettings } from "@/features/settings/context/SettingsContext";
import {
  NotesFontSize,
  NotesFontFamily,
  NotesLineHeight,
  RegenerationTone,
} from "@/features/settings/types";
import {
  UserRole,
  CitationStyle,
  ROLE_METADATA,
  ROLE_PRESETS,
} from "@/types/customization";

interface NotesSettingsPopoverProps {
  className?: string;
  onRegenerate?: () => void;
  isStreaming?: boolean;
}

const CITATION_OPTIONS: { id: CitationStyle; label: string }[] = [
  { id: "apa", label: "APA 7th" },
  { id: "mla", label: "MLA 9th" },
  { id: "chicago", label: "Chicago" },
  { id: "ieee", label: "IEEE" },
  { id: "bibtex", label: "BibTeX" },
  { id: "harvard", label: "Harvard" },
];

const RIGOR_LABELS: Record<number, string> = {
  1: "Foundational & Analogies",
  2: "Accessible High School",
  3: "Balanced Undergraduate",
  4: "Advanced Scholar",
  5: "Exhaustive Primary Research",
};

export default function NotesSettingsPopover({
  className,
  onRegenerate,
  isStreaming = false,
}: NotesSettingsPopoverProps) {
  const {
    notesSettings,
    updateNotesSettings,
    userRole,
    setUserRole,
    preferences,
    updatePreferences,
    resetToRolePreset,
  } = useSettings();

  const [popoverTab, setPopoverTab] = useState<"typography" | "rigor">("typography");

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

  const currentRole = userRole || "undergrad";
  const currentRigor = preferences?.rigorLevel ?? 3;
  const currentCitation = preferences?.citationStyle ?? "apa";

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
        className="w-84 sm:w-92 p-0 rounded-2xl border border-border bg-card shadow-tactile-dock text-foreground overflow-hidden"
      >
        {/* Header Tabs: Typography vs Rigor & Role */}
        <div className="p-2 border-b border-border/70 bg-muted/20 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 p-0.5 rounded-xl bg-muted/60 border border-border/50 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setPopoverTab("typography")}
              className={cn(
                "px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer",
                popoverTab === "typography"
                  ? "bg-background text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Type className="size-3" />
              <span>Typography</span>
            </button>
            <button
              type="button"
              onClick={() => setPopoverTab("rigor")}
              className={cn(
                "px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer",
                popoverTab === "rigor"
                  ? "bg-background text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Sliders className="size-3" />
              <span>Rigor & Role</span>
            </button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (popoverTab === "typography") {
                updateNotesSettings({
                  fontSize: "regular",
                  fontFamily: "sans",
                  lineHeight: "normal",
                  renderKaTeX: true,
                  showPageSummaryBanner: true,
                  autoScrollOutline: true,
                  regenerationTone: "academic",
                });
              } else {
                resetToRolePreset(currentRole);
              }
            }}
            title={popoverTab === "typography" ? "Reset typography" : "Reset role defaults"}
            className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {popoverTab === "typography" ? (
            <>
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
                  <span>Regeneration tone</span>
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
            </>
          ) : (
            <>
              {/* Persona Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                  <span className="flex items-center gap-1.5">
                    <GraduationCap className="h-3 w-3 text-primary" />
                    Academic Persona
                  </span>
                  <span className="font-bold text-foreground capitalize">
                    {ROLE_METADATA[currentRole]?.label}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {(Object.keys(ROLE_METADATA) as UserRole[]).map((r) => {
                    const meta = ROLE_METADATA[r];
                    const isSelected = currentRole === r;
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setUserRole(r)}
                        className={cn(
                          "p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-0.5",
                          isSelected
                            ? "border-primary bg-primary/10 text-foreground font-semibold"
                            : "border-border/60 bg-muted/20 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                      >
                        <span className="text-xs truncate">{meta.label}</span>
                        <span className="text-[10px] text-muted-foreground truncate">{meta.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="h-px bg-border/60" />

              {/* Rigor Depth Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-mono text-muted-foreground flex items-center gap-1.5">
                    <Sliders className="size-3 text-sky-500" />
                    Rigor Level ({currentRigor}/5)
                  </span>
                  <span className="font-semibold text-foreground">
                    {RIGOR_LABELS[currentRigor]}
                  </span>
                </div>

                <input
                  type="range"
                  min={1}
                  max={5}
                  step={1}
                  value={currentRigor}
                  onChange={(e) => updatePreferences({ rigorLevel: Number(e.target.value) as 1 | 2 | 3 | 4 | 5 })}
                  className="w-full accent-primary cursor-pointer h-2 bg-muted rounded-lg"
                />

                <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                  <span>1 Intuitive</span>
                  <span>3 Balanced</span>
                  <span>5 Exhaustive</span>
                </div>
              </div>

              <div className="h-px bg-border/60" />

              {/* Citation Format */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground">
                  <BookMarked className="size-3 text-emerald-500" />
                  <span>Citation Style</span>
                </div>

                <div className="grid grid-cols-3 gap-1">
                  {CITATION_OPTIONS.map((c) => {
                    const isSelected = currentCitation === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => updatePreferences({ citationStyle: c.id })}
                        className={cn(
                          "py-1.5 px-2 rounded-lg border text-center text-xs transition-all cursor-pointer font-medium",
                          isSelected
                            ? "border-primary bg-primary/10 text-foreground font-semibold"
                            : "border-border/60 bg-muted/20 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                      >
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Optional onRegenerate Action */}
              {onRegenerate && (
                <div className="pt-2">
                  <Button
                    onClick={onRegenerate}
                    disabled={isStreaming}
                    className="w-full h-8 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:opacity-90 gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className={cn("size-3", isStreaming && "animate-spin")} />
                    <span>Regenerate Notes with Overrides</span>
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
