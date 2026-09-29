/**
 * TEMPORARY design-review harness. Not part of the product.
 *
 * The hosted Supabase project requires email confirmation, so a signed-in
 * workspace cannot be reached locally. This route mounts the real workspace
 * components against fixture data so their composition can be reviewed against
 * the plate design system.
 *
 * Delete this file and its route in App.tsx before merging.
 */
import { useState } from "react";
import FlashcardsDeck from "@/features/flashcards/components/FlashcardsDeck";
import QuizPlayer from "@/features/quiz/components/QuizPlayer";
import CustomAudioPlayer from "@/features/documents/components/CustomAudioPlayer";
import MarkdownView from "@/components/common/MarkdownView";
import Magnitude from "@/components/common/Magnitude";
import ThemeToggle from "@/components/common/ThemeToggle";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText, Layers, ListChecks, Headphones, MessagesSquare,
  Trash2, Cpu, User, BookOpen, Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { FlashcardRow, QuizRow } from "@/features/documents/types";

const NOTES = `Here are the core concepts distilled from your reading:

### 1. Fundamental Quantum Mechanics

Quantum Computing leverages the unique principles of quantum physics to solve complex calculations that would take classical supercomputers millennia:

*   **Superposition**: A state where quantum systems contain multiple values simultaneously until measured.
*   **Entanglement**: Spooky correlation between qubits, locking their states instantly across distance.
*   **Decoherence**: Environmental noise causing qubits to lose their quantum state. This is the biggest engineering hurdle.

### 2. Quantum vs. Classical State Comparison

| Concept | Classical Computers | Quantum Computers |
| :--- | :--- | :--- |
| Core Unit | Bits (0 or 1) | Qubits (\\|0⟩, \\|1⟩, or both) |
| Speed Scaling | Linear | Exponential (for select problems) |
| Entanglement | Impossible | Supported natively |

> Quantum algorithms exploit superposition states to test billions of outcomes in parallel.`;

const CARDS: FlashcardRow[] = [
  { id: "1", document_id: "d1", front: "What is Superposition?", back: "The ability of a qubit to exist in multiple states (0 and 1) simultaneously until it is measured.", order_index: 0 },
  { id: "2", document_id: "d1", front: "Explain Quantum Entanglement.", back: "Two or more particles become interconnected such that the state of one instantly influences the other, regardless of distance.", order_index: 1 },
  { id: "3", document_id: "d1", front: "What causes decoherence?", back: "Interaction with the environment — stray heat, vibration, and electromagnetic noise — collapsing the quantum state.", order_index: 2 },
];

const QUIZ: QuizRow = {
  id: "q1", document_id: "d1", title: "Quantum Fundamentals",
  questions: [
    { id: "q1a", quiz_id: "q1", question: "Which process describes a qubit losing its quantum state through environmental interaction?", type: "mcq", choices: ["Entanglement", "Decoherence", "Superposition", "Tunnelling"], correct: "Decoherence", explanation: "Decoherence is the loss of quantum state caused by interaction with the environment — heat, vibration, or electromagnetic noise.", order_index: 0 },
    { id: "q1b", quiz_id: "q1", question: "Entanglement can be reproduced on classical hardware.", type: "true_false", choices: null, correct: "False", explanation: "Entanglement has no classical analogue; it is a genuinely quantum correlation.", order_index: 1 },
  ],
};

const CITED = [
  { n: 1, sim: 0.94, text: "Decoherence is the loss of a qubit's quantum state through interaction with its environment." },
  { n: 2, sim: 0.71, text: "Most designs operate near absolute zero to limit thermal noise." },
  { n: 3, sim: 0.46, text: "Error correction schemes add redundancy across physical qubits." },
];

export default function PreviewWorkspace() {
  const [tab, setTab] = useState("notes");
  const { theme } = useTheme();

  return (
    <div className={cn("luminous-app h-screen flex bg-background text-foreground font-sans antialiased", theme === "dark" && "dark")}>
      {/* Sidebar — Luminous / Obsidian Studio Index */}
      <aside className="w-64 shrink-0 border-r border-sidebar-border bg-sidebar flex flex-col h-screen">
        <div className="p-4 border-b border-sidebar-border/60">
          <div className="flex items-center gap-2.5 px-2 py-1">
            <div className="h-8 w-8 rounded-full bg-slate-900 dark:bg-card border border-transparent dark:border-border flex items-center justify-center text-white shadow-sm overflow-hidden">
              <img src="/favicon.png" className="h-4 w-4 object-contain" alt="Logo" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold tracking-tight text-foreground font-display text-sm">
                Source<span className="text-sky-600 dark:text-sky-400">.io</span>
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">Research Studio</span>
            </div>
          </div>
        </div>

        <div className="p-4">
          <Button className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-sky-500 dark:hover:bg-sky-400 text-white font-semibold py-2.5 rounded-full flex items-center justify-center gap-2 shadow-sm text-xs" size="sm">
            <FileText className="h-4 w-4 shrink-0 text-sky-400 dark:text-white" />
            <span>New Document</span>
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground px-2">
            <span className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider">
              <BookOpen className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" /> Library
            </span>
            <span className="font-mono text-[11px] text-muted-foreground bg-card border border-border/80 px-2 py-0.5 rounded-full shadow-2xs">3</span>
          </div>
          <ul className="space-y-1">
            {[
              { t: "Introduction to Quantum Computing", active: true, s: "ready" },
              { t: "Lecture 07 — Linear Algebra", active: false, s: "ready" },
              { t: "Podcast: History of Cryptography", active: false, s: "processing" },
            ].map((d) => (
              <li key={d.t}>
                <button className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-left transition-all relative group focus-ring ${d.active ? "bg-card text-foreground border border-border shadow-xs font-medium" : "hover:bg-accent/60 text-muted-foreground hover:text-foreground border border-transparent"}`}>
                  <div className={`h-6 w-6 rounded-lg flex items-center justify-center shrink-0 border ${d.active ? "bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/30 text-sky-700 dark:text-sky-400" : "bg-card border-border text-muted-foreground group-hover:text-foreground"}`}>
                    <FileText className="h-3.5 w-3.5" />
                  </div>
                  <span className="truncate flex-1 font-medium">{d.t}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Sidebar Footer with ThemeToggle */}
        <div className="p-3 border-t border-sidebar-border/60 bg-sidebar">
          <div className="flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-xl border border-border/80 bg-card shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-7 w-7 rounded-full bg-slate-900 dark:bg-sky-500 text-white flex items-center justify-center text-xs font-semibold shrink-0">A</div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-foreground truncate">aayan</div>
                <div className="text-[11px] text-muted-foreground truncate">aayan@example.com</div>
              </div>
            </div>
            <ThemeToggle className="h-7 w-7 border-none bg-transparent hover:bg-accent" />
          </div>
        </div>
      </aside>

      {/* Workspace Canvas */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col bg-background">
          <div className="border-b border-border/80 bg-card px-6 py-3.5 flex items-center justify-between gap-4 shrink-0 shadow-2xs">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Badge variant="outline" className="text-[11px] uppercase font-mono tracking-wider border-border/80 text-muted-foreground bg-muted px-2 py-0.5 rounded-full">PDF</Badge>
                  <span className="flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/40">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Ready
                  </span>
                </div>
                <h1 className="text-base sm:text-lg font-semibold text-foreground tracking-tight truncate font-display">Introduction to Quantum Computing</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle variant="pill" />
              <Button variant="ghost" size="icon" aria-label="Delete document" className="h-8 w-8 text-muted-foreground hover:text-destructive rounded-full">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col overflow-hidden">
            <div className="border-b border-border/80 bg-card/70 backdrop-blur-sm px-6 py-2.5 shrink-0 overflow-x-auto">
              <TabsList className="bg-muted/80 border border-border/60 p-1 rounded-full gap-1 inline-flex items-center">
                {[
                  { val: "notes", label: "Study Notes", icon: FileText },
                  { val: "flashcards", label: "Flashcards", icon: Layers },
                  { val: "quiz", label: "Quiz Practice", icon: ListChecks },
                  { val: "podcast", label: "Audio Recap", icon: Headphones },
                  { val: "chat", label: "Grounded Chat", icon: MessagesSquare },
                ].map((t) => (
                  <TabsTrigger key={t.val} value={t.val} className="rounded-full px-4 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all flex items-center gap-1.5">
                    <t.icon className="h-3.5 w-3.5" />
                    <span>{t.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto bg-background">
              <TabsContent value="notes" className="m-0 p-6 sm:p-8 max-w-4xl mx-auto">
                <div className="bg-card p-7 sm:p-9 rounded-2xl border border-border shadow-sm">
                  <MarkdownView>{NOTES}</MarkdownView>
                </div>
              </TabsContent>

              <TabsContent value="flashcards" className="m-0 p-6 sm:p-8 max-w-4xl mx-auto">
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-border/60 pb-3">
                    <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest font-mono">3 cards ready</h2>
                  </div>
                  <FlashcardsDeck cards={CARDS} />
                </div>
              </TabsContent>

              <TabsContent value="quiz" className="m-0 p-6 sm:p-8 max-w-4xl mx-auto">
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-border/60 pb-3">
                    <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest font-mono">Quantum Fundamentals · 2 questions</h2>
                  </div>
                  <QuizPlayer quiz={QUIZ} />
                </div>
              </TabsContent>

              <TabsContent value="podcast" className="m-0 p-6 sm:p-8 max-w-4xl mx-auto">
                <CustomAudioPlayer title="Introduction to Quantum Computing — Audio Recap" />
              </TabsContent>

              <TabsContent value="chat" className="m-0 p-6 sm:p-8 max-w-4xl mx-auto">
                <div className="bg-card rounded-2xl border border-border shadow-sm p-6 sm:p-8 space-y-4">
                  <div className="flex items-center justify-between border-b border-border/60 pb-3">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <MessagesSquare className="h-4 w-4 text-sky-600 dark:text-sky-400" /> Grounded Passage Citations
                    </h3>
                    <span className="text-[11px] font-mono text-muted-foreground">Citations ranked by vector proximity</span>
                  </div>

                  <div className="space-y-3">
                    {CITED.map((c) => (
                      <div key={c.n} className="p-3.5 rounded-xl bg-muted/40 border border-border/80 flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <span className="text-[11px] font-mono text-sky-700 dark:text-sky-300 font-semibold block">Passage §1.{c.n}</span>
                          <p className="text-xs text-foreground leading-relaxed font-reading">{c.text}</p>
                        </div>
                        <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-500/20 text-sky-800 dark:text-sky-300 shrink-0">
                          {(c.sim * 100).toFixed(0)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

