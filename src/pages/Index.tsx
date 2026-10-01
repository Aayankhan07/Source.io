import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useTheme } from "@/hooks/use-theme";
import { motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import { 
  FileText, Headphones, MessagesSquare, ListChecks, Layers,
  ArrowRight, Play, Pause, Check, X, RotateCcw, Send,
  Sparkles, FileCode, Video, Mic, Globe, Cpu, ShieldCheck,
  ChevronRight, BookmarkCheck, Database, Menu, Sun, Moon,
  Search, Copy, Terminal, ExternalLink
} from "lucide-react";

import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} from "@/components/ui/command";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function Index() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const shouldReduceMotion = useReducedMotion();
  const [activeSimTab, setActiveSimTab] = useState<string>("notes");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);

  // Keyboard shortcut listener for Command Menu (Cmd+K / Ctrl+K)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCmdOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Simulated Flashcards State
  const simFlashcards = [
    { 
      front: "What is Superposition in Quantum Computing?", 
      back: "The capacity of a qubit to exist in a normalized linear combination of states (|0⟩ and |1⟩) simultaneously until measurement forces a collapse." 
    },
    { 
      front: "Explain Quantum Entanglement.", 
      back: "A physical phenomenon where multiple qubits correlate such that measuring one instantaneously determines the state of the other across arbitrary distance." 
    },
    { 
      front: "What causes Quantum Decoherence?", 
      back: "Environmental interference such as thermal noise or electromagnetic fields that decays quantum phase into classical probability." 
    }
  ];
  const [cardIdx, setCardIdx] = useState(0);
  const [cardFlipped, setCardFlipped] = useState(false);

  // Simulated Quiz State
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Simulated Podcast State
  const [podcastPlaying, setPodcastPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(38);
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (podcastPlaying) {
      progressInterval.current = setInterval(() => {
        setAudioProgress((p) => (p >= 100 ? 0 : p + 1));
      }, 500);
    } else {
      if (progressInterval.current) clearInterval(progressInterval.current);
    }
    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [podcastPlaying]);

  // Simulated Chat State
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; content: string; citation?: string; score?: number }>>([
    { 
      role: "assistant", 
      content: "I am your Source research assistant. Ask any question about your Quantum Computing text, and I will cite the exact passage coordinate.",
      citation: "Passage §1.2 (p. 4)",
      score: 0.96
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatTyping, setChatTyping] = useState(false);
  const typeInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
      if (typeInterval.current) clearInterval(typeInterval.current);
    };
  }, []);

  const handleSendChat = (text: string) => {
    if (!text.trim() || chatTyping) return;
    const userMsg = { role: "user" as const, content: text };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setChatTyping(true);

    setTimeout(() => {
      let fullResponse = "";
      let citation = "Passage §2.1 (p. 7)";
      let score = 0.94;

      if (text.toLowerCase().includes("superposition")) {
        fullResponse = "Superposition enables a qubit to evaluate linear state combinations (|0⟩ and |1⟩) in parallel. The wave function collapses into a discrete observable state upon detector interaction.";
        citation = "Passage §1.1 (p. 2)";
        score = 0.98;
      } else if (text.toLowerCase().includes("entanglement")) {
        fullResponse = "Entangled pairs maintain non-local correlations across arbitrary space, forming the foundational resource for quantum teleportation protocols and superdense coding.";
        citation = "Passage §1.3 (p. 5)";
        score = 0.95;
      } else {
        fullResponse = "Decoherence represents the primary engineering barrier in quantum processors. Thermal fluctuations disperse quantum phase coherence within microseconds.";
        citation = "Passage §3.4 (p. 11)";
        score = 0.91;
      }

      setChatMessages((prev) => [...prev, { role: "assistant", content: "", citation, score }]);
      
      let charIdx = 0;
      const STEP = 4;
      if (typeInterval.current) clearInterval(typeInterval.current);
      typeInterval.current = setInterval(() => {
        charIdx = Math.min(charIdx + STEP, fullResponse.length);
        const slice = fullResponse.slice(0, charIdx);
        setChatMessages((prev) =>
          prev.map((m, i) =>
            i === prev.length - 1 && m.role === "assistant" ? { ...m, content: slice } : m,
          ),
        );
        if (charIdx >= fullResponse.length) {
          if (typeInterval.current) clearInterval(typeInterval.current);
          typeInterval.current = null;
          setChatTyping(false);
        }
      }, 25);
    }, 600);
  };

  const handleCopyCitation = (citation: string, score?: number) => {
    navigator.clipboard?.writeText(`${citation} (${Math.round((score || 0.96) * 100)}% match)`);
    toast.success("Citation coordinate copied to clipboard", {
      description: `${citation} • ${Math.round((score || 0.96) * 100)}% cosine similarity`,
    });
  };

  return (
    <TooltipProvider delayDuration={150}>
      <div className="min-h-[100dvh] bg-background text-foreground font-sans relative overflow-x-clip transition-colors duration-200">
        {/* Subtle clean ambient lighting */}
        <div 
          aria-hidden="true" 
          className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[480px] bg-gradient-to-b from-primary/5 via-primary/[0.02] to-transparent" 
        />

        {/* Floating Pill Navigation Bar */}
        <header className="sticky top-5 z-50 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto bg-card/85 backdrop-blur-xl border border-border rounded-full px-4 sm:px-6 py-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center gap-2 group">
                <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                  <Sparkles className="h-3 w-3" strokeWidth={1.5} />
                </div>
                <span className="font-semibold tracking-tight text-sm font-display text-foreground">
                  Source<span className="text-muted-foreground">.io</span>
                </span>
              </Link>

              <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-muted-foreground">
                <a href="#simulator" className="hover:text-foreground transition-colors">Workspace</a>
                <a href="#grounding" className="hover:text-foreground transition-colors">Grounding</a>
                <a href="#pipeline" className="hover:text-foreground transition-colors">Pipeline</a>
                
                {/* CMDK Search Trigger Button */}
                <button
                  type="button"
                  onClick={() => setCmdOpen(true)}
                  className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-accent/60 border border-border text-[11px] text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  <Search className="h-3 w-3" strokeWidth={1.5} />
                  <span>Search source...</span>
                  <kbd className="font-mono text-[9px] px-1 py-0.5 rounded bg-card border border-border">⌘K</kbd>
                </button>
              </nav>

              <div className="flex items-center gap-2 sm:gap-2.5">
                {/* Theme Toggle Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={toggleTheme}
                      className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
                    >
                      {theme === "dark" ? <Sun className="h-4 w-4" strokeWidth={1.5} /> : <Moon className="h-4 w-4" strokeWidth={1.5} />}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p className="text-xs">{theme === "dark" ? "Luminous Light" : "Obsidian Studio"}</p>
                  </TooltipContent>
                </Tooltip>

                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  aria-label="Toggle navigation menu"
                  aria-expanded={mobileMenuOpen}
                >
                  {mobileMenuOpen ? <X className="h-4 w-4" strokeWidth={1.5} /> : <Menu className="h-4 w-4" strokeWidth={1.5} />}
                </button>

                {user ? (
                  <Link 
                    to="/app" 
                    className="bg-primary hover:opacity-90 text-primary-foreground rounded-full px-4 py-1.5 text-xs font-medium shadow-sm inline-flex items-center gap-1.5 active:scale-[0.98] transition-all"
                  >
                    Open workspace
                    <ArrowRight className="h-3 w-3" strokeWidth={1.5} />
                  </Link>
                ) : (
                  <>
                    <Link 
                      to="/auth" 
                      className="text-xs font-medium text-muted-foreground hover:text-foreground px-2.5 py-1.5 transition-colors hidden sm:inline-block"
                    >
                      Sign in
                    </Link>
                    <Link 
                      to="/auth" 
                      className="bg-primary hover:opacity-90 text-primary-foreground font-medium rounded-full px-4 py-1.5 text-xs shadow-sm inline-flex items-center gap-1.5 active:scale-[0.98] transition-all"
                    >
                      Get started free
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Mobile Collapsible Navigation Links */}
            {mobileMenuOpen && (
              <nav className="md:hidden mt-3 pt-3 border-t border-border flex flex-col gap-2 text-xs font-medium text-muted-foreground pb-1">
                <a href="#simulator" onClick={() => setMobileMenuOpen(false)} className="hover:text-foreground py-1 transition-colors">Workspace</a>
                <a href="#grounding" onClick={() => setMobileMenuOpen(false)} className="hover:text-foreground py-1 transition-colors">Grounding</a>
                <a href="#pipeline" onClick={() => setMobileMenuOpen(false)} className="hover:text-foreground py-1 transition-colors">Pipeline</a>
                <button
                  type="button"
                  onClick={() => { setMobileMenuOpen(false); setCmdOpen(true); }}
                  className="flex items-center gap-2 py-1 hover:text-foreground text-left"
                >
                  <Search className="h-3.5 w-3.5" /> Quick search (⌘K)
                </button>
              </nav>
            )}
          </div>
        </header>

        {/* Hero Section: One Source, Five Renderings */}
        <section className="pt-16 md:pt-20 pb-12 px-4 sm:px-6 relative z-10 max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Focused Copy Stack (Eyebrow, H1, Subtext, CTAs) */}
            <div className="lg:col-span-7 space-y-6 text-left">
              {/* Eyebrow 1 of 2 across page */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent border border-border text-xs font-mono text-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span>ONE SOURCE, FIVE RENDERINGS</span>
              </div>

              {/* Disciplined Headline: max 2 lines desktop */}
              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-display font-medium tracking-tight text-foreground leading-[1.08]">
                Turn any source into structured mastery
              </h1>

              {/* Disciplined Subtext: max 20 words */}
              <p className="text-sm sm:text-base text-muted-foreground max-w-xl leading-relaxed">
                Drop in a document, recording, or lecture. Source extracts and derives five distinct study views with verifiable passage citations.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  to={user ? "/app" : "/auth"}
                  className="bg-primary hover:opacity-90 text-primary-foreground font-medium text-xs sm:text-sm px-6 py-2.5 rounded-full shadow-sm active:scale-[0.98] transition-all inline-flex items-center gap-2"
                >
                  {user ? "Open workspace" : "Get started free"}
                  <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
                </Link>
                <a
                  href="#simulator"
                  className="bg-card hover:bg-accent text-foreground font-medium text-xs sm:text-sm px-5 py-2.5 rounded-full border border-border shadow-2xs active:scale-[0.98] transition-all inline-flex items-center gap-1.5"
                >
                  Explore live demo
                  <ChevronRight className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                </a>
              </div>

              <div className="pt-2 flex items-center gap-6 text-[11px] font-mono text-muted-foreground">
                <span>Whisper speech parsing</span>
                <span className="h-1 w-1 rounded-full bg-border" />
                <span>Vector coordinate verification</span>
                <span className="h-1 w-1 rounded-full bg-border" />
                <span>No hallucination</span>
              </div>
            </div>

            {/* Right Column: Hero Visual Asset (Clean architectural workspace visual) */}
            <div className="lg:col-span-5 relative">
              <motion.div 
                initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="relative rounded-2xl overflow-hidden border border-border shadow-lg shadow-black/5 group bg-card"
              >
                <img 
                  src="/assets/luminous_minimal_hero.jpg" 
                  alt="Minimalist architectural desk with tablet and open research notebook"
                  className="w-full h-auto object-cover aspect-[16/10] group-hover:scale-102 transition-transform duration-700 ease-out"
                  loading="eager"
                />
                <div className="p-3 bg-card border-t border-border flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-foreground">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="font-mono text-muted-foreground text-[11px]">Ready for ingestion</span>
                  </div>
                  <span className="font-mono text-muted-foreground text-[11px]">PDF • Audio • Video</span>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Ingestion Sources Ribbon */}
        <section className="py-7 px-4 sm:px-6 relative z-10 max-w-5xl mx-auto border-y border-border">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            {[
              { icon: FileText, label: "PDF Documents" },
              { icon: Mic, label: "Audio & Speech" },
              { icon: Video, label: "YouTube Lectures" },
              { icon: FileCode, label: "Markdown & DOCX" },
              { icon: Cpu, label: "Whisper Transcription" },
              { icon: Globe, label: "Web Articles" },
              { icon: Database, label: "LaTeX Equations" }
            ].map((item) => (
              <div
                key={item.label}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border text-xs font-medium text-foreground shadow-2xs"
              >
                <item.icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Live Interactive Workspace Demo Powered by Radix Tabs */}
        <section id="simulator" className="py-20 px-4 sm:px-6 relative z-10 max-w-4xl mx-auto scroll-mt-24">
          <div className="text-center max-w-xl mx-auto mb-8">
            <h2 className="text-2xl sm:text-3xl font-display font-medium text-foreground tracking-tight mb-2">
              Experience the study workflow
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Select a mode to inspect how Source converts raw sources into active understanding.
            </p>
          </div>

          <Tabs value={activeSimTab} onValueChange={(val) => {
            setActiveSimTab(val);
            toast.info(`Switched to ${val === "notes" ? "Study Notes" : val === "flashcards" ? "Flashcards Deck" : val === "quiz" ? "Practice Quiz" : val === "podcast" ? "Audio Recap" : "Grounded Chat"}`);
          }}>
            {/* Tab Switcher using Radix Tabs */}
            <div className="flex justify-center mb-6">
              <TabsList className="bg-accent/80 border border-border p-1 rounded-full h-auto gap-1">
                <TabsTrigger value="notes" className="rounded-full text-xs gap-1.5 px-3 py-1.5 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs">
                  <FileText className="h-3.5 w-3.5" strokeWidth={1.5} />
                  <span>Study Notes</span>
                </TabsTrigger>
                <TabsTrigger value="flashcards" className="rounded-full text-xs gap-1.5 px-3 py-1.5 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs">
                  <Layers className="h-3.5 w-3.5" strokeWidth={1.5} />
                  <span>Flashcards</span>
                </TabsTrigger>
                <TabsTrigger value="quiz" className="rounded-full text-xs gap-1.5 px-3 py-1.5 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs">
                  <ListChecks className="h-3.5 w-3.5" strokeWidth={1.5} />
                  <span>Practice Quiz</span>
                </TabsTrigger>
                <TabsTrigger value="podcast" className="rounded-full text-xs gap-1.5 px-3 py-1.5 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs">
                  <Headphones className="h-3.5 w-3.5" strokeWidth={1.5} />
                  <span>Audio Recap</span>
                </TabsTrigger>
                <TabsTrigger value="chat" className="rounded-full text-xs gap-1.5 px-3 py-1.5 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs">
                  <MessagesSquare className="h-3.5 w-3.5" strokeWidth={1.5} />
                  <span>Grounded Chat</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Console Shell */}
            <div className="bg-card rounded-2xl border border-border shadow-xl shadow-black/5 overflow-hidden">
              {/* Header Bar */}
              <div className="bg-accent/50 border-b border-border px-4 py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-border" />
                  <span className="h-2.5 w-2.5 rounded-full bg-border" />
                  <span className="h-2.5 w-2.5 rounded-full bg-border" />
                </div>

                <div className="flex-1 max-w-xs mx-auto hidden sm:flex items-center justify-center">
                  <div className="w-full bg-card border border-border rounded px-2.5 py-0.5 text-xs text-foreground flex items-center justify-between font-mono">
                    <span className="truncate">quantum_computing_intro.pdf</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1 rounded font-medium">Grounded</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono tabular-nums">
                  <span className="hidden md:inline">48 Citations Indexed</span>
                  
                  {/* Vaul Drawer Trigger for Raw Telemetry */}
                  <Drawer>
                    <DrawerTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-accent hover:text-foreground border border-border transition-colors cursor-pointer"
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
                        <div className="p-3 rounded-lg bg-accent/60 border border-border flex items-center justify-between">
                          <div>
                            <span className="font-semibold text-foreground block">chunk_001 • p. 2</span>
                            <span className="text-muted-foreground text-[11px]">"Superposition allows linear vector states..."</span>
                          </div>
                          <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-[11px] font-semibold border border-emerald-500/20">
                            0.98 similarity
                          </span>
                        </div>
                        <div className="p-3 rounded-lg bg-accent/60 border border-border flex items-center justify-between">
                          <div>
                            <span className="font-semibold text-foreground block">chunk_003 • p. 4</span>
                            <span className="text-muted-foreground text-[11px]">"Entanglement non-local state correlation..."</span>
                          </div>
                          <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-[11px] font-semibold border border-emerald-500/20">
                            0.95 similarity
                          </span>
                        </div>
                        <div className="p-3 rounded-lg bg-accent/60 border border-border flex items-center justify-between">
                          <div>
                            <span className="font-semibold text-foreground block">chunk_008 • p. 11</span>
                            <span className="text-muted-foreground text-[11px]">"Thermal decoherence induced by stray electromagnetic noise..."</span>
                          </div>
                          <span className="text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded text-[11px] font-semibold border border-sky-500/20">
                            0.91 similarity
                          </span>
                        </div>
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
              <div className="p-6 sm:p-8 min-h-[350px]">
                {/* Tab 1: Notes */}
                <TabsContent value="notes" className="mt-0 focus-visible:outline-none">
                  <div className="max-w-2xl mx-auto space-y-4 text-left">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <div>
                        <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary" strokeWidth={1.5} /> Introduction to Quantum Computing
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">Synthesized from Chapter 1: The Quantum State Representation</p>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-accent text-muted-foreground font-mono tabular-nums">
                        3 min read
                      </span>
                    </div>
                    
                    <div className="text-xs sm:text-sm text-foreground/90 leading-relaxed space-y-3">
                      <p>
                        Quantum computation is fundamentally distinguished by its exploitation of <strong>superposition</strong> and <strong>quantum entanglement</strong>. Unlike classical binary systems where bits represent discrete states of either 0 or 1, quantum systems utilize complex Hilbert vector spaces.
                      </p>

                      <div className="grid sm:grid-cols-2 gap-3 my-3">
                        <div className="p-3.5 rounded-xl bg-accent/60 border border-border">
                          <span className="text-[11px] font-semibold text-foreground block mb-1 font-mono">Principle 1: Superposition</span>
                          <p className="text-xs text-muted-foreground leading-normal">
                            A qubit exists in a normalized linear superposition |ψ⟩ = α|0⟩ + β|1⟩, evaluating multi-path algorithms simultaneously until measurement.
                          </p>
                        </div>
                        <div className="p-3.5 rounded-xl bg-accent/60 border border-border">
                          <span className="text-[11px] font-semibold text-foreground block mb-1 font-mono">Principle 2: Entanglement</span>
                          <p className="text-xs text-muted-foreground leading-normal">
                            Entangled Bell pairs establish instant state correlations across spatial separations, enabling dense coding and cryptographic key distribution.
                          </p>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-accent/60 border border-border text-xs text-foreground flex items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" strokeWidth={1.5} />
                          <span className="tabular-nums">Indexed to coordinates [p. 2-5] with 96% verification fidelity.</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyCitation("Passage §1.1-1.3 [p. 2-5]", 0.96)}
                          className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-card hover:bg-accent border border-border text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Copy className="h-3 w-3" /> Copy Citation
                        </button>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Tab 2: Flashcards */}
                <TabsContent value="flashcards" className="mt-0 focus-visible:outline-none">
                  <div className="max-w-md mx-auto space-y-4 text-center py-2">
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span className="font-mono tabular-nums">Card {cardIdx + 1} of {simFlashcards.length}</span>
                      <button 
                        onClick={() => { 
                          setCardIdx(0); 
                          setCardFlipped(false);
                          toast.info("Flashcards deck reset to beginning");
                        }}
                        className="px-2.5 py-1 rounded-full bg-accent hover:opacity-80 text-foreground text-xs transition-colors"
                      >
                        Reset deck
                      </button>
                    </div>

                    {/* Flip Card Design */}
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
                      aria-label={cardFlipped ? "Answer revealed. Click or press space to show question" : "Question shown. Click or press space to reveal answer"}
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
                          <span className="px-2.5 py-0.5 rounded-full bg-accent text-foreground text-[10px] font-mono font-semibold mb-3">
                            QUESTION
                          </span>
                          <p className="text-base font-semibold text-foreground leading-snug">
                            {simFlashcards[cardIdx].front}
                          </p>
                          <p className="absolute bottom-4 text-xs text-muted-foreground">Click or press Space to reveal answer</p>
                        </div>

                        {/* Back */}
                        <div 
                          className="absolute inset-0 rounded-2xl border border-border bg-accent/40 p-6 flex flex-col items-center justify-center text-center shadow-xs"
                          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                        >
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-mono font-semibold mb-3 border border-emerald-500/20">
                            EXPLANATION
                          </span>
                          <p className="text-xs sm:text-sm text-foreground leading-relaxed">
                            {simFlashcards[cardIdx].back}
                          </p>
                          <p className="absolute bottom-4 text-xs text-muted-foreground">Click or press Space to flip back</p>
                        </div>
                      </div>
                    </div>

                    {/* Leitner Confidence Buttons */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <button 
                        onClick={() => { setCardFlipped(false); setCardIdx(i => Math.max(0, i - 1)); }}
                        disabled={cardIdx === 0}
                        className="px-3 py-1.5 rounded-full border border-border text-xs text-muted-foreground disabled:opacity-40 hover:bg-accent transition-colors"
                      >
                        Previous
                      </button>
                      <div className="flex gap-1.5" role="group" aria-label="Leitner confidence rating">
                        {[
                          { label: "Again", days: "1 day", style: "hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400" },
                          { label: "Hard", days: "2 days", style: "hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400" },
                          { label: "Good", days: "4 days", style: "hover:bg-accent hover:text-foreground" },
                          { label: "Easy", days: "7 days", style: "hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400" },
                        ].map((item) => (
                          <Tooltip key={item.label}>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() => {
                                  setCardFlipped(false);
                                  setCardIdx((i) => (i + 1) % simFlashcards.length);
                                  toast.success(`Marked as ${item.label}`, {
                                    description: `Scheduled for review in ${item.days} via Leitner algorithm`,
                                  });
                                }}
                                className={`text-[11px] px-2.5 py-1 rounded-full bg-accent text-foreground font-medium transition-colors ${item.style}`}
                                aria-label={`Mark as ${item.label} and show next card`}
                              >
                                {item.label}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                              <p className="text-xs">Next review in {item.days}</p>
                            </TooltipContent>
                          </Tooltip>
                        ))}
                      </div>
                      <button 
                        onClick={() => { setCardFlipped(false); setCardIdx(i => Math.min(simFlashcards.length - 1, i + 1)); }}
                        disabled={cardIdx === simFlashcards.length - 1}
                        className="px-3 py-1.5 rounded-full border border-border text-xs text-muted-foreground disabled:opacity-40 hover:bg-accent transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </TabsContent>

                {/* Tab 3: Practice Quiz */}
                <TabsContent value="quiz" className="mt-0 focus-visible:outline-none">
                  <div className="max-w-xl mx-auto space-y-4 text-left">
                    <div className="border border-border bg-card rounded-2xl p-5 sm:p-6 space-y-4">
                      <div className="flex items-start gap-2.5">
                        <span className="px-2 py-0.5 rounded bg-primary text-primary-foreground text-xs font-mono font-bold mt-0.5">Q1</span>
                        <div>
                          <h4 className="text-sm sm:text-base font-semibold text-foreground">
                            Which decay mechanism transforms a qubit's quantum superposition into classical probability?
                          </h4>
                          <p className="text-xs text-muted-foreground mt-0.5 font-mono">Single choice • Vector verified</p>
                        </div>
                      </div>

                      <div className="space-y-2 pt-1" role="radiogroup" aria-label="Question 1 choices">
                        {[
                          { idx: 0, text: "Quantum Teleportation" },
                          { idx: 1, text: "Quantum Decoherence", correct: true },
                          { idx: 2, text: "Phase Gate Inversion" },
                          { idx: 3, text: "Qubit Entanglement Collapse" }
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
                              role="radio"
                              aria-checked={isSelected}
                              disabled={quizSubmitted}
                              onClick={() => setSelectedChoice(opt.idx)}
                              className={`w-full text-left p-3 rounded-xl border transition-all text-xs sm:text-sm font-medium flex items-center justify-between ${btnStyle}`}
                            >
                              <span>{opt.text}</span>
                              {quizSubmitted && isCorrect && <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" strokeWidth={1.5} />}
                              {quizSubmitted && isSelected && !isCorrect && <X className="h-4 w-4 text-rose-600 dark:text-rose-400" strokeWidth={1.5} />}
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-border">
                        <span className="text-xs text-muted-foreground">Select an option to test your comprehension</span>
                        {quizSubmitted ? (
                          <button 
                            onClick={() => { setSelectedChoice(null); setQuizSubmitted(false); }}
                            className="px-3.5 py-1.5 rounded-full bg-accent hover:opacity-80 text-foreground text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                          >
                            <RotateCcw className="h-3 w-3" strokeWidth={1.5} /> Retry
                          </button>
                        ) : (
                          <button 
                            disabled={selectedChoice === null}
                            onClick={() => {
                              setQuizSubmitted(true);
                              if (selectedChoice === 1) {
                                toast.success("Correct Answer!", { description: "Quantum decoherence causes loss of phase coherence." });
                              } else {
                                toast.error("Incorrect Choice", { description: "Decoherence is the primary physical decay mechanism." });
                              }
                            }}
                            className="px-4 py-1.5 rounded-full bg-primary hover:opacity-90 text-primary-foreground text-xs font-semibold disabled:opacity-40 transition-colors"
                          >
                            Submit Answer
                          </button>
                        )}
                      </div>

                      {quizSubmitted && (
                        <div className="text-xs text-foreground bg-accent/60 p-3.5 rounded-xl border border-border leading-relaxed">
                          <strong className="text-foreground font-semibold block mb-0.5">Rationale:</strong> 
                          Decoherence occurs when environmental thermal vibrations or electromagnetic fields interact with qubits, inducing rapid loss of phase coherence.
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* Tab 4: Audio Recap */}
                <TabsContent value="podcast" className="mt-0 focus-visible:outline-none">
                  <div className="max-w-md mx-auto space-y-4 text-center py-2">
                    <div className="w-full bg-card rounded-2xl p-6 text-left border border-border shadow-xs">
                      <div className="flex items-center justify-between mb-3 text-xs text-muted-foreground font-mono">
                        <span>SYNTHESIZED EPISODE</span>
                        <span className="px-2 py-0.5 rounded-full bg-accent text-foreground border border-border">
                          2 AI Hosts
                        </span>
                      </div>

                      <h4 className="text-base font-semibold text-foreground mb-1">
                        Demystifying Superposition and Entanglement
                      </h4>
                      <p className="text-xs text-muted-foreground mb-6">Generated dialogue from Chapter 1</p>

                      {/* Playback Controls */}
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => {
                            const nextState = !podcastPlaying;
                            setPodcastPlaying(nextState);
                            if (nextState) {
                              toast.info("Playing audio recap preview", { description: "Voice synthesized with 2-host conversational pacing" });
                            }
                          }}
                          aria-label={podcastPlaying ? "Pause audio preview" : "Play audio preview"}
                          className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center transition-all shrink-0 active:scale-95 shadow-sm"
                        >
                          {podcastPlaying ? <Pause className="h-4 w-4" strokeWidth={1.5} /> : <Play className="h-4 w-4 ml-0.5" strokeWidth={1.5} />}
                        </button>
                        <div className="flex-1 space-y-1">
                          <div 
                            className="h-1.5 w-full bg-accent rounded-full overflow-hidden"
                            role="progressbar"
                            aria-valuenow={audioProgress}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label="Podcast preview progress"
                          >
                            <div className="h-full bg-primary transition-all duration-300" style={{ width: `${audioProgress}%` }} />
                          </div>
                          <div className="flex justify-between text-[11px] text-muted-foreground font-mono tabular-nums">
                            <span>0:48</span>
                            <span>4:12</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Transcript Snippet */}
                    <div className="text-left w-full space-y-2 text-xs bg-accent/50 border border-border p-4 rounded-xl">
                      <div>
                        <span className="font-semibold text-foreground font-mono text-[11px]">Host A (Clara):</span>
                        <p className="text-muted-foreground mt-0.5">"So when a qubit is in superposition, it is not merely alternating between zero and one, correct?"</p>
                      </div>
                      <div>
                        <span className="font-semibold text-foreground font-mono text-[11px]">Host B (Julian):</span>
                        <p className="text-muted-foreground mt-0.5">"Precisely. It occupies a normalized vector space until physical measurement prompts state reduction."</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Tab 5: Grounded Chat */}
                <TabsContent value="chat" className="mt-0 focus-visible:outline-none">
                  <div className="max-w-xl mx-auto flex flex-col h-[360px] justify-between text-left">
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
                              {m.content === "" ? (
                                <div className="flex items-center gap-1.5 py-1 text-muted-foreground">
                                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-pulse" />
                                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-pulse" style={{ animationDelay: "200ms" }} />
                                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-pulse" style={{ animationDelay: "400ms" }} />
                                </div>
                              ) : (
                                <>
                                  <p>{m.content}</p>
                                  {m.citation && (
                                    <div className="mt-2 pt-2 border-t border-border flex items-center justify-between text-[11px] font-mono text-muted-foreground tabular-nums">
                                      <span className="text-foreground font-medium flex items-center gap-1">
                                        <BookmarkCheck className="h-3 w-3 text-primary" strokeWidth={1.5} /> {m.citation}
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
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Input area */}
                    <div className="border-t border-border pt-3 mt-2 space-y-2">
                      <div className="flex gap-1.5 flex-wrap">
                        <button 
                          onClick={() => handleSendChat("What is quantum superposition?")}
                          disabled={chatTyping}
                          className="text-xs px-2.5 py-1 rounded-full bg-accent hover:opacity-80 text-foreground transition-colors"
                        >
                          What is superposition?
                        </button>
                        <button 
                          onClick={() => handleSendChat("Explain entanglement in simple terms.")}
                          disabled={chatTyping}
                          className="text-xs px-2.5 py-1 rounded-full bg-accent hover:opacity-80 text-foreground transition-colors"
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
                          placeholder="Ask a question about your document..."
                          disabled={chatTyping}
                          aria-label="Ask a question about the document"
                          className="flex-1 bg-accent/40 border border-border rounded-full px-4 py-2 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                        <button 
                          type="button"
                          onClick={() => handleSendChat(chatInput)}
                          disabled={chatTyping || !chatInput.trim()}
                          aria-label="Send message"
                          className="h-9 w-9 rounded-full bg-primary hover:opacity-90 text-primary-foreground flex items-center justify-center disabled:opacity-40 transition-all shrink-0 active:scale-95"
                        >
                          <Send className="h-3.5 w-3.5" strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </div>
          </Tabs>
        </section>

        {/* Grounding & Verification Bento Section */}
        <section id="grounding" className="py-20 px-4 sm:px-6 relative z-10 max-w-6xl mx-auto scroll-mt-24">
          <div className="text-left max-w-2xl mb-12">
            {/* Eyebrow 2 of 2 across page */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent border border-border text-xs font-mono text-foreground mb-3">
              <span>GROUNDED, NOT ASSERTED</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-medium text-foreground tracking-tight leading-tight">
              Citations back to source passages with exact coordinates
            </h2>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Every output retains an immutable anchor back to page numbers, timestamps, and cosine similarity confidence.
            </p>
          </div>

          {/* Bento Grid: 3 Clean Cells */}
          <div className="grid lg:grid-cols-12 gap-6">
            {/* Cell 1: Neural Transcription */}
            <div className="lg:col-span-7 bg-card rounded-3xl border border-border p-6 sm:p-8 flex flex-col justify-between shadow-xs">
              <div>
                <h3 className="text-xl font-display font-medium text-foreground mb-2">
                  Acoustic transcriptions with word-level alignment
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-lg mb-6">
                  Whisper neural models isolate multi-speaker conversations from lectures, webinars, and audiobooks, indexing each sentence to precise timestamps.
                </p>
              </div>

              <div className="rounded-2xl bg-accent/50 border border-border p-4 space-y-2 font-mono text-xs text-foreground">
                <div className="flex items-center justify-between pb-2 border-b border-border text-[11px] text-muted-foreground">
                  <span>SPEAKER DIARIZATION</span>
                  <span>TIMESTAMP</span>
                </div>
                <div className="flex items-center justify-between tabular-nums">
                  <span>Clara: "Superposition allows a linear combination..."</span>
                  <span className="text-muted-foreground">01:14</span>
                </div>
                <div className="flex items-center justify-between tabular-nums">
                  <span>Julian: "Evaluating multi-path algorithms simultaneously..."</span>
                  <span className="text-muted-foreground">01:28</span>
                </div>
              </div>
            </div>

            {/* Right Column: 2 Stacked Cells */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              {/* Cell 2: Vector Coordinate Scoring */}
              <div className="bg-card rounded-3xl border border-border p-6 flex-1 flex flex-col justify-between shadow-xs">
                <div>
                  <h3 className="text-lg font-display font-medium text-foreground mb-2">
                    Cosine similarity ranking
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                    Incoming questions compute dense vector embeddings, retrieving the top matched fragments with transparent certainty scores.
                  </p>
                </div>

                <div className="space-y-2 bg-accent/50 p-3.5 rounded-xl border border-border font-mono text-xs">
                  <div className="flex items-center justify-between text-muted-foreground border-b border-border pb-2 text-[11px]">
                    <span>PASSAGE EXCERPT</span>
                    <span>CONFIDENCE</span>
                  </div>
                  <div className="flex items-center justify-between text-foreground pt-1 tabular-nums">
                    <span className="truncate max-w-[210px]">§ 1.2 "Superposition collapse..."</span>
                    <span className="text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-medium">0.96</span>
                  </div>
                  <div className="flex items-center justify-between text-foreground tabular-nums">
                    <span className="truncate max-w-[210px]">§ 2.4 "Thermal decoherence in..."</span>
                    <span className="text-foreground bg-accent px-1.5 py-0.5 rounded border border-border font-medium">0.91</span>
                  </div>
                </div>
              </div>

              {/* Cell 3: Spaced Repetition */}
              <div className="bg-card rounded-3xl border border-border p-6 flex-1 flex flex-col justify-between shadow-xs">
                <div>
                  <h3 className="text-lg font-display font-medium text-foreground mb-2">
                    Adaptive Leitner scheduling
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                    Surfaces challenging concepts right before memory decay occurs, reducing total review time while reinforcing long-term retention.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs">
                  <div className="p-2.5 rounded-xl bg-accent/50 border border-border">
                    <span className="text-muted-foreground block text-[10px]">INTERVAL</span>
                    <span className="font-semibold text-foreground tabular-nums">4 Days</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-accent/50 border border-border">
                    <span className="text-muted-foreground block text-[10px]">RETENTION</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">94.2%</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-accent/50 border border-border">
                    <span className="text-muted-foreground block text-[10px]">DECKS</span>
                    <span className="font-semibold text-foreground tabular-nums">28 Cards</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Knowledge Pipeline Workflow */}
        <section id="pipeline" className="py-20 px-4 sm:px-6 relative z-10 max-w-6xl mx-auto scroll-mt-24 border-t border-border">
          <div className="text-center max-w-xl mx-auto mb-14">
            <h2 className="text-3xl sm:text-4xl font-display font-medium text-foreground tracking-tight mb-2">
              From raw media to complete comprehension
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              A continuous four-stage pipeline that operates without manual prompt tinkering.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            {[
              {
                title: "Parse & Extract",
                desc: "Upload files or paste URLs. Neural OCR and Whisper transcribe texts and timestamps locally.",
                metric: "OCR + Whisper"
              },
              {
                title: "Structure Notes",
                desc: "Synthesizes hierarchical markdown outlines, definitions, and equations into clear notes.",
                metric: "Markdown Outlines"
              },
              {
                title: "Derive Practice",
                desc: "Generates spaced flashcard decks, multi-choice quizzes, and audio podcast dialogues.",
                metric: "Leitner Decks"
              },
              {
                title: "Query Citations",
                desc: "Engage in grounded conversation where every statement points back to the exact passage.",
                metric: "Coordinate Citations"
              }
            ].map((stage, idx) => (
              <div 
                key={stage.title}
                className="bg-card rounded-2xl border border-border p-6 flex flex-col justify-between shadow-xs"
              >
                <div>
                  <span className="text-muted-foreground font-mono text-xs font-semibold block mb-3 tabular-nums">
                    Stage {idx + 1}
                  </span>
                  <h3 className="text-base font-semibold text-foreground mb-2">{stage.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{stage.desc}</p>
                </div>

                <div className="pt-4 mt-4 border-t border-border text-[11px] font-mono text-muted-foreground">
                  {stage.metric}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Honest Direct Onboarding Section */}
        <section className="pt-16 pb-24 px-4 sm:px-6 relative z-10 text-center max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-display font-medium text-foreground tracking-tight leading-tight mb-3">
            Bring your own document and start working
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto mb-8 leading-relaxed">
            Open Source.io in your browser. Upload any PDF, lecture audio, or notes and turn it into active study assets.
          </p>

          <div className="flex items-center justify-center">
            <Link
              to={user ? "/app" : "/auth"}
              className="bg-primary hover:opacity-90 text-primary-foreground font-medium text-xs sm:text-sm px-8 py-3 rounded-full shadow-sm active:scale-[0.98] transition-all inline-flex items-center gap-2"
            >
              {user ? "Open workspace" : "Get started free"}
              <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
            </Link>
          </div>
        </section>

        {/* Clean Minimalist Footer */}
        <footer className="px-4 sm:px-6 pb-10 max-w-5xl mx-auto relative z-10 border-t border-border pt-10">
          <div className="space-y-10 text-left">
            <div className="flex flex-col md:flex-row items-start justify-between gap-8">
              <div className="space-y-3 max-w-sm">
                <Link to="/" className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                    <Sparkles className="h-3 w-3" strokeWidth={1.5} />
                  </div>
                  <span className="font-semibold text-sm font-display text-foreground">
                    Source<span className="text-muted-foreground">.io</span>
                  </span>
                </Link>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  The multi-modal intelligence workspace that synthesizes complex documents into verified study notes and interactive recall systems.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-xs">
                <div>
                  <span className="font-mono text-foreground font-semibold block mb-3">Product</span>
                  <ul className="space-y-2 text-muted-foreground">
                    <li><a href="#simulator" className="hover:text-foreground transition-colors">Workspace Demo</a></li>
                    <li><a href="#grounding" className="hover:text-foreground transition-colors">Grounding</a></li>
                    <li><a href="#pipeline" className="hover:text-foreground transition-colors">Pipeline</a></li>
                  </ul>
                </div>

                <div>
                  <span className="font-mono text-foreground font-semibold block mb-3">Grounding</span>
                  <ul className="space-y-2 text-muted-foreground">
                    <li><span className="text-muted-foreground">Whisper ASR</span></li>
                    <li><span className="text-muted-foreground">Groq Llama 3</span></li>
                    <li><span className="text-muted-foreground">Vector Embeddings</span></li>
                    <li><span className="text-muted-foreground">Citation Engine</span></li>
                  </ul>
                </div>

                <div>
                  <span className="font-mono text-foreground font-semibold block mb-3">Platform</span>
                  <ul className="space-y-2 text-muted-foreground">
                    <li><Link to="/auth" className="hover:text-foreground transition-colors">Sign in</Link></li>
                    <li><Link to="/auth" className="hover:text-foreground transition-colors">Create account</Link></li>
                    <li><span className="text-muted-foreground">Privacy Policy</span></li>
                    <li><span className="text-muted-foreground">Terms of Service</span></li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>All inference pipelines operational</span>
              </div>

              <div className="tabular-nums">
                (c) {new Date().getFullYear()} Source.io Inc. All rights reserved.
              </div>
            </div>
          </div>
        </footer>

        {/* Global CMDK Command Palette Dialog */}
        <CommandDialog open={cmdOpen} onOpenChange={setCmdOpen}>
          <CommandInput placeholder="Search document concepts, passages, equations..." />
          <CommandList>
            <CommandEmpty>No matching concept or passage found.</CommandEmpty>
            <CommandGroup heading="Study Modalities">
              <CommandItem onSelect={() => { setActiveSimTab("notes"); setCmdOpen(false); toast.info("Navigated to Study Notes"); }}>
                <FileText className="mr-2 h-4 w-4" />
                <span>Read Study Notes</span>
                <CommandShortcut>§ 1</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => { setActiveSimTab("flashcards"); setCmdOpen(false); toast.info("Navigated to Flashcards Deck"); }}>
                <Layers className="mr-2 h-4 w-4" />
                <span>Review Leitner Flashcards</span>
                <CommandShortcut>§ 2</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => { setActiveSimTab("quiz"); setCmdOpen(false); toast.info("Navigated to Practice Quiz"); }}>
                <ListChecks className="mr-2 h-4 w-4" />
                <span>Take Practice Quiz</span>
                <CommandShortcut>§ 3</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => { setActiveSimTab("podcast"); setCmdOpen(false); toast.info("Navigated to Audio Recap"); }}>
                <Headphones className="mr-2 h-4 w-4" />
                <span>Listen to 2-Host Dialogue</span>
                <CommandShortcut>§ 4</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => { setActiveSimTab("chat"); setCmdOpen(false); toast.info("Navigated to Grounded Chat"); }}>
                <MessagesSquare className="mr-2 h-4 w-4" />
                <span>Ask Grounded Research Assistant</span>
                <CommandShortcut>§ 5</CommandShortcut>
              </CommandItem>
            </CommandGroup>
            <CommandGroup heading="Document Key Concepts">
              <CommandItem onSelect={() => {
                setActiveSimTab("notes");
                setCmdOpen(false);
                toast.success("Found: Superposition Principle", { description: "Passage §1.1 (p. 2): Linear vector |ψ⟩ = α|0⟩ + β|1⟩" });
              }}>
                <BookmarkCheck className="mr-2 h-4 w-4 text-emerald-500" />
                <span>Quantum Superposition: Linear combinations of |0⟩ and |1⟩</span>
              </CommandItem>
              <CommandItem onSelect={() => {
                setActiveSimTab("notes");
                setCmdOpen(false);
                toast.success("Found: Quantum Entanglement", { description: "Passage §1.3 (p. 5): Non-local state correlations" });
              }}>
                <BookmarkCheck className="mr-2 h-4 w-4 text-emerald-500" />
                <span>Quantum Entanglement: Bell state correlations</span>
              </CommandItem>
              <CommandItem onSelect={() => {
                setActiveSimTab("notes");
                setCmdOpen(false);
                toast.success("Found: Quantum Decoherence", { description: "Passage §3.4 (p. 11): Thermal phase loss" });
              }}>
                <BookmarkCheck className="mr-2 h-4 w-4 text-emerald-500" />
                <span>Quantum Decoherence: Environmental thermal decay</span>
              </CommandItem>
            </CommandGroup>
            <CommandGroup heading="Quick Navigation">
              <CommandItem onSelect={() => { toggleTheme(); setCmdOpen(false); }}>
                {theme === "dark" ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                <span>Toggle Light / Dark Theme</span>
              </CommandItem>
              <CommandItem onSelect={() => { window.location.href = user ? "/app" : "/auth"; setCmdOpen(false); }}>
                <ExternalLink className="mr-2 h-4 w-4" />
                <span>{user ? "Go to Document Library" : "Create Free Account"}</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </CommandDialog>
      </div>
    </TooltipProvider>
  );
}
