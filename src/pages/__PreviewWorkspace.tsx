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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText, Layers, ListChecks, Headphones, MessagesSquare,
  Trash2, Cpu, User, BookOpen, Send,
} from "lucide-react";
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

  return (
    <div className="h-screen flex bg-background text-foreground">
      {/* Sidebar — the chart index */}
      <aside className="w-64 shrink-0 border-r border-sidebar-border bg-sidebar flex flex-col h-screen">
        <div className="p-4 border-b border-sidebar-border/60">
          <div className="flex items-center gap-2 px-2 py-1">
            <div className="h-8 w-8 rounded-sm flex items-center justify-center overflow-hidden border border-border bg-card">
              <img src="/favicon.png" className="h-full w-full object-contain" alt="" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold tracking-tight text-foreground font-display text-sm">Source.io</span>
              <span className="text-xs text-muted-foreground font-mono">3 plates</span>
            </div>
          </div>
        </div>

        <div className="p-4">
          <Button className="w-full font-semibold py-2.5 rounded-sm flex items-center justify-start gap-2" size="sm">
            <FileText className="h-4 w-4 shrink-0" />
            <span>New document</span>
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-4">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground px-2">
            <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> Library</span>
            <span className="font-mono text-muted-foreground/70 bg-surface-raised px-1.5 py-0.5 rounded-sm">3</span>
          </div>
          <ul className="space-y-1">
            {[
              { t: "Introduction to Quantum Computing", active: true, s: "ready" },
              { t: "Lecture 07 — Linear Algebra", active: false, s: "ready" },
              { t: "Podcast: History of Cryptography", active: false, s: "processing" },
            ].map((d) => (
              <li key={d.t}>
                <button className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-sm text-xs text-left transition-all relative group focus-ring ${d.active ? "bg-surface-raised text-foreground border border-border" : "hover:bg-surface-raised text-muted-foreground border border-transparent"}`}>
                  {d.active && <span className="absolute left-0 top-2 bottom-2 w-0.5 bg-primary rounded-r-sm" />}
                  <div className={`h-6 w-6 rounded-sm flex items-center justify-center shrink-0 border ${d.active ? "bg-primary/10 border-primary/20 text-primary" : "bg-surface-sunken border-border text-muted-foreground"}`}>
                    <FileText className="h-3.5 w-3.5" />
                  </div>
                  <span className="truncate flex-1 font-medium">{d.t}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-3 border-t border-sidebar-border/60 bg-surface-sunken">
          <div className="flex items-center gap-3 px-2 py-1.5 rounded-sm">
            <div className="h-8 w-8 rounded-sm bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-semibold text-primary">A</div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-foreground truncate">aayan</div>
              <div className="text-xs text-muted-foreground truncate">aayan@example.com</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Workspace */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col bg-background">
          <div className="border-b border-border/60 bg-sidebar px-6 py-4 flex items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <Badge variant="outline" className="text-xs uppercase font-mono tracking-wider">pdf</Badge>
                  <span className="flex items-center gap-1 text-xs text-success font-medium bg-success/5 px-2 py-0.5 rounded-sm border border-success/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-success" /> Ready
                  </span>
                </div>
                <h1 className="text-base sm:text-lg font-bold text-foreground tracking-tight truncate font-display">Introduction to Quantum Computing</h1>
              </div>
            </div>
            <Button variant="ghost" size="icon" aria-label="Delete document" className="h-8 w-8 text-muted-foreground hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col overflow-hidden">
            <div className="border-b border-border/60 bg-sidebar px-4 shrink-0 overflow-x-auto">
              <TabsList className="bg-transparent h-12 p-0 gap-1 flex justify-start items-stretch">
                {[
                  { val: "notes", label: "Notes", icon: FileText },
                  { val: "flashcards", label: "Flashcards", icon: Layers },
                  { val: "quiz", label: "Quiz", icon: ListChecks },
                  { val: "podcast", label: "Audio recap", icon: Headphones },
                  { val: "chat", label: "Chat", icon: MessagesSquare },
                ].map((t) => (
                  <TabsTrigger key={t.val} value={t.val} className="rounded-none border-b-2 border-transparent bg-transparent px-4 text-xs font-medium text-muted-foreground hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-primary transition-all flex items-center gap-1.5">
                    <t.icon className="h-3.5 w-3.5" />
                    <span>{t.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto">
              <TabsContent value="notes" className="m-0 p-6 max-w-3xl mx-auto">
                <div className="plate p-6 sm:p-8 rounded-sm">
                  <MarkdownView>{NOTES}</MarkdownView>
                </div>
              </TabsContent>

              <TabsContent value="flashcards" className="m-0 p-6 max-w-3xl mx-auto">
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">3 cards</h2>
                  </div>
                  <FlashcardsDeck cards={CARDS} />
                </div>
              </TabsContent>

              <TabsContent value="quiz" className="m-0 p-6 max-w-3xl mx-auto">
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Quantum Fundamentals · 2 questions</h2>
                  </div>
                  <QuizPlayer quiz={QUIZ} />
                </div>
              </TabsContent>

              <TabsContent value="podcast" className="m-0 p-6 max-w-3xl mx-auto">
                <CustomAudioPlayer title="Introduction to Quantum Computing — Audio Recap" />
              </TabsContent>

              <TabsContent value="chat" className="m-0 p-6 max-w-3xl mx-auto w-full h-full flex flex-col">
                <div className="flex flex-col h-full min-h-[24rem]">
                  <div className="flex-1 overflow-y-auto space-y-5 pr-2 pb-4">
                    <div className="flex gap-3 justify-end">
                      <div className="max-w-[92%] sm:max-w-[85%] rounded-sm px-4 py-3 border bg-primary border-primary/10 text-primary-foreground font-medium">
                        <p className="text-sm leading-relaxed">What is decoherence and why does it matter?</p>
                      </div>
                      <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-sm bg-surface-raised border border-border flex items-center justify-center text-foreground/90 shrink-0">
                        <User className="h-4 w-4" />
                      </div>
                    </div>

                    <div className="flex gap-3 justify-start">
                      <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-sm bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                        <Cpu className="h-4 w-4" />
                      </div>
                      <div className="max-w-[92%] sm:max-w-[85%] rounded-sm px-4 py-3 border bg-card border-border text-foreground/90 plate">
                        <div className="text-sm leading-relaxed prose-invert-tight">
                          <p>Decoherence is the loss of a qubit's quantum state through interaction with its environment — stray heat, vibration, electromagnetic noise <strong className="text-primary">[1]</strong>. It matters because it is the central obstacle to scaling: most designs operate near absolute zero to limit it <strong className="text-primary">[2]</strong>.</p>
                        </div>
                        <div className="mt-3 pt-2.5 border-t border-border flex flex-wrap gap-1.5">
                          {CITED.map((c) => (
                            <span key={c.n} className="inline-flex items-center gap-1.5 text-xs font-mono px-2 py-0.5 rounded-sm bg-surface-sunken border border-border text-muted-foreground">
                              <Magnitude value={c.sim} className="text-primary" />
                              [{c.n}]
                              <span className="text-muted-foreground/70">{(c.sim * 100).toFixed(0)}%</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border pt-4 shrink-0">
                    <div className="plate p-2.5 rounded-sm flex items-end gap-2 focus-within:border-primary/50">
                      <textarea rows={2} placeholder="Ask a question grounded in this document..." className="flex-1 bg-transparent border-none text-foreground placeholder:text-muted-foreground/70 text-sm resize-none p-1 focus:outline-none" />
                      <Button size="icon" aria-label="Send" className="h-9 w-9 rounded-sm shrink-0">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground font-mono mt-2 px-1">
                      <span className="flex items-center gap-1"><BookOpen className="h-3 w-3 text-primary" /> Answers cite 42 passages</span>
                      <span>Press Enter to send</span>
                    </div>
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
