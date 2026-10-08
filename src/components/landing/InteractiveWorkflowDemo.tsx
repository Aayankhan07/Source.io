"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { 
  FileText, Headphones, MessagesSquare, ListChecks, Layers,
  Play, Pause, Check, X, RotateCcw, Send, BookmarkCheck,
  Copy, Terminal, ExternalLink, ShieldCheck, ChevronRight,
  LayoutDashboard, Library
} from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { SectionHeading } from "./SectionHeading";

interface InteractiveWorkflowDemoProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function InteractiveWorkflowDemo({ 
  activeTab = "dashboard", 
  onTabChange 
}: InteractiveWorkflowDemoProps) {
  const [currentTab, setCurrentTab] = useState<string>(activeTab);

  // Tab 1: Study Notes & Split PDF Inspector State
  const [highlightedPassage, setHighlightedPassage] = useState<number>(1);
  const sourcePassages = [
    {
      id: 1,
      page: 2,
      section: "§1.1 Quantum Linear Combinations",
      text: "A qubit exists in an arbitrary normalized linear combination |ψ⟩ = α|0⟩ + β|1⟩ where α, β ∈ ℂ such that |α|² + |β|² = 1. This linear state vector describes the system completely prior to thermodynamic wave function reduction.",
      similarity: 0.98,
      sourceCoordinates: "Page 2 • Paragraph 3 • Lines 14-19"
    },
    {
      id: 2,
      page: 4,
      section: "§1.3 Entangled Bell Pairs",
      text: "Entangled quantum states cannot be decomposed into a tensor product of single-particle states |ψ_AB⟩ ≠ |ψ_A⟩ ⊗ |ψ_B⟩. A projective measurement on qubit A instantaneously projects qubit B into a correlated outcome regardless of spatial separation.",
      similarity: 0.95,
      sourceCoordinates: "Page 4 • Paragraph 1 • Lines 4-8"
    },
    {
      id: 3,
      page: 11,
      section: "§3.4 Thermal Phase Decoherence",
      text: "Thermal fluctuations in the superconducting substrate induce random phase drift. Within a characteristic coherence time T₂, environmental phonons disperse phase coherence, driving the density matrix into a classical diagonal distribution.",
      similarity: 0.91,
      sourceCoordinates: "Page 11 • Paragraph 4 • Lines 22-27"
    }
  ];

  // Tab 2: Leitner Flashcards State
  const flashcardsData = [
    { 
      front: "What is Superposition in Quantum Computing?", 
      back: "The capacity of a qubit to exist in a normalized linear combination of states (|0⟩ and |1⟩) simultaneously until measurement forces a collapse.",
      interval: "4 Days",
      retention: "94.2%"
    },
    { 
      front: "Explain Quantum Entanglement.", 
      back: "A physical phenomenon where multiple qubits correlate such that measuring one instantaneously determines the state of the other across arbitrary distance.",
      interval: "2 Days",
      retention: "89.5%"
    },
    { 
      front: "What causes Quantum Decoherence?", 
      back: "Environmental interference such as thermal noise or electromagnetic fields that decays quantum phase into classical probability.",
      interval: "7 Days",
      retention: "98.1%"
    }
  ];
  const [cardIdx, setCardIdx] = useState<number>(0);
  const [cardFlipped, setCardFlipped] = useState<boolean>(false);
  const [activeInterval, setActiveInterval] = useState<string>("4 Days");
  const [activeRetention, setActiveRetention] = useState<string>("94.2%");

  // Tab 3: Practice Quiz State
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);

  // Tab 4: Audio Recap & Synchronized Waveform State
  const [podcastPlaying, setPodcastPlaying] = useState<boolean>(false);
  const [audioSeconds, setAudioSeconds] = useState<number>(48);
  const [currentSpeaker, setCurrentSpeaker] = useState<"Clara" | "Julian">("Clara");
  const audioIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (podcastPlaying) {
      audioIntervalRef.current = setInterval(() => {
        setAudioSeconds((prev) => {
          const next = prev + 1;
          if (next % 8 === 0) {
            setCurrentSpeaker((s) => (s === "Clara" ? "Julian" : "Clara"));
          }
          if (next >= 252) return 0; // Loop 4:12
          return next;
        });
      }, 1000);
    } else {
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    }
    return () => {
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    };
  }, [podcastPlaying]);

  const formatAudioTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder < 10 ? "0" : ""}${remainder}`;
  };

  // Tab 5: Grounded Chat State
  const [chatMessages, setChatMessages] = useState<Array<{ role: string; content: string; citation?: string; score?: number }>>([
    {
      role: "assistant",
      content: "Hello! I have indexed 38 pages of your document quantum_computing_intro.pdf. What concept or equation would you like verified against the text?",
    },
    {
      role: "user",
      content: "What causes quantum decoherence in physical hardware?",
    },
    {
      role: "assistant",
      content: "Decoherence is induced primarily by environmental thermal vibrations and stray electromagnetic fields. These external interactions disperse the qubit's delicate phase angle within microseconds, collapsing quantum state superposition into classical probability distributions.",
      citation: "Passage §3.4 [p. 11]",
      score: 0.91,
    },
  ]);
  const [chatInput, setChatInput] = useState<string>("");
  const [chatTyping, setChatTyping] = useState<boolean>(false);

  const handleSendChat = (text: string) => {
    if (!text.trim() || chatTyping) return;
    setChatMessages((prev) => [...prev, { role: "user", content: text }]);
    setChatInput("");
    setChatTyping(true);

    setTimeout(() => {
      let fullResponse = "";
      let citation = "";
      let score = 0.95;

      if (text.toLowerCase().includes("superposition")) {
        fullResponse = "Superposition allows a single qubit to occupy any point on the Bloch sphere, represented as |ψ⟩ = α|0⟩ + β|1⟩, evaluating multi-path computational states concurrently until projection.";
        citation = "Passage §1.1 [p. 2]";
        score = 0.98;
      } else if (text.toLowerCase().includes("entanglement")) {
        fullResponse = "Entangled pairs maintain non-local correlations across arbitrary space, forming the foundational resource for quantum teleportation protocols and superdense coding.";
        citation = "Passage §1.3 [p. 4]";
        score = 0.95;
      } else {
        fullResponse = "Decoherence represents the primary engineering barrier in quantum processors. Thermal fluctuations disperse quantum phase coherence within microseconds.";
        citation = "Passage §3.4 [p. 11]";
        score = 0.91;
      }

      setChatMessages((prev) => [...prev, { role: "assistant", content: fullResponse, citation, score }]);
      setChatTyping(false);
    }, 700);
  };

  const handleTabChange = (val: string) => {
    setCurrentTab(val);
    if (onTabChange) onTabChange(val);
  };

  const handleCopyCitation = (citation: string, score?: number) => {
    navigator.clipboard?.writeText(`${citation} (${Math.round((score || 0.96) * 100)}% match)`);
    toast.success("Citation coordinate copied to clipboard", {
      description: `${citation} • ${Math.round((score || 0.96) * 100)}% cosine similarity`,
    });
  };

  const shouldReduceMotion = useReducedMotion();

  const tabsList = [
    { value: "dashboard", label: "Dashboard", icon: LayoutDashboard, title: "Performance chart, goals & study sources" },
    { value: "library", label: "Library", icon: Library, title: "Study sources and library overview" },
    { value: "notes", label: "Structured Notes", icon: FileText, title: "Understand main ideas quickly" },
    { value: "flashcards", label: "Flashcards", icon: Layers, title: "Retain concepts over time" },
    { value: "quiz", label: "Practice Quiz", icon: ListChecks, title: "Test whether you actually understand" },
    { value: "podcast", label: "Audio Recap", icon: Headphones, title: "Review while walking or commuting" },
    { value: "chat", label: "Grounded Chat", icon: MessagesSquare, title: "Ask questions with source-backed answers" },
  ];

  return (
    <motion.section 
      id="modes" 
      data-alias="simulator" 
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: shouldReduceMotion ? 0.3 : 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="py-8 md:py-14 relative z-10 w-full scroll-mt-24"
    >
      <SectionHeading
        badge="5 Study Modes"
        badgeTone="blue"
        line1="One source."
        line2="Five ways to learn."
        description="Convert one source document into five coordinated study modes, each tailored to a different stage of learning."
        align="center"
      />

      <Tabs value={currentTab} onValueChange={handleTabChange}>
        {/* Tab Switcher */}
        <div className="flex justify-center mb-8 overflow-x-auto max-w-full pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
          <TabsList className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-white/10 p-1.5 rounded-full h-auto gap-1 inline-flex shrink-0 shadow-tactile-pill relative">
            {tabsList.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.value;
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="relative rounded-full text-[12px] font-semibold gap-2 px-3.5 py-1.5 transition-colors focus-visible:outline-none group cursor-pointer data-[state=active]:bg-transparent data-[state=active]:text-primary-foreground data-[state=active]:shadow-none text-muted-foreground hover:text-foreground"
                  title={tab.title}
                >
                  {isActive && (
                    <motion.span
                      layoutId="activeTabPill"
                      className="absolute inset-0 rounded-full bg-primary shadow-tactile-pill -z-0"
                      transition={
                        shouldReduceMotion
                          ? { duration: 0 }
                          : { type: "spring", stiffness: 450, damping: 32 }
                      }
                    />
                  )}
                  <span className="relative z-10 inline-flex items-center gap-2">
                    <Icon className="size-4 shrink-0" />
                    <span>{tab.label}</span>
                  </span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {/* Console Shell (Hero-style Tactile Squircle Shell) */}
        <div className="bg-white dark:bg-slate-900/90 rounded-[32px] sm:rounded-[40px] border border-black/[0.06] dark:border-white/10 shadow-tactile-dock overflow-hidden relative">
          {/* Header Bar */}
          <div className="bg-muted/30 border-b border-border/70 px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
              <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
              <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
            </div>

            <div className="flex-1 max-w-xs mx-auto hidden sm:flex items-center justify-center">
              <div className="w-full bg-card border border-border rounded-lg px-2.5 py-1 text-xs text-foreground flex items-center justify-between font-mono shadow-2xs">
                <span className="truncate">quantum_computing_intro.pdf</span>
                <span className="text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded font-mono font-medium border border-primary/20">Grounded</span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono tabular-nums">
              <span className="hidden md:inline">48 Citations Indexed</span>
              
              {/* Telemetry Drawer */}
              <Drawer>
                <DrawerTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-accent hover:text-foreground border border-border transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Terminal className="h-3 w-3" strokeWidth={1.5} /> Inspect Chunks
                  </button>
                </DrawerTrigger>
                <DrawerContent className="max-w-2xl mx-auto">
                  <DrawerHeader className="text-left">
                    <DrawerTitle className="text-base font-semibold font-display">Document Embedding Chunks</DrawerTitle>
                    <DrawerDescription className="text-xs">
                      Inspect verified vector coordinates and cosine similarity scores calculated against source chunks.
                    </DrawerDescription>
                  </DrawerHeader>
                  <div className="p-4 space-y-2.5 font-mono text-xs max-h-80 overflow-y-auto">
                    {sourcePassages.map((p) => (
                      <div key={p.id} className="p-3 rounded-lg bg-accent/60 border border-border flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-foreground block">chunk_00{p.id} • Page {p.page}</span>
                          <span className="text-muted-foreground text-xs truncate max-w-sm block">"{p.text.slice(0, 50)}..."</span>
                        </div>
                        <span className="text-primary bg-primary/10 px-2 py-0.5 rounded text-xs font-semibold border border-primary/20 font-mono">
                          {p.similarity} similarity
                        </span>
                      </div>
                    ))}
                  </div>
                  <DrawerFooter className="pt-2">
                    <DrawerClose asChild>
                      <button type="button" className="w-full py-2 rounded-full border border-border text-xs font-medium hover:bg-accent transition-colors">
                        Close Inspector
                      </button>
                    </DrawerClose>
                  </DrawerFooter>
                </DrawerContent>
              </Drawer>
            </div>
          </div>

          {/* Interactive Workspace Body with silky tab cross-fade */}
          <div className="p-5 sm:p-8 min-h-[380px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTab}
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 10, filter: shouldReduceMotion ? "none" : "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -8, filter: shouldReduceMotion ? "none" : "blur(4px)" }}
                transition={{ duration: shouldReduceMotion ? 0.15 : 0.28, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* TAB: DASHBOARD PREVIEW */}
                <TabsContent value="dashboard" forceMount={currentTab === "dashboard" ? true : undefined} className="mt-0 focus-visible:outline-none">
                  {currentTab === "dashboard" && (
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                        <div>
                          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                            <LayoutDashboard className="h-4 w-4 text-foreground/80" strokeWidth={1.5} /> Central Workspace Dashboard
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5">Performance charts, weekly goals progress, and quick source access</p>
                        </div>
                        <span className="text-xs px-2.5 py-1 rounded-full bg-muted/60 text-muted-foreground font-mono tabular-nums border border-border/60">
                          Live UI Preview
                        </span>
                      </div>

                      <div className="w-full rounded-2xl overflow-hidden border border-border bg-slate-50 dark:bg-slate-950/40 p-2 sm:p-3 flex items-center justify-center shadow-xs">
                        <img
                          src="/dashboard-preview.png"
                          alt="Source.io Dashboard Preview"
                          className="w-full max-h-[620px] object-contain rounded-xl shadow-xs"
                        />
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* TAB: LIBRARY PREVIEW */}
                <TabsContent value="library" forceMount={currentTab === "library" ? true : undefined} className="mt-0 focus-visible:outline-none">
                  {currentTab === "library" && (
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                        <div>
                          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                            <Library className="h-4 w-4 text-foreground/80" strokeWidth={1.5} /> Study Sources &amp; Library
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5">All uploaded textbooks, lecture recordings, papers, and YouTube videos</p>
                        </div>
                        <span className="text-xs px-2.5 py-1 rounded-full bg-muted/60 text-muted-foreground font-mono tabular-nums border border-border/60">
                          Multi-Format Index
                        </span>
                      </div>

                      <div className="w-full rounded-2xl overflow-hidden border border-border bg-slate-50 dark:bg-slate-950/40 p-2 sm:p-3 flex items-center justify-center shadow-xs">
                        <img
                          src="/library-preview.png"
                          alt="Source.io Study Sources and Library Preview"
                          className="w-full max-h-[620px] object-contain rounded-xl shadow-xs"
                        />
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* TAB: STRUCTURED NOTES */}
                <TabsContent value="notes" forceMount={currentTab === "notes" ? true : undefined} className="mt-0 focus-visible:outline-none">
                  {currentTab === "notes" && (
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                        <div>
                          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                            <FileText className="h-4 w-4 text-foreground/80" strokeWidth={1.5} /> Structured Notes &amp; Copilot
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5">AI-synthesized lecture outlines, quantum mechanics notes, and verified Copilot</p>
                        </div>
                        <span className="text-xs px-2.5 py-1 rounded-full bg-muted/60 text-muted-foreground font-mono tabular-nums border border-border/60">
                          Verified Notes
                        </span>
                      </div>

                      <div className="w-full rounded-2xl overflow-hidden border border-border bg-slate-50 dark:bg-slate-950/40 p-2 sm:p-3 flex items-center justify-center shadow-xs">
                        <img
                          src="/notes-preview.png"
                          alt="Source.io Structured Notes Preview"
                          className="w-full max-h-[620px] object-contain rounded-xl shadow-xs"
                        />
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* TAB 2: FLASHCARDS (3D TACTILE SPRING FLIP) */}
                <TabsContent value="flashcards" forceMount={currentTab === "flashcards" ? true : undefined} className="mt-0 focus-visible:outline-none">
                  {currentTab === "flashcards" && (
                    <div className="max-w-xl mx-auto py-6 sm:py-8 px-2 text-center space-y-6">
                      <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                        <span>Card {cardIdx + 1} of {flashcardsData.length}</span>
                        <div className="flex items-center gap-2">
                          <span>Interval: {activeInterval}</span>
                          <span>•</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{activeRetention} Retention</span>
                        </div>
                      </div>

                      {/* 3D Flip Card Container */}
                      <div 
                        className="w-full h-64 [perspective:1000px] cursor-pointer"
                        onClick={() => setCardFlipped(!cardFlipped)}
                      >
                        <motion.div
                          animate={{ rotateY: cardFlipped ? 180 : 0 }}
                          transition={
                            shouldReduceMotion 
                              ? { duration: 0.15 } 
                              : { type: "spring", stiffness: 280, damping: 24 }
                          }
                          className="w-full h-full relative [transform-style:preserve-3d] shadow-tactile-card rounded-[28px]"
                        >
                          {/* Front of Card */}
                          <div className="absolute inset-0 [backface-visibility:hidden] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[28px] p-8 flex flex-col justify-between text-left">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                                Question (Click to flip)
                              </span>
                              <Layers className="size-4 text-muted-foreground" />
                            </div>
                            <p className="text-base sm:text-lg font-bold font-display text-slate-900 dark:text-white leading-relaxed">
                              {flashcardsData[cardIdx].front}
                            </p>
                            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                              <RotateCcw className="size-3.5 text-primary" /> Click card to reveal answer & formula
                            </span>
                          </div>

                          {/* Back of Card */}
                          <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] bg-slate-950 text-white border border-slate-800 rounded-[28px] p-8 flex flex-col justify-between text-left shadow-2xl">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                Answer & Coordinate
                              </span>
                              <BookmarkCheck className="size-4 text-emerald-400" />
                            </div>
                            <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-mono">
                              {flashcardsData[cardIdx].back}
                            </p>
                            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800 font-mono">
                              <span>Page 4 • §1.3 • 97% Match</span>
                              <span className="text-emerald-400 font-bold">Space Repetition Sync</span>
                            </div>
                          </div>
                        </motion.div>
                      </div>

                      {/* Card Switch Controls */}
                      <div className="flex items-center justify-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCardFlipped(false);
                            setCardIdx((prev) => (prev > 0 ? prev - 1 : flashcardsData.length - 1));
                          }}
                          className="px-4 py-2 rounded-full border border-border bg-white dark:bg-slate-900 hover:bg-slate-100 text-xs font-semibold cursor-pointer transition-all active:scale-95"
                        >
                          Previous
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCardFlipped(!cardFlipped);
                          }}
                          className="px-5 py-2 rounded-full bg-primary text-primary-foreground text-xs font-semibold shadow-xs cursor-pointer transition-all active:scale-95"
                        >
                          {cardFlipped ? "Show Prompt" : "Flip Answer"}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCardFlipped(false);
                            setCardIdx((prev) => (prev < flashcardsData.length - 1 ? prev + 1 : 0));
                          }}
                          className="px-4 py-2 rounded-full border border-border bg-white dark:bg-slate-900 hover:bg-slate-100 text-xs font-semibold cursor-pointer transition-all active:scale-95"
                        >
                          Next Card
                        </button>
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* TAB 3: PRACTICE QUIZ */}
                <TabsContent value="quiz" forceMount={currentTab === "quiz" ? true : undefined} className="mt-0 focus-visible:outline-none">
                  {currentTab === "quiz" && (
                    <div className="max-w-xl mx-auto py-8 px-4 text-center space-y-4">
                      <div className="size-16 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto shadow-xs">
                        <ListChecks className="size-8" />
                      </div>
                      <h4 className="text-lg font-bold text-foreground font-display">Self-Grading Practice Quizzes</h4>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        AI-generated multiple choice and diagnostic quiz questions with instant verification and direct passage coordinates.
                      </p>
                      <div className="pt-2">
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-white/10 text-xs font-mono font-medium text-slate-700 dark:text-slate-300 border border-border">
                          <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
                          Diagnostic Exam Mode Ready
                        </span>
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* TAB 4: AUDIO RECAP WITH ANIMATED WAVEFORM BARS */}
                <TabsContent value="podcast" forceMount={currentTab === "podcast" ? true : undefined} className="mt-0 focus-visible:outline-none">
                  {currentTab === "podcast" && (
                    <div className="max-w-xl mx-auto py-6 sm:py-8 px-4 space-y-6 text-center">
                      <div className="p-6 rounded-[28px] bg-slate-950 text-white border border-slate-800 shadow-tactile-dock space-y-5">
                        <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-b border-slate-800 pb-3">
                          <span className="flex items-center gap-1.5 text-primary">
                            <Headphones className="size-3.5" /> 2-Host Dialogue Recap
                          </span>
                          <span>Speaker: {currentSpeaker}</span>
                        </div>

                        {/* Animated Live Frequency Waveform */}
                        <div className="h-16 flex items-center justify-center gap-1 px-4">
                          {[32, 48, 64, 40, 56, 72, 80, 50, 68, 76, 44, 60, 52, 65, 38, 45].map((baseHeight, i) => (
                            <motion.span
                              key={i}
                              animate={
                                podcastPlaying
                                  ? {
                                      scaleY: [0.35, 1.25, 0.45, 1.1, 0.3],
                                      opacity: [0.6, 1, 0.7, 1, 0.6],
                                    }
                                  : { scaleY: 0.25, opacity: 0.4 }
                              }
                              transition={
                                shouldReduceMotion
                                  ? { duration: 0 }
                                  : {
                                      repeat: Infinity,
                                      duration: 1.1,
                                      delay: (i % 8) * 0.08,
                                      ease: "easeInOut",
                                    }
                              }
                              style={{ height: `${baseHeight}%`, width: "4px" }}
                              className="rounded-full bg-primary origin-center"
                            />
                          ))}
                        </div>

                        <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-1">
                          <span>{formatAudioTime(audioSeconds)}</span>
                          <span className="text-slate-300 font-medium">Topic: §3.4 Thermal Phase Decoherence</span>
                          <span>4:12</span>
                        </div>

                        {/* Player Controls */}
                        <div className="pt-2 flex items-center justify-center gap-4">
                          <button
                            type="button"
                            onClick={() => setPodcastPlaying(!podcastPlaying)}
                            className="size-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
                          >
                            {podcastPlaying ? <Pause className="size-5 fill-current" /> : <Play className="size-5 fill-current ml-0.5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* TAB 5: GROUNDED CHAT */}
                <TabsContent value="chat" forceMount={currentTab === "chat" ? true : undefined} className="mt-0 focus-visible:outline-none">
                  {currentTab === "chat" && (
              <div className="max-w-xl mx-auto flex flex-col h-[380px] justify-between text-left">
                <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                  {chatMessages.map((m, idx) => {
                    const isAi = m.role === "assistant";
                    return (
                      <div key={idx} className={`flex ${isAi ? "justify-start" : "justify-end"}`}>
                        <div className={`max-w-[88%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed ${
                          isAi 
                            ? "bg-accent/60 border border-border text-foreground" 
                            : "bg-primary text-primary-foreground font-medium"
                        }`}>
                          <p>{m.content}</p>
                          {m.citation && (
                            <div className="mt-2 pt-2 border-t border-border flex items-center justify-between text-xs font-mono text-muted-foreground tabular-nums">
                              <span className="text-foreground font-medium flex items-center gap-1">
                                <BookmarkCheck className="h-3 w-3 text-primary" /> {m.citation}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyCitation(m.citation || "Passage §1.2", m.score)}
                                className="bg-accent hover:bg-card text-foreground px-1.5 py-0.5 rounded border border-border flex items-center gap-1 transition-colors"
                              >
                                <Copy className="h-2.5 w-2.5" />
                                <span>{Math.round((m.score || 0.95) * 100)}% match</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {chatTyping && (
                    <div className="flex justify-start">
                      <div className="bg-accent/60 border border-border rounded-2xl px-4 py-2 flex items-center gap-1 text-muted-foreground">
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-pulse" />
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-pulse delay-100" />
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-pulse delay-200" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Input area */}
                <div className="border-t border-border pt-3 mt-2 space-y-2">
                  <div className="flex gap-1.5 flex-wrap">
                    <button 
                      type="button"
                      onClick={() => handleSendChat("What is quantum superposition?")}
                      disabled={chatTyping}
                      className="text-xs px-3 py-1 rounded-full bg-accent hover:opacity-80 text-foreground transition-colors cursor-pointer"
                    >
                      What is superposition?
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleSendChat("Explain entanglement in simple terms.")}
                      disabled={chatTyping}
                      className="text-xs px-3 py-1 rounded-full bg-accent hover:opacity-80 text-foreground transition-colors cursor-pointer"
                    >
                      Explain entanglement
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendChat(chatInput)}
                      placeholder="Ask a question about quantum_intro.pdf..."
                      disabled={chatTyping}
                      className="flex-1 bg-accent/40 border border-border rounded-full px-4 py-2 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                    <button 
                      type="button"
                      onClick={() => handleSendChat(chatInput)}
                      disabled={chatTyping || !chatInput.trim()}
                      className="h-9 w-9 rounded-full bg-primary hover:opacity-90 text-primary-foreground flex items-center justify-center disabled:opacity-40 transition-all shrink-0 active:scale-95 cursor-pointer"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
                    )}
                  </TabsContent>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </Tabs>
      </motion.section>
    );
  }
