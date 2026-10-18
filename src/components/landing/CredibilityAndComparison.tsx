"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Check,
  X,
  ArrowRight,
  BookOpen,
  GraduationCap,
  Microscope,
  Smile,
  Library,
  Presentation,
  Sliders,
  SlidersHorizontal,
  ListChecks,
  FileCheck,
  Activity,
  FileText,
  Printer,
  Download,
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SectionHeading } from "./SectionHeading";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { UserRole } from "@/types/customization";

interface PersonaConfig {
  id: UserRole;
  title: string;
  badge: string;
  icon: React.ElementType;
  sourceDoc: string;
  description: string;
  noteTemplate: string;
  rigorLevel: 1 | 2 | 3 | 4 | 5;
  rigorLabel: string;
  citationBadge: string;
  tabsShown: string[];
  activeBlocks: string[];
  signatureAction: {
    label: string;
    icon: React.ElementType;
    badge: string;
  };
  sampleExcerpt: string;
}

const PERSONAS_DATA: Record<UserRole, PersonaConfig> = {
  school_student: {
    id: "school_student",
    title: "School Student",
    badge: "Grades 6–8",
    icon: Smile,
    sourceDoc: "Earth Science & Planetary Orbits (Middle School Core Science, 18 pp.)",
    description: "Visual, story-driven scaffolding with everyday analogies (ELI12), bold definitions, and zero dense jargon. Keeps young learners confident and engaged.",
    noteTemplate: "Visual & Story-Driven (ELI12)",
    rigorLevel: 1,
    rigorLabel: "Level 1: Intuitive & Accessible",
    citationBadge: "[Page 4]",
    tabsShown: ["Study Guide", "Word Cards", "Practice Check", "Ask Tutor"],
    activeBlocks: [
      "Executive Overview",
      "Real-World Analogies",
      "Bold Vocabulary Definitions",
      "Key Milestones Checklist",
    ],
    signatureAction: {
      label: "3-Choice Diagnostic Quizzes with Hints",
      icon: ListChecks,
      badge: "Cheerfully Grounded",
    },
    sampleExcerpt: "Electrons orbit the nucleus much like planets revolve around the sun, bound by electrical attraction rather than gravity.",
  },
  high_school: {
    id: "high_school",
    title: "High School",
    badge: "AP / IB / A-Level",
    icon: BookOpen,
    sourceDoc: "Campbell Biology: Cellular Respiration & ATP Synthase (Ch. 9, 32 pp.)",
    description: "Cornell study architecture with high-yield cue terms on the left, structured summaries on the right, worked step-by-step solutions, and exam traps.",
    noteTemplate: "Cornell Notes & Exam Syllabus",
    rigorLevel: 2,
    rigorLabel: "Level 2: Foundational & Exam-Oriented",
    citationBadge: "[p. 14, §1.2]",
    tabsShown: ["Cornell Notes", "Flashcards", "Exam Practice", "Audio Recap", "Ask Copilot"],
    activeBlocks: [
      "Cornell Cue Column",
      "Structured Chapter Summaries",
      "Step-by-Step Worked Problems",
      "Common Standardized Exam Traps",
    ],
    signatureAction: {
      label: "Board-Style MCQs with Marking Keys",
      icon: FileCheck,
      badge: "Syllabus Aligned",
    },
    sampleExcerpt: "Exam Trap: Glycolysis occurs in the cytoplasm and requires 2 ATP of activation energy, yielding a net gain of 2 ATP and 2 NADH.",
  },
  undergrad: {
    id: "undergrad",
    title: "Bachelor's / Undergrad",
    badge: "College Default",
    icon: GraduationCap,
    sourceDoc: "MIT 6.824: Distributed Systems & Raft Consensus Protocol (42 pp.)",
    description: "Collegiate synthesis with formal axiomatic definitions, step-by-step KaTeX math derivations, comparative evaluation tables, and Bloom's evaluative checks.",
    noteTemplate: "Executive Lecture Outline & Proofs",
    rigorLevel: 3,
    rigorLabel: "Level 3: Standard Collegiate Rigor",
    citationBadge: "[p. 14, ¶3]",
    tabsShown: ["Notes", "Flashcards", "Quiz", "Podcast", "Ask Copilot"],
    activeBlocks: [
      "Executive Summary & Thesis",
      "Step-by-Step KaTeX Math Proofs",
      "Comparative Evaluation Tables",
      "Critical Misconceptions & Edge Cases",
    ],
    signatureAction: {
      label: "Export to Anki Deck (.tsv)",
      icon: Download,
      badge: "5-Box Spaced Cadence",
    },
    sampleExcerpt: "State Safety Invariant: If a leader has applied an entry at log index i, no other server will ever apply a different log entry for index i.",
  },
  scholar: {
    id: "scholar",
    title: "Scholar / Postgrad",
    badge: "Grad / Med / Law",
    icon: Library,
    sourceDoc: "Robbins & Cotran: Glomerular Pathology & Nephrotic Differentials (68 pp.)",
    description: "High-density synthesis designed for medical, legal, and postgraduate scholarship. Focuses on theoretical paradigms, differential diagnoses, and statutory precedents.",
    noteTemplate: "High-Density Synthesis & Differentials",
    rigorLevel: 4,
    rigorLabel: "Level 4: Advanced Graduate Synthesis",
    citationBadge: "[p. 14, ¶3:L12]",
    tabsShown: ["Synthesis", "Leitner Deck", "Board Quiz", "Seminar Audio", "Ask Copilot"],
    activeBlocks: [
      "Core Theoretical Paradigms",
      "Clinical / Legal Differentials",
      "Axiomatic KaTeX Derivations",
      "Multi-Variable Boundary Limitations",
    ],
    signatureAction: {
      label: "USMLE / Bar Case Vignette Diagnostic",
      icon: Activity,
      badge: "High Density",
    },
    sampleExcerpt: "Minimal Change Disease presents with selective proteinuria and effacement of podocyte foot processes on electron microscopy without immune deposits.",
  },
  researcher: {
    id: "researcher",
    title: "Researcher / PhD",
    badge: "Faculty / PI",
    icon: Microscope,
    sourceDoc: "Vaswani et al.: Attention Is All You Need & Transformer Complexity (15 pp.)",
    description: "Literature review mode deconstructing papers using the IMRaD framework. Evaluates research questions, methodology, statistical validity, and explicit literature gaps. Flashcards & beginner quizzes hidden.",
    noteTemplate: "IMRaD Literature Critique & Methodology Audit",
    rigorLevel: 5,
    rigorLabel: "Level 5: Peer-Review Rigor",
    citationBadge: "(Vaswani et al., 2017, p. 4) / IEEE [1]",
    tabsShown: ["Lit Review", "Paper Colloquium", "Query Corpus"],
    activeBlocks: [
      "IMRaD Structural Deconstruction",
      "Methodology & Statistical Validity Audit",
      "Sample Size & Bias Critique",
      "Explicit Research Gaps & Citations",
    ],
    signatureAction: {
      label: "Export Formal BibTeX & APA 7th Tree",
      icon: FileText,
      badge: "Zotero / Mendeley Ready",
    },
    sampleExcerpt: "Self-attention computational complexity per layer scales as O(n² · d), creating a quadratic memory bottleneck with long context sequences.",
  },
  teacher: {
    id: "teacher",
    title: "Teacher / Educator",
    badge: "Curriculum Architect",
    icon: Presentation,
    sourceDoc: "AP Physics C: Electromagnetic Induction & Faraday's Law (24 pp.)",
    description: "Transforms dense source material into classroom-ready 45/60-minute lesson plans, lecture pacing schedules, chalkboard derivation notes, and student discussion prompts.",
    noteTemplate: "Instructional 60-Min Lesson Plan",
    rigorLevel: 3,
    rigorLabel: "Level 3: Master Curriculum Structure",
    citationBadge: "[Source p. 14]",
    tabsShown: ["Lesson Plan", "Handout Cards", "Exam Builder", "Curriculum Assistant"],
    activeBlocks: [
      "Bloom's Taxonomy Learning Objectives",
      "Timed 60-Minute Lecture Pacing Schedule",
      "Chalkboard KaTeX Derivations",
      "Socratic Classroom Discussion Prompts",
    ],
    signatureAction: {
      label: "Export Printable Exam & Rubric Key",
      icon: Printer,
      badge: "Student & Teacher Keys",
    },
    sampleExcerpt: "Pacing (Minutes 15-30): Board derivation of Lenz's law ε = -dΦB/dt. Prompt class: 'Why does the minus sign guarantee conservation of energy?'",
  },
  custom: {
    id: "custom",
    title: "Custom / Modular",
    badge: "Polymath",
    icon: Sliders,
    sourceDoc: "User-Defined Multidisciplinary Research Monograph",
    description: "Complete modular sovereignty. Choose your exact visible tabs, toggle individual note sections on or off, set explanation rigor (1–5), and inject custom system directives.",
    noteTemplate: "Modular Block Custom Builder",
    rigorLevel: 3,
    rigorLabel: "Level 1–5: Fully User-Adjustable",
    citationBadge: "User Choice (Pills, APA, IEEE, Coordinates)",
    tabsShown: ["Custom Workspace Selection"],
    activeBlocks: [
      "User-Toggled Note Sections",
      "Custom System Directives",
      "Flexible Citation Anchoring",
      "Per-Document Notes Overrides",
    ],
    signatureAction: {
      label: "In-Document ⚙ Notes Settings Overrides",
      icon: SlidersHorizontal,
      badge: "Full Sovereignty",
    },
    sampleExcerpt: "Custom Prompt Injection: 'Always format algorithms in Python pseudocode with Big-O time and space complexity annotations.'",
  },
};

export function AcademicPersonasSection() {
  const [activeRole, setActiveRole] = useState<UserRole>("undergrad");
  const persona = PERSONAS_DATA[activeRole];
  const SignatureIcon = persona.signatureAction.icon;

  return (
    <section id="personas" className="py-12 sm:py-20 mx-auto text-left w-full scroll-mt-24">
      <SectionHeading
        badge="Role-Adaptive Architecture"
        badgeTone="amber"
        line1="One engine. Seven calibrated academic workspaces."
        description="Choose your persona during onboarding—or toggle any tab, note block, rigor level (1–5), and citation format anytime in Settings → Customization."
        align="left"
      />

      {/* 7-Persona Selector Tabs with Gliding Obsidian Pill - Swipeable on mobile, flex row on desktop */}
      <div className="flex flex-nowrap overflow-x-auto scrollbar-none snap-x lg:flex-wrap items-center gap-1.5 sm:gap-2 mb-6 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 max-w-full">
        {(Object.keys(PERSONAS_DATA) as UserRole[]).map((key) => {
          const item = PERSONAS_DATA[key];
          const Icon = item.icon;
          const isSelected = activeRole === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveRole(key)}
              className={cn(
                "relative inline-flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer shadow-xs select-none shrink-0 snap-center whitespace-nowrap",
                isSelected
                  ? "text-white"
                  : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200"
              )}
            >
              {isSelected && (
                <motion.div
                  layoutId="activePersonaPill"
                  className="absolute inset-0 rounded-full bg-slate-900 -z-0 shadow-sm"
                  transition={{ type: "spring", stiffness: 420, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Icon className="size-3.5 shrink-0" />
                <span>{item.title}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Persona Morphing Card */}
      <div className="bg-white rounded-[28px] sm:rounded-[36px] border border-slate-200 p-5 sm:p-9 shadow-tactile-card grid lg:grid-cols-12 gap-6 sm:gap-8 items-stretch relative overflow-hidden">
        {/* Left Column: Role Intelligence, Exemplar Source & Rigor Depth (7 Cols) */}
        <div className="lg:col-span-7 space-y-4 relative z-10 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-500 uppercase tracking-wider font-semibold">
                Exemplar Source Material
              </span>
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-800 font-semibold">
                {persona.badge}
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold font-display text-slate-900 tracking-tight">
              {persona.sourceDoc}
            </h3>

            <p className="text-[14px] leading-relaxed text-slate-600">
              {persona.description}
            </p>

            {/* Rigor Depth Gauge (5-pip tactile meter) */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500 font-medium">Academic Rigor Level:</span>
                <span className="text-slate-900 font-bold">{persona.rigorLabel}</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5 pt-1">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <div
                    key={lvl}
                    className={cn(
                      "h-2 rounded-full transition-colors",
                      lvl <= persona.rigorLevel ? "bg-slate-900" : "bg-slate-200"
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Citation & Sample Excerpt */}
            <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-slate-500 text-[11px] uppercase tracking-wider font-semibold">
                  Citation Format Preview:
                </span>
                <span className="font-mono font-bold text-slate-900 px-2 py-0.5 rounded-md bg-white border border-slate-200 shadow-2xs">
                  {persona.citationBadge}
                </span>
              </div>
              <blockquote className="italic text-slate-700 border-l-2 border-slate-300 pl-3 text-[13px] leading-relaxed">
                &quot;{persona.sampleExcerpt}&quot;
              </blockquote>
            </div>
          </div>

          {/* Role Signature Action Metadata Footer + Interactive Demo Link */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 text-xs font-medium shadow-2xs">
              <SignatureIcon className="size-3.5 text-slate-700 shrink-0" />
              <span>Signature Output: <strong className="font-semibold text-slate-900">{persona.signatureAction.label}</strong></span>
              <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">({persona.signatureAction.badge})</span>
            </div>
            <Link
              href="/app/doc/demo-quantum"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-950 transition-colors group cursor-pointer"
            >
              <span>Try this preset in live demo</span>
              <ArrowRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Right Column: Morphing Workspace Header & Blocks (5 Cols) - Aligned Flush */}
        <div className="lg:col-span-5 bg-slate-50 rounded-[24px] border border-slate-200 p-6 text-xs relative z-10 shadow-xs h-full flex flex-col justify-between">
          <div className="space-y-4">
            {/* Live Dynamic Tabs Header Simulation */}
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs font-mono text-slate-500 mb-2.5">
                <span>Active Workspace Header</span>
                <span className="text-slate-900 font-bold font-mono">Dynamic Tabs</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {persona.tabsShown.map((tab, idx) => (
                  <span
                    key={tab}
                    className={cn(
                      "px-2.5 py-1 rounded-full font-medium text-[11px] border transition-colors",
                      idx === 0
                        ? "bg-slate-900 text-white border-transparent shadow-xs"
                        : "bg-white text-slate-700 border-slate-200"
                    )}
                  >
                    {tab}
                  </span>
                ))}
              </div>
            </div>

            {/* Enabled Note Architecture Modules */}
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs font-mono text-slate-500 mb-2.5">
                <span>Included Synthesis Blocks</span>
                <span className="text-slate-900 font-semibold font-mono">Calibrated</span>
              </div>
              <div className="space-y-2 text-slate-700 font-medium">
                {persona.activeBlocks.map((block) => (
                  <div key={block} className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="size-1.5 rounded-full bg-slate-900" />
                      <span>{block}</span>
                    </span>
                    <Check className="size-3.5 text-slate-900" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Note Settings Override Notice */}
          <div className="pt-3 mt-4 border-t border-slate-200 text-[11px] text-slate-500 leading-relaxed font-mono">
            <span>⚙ Override template, blocks, or rigor per-document in <strong className="text-slate-900">Notes Settings</strong>.</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ComparisonTableSection() {
  const comparisonRows = [
    {
      feature: "Page & line-level citations",
      source: true,
      chatgpt: false,
      notebooklm: "Partial (doc-level)",
      note: "Every statement anchored to exact paragraph & audio millisecond",
    },
    {
      feature: "Audio timestamp sync",
      source: true,
      chatgpt: false,
      notebooklm: "Partial",
      note: "Synchronized playback linked to written transcript moments",
    },
    {
      feature: "Role-adaptive workspace & rigor (1–5)",
      source: true,
      chatgpt: "Requires manual prompt",
      notebooklm: false,
      note: "Morphs tabs, note blocks & citations for School, Undergrad, PhD & Teachers",
    },
    {
      feature: "Active spaced repetition (Leitner)",
      source: true,
      chatgpt: false,
      notebooklm: false,
      note: "Adaptive intervals (1d, 2d, 4d, 7d) derived automatically from source text",
    },
    {
      feature: "Interactive practice quizzes with proofs",
      source: true,
      chatgpt: "Requires manual prompt",
      notebooklm: false,
      note: "Instant right/wrong verification with coordinate explanations",
    },
    {
      feature: "Multi-format ingestion (PDF, Audio, LaTeX)",
      source: true,
      chatgpt: "No native coordinate/LaTeX OCR",
      notebooklm: "Text & Audio",
      note: "Extracts text, Whisper speech-to-text, and mathematical equations",
    },
    {
      feature: "Strict zero-data retention policy",
      source: true,
      chatgpt: "Opt-out required",
      notebooklm: "Cloud indexed",
      note: "Documents processed in isolated sessions; never used to train models",
    },
  ];

  return (
    <section id="comparison" className="py-12 sm:py-20 mx-auto text-left w-full scroll-mt-24">
      <SectionHeading
        badge="Comparison"
        badgeTone="blue"
        line1="Why generic AI chat falls short for rigorous study, research, and teaching."
        description="How Source.io compares with generic AI chat windows when analyzing dense, verifiable academic sources."
        align="left"
      />

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto rounded-[32px] border border-slate-200 bg-white shadow-tactile-card">
        <table className="w-full text-left border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-900 font-mono text-xs">
              <th className="h-12 px-6 font-semibold">Capability</th>
              <th className="h-12 px-5 font-bold text-slate-900">Source.io</th>
              <th className="h-12 px-5 font-normal text-slate-500">Generic ChatGPT</th>
              <th className="h-12 px-6 font-normal text-slate-500">NotebookLM</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {comparisonRows.map((row, idx) => (
              <tr key={row.feature} className="h-12 hover:bg-slate-50/70 transition-colors">
                <td className="px-6 py-3.5 font-medium text-slate-900">
                  <div>{row.feature}</div>
                  <div className="text-slate-500 text-xs font-mono font-normal mt-0.5">{row.note}</div>
                </td>
                <td className="px-5 py-3.5">
                  {row.source === true ? (
                    <motion.span 
                      initial={{ scale: 0.86, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      viewport={{ once: true, amount: 0.2 }}
                      transition={{ delay: idx * 0.05, type: "spring", stiffness: 450, damping: 25 }}
                      className="inline-flex items-center gap-2 text-slate-900 font-semibold font-mono text-xs"
                    >
                      <span className="size-5 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-2xs">
                        <Check className="size-3 text-white stroke-[2.5]" />
                      </span>
                      <span>Native</span>
                    </motion.span>
                  ) : (
                    <span className="font-medium text-slate-900">{row.source}</span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-slate-500 text-xs font-mono">
                  {row.chatgpt === false ? (
                    <span className="inline-flex items-center gap-1 text-slate-400 font-mono text-xs">
                      <X className="size-4 text-slate-400" /> None
                    </span>
                  ) : (
                    <span>{row.chatgpt}</span>
                  )}
                </td>
                <td className="px-6 py-3.5 text-slate-500 text-xs font-mono">
                  {row.notebooklm === false ? (
                    <span className="inline-flex items-center gap-1 text-slate-400 font-mono text-xs">
                      <X className="size-4 text-slate-400" /> None
                    </span>
                  ) : row.notebooklm === true ? (
                    <span className="inline-flex items-center gap-1 text-slate-900 font-mono text-xs font-medium">
                      <Check className="size-4 text-slate-900" /> Yes
                    </span>
                  ) : (
                    <span>{row.notebooklm}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile View: High-Legibility Verdict Cards (No 90px cramped columns) */}
      <div className="md:hidden space-y-3">
        {comparisonRows.map((row) => (
          <div key={row.feature} className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-2.5 shadow-xs">
            <div>
              <h3 className="font-bold text-slate-900 text-[13px] font-display">{row.feature}</h3>
              <p className="text-slate-500 text-[11px] mt-0.5 leading-normal">{row.note}</p>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-1.5 font-mono text-xs">
              {/* Source.io Row - Dominant & Crisp */}
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900 text-white shadow-2xs">
                <span className="font-semibold text-slate-200 text-[11px]">Source.io</span>
                <span className="inline-flex items-center gap-1.5 font-bold text-white text-[11px]">
                  <span className="size-4 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <Check className="size-2.5 text-white stroke-[2.5]" />
                  </span>
                  <span>Native</span>
                </span>
              </div>

              {/* Competitors Row - Readable without hyphenation */}
              <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-[11px]">
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">ChatGPT</span>
                  <span className="text-slate-700 font-medium block truncate" title={String(row.chatgpt)}>
                    {row.chatgpt === false ? (
                      <span className="inline-flex items-center gap-1 text-slate-400">
                        <X className="size-3 text-slate-400" /> None
                      </span>
                    ) : (
                      <span>{row.chatgpt}</span>
                    )}
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-[11px]">
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">NotebookLM</span>
                  <span className="text-slate-700 font-medium block truncate" title={String(row.notebooklm)}>
                    {row.notebooklm === false ? (
                      <span className="inline-flex items-center gap-1 text-slate-400">
                        <X className="size-3 text-slate-400" /> None
                      </span>
                    ) : row.notebooklm === true ? (
                      <span className="inline-flex items-center gap-1 text-slate-900 font-bold">
                        <Check className="size-3 text-slate-900" /> Yes
                      </span>
                    ) : (
                      <span>{row.notebooklm}</span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-slate-500 mt-6 font-medium">
        Built with feedback from students, researchers, and technical learners.
      </p>
    </section>
  );
}

export function FaqAndFinalCtaSection() {
  const shouldReduceMotion = useReducedMotion();

  const faqs = [
    {
      q: "What file types and sizes are supported?",
      a: "Source.io accepts PDF documents up to 50MB, audio and video recordings (MP3, WAV, M4A, MP4), YouTube lecture links, Word (.docx), and plain text. Text extraction, layout parsing, and speech-to-text run automatically upon upload.",
    },
    {
      q: "How are citations generated?",
      a: "When Source ingests your document, it splits passages into vector embedding chunks with immutable page numbers, paragraph positions, and audio timestamps. Every answer, flashcard, and quiz question computes similarity against these chunks and displays the exact coordinate.",
    },
    {
      q: "Can teachers and PhD researchers use Source.io, and can I customize or switch my persona?",
      a: "Yes. Source.io adapts to 7 distinct academic profiles during onboarding—from Middle School through PhD Researchers and Educators. Researchers get IMRaD methodology critiques and formal citations with flashcards hidden; Teachers get 60-minute lesson plans and printable exam rubrics; students get Cornell notes, KaTeX proofs, and 5-box Leitner flashcards. You are never locked in: you can switch personas, toggle workspace tabs on or off, and adjust explanation rigor (1–5) anytime in Settings or per-document in Notes Settings.",
    },
    {
      q: "Are my research papers or documents used to train AI models?",
      a: "No. Your documents and audio files are parsed strictly in isolated sessions with zero retention for model training. Your research and coursework remain strictly yours.",
    },
    {
      q: "Can I export my notes and flashcards?",
      a: "Yes. You can export your structured notes directly to standard clean Markdown, and copy flashcards and practice quizzes with full citation proofs for offline study.",
    },
  ];

  return (
    <div className="py-12 sm:py-20 space-y-16 md:space-y-24 scroll-mt-20">
      {/* 3. Frequently Asked Questions */}
      <section 
        id="faq" 
        className="max-w-3xl mx-auto text-left w-full scroll-mt-24"
      >
        {/* Structured Data for Search Engines & Crawlers */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: faqs.map((faq) => ({
                "@type": "Question",
                name: faq.q,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: faq.a,
                },
              })),
            }),
          }}
        />

        <SectionHeading
          badge="FAQ"
          badgeTone="slate"
          line1="Frequently asked questions."
          description="Everything you need to know about file formats, coordinate verification, and privacy."
          align="center"
        />

        <Accordion type="single" collapsible className="w-full space-y-3.5">
          {faqs.map((faq, idx) => (
            <AccordionItem 
              key={idx} 
              value={`item-${idx}`}
              className="group border border-slate-200/90 hover:border-slate-300 data-[state=open]:border-slate-400 data-[state=open]:shadow-[0_4px_24px_-4px_rgba(15,23,42,0.06)] rounded-2xl sm:rounded-[22px] bg-white data-[state=open]:bg-white px-4 sm:px-7 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
            >
              <AccordionTrigger className="min-h-[52px] sm:min-h-[64px] text-left font-bold text-sm sm:text-[15px] leading-normal text-slate-900 group-hover:text-slate-950 py-3.5 sm:py-5 hover:no-underline font-display cursor-pointer flex items-center justify-between gap-3 sm:gap-4 transition-colors">
                <span className="flex-1 py-0.5">{faq.q}</span>
              </AccordionTrigger>
              <AccordionContent className="text-[13.5px] sm:text-sm leading-[1.75] text-slate-700 pb-5 sm:pb-6 pt-0 mt-0">
                <div className="border-t border-slate-200/80 pt-4">
                  {faq.a}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* 4. Final CTA Banner */}
      <motion.section 
        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.12 }}
        transition={{ duration: shouldReduceMotion ? 0.3 : 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="text-center pb-6 w-full relative"
      >
        <div 
          onMouseMove={(e) => {
            if (shouldReduceMotion) return;
            const rect = e.currentTarget.getBoundingClientRect();
            e.currentTarget.style.setProperty("--cta-x", `${e.clientX - rect.left}px`);
            e.currentTarget.style.setProperty("--cta-y", `${e.clientY - rect.top}px`);
          }}
          className="relative rounded-[32px] sm:rounded-[44px] bg-slate-950 text-white p-6 sm:p-16 shadow-2xl border border-slate-800 overflow-hidden group hover:border-slate-700 transition-colors duration-300"
        >
          {/* Tactile Cursor Ink Spotlight Glow */}
          <div
            className="pointer-events-none absolute -inset-px rounded-[32px] sm:rounded-[44px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-0"
            style={{
              background: "radial-gradient(550px circle at var(--cta-x, 250px) var(--cta-y, 150px), rgba(255, 255, 255, 0.07), transparent 70%)",
            }}
          />

          {/* Central Content */}
          <div className="relative z-10 max-w-3xl mx-auto space-y-4">
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold font-display tracking-tight text-white text-balance">
              Stop skimming. Start mastering.
            </h2>

            <p className="text-sm sm:text-lg leading-relaxed text-slate-300 max-w-[540px] mx-auto text-balance">
              Upload your first document or lecture recording and see what Source.io can generate.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-3.5 w-full sm:w-auto">
              <motion.div
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.965, y: 0.5 }}
                transition={{ type: "spring", stiffness: 450, damping: 25 }}
                className="w-full sm:w-auto"
              >
                <Link
                  href="/auth?mode=signup"
                  className="w-full sm:w-auto bg-white text-slate-950 font-bold text-sm px-8 py-3.5 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.12),0_12px_24px_-8px_rgba(0,0,0,0.18)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.2),0_16px_32px_-8px_rgba(0,0,0,0.25)] hover:bg-slate-100 transition-all inline-flex items-center justify-center gap-2 cursor-pointer border-t border-white/40"
                >
                  <span>Start free</span>
                  <ArrowRight className="size-4" />
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.965, y: 0.5 }}
                transition={{ type: "spring", stiffness: 450, damping: 25 }}
                className="w-full sm:w-auto"
              >
                <Link
                  href="/app/doc/demo-quantum"
                  className="w-full sm:w-auto border border-white/20 bg-white/10 hover:bg-white/15 text-white font-semibold text-sm px-7 py-3.5 rounded-full backdrop-blur-md transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:shadow-md"
                >
                  <span>See a live demo</span>
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  );
}

export function CredibilityAndComparison() {
  return (
    <>
      <AcademicPersonasSection />
      <ComparisonTableSection />
      <FaqAndFinalCtaSection />
    </>
  );
}
