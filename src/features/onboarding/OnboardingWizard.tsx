"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  GraduationCap,
  BookOpen,
  Smile,
  Library,
  Microscope,
  Presentation,
  Sliders,
  Check,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  FileText,
  Layers,
  ListChecks,
  Headphones,
  MessageSquare,
  HelpCircle,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { useSettings } from "@/features/settings/context/SettingsContext";
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

export default function OnboardingWizard() {
  const router = useRouter();
  const { toast } = useToast();
  const { completeOnboarding, userRole: initialRole, preferences: initialPrefs } = useSettings();

  const [step, setStep] = useState<number>(1);
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole || "undergrad");
  const [prefs, setPrefs] = useState<WorkspacePreferences>(
    initialPrefs || ROLE_PRESETS[initialRole || "undergrad"]
  );
  const [submitting, setSubmitting] = useState(false);

  // Sync role defaults when role changes
  const handleSelectRole = (role: UserRole) => {
    setSelectedRole(role);
    setPrefs(ROLE_PRESETS[role]);
  };

  const handleToggleMode = (mode: StudyModeId) => {
    const current = prefs.enabledModes;
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
    setPrefs((prev) => ({ ...prev, enabledModes: next }));
  };

  const handleFinish = async () => {
    setSubmitting(true);
    try {
      await completeOnboarding(selectedRole, prefs);
      toast({
        title: "Workspace customized",
        description: `Your workstation has been tailored to the ${ROLE_METADATA[selectedRole].label} preset.`,
      });
      router.replace("/app");
    } catch {
      router.replace("/app");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = async () => {
    setSubmitting(true);
    try {
      await completeOnboarding("undergrad", ROLE_PRESETS.undergrad);
      router.replace("/app");
    } catch {
      router.replace("/app");
    } finally {
      setSubmitting(false);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (step < 4) {
          setStep((s) => s + 1);
        } else {
          void handleFinish();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [step, selectedRole, prefs]);

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
    <div className="min-h-screen bg-tactile-canvas text-foreground flex flex-col justify-between p-4 sm:p-8 font-sans antialiased select-none">
      {/* Top Bar */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between pb-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-display font-bold shadow-tactile-pill text-sm">
            S
          </div>
          <span className="font-display font-bold text-base tracking-tight text-foreground">
            Source.io Workstation
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-medium text-muted-foreground">
            Step {step} of 4
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            disabled={submitting}
            className="text-xs text-muted-foreground hover:text-foreground rounded-full h-8 px-3"
          >
            Skip with Defaults
          </Button>
        </div>
      </header>

      {/* Main Flow Content */}
      <main className="max-w-3xl w-full mx-auto my-auto py-8">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="space-y-1.5">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                  01 / Academic Profile
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-foreground tracking-tight">
                  How will you be using Source.io?
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  We’ll calibrate your default note formats, AI explanation rigor, and active workspace tools. You can change these anytime in Settings.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {rolesList.map((role) => {
                  const meta = ROLE_METADATA[role];
                  const Icon = ROLE_ICONS[role];
                  const isSelected = selectedRole === role;

                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => handleSelectRole(role)}
                      className={cn(
                        "p-4 rounded-[20px] border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 group select-none shadow-2xs",
                        isSelected
                          ? "bg-primary text-primary-foreground border-transparent shadow-tactile-pill scale-[1.01]"
                          : "bg-card border-border text-foreground hover:bg-muted/60 hover:border-border/90"
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
                            <Check className="size-3.5 text-amber-400 dark:text-amber-500 stroke-[2.5]" />
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
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="space-y-1.5">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                  02 / Workspace Study Tools
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-foreground tracking-tight">
                  Customize Your Study Toolbar
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Select which primitives appear in your workspace header. Unchecked tools remain hidden to eliminate workspace clutter.
                </p>
              </div>

              <div className="space-y-2.5 pt-2">
                {STUDY_TOOLS_CONFIG.map((tool) => {
                  const Icon = tool.icon;
                  const isEnabled = prefs.enabledModes.includes(tool.id);

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
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="space-y-1.5">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                  03 / Note Architecture
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-foreground tracking-tight">
                  Choose Included Synthesis Blocks
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Every note generation adapts to include only the modules you need for your study goals.
                </p>
              </div>

              <div className="rounded-[28px] bg-card border border-border p-6 shadow-tactile-card space-y-4">
                <span className="text-xs font-mono uppercase font-semibold text-muted-foreground block">
                  Included Note Sections
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { key: "executiveOverview", label: "Executive Summary", desc: "Core arguments & high-level thesis" },
                    { key: "mathProofs", label: "KaTeX Math & Derivations", desc: "Step-by-step formula proofs ($$...$$)" },
                    { key: "contrastTables", label: "Comparative Tables", desc: "Side-by-side paradigm comparisons" },
                    { key: "misconceptions", label: "Common Misconceptions", desc: "Pitfalls, traps, and boundary cases" },
                    { key: "analogies", label: "Real-World Analogies", desc: "Intuitive physical models & ELI12" },
                    { key: "discussionPrompts", label: "Discussion Prompts", desc: "Seminar questions & classroom debates" },
                    { key: "actionItems", label: "Action Items & Takeaways", desc: "Summary checklist & study roadmap" },
                  ].map((block) => {
                    const isChecked = prefs.noteSections[block.key as keyof typeof prefs.noteSections];

                    return (
                      <div
                        key={block.key}
                        onClick={() =>
                          setPrefs((prev) => ({
                            ...prev,
                            noteSections: {
                              ...prev.noteSections,
                              [block.key]: !isChecked,
                            },
                          }))
                        }
                        className={cn(
                          "p-3.5 rounded-[18px] border flex items-start justify-between gap-3 cursor-pointer select-none transition-all",
                          isChecked
                            ? "bg-muted/40 border-border"
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
                          onCheckedChange={(checked) =>
                            setPrefs((prev) => ({
                              ...prev,
                              noteSections: { ...prev.noteSections, [block.key]: checked },
                            }))
                          }
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step-4"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="space-y-1.5">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                  04 / Rigor & Citations
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-foreground tracking-tight">
                  Academic Depth & Grounding
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Calibrate AI reasoning depth and how source citations appear inline within your generated notes.
                </p>
              </div>

              <div className="rounded-[28px] bg-card border border-border p-6 shadow-tactile-card space-y-6">
                {/* Rigor Slider */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-foreground block font-display">
                        Explanation Rigor Level: {prefs.rigorLevel} / 5
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {prefs.rigorLevel === 1 && "Simple, approachable everyday language (ELI12)"}
                        {prefs.rigorLevel === 2 && "Exam-focused clarity with syllabus definitions"}
                        {prefs.rigorLevel === 3 && "Standard collegiate depth with formal derivations"}
                        {prefs.rigorLevel === 4 && "Advanced postgraduate analysis & clinical depth"}
                        {prefs.rigorLevel === 5 && "Peer-review theoretical rigor & methodology critique"}
                      </span>
                    </div>
                  </div>

                  <Slider
                    value={[prefs.rigorLevel]}
                    min={1}
                    max={5}
                    step={1}
                    onValueChange={(val) =>
                      setPrefs((prev) => ({
                        ...prev,
                        rigorLevel: (val[0] || 3) as 1 | 2 | 3 | 4 | 5,
                      }))
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

                {/* Citation Style */}
                <div className="space-y-3">
                  <div>
                    <span className="text-xs font-bold text-foreground block font-display">
                      Citation Badge Format
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      How verified source references appear within generated notes.
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {[
                      { id: "coordinate_pills" as CitationStyle, label: "Coordinate Pills", preview: "[p. 14, ¶3]" },
                      { id: "simple_page" as CitationStyle, label: "Simple Page", preview: "[Page 14]" },
                      { id: "apa_7" as CitationStyle, label: "APA 7th / IEEE", preview: "(Author, 2024)" },
                    ].map((c) => {
                      const isSelected = prefs.citationStyle === c.id;

                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setPrefs((prev) => ({ ...prev, citationStyle: c.id }))}
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
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Navigation Bar */}
      <footer className="max-w-4xl w-full mx-auto flex items-center justify-between pt-6 border-t border-border">
        {step > 1 ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setStep((s) => s - 1)}
            disabled={submitting}
            className="rounded-full text-xs h-9 px-4 border-border text-foreground hover:bg-muted"
          >
            <ArrowLeft className="size-3.5 mr-1.5" />
            <span>Back</span>
          </Button>
        ) : (
          <div />
        )}

        {step < 4 ? (
          <Button
            onClick={() => setStep((s) => s + 1)}
            className="rounded-full text-xs font-semibold h-9 px-6 bg-primary text-primary-foreground shadow-tactile-pill hover:scale-105 active:scale-95 transition-all"
          >
            <span>Continue</span>
            <ArrowRight className="size-3.5 ml-1.5" />
          </Button>
        ) : (
          <Button
            onClick={handleFinish}
            disabled={submitting}
            className="rounded-full text-xs font-semibold h-9 px-6 bg-primary text-primary-foreground shadow-tactile-pill hover:scale-105 active:scale-95 transition-all"
          >
            <Sparkles className="size-3.5 mr-1.5 text-sky-400" />
            <span>Launch Workstation</span>
          </Button>
        )}
      </footer>
    </div>
  );
}
