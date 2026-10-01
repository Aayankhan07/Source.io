import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useTheme } from "@/hooks/use-theme";
import { toast } from "sonner";
import { 
  FileText, Headphones, MessagesSquare, ListChecks, Layers,
  ArrowRight, Sparkles, FileCode, Video, Mic, Globe, Cpu,
  ChevronRight, BookmarkCheck, Database, Menu, X, Sun, Moon,
  Search, ExternalLink, BookOpen
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

import { HeroProductDemo } from "@/components/landing/HeroProductDemo";
import { InteractiveWorkflowDemo } from "@/components/landing/InteractiveWorkflowDemo";
import { FeatureMotionCards } from "@/components/landing/FeatureMotionCards";
import { CredibilityAndComparison } from "@/components/landing/CredibilityAndComparison";

export default function Index() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
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

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <TooltipProvider delayDuration={150}>
      <div className="min-h-[100dvh] bg-white dark:bg-background text-foreground font-sans relative overflow-x-clip transition-colors duration-200">
        {/* Floating Pill Navigation Bar */}
        <header className="sticky top-3 sm:top-5 z-50 px-3 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto bg-card/85 backdrop-blur-xl border border-border rounded-full px-4 sm:px-6 py-2.5 shadow-sm">
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
                  className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-accent/60 border border-border text-[11px] text-muted-foreground hover:text-foreground hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                      className="h-9 w-9 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
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
                  className="md:hidden h-9 w-9 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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

        {/* Hero Section: Live Working Product replacing static photo */}
        <section className="min-h-[calc(100dvh-5.5rem)] flex flex-col justify-center pt-8 sm:pt-12 pb-14 px-4 sm:px-6 lg:px-10 xl:px-12 relative z-10 max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-16 items-center flex-1 my-auto w-full">
            {/* Left Column: Focused Copy Stack */}
            <div className="lg:col-span-7 space-y-6 sm:space-y-7 text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-accent border border-border text-xs font-mono text-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span>ONE SOURCE, FIVE RENDERINGS</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-[3.5rem] xl:text-[4.125rem] font-display font-medium tracking-tight text-foreground leading-[1.06] text-balance">
                Turn any source into structured mastery
              </h1>

              <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-xl leading-relaxed">
                Drop in a document, recording, or lecture. Source extracts and derives five distinct study views with verifiable passage citations.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                <Link
                  to={user ? "/app" : "/auth"}
                  className="bg-primary hover:opacity-90 text-primary-foreground font-medium text-xs sm:text-sm px-7 py-3 rounded-full shadow-sm active:scale-[0.98] transition-all inline-flex items-center justify-center gap-2"
                >
                  {user ? "Open workspace" : "Get started free"}
                  <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
                </Link>
                <a
                  href="#simulator"
                  className="bg-card hover:bg-accent text-foreground font-medium text-xs sm:text-sm px-6 py-3 rounded-full border border-border shadow-2xs active:scale-[0.98] transition-all inline-flex items-center justify-center gap-1.5"
                >
                  Explore live demo
                  <ChevronRight className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                </a>
              </div>

              {/* Credible, Provable Tech Specs Badge Strip */}
              <div className="pt-2 flex flex-wrap items-center gap-y-2 gap-x-4 sm:gap-x-6 text-[11px] sm:text-xs font-mono text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Whisper speech parsing
                </span>
                <span className="hidden sm:inline-block h-1 w-1 rounded-full bg-border" />
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                  Vector coordinate verification
                </span>
                <span className="hidden sm:inline-block h-1 w-1 rounded-full bg-border" />
                <span>Every answer cites its source</span>
              </div>
            </div>

            {/* Right Column: Live Interactive Product Demo */}
            <div className="lg:col-span-5 relative w-full">
              <HeroProductDemo onExploreWorkflow={() => scrollToSection("simulator")} />
            </div>
          </div>
        </section>

        {/* Ingestion Sources Ribbon - Full Width & Responsive 8 Items */}
        <section className="py-6 px-4 sm:px-6 lg:px-8 relative z-10 w-full border-y border-border bg-card/40 backdrop-blur-xs">
          <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
            {[
              { icon: FileText, label: "PDF Documents" },
              { icon: Mic, label: "Audio & Speech" },
              { icon: Video, label: "YouTube Lectures" },
              { icon: FileCode, label: "Markdown & DOCX" },
              { icon: Cpu, label: "Whisper Transcription" },
              { icon: Globe, label: "Web Articles" },
              { icon: Database, label: "LaTeX Equations" },
              { icon: BookOpen, label: "EPUB & Textbooks" },
            ].map((item) => (
              <div
                key={item.label}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-card border border-border text-xs font-medium text-foreground shadow-2xs transition-colors hover:bg-accent/60"
              >
                <item.icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Interactive Study Workflow (Split PDF inspector, Leitner cards, Quiz, Audio with waveform) */}
        <InteractiveWorkflowDemo />

        {/* Feature Motion Cards (Acoustic Diarization, Cosine Re-ranking, Leitner Simulation) */}
        <FeatureMotionCards />

        {/* Knowledge Pipeline Workflow */}
        <section id="pipeline" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 relative z-10 max-w-7xl mx-auto scroll-mt-24 border-t border-border w-full">
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

        {/* Credibility & Proof: Social proof, Audience use-cases, Comparison matrix, Free tier, FAQ */}
        <CredibilityAndComparison />

        {/* Clean Minimalist Footer */}
        <footer className="px-4 sm:px-6 lg:px-8 pb-12 max-w-6xl mx-auto relative z-10 border-t border-border pt-12 w-full">
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
            <CommandGroup heading="Interactive Study Workflow">
              <CommandItem onSelect={() => { scrollToSection("simulator"); setCmdOpen(false); toast.info("Navigated to Study Notes"); }}>
                <FileText className="mr-2 h-4 w-4" />
                <span>Read Study Notes (Split Passage Inspector)</span>
                <CommandShortcut>§ 1</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => { scrollToSection("simulator"); setCmdOpen(false); toast.info("Navigated to Flashcards Deck"); }}>
                <Layers className="mr-2 h-4 w-4" />
                <span>Review Leitner Flashcards</span>
                <CommandShortcut>§ 2</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => { scrollToSection("simulator"); setCmdOpen(false); toast.info("Navigated to Practice Quiz"); }}>
                <ListChecks className="mr-2 h-4 w-4" />
                <span>Take Practice Quiz</span>
                <CommandShortcut>§ 3</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => { scrollToSection("simulator"); setCmdOpen(false); toast.info("Navigated to Audio Recap"); }}>
                <Headphones className="mr-2 h-4 w-4" />
                <span>Listen to 2-Host Dialogue</span>
                <CommandShortcut>§ 4</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => { scrollToSection("simulator"); setCmdOpen(false); toast.info("Navigated to Grounded Chat"); }}>
                <MessagesSquare className="mr-2 h-4 w-4" />
                <span>Ask Grounded Research Assistant</span>
                <CommandShortcut>§ 5</CommandShortcut>
              </CommandItem>
            </CommandGroup>
            <CommandGroup heading="Document Key Concepts">
              <CommandItem onSelect={() => {
                scrollToSection("simulator");
                setCmdOpen(false);
                toast.success("Found: Superposition Principle", { description: "Passage §1.1 (p. 2): Linear vector |ψ⟩ = α|0⟩ + β|1⟩" });
              }}>
                <BookmarkCheck className="mr-2 h-4 w-4 text-emerald-500" />
                <span>Quantum Superposition: Linear combinations of |0⟩ and |1⟩</span>
              </CommandItem>
              <CommandItem onSelect={() => {
                scrollToSection("simulator");
                setCmdOpen(false);
                toast.success("Found: Quantum Entanglement", { description: "Passage §1.3 (p. 4): Non-local state correlations" });
              }}>
                <BookmarkCheck className="mr-2 h-4 w-4 text-emerald-500" />
                <span>Quantum Entanglement: Bell state correlations</span>
              </CommandItem>
              <CommandItem onSelect={() => {
                scrollToSection("simulator");
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
