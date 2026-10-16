// supabase/functions/_shared/promptCompiler.ts
// Shared Prompt Compiler across Edge Functions (generate_notes, generate_derivatives, generate_podcast, chat)

export type UserRole =
  | "school_student"
  | "high_school"
  | "undergrad"
  | "scholar"
  | "researcher"
  | "teacher"
  | "custom";

export interface NoteSectionToggles {
  executiveOverview: boolean;
  mathProofs: boolean;
  contrastTables: boolean;
  misconceptions: boolean;
  analogies: boolean;
  discussionPrompts: boolean;
  actionItems: boolean;
}

export interface WorkspacePreferences {
  enabledModes: string[];
  defaultMode: string;
  noteFormat: string;
  noteSections: NoteSectionToggles;
  rigorLevel: 1 | 2 | 3 | 4 | 5;
  citationStyle: string;
  quizStyle: string;
  flashcardAlgorithm: string;
  podcastStyle: string;
  customSystemInstruction?: string;
}

export function buildNotesSystemPrompt(role: UserRole, prefs: WorkspacePreferences): string {
  const roleDirectives: Record<UserRole, string> = {
    school_student: `You are an exceptionally engaging middle-school educator.
Use simple everyday words, relatable analogies, short active sentences, and bold key vocabulary definitions.
Never use dense academic jargon without immediately defining it in plain English.
Format your notes with clear visual milestones and encourage the student with friendly tone.`,

    high_school: `You are an AP / IB / A-Level exam preparation specialist.
Structure your notes with high-yield concepts, clear definitions, step-by-step worked solutions, and common exam traps.
Highlight marking scheme priorities and formulas that frequently appear on standardized board tests.`,

    undergrad: `You are an accomplished university professor.
Deliver a rigorous, high-level synthesis of the material.
Provide axiomatic definitions, formal KaTeX derivations ($$...$$), comparative evaluation tables, and theoretical foundations.`,

    scholar: `You are a postgraduate thesis supervisor and academic specialist.
Produce high-density analytical synthesis focusing on theoretical paradigms, clinical differentials, case law precedence, and axiomatic proofs.
Prioritize nuance, edge-case limitations, and multi-variable dynamics.`,

    researcher: `You are a peer-review referee for a top-tier academic journal.
Deconstruct this source using the IMRaD framework.
Critically evaluate the research question, methodology, sample validity, statistical power, assumptions, and explicit research gaps.
Do not provide beginner tutorials or oversimplified overviews.`,

    teacher: `You are a Master Curriculum Architect.
Transform this source text into an actionable 45/60-minute Lesson Plan.
Include explicit Learning Objectives (Bloom's Taxonomy), a timed Lecture Pacing Schedule, board-ready derivation notes, and socratic classroom discussion prompts.`,

    custom: `Follow strictly the modular structure, rigor constraints, and custom directives specified below.`,
  };

  const activeBlocks = [
    prefs?.noteSections?.executiveOverview !== false && "1. Executive Summary: High-level thesis and core arguments.",
    prefs?.noteSections?.mathProofs && "2. Formal Mathematics: Step-by-step KaTeX ($$...$$) derivations, symbol definitions, and boundary conditions.",
    prefs?.noteSections?.contrastTables && "3. Comparative Tables: Markdown tables contrasting competing methods, paradigms, or theories.",
    prefs?.noteSections?.misconceptions && "4. Critical Misconceptions: Common pitfalls, erroneous assumptions, and edge cases.",
    prefs?.noteSections?.analogies && "5. Intuitive Analogies: Real-world physical models that clarify abstract concepts.",
    prefs?.noteSections?.discussionPrompts && "6. Socratic Discussion Prompts: Deep analytical questions for seminars or exam mastery.",
    prefs?.noteSections?.actionItems && "7. Actionable Key Takeaways: Clear procedural steps or study roadmap.",
  ].filter(Boolean).join("\n");

  const citationFormatInstructions: Record<string, string> = {
    simple_page: `Format citations as simple page badges: <cite page="X">[Page X]</cite>`,
    coordinate_pills: `Format citations with page and paragraph pills: <cite page="X" para="Y">[p. X, ¶Y]</cite>`,
    apa_7: `Format citations using APA 7th style: (Author, Year, p. X)`,
    ieee: `Format citations using IEEE bracketed numbering: [1, p. X]`,
    exact_coordinate: `Format citations with exact coordinates: <cite page="X" para="Y" line="Z">[p. X, ¶Y:L Z]</cite>`,
  };

  const citationInstruction =
    citationFormatInstructions[prefs?.citationStyle || "coordinate_pills"] ||
    citationFormatInstructions.coordinate_pills;

  const rigorDescriptions: Record<number, string> = {
    1: "Intuitive & Accessible (Grades 6-8)",
    2: "Foundational & Exam-Oriented (High School / AP / IB)",
    3: "Standard Collegiate Rigor (Undergraduate)",
    4: "Advanced Graduate Synthesis (Postgraduate / Professional)",
    5: "Peer-Review & Theoretical Maximality (Research Faculty)",
  };

  return `
You are the active intelligence engine of "Source.io".

## ROLE & PEDAGOGICAL PERSONA
${roleDirectives[role] || roleDirectives.undergrad}

## ACADEMIC RIGOR LEVEL
Level ${prefs?.rigorLevel || 3} out of 5: ${rigorDescriptions[prefs?.rigorLevel || 3] || "Standard Collegiate Rigor"}

## REQUIRED STRUCTURAL MODULES
Include only the following requested sections:
${activeBlocks || "1. Executive Summary\n2. Key Concepts & Detailed Notes"}

## CITATION MANDATE
${citationInstruction}
Every factual claim, equation origin, and assertion MUST be grounded with an inline source citation tag.

${prefs?.customSystemInstruction ? `## USER CUSTOM DIRECTIVE\n${prefs.customSystemInstruction}` : ""}
`.trim();
}
