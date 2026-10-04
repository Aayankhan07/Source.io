"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  FileText, Headphones, MessagesSquare, ListChecks, Layers,
  Play, Pause, Check, X, RotateCcw, Send, BookmarkCheck,
  Copy, Terminal, ExternalLink, ShieldCheck, ChevronRight
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

interface InteractiveWorkflowDemoProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function InteractiveWorkflowDemo({ 
  activeTab = "notes", 
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

  return (
    <section id="workbench" data-alias="simulator" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 relative z-10 max-w-6xl mx-auto scroll-mt-24 w-full">
      <div className="text-center max-w-xl mx-auto mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent border border-border text-xs font-mono text-foreground mb-2">
          <span>INTERACTIVE PLAYGROUND</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-display font-medium text-foreground tracking-tight mb-2">
          Experience the study workflow
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Inspect how Source converts raw documents into 5 derived, coordinate-verified study assets.
        </p>
      </div>

      <Tabs value={currentTab} onValueChange={handleTabChange}>
        {/* Tab Switcher */}
        <div className="flex justify-center mb-3 overflow-x-auto max-w-full pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
          <TabsList className="bg-accent/80 border border-border p-1 rounded-full h-auto gap-1 inline-flex shrink-0">
            <TabsTrigger value="notes" className="rounded-full text-xs gap-1.5 px-3 py-1.5 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <FileText className="h-3.5 w-3.5" strokeWidth={1.5} />
              <span>Study Notes</span>
            </TabsTrigger>
            <TabsTrigger value="flashcards" className="rounded-full text-xs gap-1.5 px-3 py-1.5 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Layers className="h-3.5 w-3.5" strokeWidth={1.5} />
              <span>Flashcards</span>
            </TabsTrigger>
            <TabsTrigger value="quiz" className="rounded-full text-xs gap-1.5 px-3 py-1.5 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <ListChecks className="h-3.5 w-3.5" strokeWidth={1.5} />
              <span>Practice Quiz</span>
            </TabsTrigger>
            <TabsTrigger value="podcast" className="rounded-full text-xs gap-1.5 px-3 py-1.5 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Headphones className="h-3.5 w-3.5" strokeWidth={1.5} />
              <span>Audio Recap</span>
            </TabsTrigger>
            <TabsTrigger value="chat" className="rounded-full text-xs gap-1.5 px-3 py-1.5 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <MessagesSquare className="h-3.5 w-3.5" strokeWidth={1.5} />
              <span>Grounded Chat</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Console Shell */}
        <div className="bg-card rounded-2xl sm:rounded-3xl border border-border shadow-xl shadow-black/5 overflow-hidden">
          {/* Header Bar */}
          <div className="bg-accent/40 border-b border-border px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-border" />
              <span className="h-2.5 w-2.5 rounded-full bg-border" />
              <span className="h-2.5 w-2.5 rounded-full bg-border" />
            </div>

            <div className="flex-1 max-w-xs mx-auto hidden sm:flex items-center justify-center">
              <div className="w-full bg-card border border-border rounded-lg px-2.5 py-1 text-xs text-foreground flex items-center justify-between font-mono shadow-2xs">
                <span className="truncate">quantum_computing_intro.pdf</span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1 rounded font-medium">Grounded</span>
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
                        <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-xs font-semibold border border-emerald-500/20">
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

          {/* Interactive Workspace Body */}
          <div className="p-5 sm:p-8 min-h-[380px]">
            {/* TAB 1: STUDY NOTES WITH SPLIT SOURCE INSPECTOR */}
            <TabsContent value="notes" className="mt-0 focus-visible:outline-none">
              <div className="grid lg:grid-cols-12 gap-6 items-start text-left">
                {/* Left: Synthesized Study Notes */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <div>
                      <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" strokeWidth={1.5} /> Introduction to Quantum Computing
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Click or hover citation tags to inspect verified source passages</p>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-accent text-muted-foreground font-mono tabular-nums">
                      3 min read
                    </span>
                  </div>

                  <div className="text-xs sm:text-sm text-foreground/90 leading-relaxed space-y-3">
                    <p>
                      Quantum computation is fundamentally distinguished by its exploitation of <strong>superposition</strong> and <strong>quantum entanglement</strong>.
                    </p>

                    {/* Interactive Citation Cards */}
                    <div className="space-y-2.5">
                      <div 
                        onMouseEnter={() => setHighlightedPassage(1)}
                        onClick={() => setHighlightedPassage(1)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                          highlightedPassage === 1 
                            ? "bg-accent/80 border-primary ring-1 ring-primary/20 shadow-xs" 
                            : "bg-accent/40 border-border hover:bg-accent/60"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-foreground font-mono">Principle 1: Superposition</span>
                          <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-card border border-border text-foreground">
                            §1.1 [p. 2]
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-normal">
                          A qubit exists in a normalized linear superposition |ψ⟩ = α|0⟩ + β|1⟩, evaluating multi-path algorithms simultaneously until measurement.
                        </p>
                      </div>

                      <div 
                        onMouseEnter={() => setHighlightedPassage(2)}
                        onClick={() => setHighlightedPassage(2)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                          highlightedPassage === 2 
                            ? "bg-accent/80 border-primary ring-1 ring-primary/20 shadow-xs" 
                            : "bg-accent/40 border-border hover:bg-accent/60"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-foreground font-mono">Principle 2: Entanglement</span>
                          <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-card border border-border text-foreground">
                            §1.3 [p. 4]
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-normal">
                          Entangled Bell pairs establish instant state correlations across spatial separations, enabling dense coding and cryptographic key distribution.
                        </p>
                      </div>

                      <div 
                        onMouseEnter={() => setHighlightedPassage(3)}
                        onClick={() => setHighlightedPassage(3)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                          highlightedPassage === 3 
                            ? "bg-accent/80 border-primary ring-1 ring-primary/20 shadow-xs" 
                            : "bg-accent/40 border-border hover:bg-accent/60"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-foreground font-mono">Decoherence Decay</span>
                          <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-card border border-border text-foreground">
                            §3.4 [p. 11]
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-normal">
                          Thermal fluctuations induce environmental phase drift, collapsing quantum linear state vectors into classical probabilities.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Real-time Split Source PDF Inspector */}
                <div className="lg:col-span-5 bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between min-h-[340px]">
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-border text-xs mb-3 font-mono">
                      <span className="font-semibold text-foreground flex items-center gap-1.5">
                        <BookmarkCheck className="h-3.5 w-3.5 text-primary" /> Source Passage View
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                        {Math.round(sourcePassages[highlightedPassage - 1].similarity * 100)}% Match
                      </span>
                    </div>

                    <div className="text-xs font-mono text-muted-foreground mb-2 flex items-center justify-between">
                      <span>{sourcePassages[highlightedPassage - 1].section}</span>
                      <span>Page {sourcePassages[highlightedPassage - 1].page}</span>
                    </div>

                    <AnimatePresence mode="wait">
                      <motion.div
                        key={highlightedPassage}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="p-3.5 rounded-xl bg-accent/60 border border-primary/30 text-xs text-foreground leading-relaxed font-serif relative"
                      >
                        <span className="absolute -top-2 right-3 text-xs font-mono font-mono font-bold bg-primary text-primary-foreground px-1.5 rounded">
                          HIGHLIGHTED
                        </span>
                        "{sourcePassages[highlightedPassage - 1].text}"
                      </motion.div>
                    </AnimatePresence>

                    <p className="text-xs font-mono text-muted-foreground mt-3">
                      Coordinate: {sourcePassages[highlightedPassage - 1].sourceCoordinates}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-border mt-4 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleCopyCitation(sourcePassages[highlightedPassage - 1].section, sourcePassages[highlightedPassage - 1].similarity)}
                      className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-accent hover:bg-card border border-border text-foreground transition-colors cursor-pointer"
                    >
                      <Copy className="h-3 w-3" /> Copy Coordinate
                    </button>
                    <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400">
                      Verified Exact Match
                    </span>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: LEITNER FLASHCARDS */}
            <TabsContent value="flashcards" className="mt-0 focus-visible:outline-none">
              <div className="max-w-md mx-auto space-y-4 text-center py-2">
                <div className="flex justify-between items-center text-xs text-muted-foreground font-mono">
                  <span>Card {cardIdx + 1} of {flashcardsData.length}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-accent px-2 py-0.5 rounded text-foreground">
                      Interval: {activeInterval}
                    </span>
                    <button 
                      type="button"
                      onClick={() => { 
                        setCardIdx(0); 
                        setCardFlipped(false);
                        setActiveInterval("4 Days");
                        toast.info("Flashcards deck reset to beginning");
                      }}
                      className="px-2.5 py-1 rounded-full bg-accent hover:opacity-80 text-foreground text-xs transition-colors"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                {/* 3D Flip Card */}
                <div
                  className="relative w-full min-h-[14rem] h-52 cursor-pointer select-none rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  style={{ perspective: "1000px" }}
                  onClick={() => setCardFlipped(!cardFlipped)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setCardFlipped(prev => !prev);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-pressed={cardFlipped}
                  aria-label={cardFlipped ? "Answer revealed. Click to show question" : "Question shown. Click to reveal answer"}
                >
                  <div
                    className="absolute inset-0 transition-transform duration-500 motion-reduce:transition-none"
                    style={{
                      transformStyle: "preserve-3d",
                      transform: cardFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                    }}
                  >
                    {/* Front */}
                    <div 
                      className="absolute inset-0 rounded-2xl border border-border bg-card p-6 flex flex-col items-center justify-center text-center shadow-xs"
                      style={{ backfaceVisibility: "hidden" }}
                    >
                      <span className="px-2.5 py-0.5 rounded-full bg-accent text-foreground text-xs font-mono font-semibold mb-3">
                        QUESTION
                      </span>
                      <p className="text-base font-semibold text-foreground leading-snug">
                        {flashcardsData[cardIdx].front}
                      </p>
                      <p className="absolute bottom-4 text-xs text-muted-foreground">Click or press Space to reveal answer</p>
                    </div>

                    {/* Back */}
                    <div 
                      className="absolute inset-0 rounded-2xl border border-border bg-accent/40 p-6 flex flex-col items-center justify-center text-center shadow-xs"
                      style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                    >
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-mono font-semibold mb-3 border border-emerald-500/20">
                        EXPLANATION
                      </span>
                      <p className="text-xs sm:text-sm text-foreground leading-relaxed">
                        {flashcardsData[cardIdx].back}
                      </p>
                      <p className="absolute bottom-4 text-xs text-muted-foreground">Click or press Space to flip back</p>
                    </div>
                  </div>
                </div>

                {/* Leitner Confidence Buttons */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <button 
                    type="button"
                    onClick={() => { setCardFlipped(false); setCardIdx(i => Math.max(0, i - 1)); }}
                    disabled={cardIdx === 0}
                    className="px-3.5 py-1.5 min-h-[36px] rounded-full border border-border text-xs text-muted-foreground disabled:opacity-40 hover:bg-accent hover:text-foreground transition-colors"
                  >
                    Previous
                  </button>
                  <div className="flex gap-1.5" role="group" aria-label="Leitner confidence rating">
                    {[
                      { label: "Again", days: "1 day", ret: "72.0%", style: "hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400" },
                      { label: "Hard", days: "2 days", ret: "84.5%", style: "hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400" },
                      { label: "Good", days: "4 days", ret: "94.2%", style: "hover:bg-accent hover:text-foreground" },
                      { label: "Easy", days: "7 days", ret: "98.8%", style: "hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400" },
                    ].map((item) => (
                      <Tooltip key={item.label}>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => {
                              setCardFlipped(false);
                              setActiveInterval(item.days);
                              setActiveRetention(item.ret);
                              setCardIdx((i) => (i + 1) % flashcardsData.length);
                              toast.success(`Scheduled for review in ${item.days}`, {
                                description: `Retention updated to ${item.ret} via Leitner algorithm`,
                              });
                            }}
                            className={`text-xs px-3.5 py-1.5 min-h-[36px] rounded-full bg-accent text-foreground font-medium transition-colors ${item.style}`}
                          >
                            {item.label}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p className="text-xs">Next interval: {item.days} ({item.ret} retention)</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                  <button 
                    type="button"
                    onClick={() => { setCardFlipped(false); setCardIdx(i => Math.min(flashcardsData.length - 1, i + 1)); }}
                    disabled={cardIdx === flashcardsData.length - 1}
                    className="px-3.5 py-1.5 min-h-[36px] rounded-full border border-border text-xs text-muted-foreground disabled:opacity-40 hover:bg-accent hover:text-foreground transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            </TabsContent>

            {/* TAB 3: PRACTICE QUIZ */}
            <TabsContent value="quiz" className="mt-0 focus-visible:outline-none">
              <div className="max-w-xl mx-auto space-y-4 text-left">
                <div className="border border-border bg-card rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
                  <div className="flex items-start gap-2.5">
                    <span className="px-2 py-0.5 rounded bg-primary text-primary-foreground text-xs font-mono font-bold mt-0.5">Q1</span>
                    <div>
                      <h4 className="text-sm sm:text-base font-semibold text-foreground">
                        Which decay mechanism transforms a qubit's quantum superposition into classical probability?
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5 font-mono">Single choice • Vector verified against Chapter 1</p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1" role="radiogroup">
                    {[
                      { idx: 0, text: "Quantum Teleportation Protocol" },
                      { idx: 1, text: "Quantum Decoherence (Thermal Vibration)", correct: true },
                      { idx: 2, text: "Phase Gate Inversion Matrix" },
                      { idx: 3, text: "Qubit Entanglement Hyper-Collapse" }
                    ].map((opt) => {
                      const isSelected = selectedChoice === opt.idx;
                      const isCorrect = opt.correct;
                      
                      let btnStyle = "border-border hover:bg-accent/60 bg-card text-foreground";
                      if (isSelected) {
                        if (quizSubmitted) {
                          btnStyle = isCorrect 
                            ? "border-emerald-500 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300" 
                            : "border-rose-500 bg-rose-500/10 text-rose-800 dark:text-rose-300";
                        } else {
                          btnStyle = "border-primary bg-accent text-foreground ring-1 ring-ring";
                        }
                      } else if (quizSubmitted && isCorrect) {
                        btnStyle = "border-emerald-500 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300";
                      }

                      return (
                        <button
                          key={opt.idx}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          disabled={quizSubmitted}
                          onClick={() => setSelectedChoice(opt.idx)}
                          className={`w-full text-left p-3.5 rounded-xl border transition-all text-xs sm:text-sm font-medium flex items-center justify-between cursor-pointer ${btnStyle}`}
                        >
                          <span>{opt.text}</span>
                          {quizSubmitted && isCorrect && <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
                          {quizSubmitted && isSelected && !isCorrect && <X className="h-4 w-4 text-rose-600 dark:text-rose-400" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <span className="text-xs text-muted-foreground">Select an option to test your comprehension</span>
                    {quizSubmitted ? (
                      <button 
                        type="button"
                        onClick={() => { setSelectedChoice(null); setQuizSubmitted(false); }}
                        className="px-3.5 py-1.5 min-h-[36px] rounded-full bg-accent hover:opacity-80 text-foreground text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                      >
                        <RotateCcw className="h-3 w-3" /> Retry
                      </button>
                    ) : (
                      <button 
                        type="button"
                        disabled={selectedChoice === null}
                        onClick={() => {
                          setQuizSubmitted(true);
                          if (selectedChoice === 1) {
                            toast.success("Correct Answer!", { description: "Verified against Passage §3.4 [p. 11]" });
                          } else {
                            toast.error("Incorrect Choice", { description: "Decoherence is the primary physical decay mechanism." });
                          }
                        }}
                        className="px-4 py-1.5 min-h-[36px] rounded-full bg-primary hover:opacity-90 text-primary-foreground text-xs font-semibold disabled:opacity-40 transition-colors cursor-pointer"
                      >
                        Submit Answer
                      </button>
                    )}
                  </div>

                  {quizSubmitted && (
                    <div className="text-xs text-foreground bg-accent/60 p-3.5 rounded-xl border border-border leading-relaxed">
                      <div className="flex items-center justify-between mb-1">
                        <strong className="text-foreground font-semibold">Verified Passage Citation:</strong>
                        <span className="font-mono text-emerald-600 dark:text-emerald-400 text-xs font-bold">Passage §3.4 [p. 11]</span>
                      </div>
                      Decoherence occurs when environmental thermal vibrations or electromagnetic fields interact with qubits, inducing rapid loss of phase coherence within characteristic time T₂.
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* TAB 4: AUDIO RECAP WITH ANIMATED WAVEFORM */}
            <TabsContent value="podcast" className="mt-0 focus-visible:outline-none">
              <div className="max-w-lg mx-auto space-y-4 text-center py-2">
                <div className="w-full bg-card rounded-2xl p-6 text-left border border-border shadow-xs">
                  <div className="flex items-center justify-between mb-3 text-xs text-muted-foreground font-mono">
                    <span>SYNTHESIZED EPISODE</span>
                    <span className="px-2 py-0.5 rounded-full bg-accent text-foreground border border-border">
                      2 AI Hosts (Clara & Julian)
                    </span>
                  </div>

                  <h4 className="text-base font-semibold text-foreground mb-1">
                    Demystifying Superposition and Entanglement
                  </h4>
                  <p className="text-xs text-muted-foreground mb-5">Generated dialogue from Chapter 1</p>

                  {/* Playback Controls & Animated Waveform */}
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        const nextState = !podcastPlaying;
                        setPodcastPlaying(nextState);
                        if (nextState) {
                          toast.info("Playing audio recap preview", { description: "Synchronized transcript highlights below" });
                        }
                      }}
                      aria-label={podcastPlaying ? "Pause audio preview" : "Play audio preview"}
                      className="h-11 w-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center transition-all shrink-0 active:scale-95 shadow-sm cursor-pointer"
                    >
                      {podcastPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                    </button>

                    <div className="flex-1 space-y-2">
                      {/* Animated SVG Waveform Equalizer */}
                      <div className="h-8 flex items-end gap-1 px-1 justify-between">
                        {[40, 65, 30, 85, 55, 95, 45, 75, 60, 90, 35, 70, 50, 80, 45, 60, 90, 40].map((h, i) => (
                          <motion.div
                            key={i}
                            animate={podcastPlaying ? { height: [`${Math.max(20, h * 0.4)}%`, `${h}%`, `${Math.max(15, h * 0.3)}%`] } : { height: `${h * 0.35}%` }}
                            transition={{
                              duration: 0.6,
                              repeat: Infinity,
                              repeatType: "reverse",
                              delay: (i % 6) * 0.1,
                            }}
                            className={`w-1 rounded-full ${podcastPlaying ? "bg-primary" : "bg-muted-foreground/30"}`}
                          />
                        ))}
                      </div>

                      <div className="flex justify-between text-xs text-muted-foreground font-mono tabular-nums">
                        <span>{formatAudioTime(audioSeconds)}</span>
                        <span>4:12</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Synchronized Transcript Highlight */}
                <div className="text-left w-full space-y-2.5 text-xs bg-accent/40 border border-border p-4 rounded-xl">
                  <div className={`p-2.5 rounded-lg transition-all ${currentSpeaker === "Clara" ? "bg-card border border-primary/40 shadow-xs" : "opacity-70"}`}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-semibold text-foreground font-mono text-xs">Host A (Clara):</span>
                      {currentSpeaker === "Clara" && podcastPlaying && (
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Speaking
                        </span>
                      )}
                    </div>
                    <p className="text-foreground">"So when a qubit is in superposition, it is not merely alternating between zero and one, correct?"</p>
                  </div>

                  <div className={`p-2.5 rounded-lg transition-all ${currentSpeaker === "Julian" ? "bg-card border border-primary/40 shadow-xs" : "opacity-70"}`}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-semibold text-foreground font-mono text-xs">Host B (Julian):</span>
                      {currentSpeaker === "Julian" && podcastPlaying && (
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Speaking
                        </span>
                      )}
                    </div>
                    <p className="text-foreground">"Precisely. It occupies a normalized vector space until physical measurement prompts state reduction."</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB 5: GROUNDED CHAT */}
            <TabsContent value="chat" className="mt-0 focus-visible:outline-none">
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
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </section>
  );
}
