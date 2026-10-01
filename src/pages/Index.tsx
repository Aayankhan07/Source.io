import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/features/auth/context/AuthContext";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import { 
  FileText, Headphones, MessagesSquare, ListChecks, Layers,
  ArrowRight, Play, Pause, Check, X, RotateCcw, Send,
  Sparkles, FileCode, Video, Mic, Globe, Cpu, ShieldCheck,
  ChevronRight, BookmarkCheck, Database, Menu
} from "lucide-react";

export default function Index() {
  const { user } = useAuth();
  const shouldReduceMotion = useReducedMotion();
  const [activeSimTab, setActiveSimTab] = useState<"notes" | "flashcards" | "quiz" | "podcast" | "chat">("notes");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Simulated Flashcards State
  const simFlashcards = [
    { 
      front: "What is Superposition in Quantum Computing?", 
      back: "The capacity of a qubit to exist in a normalized linear combination of states (|0⟩ and |1⟩) simultaneously until measurement forces a collapse." 
    },
    { 
      front: "Explain Quantum Entanglement.", 
      back: "A physical state where multiple qubits correlate such that measuring one instantaneously determines the state of the other across arbitrary distance." 
    },
    { 
      front: "What causes Quantum Decoherence?", 
      back: "Environmental interference such as thermal noise or electromagnetic stray fields that decays quantum phase into classical probability." 
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

  return (
    <div className="min-h-[100dvh] bg-[#07090e] text-slate-100 font-sans relative overflow-x-clip selection:bg-sky-500/30 selection:text-sky-200">
      {/* Precision ambient background illumination */}
      <div 
        aria-hidden="true" 
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[640px] opacity-40 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(14,165,233,0.18),rgba(15,23,42,0)_70%)]" 
      />
      <div 
        aria-hidden="true" 
        className="pointer-events-none absolute top-[1400px] right-[-10%] w-[500px] h-[500px] opacity-20 bg-[radial-gradient(circle,rgba(56,189,248,0.2),transparent_70%)] blur-3xl" 
      />

      {/* Floating Pill Navigation Bar */}
      <header className="sticky top-4 z-50 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto bg-[#0d121d]/85 backdrop-blur-xl border border-white/[0.08] rounded-full px-4 sm:px-6 py-2.5 shadow-2xl shadow-black/60">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="h-7 w-7 rounded-full bg-sky-500/10 border border-sky-400/30 flex items-center justify-center text-sky-400 group-hover:scale-105 transition-transform">
                <Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} />
              </div>
              <span className="font-semibold tracking-tight text-sm font-display text-white">
                Source<span className="text-sky-400">.io</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-slate-400">
              <a href="#simulator" className="hover:text-white transition-colors">Workspace Demo</a>
              <a href="#synthesis" className="hover:text-white transition-colors">Architecture</a>
              <a href="#workflow" className="hover:text-white transition-colors">Workflow</a>
              <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            </nav>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors"
                aria-label="Toggle navigation menu"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="h-4 w-4" strokeWidth={1.5} /> : <Menu className="h-4 w-4" strokeWidth={1.5} />}
              </button>

              {user ? (
                <Link 
                  to="/app" 
                  className="bg-white hover:bg-slate-200 text-slate-950 rounded-full px-4 py-1.5 text-xs font-semibold shadow-sm inline-flex items-center gap-1.5 active:scale-[0.98] transition-all"
                >
                  Open workspace
                  <ArrowRight className="h-3 w-3" strokeWidth={1.5} />
                </Link>
              ) : (
                <>
                  <Link 
                    to="/auth" 
                    className="text-xs font-medium text-slate-400 hover:text-white px-3 py-1.5 transition-colors hidden sm:inline-block"
                  >
                    Sign in
                  </Link>
                  <Link 
                    to="/auth" 
                    className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold rounded-full px-4 py-1.5 text-xs shadow-sm inline-flex items-center gap-1.5 active:scale-[0.98] transition-all"
                  >
                    Get started free
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile Collapsible Navigation Links */}
          {mobileMenuOpen && (
            <nav className="md:hidden mt-3 pt-3 border-t border-white/[0.08] flex flex-col gap-2 text-xs font-medium text-slate-400 pb-1">
              <a href="#simulator" onClick={() => setMobileMenuOpen(false)} className="hover:text-white py-1 transition-colors">Workspace Demo</a>
              <a href="#synthesis" onClick={() => setMobileMenuOpen(false)} className="hover:text-white py-1 transition-colors">Architecture</a>
              <a href="#workflow" onClick={() => setMobileMenuOpen(false)} className="hover:text-white py-1 transition-colors">Workflow</a>
              <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="hover:text-white py-1 transition-colors">Pricing</a>
            </nav>
          )}
        </div>
      </header>

      {/* Hero Section: Disciplined Viewport Fit */}
      <section className="pt-16 md:pt-20 pb-12 px-4 sm:px-6 relative z-10 max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Focused Copy Stack (Eyebrow, H1, Subtext, CTAs) */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Eyebrow 1 of 2 across page */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/[0.08] border border-sky-400/20 text-xs font-mono text-sky-400">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse motion-reduce:animate-none" />
              <span>MULTI-MODAL COGNITIVE ENGINE</span>
            </div>

            {/* Disciplined Headline: max 2 lines desktop */}
            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-display font-medium tracking-tight text-white leading-[1.08]">
              Turn complex research into verifiable mastery
            </h1>

            {/* Disciplined Subtext: max 20 words */}
            <p className="text-sm sm:text-base text-slate-400 max-w-xl leading-relaxed">
              Synthesize documents, audio, and lectures into cited notes, active recall decks, quizzes, and podcast dialogues with mathematical grounding.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to={user ? "/app" : "/auth"}
                className="bg-white hover:bg-slate-200 text-slate-950 font-semibold text-xs sm:text-sm px-6 py-2.5 rounded-full shadow-lg shadow-white/5 active:scale-[0.98] transition-all inline-flex items-center gap-2"
              >
                {user ? "Open workspace" : "Get started free"}
                <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
              </Link>
              <a
                href="#simulator"
                className="bg-[#101726] hover:bg-[#162035] text-slate-300 hover:text-white font-semibold text-xs sm:text-sm px-5 py-2.5 rounded-full border border-white/[0.08] active:scale-[0.98] transition-all inline-flex items-center gap-1.5"
              >
                Explore live demo
                <ChevronRight className="h-4 w-4 text-slate-400" strokeWidth={1.5} />
              </a>
            </div>

            <div className="pt-2 flex items-center gap-6 text-[11px] font-mono text-slate-500">
              <span>Whisper speech pipeline</span>
              <span className="h-1 w-1 rounded-full bg-slate-700" />
              <span>Llama 3 inference</span>
              <span className="h-1 w-1 rounded-full bg-slate-700" />
              <span>Zero hallucination guarantee</span>
            </div>
          </div>

          {/* Right Column: Hero Visual Asset (3D holographic crystal prisms) */}
          <div className="lg:col-span-5 relative">
            <motion.div 
              initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="relative rounded-2xl overflow-hidden border border-white/[0.1] shadow-2xl shadow-black/80 group"
            >
              <img 
                src="/assets/hero_visual.jpg" 
                alt="Multi-modal intelligence research visual with holographic crystal documents"
                className="w-full h-auto object-cover aspect-[16/10] group-hover:scale-105 transition-transform duration-700 ease-out"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#07090e] via-transparent to-transparent opacity-60" />
              <div className="absolute bottom-3 left-3 right-3 p-3 rounded-xl bg-[#090d16]/90 backdrop-blur-md border border-white/[0.08] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="font-mono text-slate-300 text-[11px]">Vector Mesh Active</span>
                </div>
                <span className="font-mono text-sky-400 text-[11px]">350 tok/s</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Universal Ingestion Formats Strip */}
      <section className="py-8 px-4 sm:px-6 relative z-10 max-w-6xl mx-auto border-y border-white/[0.06]">
        <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4">
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
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0d1320] border border-white/[0.06] text-xs font-medium text-slate-300"
            >
              <item.icon className="h-3.5 w-3.5 text-sky-400" strokeWidth={1.5} />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Live Interactive Workspace Demo */}
      <section id="simulator" className="py-16 px-4 sm:px-6 relative z-10 max-w-5xl mx-auto scroll-mt-20">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <h2 className="text-2xl sm:text-3xl font-display font-medium text-white tracking-tight mb-2">
            Experience the multi-modal study pipeline
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Select a mode to inspect how Source converts raw sources into active understanding.
          </p>
        </div>

        {/* Tab Navigator */}
        <div className="flex items-center justify-center gap-1.5 p-1.5 rounded-full bg-[#0d1320] border border-white/[0.08] max-w-2xl mx-auto mb-6 flex-wrap">
          {([
            { id: "notes", label: "Study Notes", icon: FileText },
            { id: "flashcards", label: "Flashcards", icon: Layers },
            { id: "quiz", label: "Practice Quiz", icon: ListChecks },
            { id: "podcast", label: "Audio Recap", icon: Headphones },
            { id: "chat", label: "Grounded Chat", icon: MessagesSquare }
          ] as const).map((t) => {
            const Icon = t.icon;
            const active = activeSimTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveSimTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  active 
                    ? "bg-sky-500 text-slate-950 font-semibold shadow-sm" 
                    : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Workspace Console Shell */}
        <div className="bg-[#0b101b] rounded-2xl border border-white/[0.09] shadow-2xl shadow-black/80 overflow-hidden">
          {/* Console Header Bar */}
          <div className="bg-[#0f1626] border-b border-white/[0.08] px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-700" />
              <span className="h-2.5 w-2.5 rounded-full bg-slate-700" />
              <span className="h-2.5 w-2.5 rounded-full bg-slate-700" />
            </div>

            <div className="flex-1 max-w-md mx-auto hidden sm:flex items-center justify-center">
              <div className="w-full bg-[#070b14] border border-white/[0.08] rounded-md px-3 py-1 text-xs text-slate-300 flex items-center justify-between font-mono">
                <span className="truncate">source.io / quantum_computing_intro.pdf</span>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  Grounded
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <span className="hidden md:inline">48 Citations Indexed</span>
              <span className="h-2 w-2 rounded-full bg-sky-400" />
            </div>
          </div>

          {/* Interactive Workspace Body */}
          <div className="p-5 sm:p-7 min-h-[360px]">
            <AnimatePresence mode="wait">
              {/* Tab 1: Notes */}
              {activeSimTab === "notes" && (
                <motion.div 
                  key="notes"
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="max-w-2xl mx-auto space-y-4 text-left"
                >
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                    <div>
                      <h3 className="text-base font-semibold text-white flex items-center gap-2">
                        <FileText className="h-4 w-4 text-sky-400" strokeWidth={1.5} /> Introduction to Quantum Computing
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">Synthesized from Chapter 1: The Quantum State Representation</p>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/[0.08] text-slate-300 font-mono">
                      3 min read
                    </span>
                  </div>
                  
                  <div className="text-xs sm:text-sm text-slate-300 leading-relaxed space-y-3">
                    <p>
                      Quantum computation is fundamentally distinguished by its exploitation of <strong>superposition</strong> and <strong>quantum entanglement</strong>. Unlike classical binary systems where bits represent discrete states of either 0 or 1, quantum systems utilize complex Hilbert vector spaces.
                    </p>

                    <div className="grid sm:grid-cols-2 gap-3 my-3">
                      <div className="p-3 rounded-xl bg-[#0e1422] border border-white/[0.06]">
                        <span className="text-[11px] font-semibold text-sky-400 block mb-1 font-mono">Principle 1: Superposition</span>
                        <p className="text-xs text-slate-400 leading-normal">
                          A qubit exists in a normalized linear superposition |ψ⟩ = α|0⟩ + β|1⟩, evaluating multi-path algorithms simultaneously until measurement.
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-[#0e1422] border border-white/[0.06]">
                        <span className="text-[11px] font-semibold text-sky-400 block mb-1 font-mono">Principle 2: Entanglement</span>
                        <p className="text-xs text-slate-400 leading-normal">
                          Entangled Bell pairs establish instant state correlations across spatial separations, enabling dense coding and cryptographic key distribution.
                        </p>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-400/20 text-xs text-sky-200 flex items-start gap-2.5">
                      <ShieldCheck className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" strokeWidth={1.5} />
                      <span>Every paragraph in this synthesis is indexed to source coordinates [p. 2-5] with 96% verification fidelity.</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Tab 2: Flashcards */}
              {activeSimTab === "flashcards" && (
                <motion.div 
                  key="flashcards"
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="max-w-md mx-auto space-y-4 text-center py-2"
                >
                  <div className="flex justify-between items-center text-xs text-slate-400">
                    <span className="font-mono">Card {cardIdx + 1} of {simFlashcards.length}</span>
                    <button 
                      onClick={() => { setCardIdx(0); setCardFlipped(false); }}
                      className="px-2.5 py-1 rounded-full bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 text-xs transition-colors"
                    >
                      Reset deck
                    </button>
                  </div>

                  {/* Flip Card Design */}
                  <div
                    className="relative w-full min-h-[14rem] h-56 cursor-pointer select-none rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
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
                        className="absolute inset-0 rounded-2xl border border-white/[0.09] bg-[#0e1422] p-6 flex flex-col items-center justify-center text-center shadow-lg"
                        style={{ backfaceVisibility: "hidden" }}
                      >
                        <span className="px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 text-[10px] font-mono font-semibold mb-3 border border-sky-400/20">
                          QUESTION
                        </span>
                        <p className="text-base font-semibold text-white leading-snug">
                          {simFlashcards[cardIdx].front}
                        </p>
                        <p className="absolute bottom-4 text-xs text-slate-500">Click or press Space to reveal answer</p>
                      </div>

                      {/* Back */}
                      <div 
                        className="absolute inset-0 rounded-2xl border border-sky-400/30 bg-[#0c1626] p-6 flex flex-col items-center justify-center text-center shadow-lg"
                        style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                      >
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-semibold mb-3 border border-emerald-400/20">
                          EXPLANATION
                        </span>
                        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                          {simFlashcards[cardIdx].back}
                        </p>
                        <p className="absolute bottom-4 text-xs text-slate-500">Click or press Space to flip back</p>
                      </div>
                    </div>
                  </div>

                  {/* Leitner Confidence Buttons */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button 
                      onClick={() => { setCardFlipped(false); setCardIdx(i => Math.max(0, i - 1)); }}
                      disabled={cardIdx === 0}
                      className="px-3 py-1.5 rounded-full border border-white/[0.08] text-xs text-slate-400 disabled:opacity-40 hover:bg-white/[0.04] transition-colors"
                    >
                      Previous
                    </button>
                    <div className="flex gap-1.5" role="group" aria-label="Leitner confidence rating">
                      {[
                        { label: "Again", style: "hover:bg-rose-500/20 hover:text-rose-300" },
                        { label: "Hard", style: "hover:bg-amber-500/20 hover:text-amber-300" },
                        { label: "Good", style: "hover:bg-sky-500/20 hover:text-sky-300" },
                        { label: "Easy", style: "hover:bg-emerald-500/20 hover:text-emerald-300" },
                      ].map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => {
                            setCardFlipped(false);
                            setCardIdx((i) => (i + 1) % simFlashcards.length);
                          }}
                          className={`text-[11px] px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/[0.08] text-slate-300 font-medium transition-colors ${item.style}`}
                          aria-label={`Mark as ${item.label} and show next card`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                    <button 
                      onClick={() => { setCardFlipped(false); setCardIdx(i => Math.min(simFlashcards.length - 1, i + 1)); }}
                      disabled={cardIdx === simFlashcards.length - 1}
                      className="px-3 py-1.5 rounded-full border border-white/[0.08] text-xs text-slate-400 disabled:opacity-40 hover:bg-white/[0.04] transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Tab 3: Practice Quiz */}
              {activeSimTab === "quiz" && (
                <motion.div 
                  key="quiz"
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="max-w-xl mx-auto space-y-4 text-left"
                >
                  <div className="border border-white/[0.08] bg-[#0e1422] rounded-2xl p-5 sm:p-6 space-y-4">
                    <div className="flex items-start gap-2.5">
                      <span className="px-2 py-0.5 rounded bg-sky-500 text-slate-950 text-xs font-mono font-bold mt-0.5">Q1</span>
                      <div>
                        <h4 className="text-sm sm:text-base font-semibold text-white">
                          Which decay mechanism transforms a qubit's quantum superposition into classical probability?
                        </h4>
                        <p className="text-xs text-slate-400 mt-1 font-mono">Single choice • Vector verified</p>
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
                        
                        let btnStyle = "border-white/[0.08] hover:border-white/[0.15] bg-[#070b14] text-slate-300";
                        if (isSelected) {
                          if (quizSubmitted) {
                            btnStyle = isCorrect 
                              ? "border-emerald-500 bg-emerald-500/10 text-emerald-200" 
                              : "border-rose-500 bg-rose-500/10 text-rose-200";
                          } else {
                            btnStyle = "border-sky-400 bg-sky-500/10 text-white ring-1 ring-sky-400";
                          }
                        } else if (quizSubmitted && isCorrect) {
                          btnStyle = "border-emerald-500 bg-emerald-500/10 text-emerald-200";
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
                            {quizSubmitted && isCorrect && <Check className="h-4 w-4 text-emerald-400" strokeWidth={1.5} />}
                            {quizSubmitted && isSelected && !isCorrect && <X className="h-4 w-4 text-rose-400" strokeWidth={1.5} />}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-white/[0.08]">
                      <span className="text-xs text-slate-400">Select an option to test your comprehension</span>
                      {quizSubmitted ? (
                        <button 
                          onClick={() => { setSelectedChoice(null); setQuizSubmitted(false); }}
                          className="px-3.5 py-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.15] text-white text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                        >
                          <RotateCcw className="h-3 w-3" strokeWidth={1.5} /> Retry
                        </button>
                      ) : (
                        <button 
                          disabled={selectedChoice === null}
                          onClick={() => setQuizSubmitted(true)}
                          className="px-4 py-1.5 rounded-full bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-semibold disabled:opacity-40 transition-colors"
                        >
                          Submit Answer
                        </button>
                      )}
                    </div>

                    {quizSubmitted && (
                      <div className="text-xs text-slate-300 bg-[#070b14] p-3.5 rounded-xl border border-white/[0.08] leading-relaxed">
                        <strong className="text-white font-semibold block mb-0.5">Rationale:</strong> 
                        Decoherence occurs when environmental thermal fluctuations or electromagnetic fields interact with qubits, inducing rapid loss of phase coherence.
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Tab 4: Audio Recap */}
              {activeSimTab === "podcast" && (
                <motion.div 
                  key="podcast"
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="max-w-md mx-auto space-y-5 text-center py-2"
                >
                  <div className="w-full bg-[#0e1422] rounded-2xl p-6 border border-white/[0.08] text-left">
                    <div className="flex items-center justify-between mb-3 text-xs text-slate-400 font-mono">
                      <span>SYNTHESIZED EPISODE</span>
                      <span className="px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-400/20">
                        2 AI Hosts
                      </span>
                    </div>

                    <h4 className="text-base font-semibold text-white mb-1">
                      Demystifying Superposition and Entanglement
                    </h4>
                    <p className="text-xs text-slate-400 mb-6">Generated conversation from Chapter 1</p>

                    {/* Playback Controls */}
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setPodcastPlaying(!podcastPlaying)}
                        aria-label={podcastPlaying ? "Pause audio preview" : "Play audio preview"}
                        className="h-11 w-11 rounded-full bg-sky-500 hover:bg-sky-400 text-slate-950 flex items-center justify-center transition-all shadow-md shrink-0 active:scale-95"
                      >
                        {podcastPlaying ? <Pause className="h-5 w-5" strokeWidth={1.5} /> : <Play className="h-5 w-5 ml-0.5" strokeWidth={1.5} />}
                      </button>
                      <div className="flex-1 space-y-1">
                        <div 
                          className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden"
                          role="progressbar"
                          aria-valuenow={audioProgress}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label="Podcast preview progress"
                        >
                          <div className="h-full bg-sky-400 transition-all duration-300" style={{ width: `${audioProgress}%` }} />
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                          <span>0:48</span>
                          <span>4:12</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Transcript Snippet */}
                  <div className="text-left w-full space-y-2 text-xs bg-[#090d16] border border-white/[0.06] p-4 rounded-xl">
                    <div>
                      <span className="font-semibold text-sky-400 font-mono text-[11px]">Host A (Clara):</span>
                      <p className="text-slate-300 mt-0.5">"So when a qubit is in superposition, it is not merely alternating between zero and one, correct?"</p>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-400 font-mono text-[11px]">Host B (Julian):</span>
                      <p className="text-slate-300 mt-0.5">"Precisely. It occupies a normalized vector space until physical measurement prompts state reduction."</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Tab 5: Grounded Chat */}
              {activeSimTab === "chat" && (
                <motion.div 
                  key="chat"
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="max-w-xl mx-auto flex flex-col h-[380px] justify-between text-left"
                >
                  <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                    {chatMessages.map((m, idx) => {
                      const isAi = m.role === "assistant";
                      return (
                        <div key={idx} className={`flex ${isAi ? "justify-start" : "justify-end"}`}>
                          <div className={`max-w-[88%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed ${
                            isAi 
                              ? "bg-[#0e1422] border border-white/[0.08] text-slate-200" 
                              : "bg-sky-500 text-slate-950 font-medium"
                          }`}>
                            {m.content === "" ? (
                              <div className="flex items-center gap-1.5 py-1 text-slate-400">
                                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-pulse" />
                                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-pulse" style={{ animationDelay: "200ms" }} />
                                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-pulse" style={{ animationDelay: "400ms" }} />
                              </div>
                            ) : (
                              <>
                                <p>{m.content}</p>
                                {m.citation && (
                                  <div className="mt-2 pt-2 border-t border-white/[0.08] flex items-center justify-between text-[11px] font-mono text-slate-400">
                                    <span className="text-sky-400 font-medium flex items-center gap-1">
                                      <BookmarkCheck className="h-3 w-3" strokeWidth={1.5} /> {m.citation}
                                    </span>
                                    <span className="bg-sky-500/10 text-sky-300 px-1.5 py-0.5 rounded border border-sky-400/20">
                                      {Math.round((m.score || 0.95) * 100)}% match
                                    </span>
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
                  <div className="border-t border-white/[0.08] pt-3 mt-2 space-y-2">
                    <div className="flex gap-1.5 flex-wrap">
                      <button 
                        onClick={() => handleSendChat("What is quantum superposition?")}
                        disabled={chatTyping}
                        className="text-xs px-2.5 py-1 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 transition-colors"
                      >
                        What is superposition?
                      </button>
                      <button 
                        onClick={() => handleSendChat("Explain entanglement in simple terms.")}
                        disabled={chatTyping}
                        className="text-xs px-2.5 py-1 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 transition-colors"
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
                        className="flex-1 bg-[#070b14] border border-white/[0.08] rounded-full px-4 py-2 text-xs sm:text-sm text-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sky-400"
                      />
                      <button 
                        type="button"
                        onClick={() => handleSendChat(chatInput)}
                        disabled={chatTyping || !chatInput.trim()}
                        aria-label="Send message"
                        className="h-9 w-9 rounded-full bg-sky-500 hover:bg-sky-400 text-slate-950 flex items-center justify-center disabled:opacity-40 transition-all shrink-0 active:scale-95"
                      >
                        <Send className="h-3.5 w-3.5" strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Asymmetric Bento Architecture Showcase */}
      <section id="synthesis" className="py-20 px-4 sm:px-6 relative z-10 max-w-6xl mx-auto scroll-mt-20">
        <div className="text-left max-w-2xl mb-12">
          {/* Eyebrow 2 of 2 across page */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/[0.08] border border-sky-400/20 text-xs font-mono text-sky-400 mb-3">
            <span>VERIFIABLE GROUNDING</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-display font-medium text-white tracking-tight leading-tight">
            Engineered for scholars who require mathematical precision
          </h2>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed">
            Every output retains an immutable anchor back to page coordinates and timestamps.
          </p>
        </div>

        {/* Bento Grid: 3 Cells with Real Visual Texture */}
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Cell 1: Large Feature with Real Visual Asset */}
          <div className="lg:col-span-7 bg-[#0b101b] rounded-3xl border border-white/[0.08] p-6 sm:p-8 flex flex-col justify-between overflow-hidden relative group">
            <div className="mb-6 relative z-10">
              <h3 className="text-xl sm:text-2xl font-display font-medium text-white mb-2">
                Acoustic transcriptions with word-level alignment
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-lg">
                Whisper neural models isolate multi-speaker conversations from lectures, webinars, and audiobooks, indexing each sentence to precise timestamps.
              </p>
            </div>

            <div className="relative rounded-2xl overflow-hidden border border-white/[0.08] mt-2">
              <img 
                src="/assets/neural_audio.jpg" 
                alt="Acoustic waveform and vector coordinate clusters visual"
                className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b101b] via-transparent to-transparent opacity-80" />
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs font-mono text-slate-300">
                <span className="bg-[#070b14]/90 px-2.5 py-1 rounded border border-white/[0.08]">
                  44.1kHz • 2 Channels
                </span>
                <span className="text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded border border-sky-400/20">
                  98.4% WER Accuracy
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: 2 Stacked Cells */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Cell 2: Vector Coordinate Scoring */}
            <div className="bg-[#0b101b] rounded-3xl border border-white/[0.08] p-6 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-display font-medium text-white mb-2">
                  Cosine similarity ranking
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Incoming questions compute dense vector embeddings, retrieving the top matched fragments with transparent certainty scores.
                </p>
              </div>

              <div className="space-y-2 bg-[#070b14] p-3.5 rounded-xl border border-white/[0.06] font-mono text-xs">
                <div className="flex items-center justify-between text-slate-400 border-b border-white/[0.06] pb-2 text-[11px]">
                  <span>PASSAGE EXCERPT</span>
                  <span>CONFIDENCE</span>
                </div>
                <div className="flex items-center justify-between text-slate-300 pt-1">
                  <span className="truncate max-w-[210px]">§ 1.2 "Superposition collapse..."</span>
                  <span className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">0.96</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="truncate max-w-[210px]">§ 2.4 "Thermal decoherence in..."</span>
                  <span className="text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20">0.91</span>
                </div>
              </div>
            </div>

            {/* Cell 3: Spaced Repetition Logic */}
            <div className="bg-[#0b101b] rounded-3xl border border-white/[0.08] p-6 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-display font-medium text-white mb-2">
                  Adaptive Leitner scheduling
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Surfaces challenging concepts right before memory decay occurs, reducing total review time while reinforcing long-term retention.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs">
                <div className="p-2.5 rounded-xl bg-[#070b14] border border-white/[0.06]">
                  <span className="text-slate-500 block text-[10px]">INTERVAL</span>
                  <span className="font-semibold text-white">4 Days</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#070b14] border border-white/[0.06]">
                  <span className="text-slate-500 block text-[10px]">RETENTION</span>
                  <span className="font-semibold text-emerald-400">94.2%</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#070b14] border border-white/[0.06]">
                  <span className="text-slate-500 block text-[10px]">DECKS</span>
                  <span className="font-semibold text-sky-400">28 Cards</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Streamlined Knowledge Pipeline Workflow */}
      <section id="workflow" className="py-20 px-4 sm:px-6 relative z-10 max-w-6xl mx-auto scroll-mt-20 border-t border-white/[0.06]">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl sm:text-4xl font-display font-medium text-white tracking-tight mb-2">
            From raw media to complete comprehension
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
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
              className="bg-[#0b101b] rounded-2xl border border-white/[0.08] p-6 flex flex-col justify-between"
            >
              <div>
                <span className="text-sky-400 font-mono text-xs font-semibold block mb-3">
                  Stage {idx + 1}
                </span>
                <h3 className="text-base font-semibold text-white mb-2">{stage.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{stage.desc}</p>
              </div>

              <div className="pt-4 mt-4 border-t border-white/[0.06] text-[11px] font-mono text-slate-500">
                {stage.metric}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Transparent Pricing Comparison */}
      <section id="pricing" className="py-20 px-4 sm:px-6 relative z-10 max-w-5xl mx-auto scroll-mt-20">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl sm:text-4xl font-display font-medium text-white tracking-tight mb-2">
            Predictable plans for researchers and teams
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Start free without a credit card and upgrade whenever you require unlimited volume.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-stretch">
          {/* Card 1: Free Tier */}
          <div className="bg-[#0b101b] rounded-3xl p-8 border border-white/[0.08] flex flex-col justify-between text-left">
            <div>
              <span className="text-xs font-mono text-slate-400 font-semibold block mb-4">
                FREE TIER
              </span>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl sm:text-5xl font-display font-bold text-white">$0</span>
                <span className="text-xs text-slate-400 font-mono">/ forever</span>
              </div>
              <p className="text-xs text-slate-400 mb-8">Fundamental research utilities for individual students.</p>

              <div className="space-y-3 mb-8">
                {[
                  "10 document uploads per month",
                  "Automated study notes generation",
                  "20 flashcards per source file",
                  "Interactive quizzes with explanations",
                  "2 audio podcast recaps",
                  "Grounded chat with passage citations"
                ].map((feat) => (
                  <div key={feat} className="flex items-center gap-2.5 text-xs text-slate-300">
                    <Check className="h-4 w-4 text-sky-400 shrink-0" strokeWidth={1.5} />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <Link
              to="/auth"
              className="w-full text-center py-3 rounded-full border border-white/[0.1] hover:bg-white/[0.05] text-white font-semibold text-xs transition-colors active:scale-[0.98]"
            >
              Get started free
            </Link>
          </div>

          {/* Card 2: Scholar Pro Tier */}
          <div className="bg-[#0e1524] rounded-3xl p-8 border border-sky-400/30 shadow-2xl shadow-sky-500/5 flex flex-col justify-between relative overflow-hidden text-left">
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-mono text-sky-400 font-semibold">
                  SCHOLAR PRO
                </span>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-300 border border-sky-400/30 font-semibold">
                  RECOMMENDED
                </span>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl sm:text-5xl font-display font-bold text-white">$19</span>
                <span className="text-xs text-slate-400 font-mono">/ per month</span>
              </div>
              <p className="text-xs text-slate-400 mb-8">Full capability for graduate researchers, analysts, and engineers.</p>

              <div className="space-y-3 mb-8">
                {[
                  "Unlimited document, video, and audio uploads",
                  "Files up to 250MB with full book support",
                  "Unlimited flashcard decks and quiz exports",
                  "Full-length high-fidelity podcast dialogues",
                  "Groq Llama 3 ultra-fast inference",
                  "Mathematical LaTeX formatting and code blocks",
                  "Priority cloud sync and source backup"
                ].map((feat) => (
                  <div key={feat} className="flex items-center gap-2.5 text-xs text-slate-200">
                    <Check className="h-4 w-4 text-sky-400 shrink-0" strokeWidth={1.5} />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <Link
              to="/auth"
              className="relative z-10 w-full text-center py-3 rounded-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs shadow-md transition-all active:scale-[0.98]"
            >
              Start 14-day free trial
            </Link>
          </div>
        </div>
      </section>

      {/* Focused Bottom Call to Action */}
      <section className="pt-16 pb-24 px-4 sm:px-6 relative z-10 text-center max-w-4xl mx-auto">
        <h2 className="text-3xl sm:text-5xl font-display font-medium text-white tracking-tight leading-tight mb-4">
          Master any subject without hallucination anxiety
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mb-8 leading-relaxed">
          Join researchers and students converting dense documents into active recall and cited answers.
        </p>

        <div className="flex items-center justify-center">
          <Link
            to={user ? "/app" : "/auth"}
            className="bg-white hover:bg-slate-200 text-slate-950 font-semibold text-xs sm:text-sm px-8 py-3 rounded-full shadow-lg active:scale-[0.98] transition-all inline-flex items-center gap-2"
          >
            {user ? "Open workspace" : "Get started free"}
            <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
          </Link>
        </div>
      </section>

      {/* Clean Cohesive Footer */}
      <footer className="px-4 sm:px-6 pb-8 max-w-6xl mx-auto relative z-10">
        <div className="bg-[#0b101b] rounded-3xl border border-white/[0.08] p-8 sm:p-10 space-y-10 text-left">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8">
            <div className="space-y-3 max-w-sm">
              <Link to="/" className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-sky-500/10 border border-sky-400/30 flex items-center justify-center text-sky-400">
                  <Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} />
                </div>
                <span className="font-semibold text-sm font-display text-white">
                  Source<span className="text-sky-400">.io</span>
                </span>
              </Link>
              <p className="text-xs text-slate-400 leading-relaxed">
                The multi-modal intelligence workspace that synthesizes complex documents into verified study notes and interactive recall systems.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-xs">
              <div>
                <span className="font-mono text-slate-400 font-semibold block mb-3">Product</span>
                <ul className="space-y-2 text-slate-400">
                  <li><a href="#simulator" className="hover:text-white transition-colors">Workspace Demo</a></li>
                  <li><a href="#synthesis" className="hover:text-white transition-colors">Architecture</a></li>
                  <li><a href="#workflow" className="hover:text-white transition-colors">Workflow</a></li>
                  <li><a href="#pricing" className="hover:text-white transition-colors">Pricing Plans</a></li>
                </ul>
              </div>

              <div>
                <span className="font-mono text-slate-400 font-semibold block mb-3">Grounding</span>
                <ul className="space-y-2 text-slate-400">
                  <li><span className="text-slate-500">Whisper ASR</span></li>
                  <li><span className="text-slate-500">Groq Llama 3</span></li>
                  <li><span className="text-slate-500">Vector Embeddings</span></li>
                  <li><span className="text-slate-500">Citation Engine</span></li>
                </ul>
              </div>

              <div>
                <span className="font-mono text-slate-400 font-semibold block mb-3">Platform</span>
                <ul className="space-y-2 text-slate-400">
                  <li><Link to="/auth" className="hover:text-white transition-colors">Sign in</Link></li>
                  <li><Link to="/auth" className="hover:text-white transition-colors">Create account</Link></li>
                  <li><span className="text-slate-500">Privacy Policy</span></li>
                  <li><span className="text-slate-500">Terms of Service</span></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>All inference pipelines operational</span>
            </div>

            <div>
              (c) {new Date().getFullYear()} Source.io Inc. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
