"use client";

import { useState } from "react";
import {
  GraduationCap,
  BookOpen,
  Smile,
  Library,
  Microscope,
  Presentation,
  Sliders,
  Check,
  RotateCcw,
  SlidersHorizontal,
  FileText,
  Layers,
  ListChecks,
  Headphones,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { useSettings } from "../context/SettingsContext";
import {
  UserRole,
  StudyModeId,
  CitationStyle,
  ROLE_PRESETS,
  ROLE_METADATA,
  WorkspacePreferences,
} from "@/types/customization";
import { useToast } from "@/hooks/use-toast";

const ROLE_ICONS: Record<UserRole, typeof GraduationCap> = {
  undergrad: GraduationCap,
  high_school: BookOpen,
  school_student: Smile,
  scholar: Library,
  researcher: Microscope,
  teacher: Presentation,
  custom: Sliders,
};

const STUDY_TOOLS_CONFIG: {
  id: StudyModeId;
  label: string;
  desc: string;
  icon: typeof FileText;
}[] = [
  {
    id: "notes",
    label: "Structured Notes & Synthesis",
    desc: "Deep chapter outlines, LaTeX mathematics, and verified citations.",
    icon: FileText,
  },
  {
    id: "flashcards",
    label: "Active Recall Flashcards",
    desc: "Spaced repetition Leitner memory system and Anki export.",
    icon: Layers,
  },
  {
    id: "quiz",
    label: "Diagnostic Evaluative Quizzes",
    desc: "Distractor rationale, difficulty scoring, and exam questions.",
    icon: ListChecks,
  },
  {
    id: "podcast",
    label: "Dual-Host Audio Podcast",
    desc: "Socratic debater duo with interactive scrubber and transcripts.",
    icon: Headphones,
  },
  {
    id: "ask",
    label: "Grounded Source Copilot (RAG)",
    desc: "Sub-second answers with exact page, paragraph, and line citation.",
    icon: MessageSquare,
  },
];

export default function CustomizationSettings() {
  const { userRole, preferences, setUserRole, updatePreferences, resetToRolePreset } = useSettings();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const handleRoleChange = async (role: UserRole) => {
    await setUserRole(role);
    toast({
      title: "Preset Activated",
      description: `Applied defaults for ${ROLE_METADATA[role].label}. You can still tweak individual options below.`,
    });
  };

  const handleReset = async () => {
    await resetToRolePreset(userRole);
    toast({
      title: "Preset Reset",
      description: `Reset settings to standard ${ROLE_METADATA[userRole].label} defaults.`,
    });
  };

  const handleToggleMode = async (mode: StudyModeId) => {
    const current = preferences.enabledModes;
    let next: StudyModeId[];
    if (current.includes(mode)) {
      if (current.length === 1) {
        toast({
          title: "At least one tool required",
          description: "Keep at least one study mode enabled for your workspace.",
        });
        return;
      }
      next = current.filter((m) => m !== mode);
    } else {
      next = [...current, mode];
    }
    await updatePreferences({ enabledModes: next });
  };

  const handleToggleSection = async (key: keyof WorkspacePreferences["noteSections"], checked: boolean) => {
    await updatePreferences({
      noteSections: {
        ...preferences.noteSections,
        [key]: checked,
      },
    });
  };

  const rolesList: UserRole[] = [
    "undergrad",
    "high_school",
    "school_student",
    "scholar",
    "researcher",
    "teacher",
    "custom",
  ];

  return (
    <div className="space-y-6">
      {/* 1. Active Persona Preset */}
      <div className="rounded-[28px] bg-card border border-border shadow-tactile-card p-6 sm:p-7 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1 rounded-lg bg-primary text-primary-foreground">
                <GraduationCap className="size-4" />
              </span>
              <h3 className="text-base sm:text-lg font-bold font-display text-foreground">
                Academic Persona Preset
              </h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Selecting a role updates recommended note templates, AI depth, and workspace tools.
            </p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="rounded-full text-xs h-8 px-3 border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <RotateCcw className="size-3.5 mr-1.5" />
            <span>Reset Preset</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {rolesList.map((role) => {
            const meta = ROLE_METADATA[role];
            const Icon = ROLE_ICONS[role];
            const isSelected = userRole === role;

            return (
              <button
                key={role}
                type="button"
                onClick={() => handleRoleChange(role)}
                className={cn(
                  "p-4 rounded-[20px] border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 group select-none shadow-2xs",
                  isSelected
                    ? "bg-primary text-primary-foreground border-transparent shadow-tactile-pill scale-[1.01]"
                    : "bg-surface-sunken border-border text-foreground hover:bg-muted/60"
                )}
              >
                <div className="flex items-start justify-between w-full">
                  <div
                    className={cn(
                      "size-8 rounded-xl flex items-center justify-center transition-colors",
                      isSelected
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-muted text-muted-foreground group-hover:text-foreground"
                    )}
                  >
                    <Icon className="size-4" />
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-mono px-2 py-0.5 rounded-md border",
                      isSelected
                        ? "bg-white/20 border-white/30 text-white"
                        : "bg-muted border-border text-muted-foreground"
                    )}
                  >
                    {meta.badge}
                  </span>
                </div>

                <div className="space-y-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "text-xs font-bold font-display",
                        isSelected ? "text-primary-foreground" : "text-foreground"
                      )}
                    >
                      {meta.label}
                    </span>
                    {isSelected && (
                      <Check className="size-3.5 text-primary-foreground stroke-[2.5]" />
                    )}
                  </div>
                  <p
                    className={cn(
                      "text-[11px] leading-relaxed",
                      isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                    )}
                  >
                    {meta.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Workspace Study Modes (Visible Tabs) */}
      <div className="rounded-[28px] bg-card border border-border shadow-tactile-card p-6 sm:p-7 space-y-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="p-1.5 rounded-xl bg-muted text-foreground border border-border/80">
              <SlidersHorizontal className="size-4" />
            </span>
            <h3 className="text-base sm:text-lg font-bold font-display text-foreground">
              Visible Workspace Tabs
            </h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Toggle which study tools appear in your document workspace header bar.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {STUDY_TOOLS_CONFIG.map((tool) => {
            const Icon = tool.icon;
            const isEnabled = preferences.enabledModes.includes(tool.id);

            return (
              <div
                key={tool.id}
                onClick={() => handleToggleMode(tool.id)}
                className={cn(
                  "p-4 rounded-[20px] border flex items-center justify-between gap-4 transition-all cursor-pointer select-none shadow-2xs",
                  isEnabled
                    ? "bg-card border-border"
                    : "bg-surface-sunken/60 border-border/60 opacity-60 hover:opacity-100"
                )}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={cn(
                      "size-9 rounded-xl flex items-center justify-center shrink-0 border",
                      isEnabled
                        ? "bg-muted border-border text-foreground"
                        : "bg-transparent border-transparent text-muted-foreground"
                    )}
                  >
                    <Icon className="size-4" />
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <span className="text-xs font-bold text-foreground font-display block">
                      {tool.label}
                    </span>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {tool.desc}
                    </p>
                  </div>
                </div>

                <Switch
                  checked={isEnabled}
                  onCheckedChange={() => handleToggleMode(tool.id)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Included Note Architecture Blocks */}
      <div className="rounded-[28px] bg-card border border-border shadow-tactile-card p-6 sm:p-7 space-y-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="p-1.5 rounded-xl bg-muted text-foreground border border-border/80">
              <FileText className="size-4" />
            </span>
            <h3 className="text-base sm:text-lg font-bold font-display text-foreground">
              Note Architecture & Included Blocks
            </h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Configure which structured sections the AI engine includes when generating study notes.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { key: "executiveOverview" as const, label: "Executive Summary", desc: "Core arguments & high-level thesis" },
            { key: "mathProofs" as const, label: "KaTeX Math & Derivations", desc: "Step-by-step formula proofs ($$...$$)" },
            { key: "contrastTables" as const, label: "Comparative Tables", desc: "Side-by-side paradigm comparisons" },
            { key: "misconceptions" as const, label: "Common Misconceptions", desc: "Pitfalls, traps, and boundary cases" },
            { key: "analogies" as const, label: "Real-World Analogies", desc: "Intuitive physical models & ELI12" },
            { key: "discussionPrompts" as const, label: "Discussion Prompts", desc: "Seminar questions & classroom debates" },
            { key: "actionItems" as const, label: "Action Items & Takeaways", desc: "Summary checklist & study roadmap" },
          ].map((block) => {
            const isChecked = preferences.noteSections[block.key];

            return (
              <div
                key={block.key}
                onClick={() => handleToggleSection(block.key, !isChecked)}
                className={cn(
                  "p-3.5 rounded-[18px] border flex items-start justify-between gap-3 cursor-pointer select-none transition-all",
                  isChecked
                    ? "bg-card border-border shadow-2xs"
                    : "bg-surface-sunken/40 border-border/50 opacity-60 hover:opacity-100"
                )}
              >
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-foreground block">
                    {block.label}
                  </span>
                  <span className="text-[11px] text-muted-foreground leading-tight block">
                    {block.desc}
                  </span>
                </div>
                <Switch
                  checked={isChecked}
                  onCheckedChange={(checked) => handleToggleSection(block.key, checked)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Rigor, Citations & Custom Directive */}
      <div className="rounded-[28px] bg-card border border-border shadow-tactile-card p-6 sm:p-7 space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-foreground block font-display">
                Explanation Rigor Depth: Level {preferences.rigorLevel} / 5
              </span>
              <span className="text-[11px] text-muted-foreground">
                {preferences.rigorLevel === 1 && "Simple, approachable everyday language (ELI12)"}
                {preferences.rigorLevel === 2 && "Exam-focused clarity with syllabus definitions"}
                {preferences.rigorLevel === 3 && "Standard collegiate depth with formal derivations"}
                {preferences.rigorLevel === 4 && "Advanced postgraduate analysis & clinical depth"}
                {preferences.rigorLevel === 5 && "Peer-review theoretical rigor & methodology critique"}
              </span>
            </div>
          </div>

          <Slider
            value={[preferences.rigorLevel]}
            min={1}
            max={5}
            step={1}
            onValueChange={(val) =>
              updatePreferences({
                rigorLevel: (val[0] || 3) as 1 | 2 | 3 | 4 | 5,
              })
            }
            className="w-full cursor-pointer"
          />

          <div className="flex justify-between text-[10px] font-mono text-muted-foreground px-1">
            <span>1: Intuitive</span>
            <span>3: Collegiate</span>
            <span>5: Peer Review</span>
          </div>
        </div>

        <div className="h-px bg-border" />

        {/* Citation Badge Style */}
        <div className="space-y-3">
          <div>
            <span className="text-xs font-bold text-foreground block font-display">
              Citation Badge Style
            </span>
            <span className="text-[11px] text-muted-foreground">
              Format for verified grounding tags in study notes.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {[
              { id: "coordinate_pills" as CitationStyle, label: "Coordinate Pills", preview: "[p. 14, ¶3]" },
              { id: "simple_page" as CitationStyle, label: "Simple Page", preview: "[Page 14]" },
              { id: "apa_7" as CitationStyle, label: "APA 7th / IEEE", preview: "(Author, 2024)" },
            ].map((c) => {
              const isSelected = preferences.citationStyle === c.id;

              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => updatePreferences({ citationStyle: c.id })}
                  className={cn(
                    "p-3 rounded-2xl border text-left cursor-pointer transition-all flex flex-col justify-between gap-2 shadow-2xs",
                    isSelected
                      ? "bg-primary text-primary-foreground border-transparent shadow-tactile-pill scale-[1.01]"
                      : "bg-surface-sunken border-border hover:bg-muted text-foreground"
                  )}
                >
                  <span className={cn("text-xs font-bold block", isSelected ? "text-primary-foreground" : "text-foreground")}>
                    {c.label}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-mono px-2 py-0.5 rounded-md border max-w-max",
                      isSelected
                        ? "bg-white/20 border-white/30 text-white"
                        : "bg-muted border-border text-muted-foreground"
                    )}
                  >
                    {c.preview}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="h-px bg-border" />

        {/* Custom AI Directive */}
        <div className="space-y-2">
          <div>
            <span className="text-xs font-bold text-foreground block font-display">
              Custom AI Directive (Optional)
            </span>
            <span className="text-[11px] text-muted-foreground">
              Always append a custom rule to AI generation (e.g. &quot;Include Python snippets where relevant&quot;).
            </span>
          </div>

          <input
            type="text"
            value={preferences.customSystemInstruction || ""}
            onChange={(e) => updatePreferences({ customSystemInstruction: e.target.value })}
            placeholder="e.g. Always provide mnemonic memory anchors for key terms..."
            className="w-full h-10 px-3.5 rounded-xl border border-border bg-surface-sunken text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>
    </div>
  );
}
