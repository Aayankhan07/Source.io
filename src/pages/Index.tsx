import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/features/auth/context/AuthContext";
import { 
  FileText, Headphones, MessagesSquare, ListChecks, Layers,
  ArrowRight, Play, Pause, Check, X, RotateCcw, Send,
  Sparkles, FileCode, Video, Mic, Globe, Cpu, ShieldCheck,
  ChevronRight, ArrowUpRight, Compass, BookmarkCheck,
  Zap, Database, BarChart3, HelpCircle
} from "lucide-react";
import MarkdownView from "@/components/common/MarkdownView";

export default function Index() {
  const { user } = useAuth();
  const [activeSimTab, setActiveSimTab] = useState<"notes" | "flashcards" | "quiz" | "podcast" | "chat">("notes");

  // Simulated Flashcards State
  const simFlashcards = [
    { front: "What is Superposition in Quantum Computing?", back: "The ability of a quantum system (qubit) to exist in multiple linear combinations of states (|0⟩ and |1⟩) simultaneously until measurement." },
    { front: "Explain Quantum Entanglement.", back: "A physical phenomenon where multiple qubits become correlated such that the quantum state of one instantaneously defines the state of the other, regardless of distance." },
    { front: "What is Quantum Decoherence?", back: "The decay of a quantum state caused by environmental interference like stray heat or electromagnetic noise, transforming quantum behavior into classical probability." }
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
      content: "Hello! I am your Source.io Research Assistant. Ask me anything about the Quantum Computing material, and I will cite the exact passage.",
      citation: "Passage §1.2 (p. 4)",
      score: 0.96
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatTyping, setChatTyping] = useState(false);

  const handleSendChat = (text: string) => {
    if (!text.trim() || chatTyping) return;
    const userMsg = { role: "user" as const, content: text };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setChatTyping(true);

    setTimeout(() => {
      let fullResponse = "";
      let citation = "Passage §2.1 (p. 7)";
      let score = 0.94;

      if (text.toLowerCase().includes("superposition")) {
        fullResponse = "Superposition allows a qubit to represent a linear combination of |0⟩ and |1⟩ simultaneously. Unlike classical bits that are either on or off, quantum states collapse into a definite value only upon observation.";
        citation = "Passage §1.1 (p. 2)";
        score = 0.98;
      } else if (text.toLowerCase().includes("entanglement")) {
        fullResponse = "Entangled qubits maintain non-local correlations. Einstein famously dubbed it 'spooky action at a distance', enabling quantum teleportation protocols and superdense coding.";
        citation = "Passage §1.3 (p. 5)";
        score = 0.95;
      } else {
        fullResponse = "Decoherence is the primary physical challenge in maintaining quantum coherence. Environmental thermal vibrations cause qubits to lose phase information within microseconds.";
        citation = "Passage §3.4 (p. 11)";
        score = 0.91;
      }

      setChatMessages(prev => [...prev, { role: "assistant", content: "", citation, score }]);
      
      let charIdx = 0;
      const STEP = 4;
      const typeInterval = setInterval(() => {
        charIdx = Math.min(charIdx + STEP, fullResponse.length);
        const slice = fullResponse.slice(0, charIdx);
        setChatMessages((prev) =>
          prev.map((m, i) =>
            i === prev.length - 1 && m.role === "assistant" ? { ...m, content: slice } : m,
          ),
        );
        if (charIdx >= fullResponse.length) {
          clearInterval(typeInterval);
          setChatTyping(false);
        }
      }, 25);
    }, 700);
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-900 font-sans relative overflow-x-hidden antialiased">
      {/* Ambient Top Glow Mesh */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[850px] ambient-hero-aura pointer-events-none z-0" />

      {/* Floating Pill Navigation Bar */}
      <header className="sticky top-5 z-50 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-md border border-slate-200/90 rounded-full px-4 sm:px-6 py-2.5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)] flex items-center justify-between transition-[background-color,border-color,box-shadow]">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="h-7 w-7 rounded-full bg-slate-900 flex items-center justify-center text-white shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-sky-300" />
            </div>
            <span className="font-semibold tracking-tight text-base font-display text-slate-900">
              Source<span className="text-sky-600">.io</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-600">
            <a href="#simulator" className="hover:text-slate-900 transition-colors">Showcase</a>
            <a href="#philosophy" className="hover:text-slate-900 transition-colors">Philosophy</a>
            <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
            <a href="#workflow" className="hover:text-slate-900 transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-slate-900 transition-colors">Pricing</a>
          </nav>

          <div className="flex items-center gap-2.5">
            {user ? (
              <Link 
                to="/app" 
                className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-4 py-1.5 text-xs font-semibold shadow-sm inline-flex items-center gap-1.5 transition-[background-color,box-shadow]"
              >
                Open Workspace <ArrowRight className="h-3 w-3" />
              </Link>
            ) : (
              <>
                <Link 
                  to="/auth" 
                  className="text-xs font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 transition-colors hidden sm:inline-block"
                >
                  Sign in
                </Link>
                <Link 
                  to="/auth" 
                  className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-4 py-1.5 text-xs font-semibold shadow-sm inline-flex items-center gap-1 transition-[background-color,box-shadow] hover:shadow"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-16 pb-12 px-4 sm:px-6 relative z-10 text-center max-w-5xl mx-auto">
        {/* Eyebrow Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/90 border border-slate-200 shadow-sm text-xs font-medium text-slate-700 mb-8 backdrop-blur-sm">
          <span className="h-2 w-2 rounded-full bg-sky-500 animate-pulse" />
          <span className="font-mono uppercase tracking-wider text-[11px] text-slate-800">Announcing Source 2.0</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500">Multi-modal AI research</span>
        </div>

        {/* Large Editorial Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-[4.3rem] font-display font-medium tracking-tight text-slate-900 leading-[1.08] text-balance mb-6">
          Turn any source into mastery, <br />
          <span className="italic font-normal text-slate-700">with AI intelligence</span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed mb-8">
          Drop in a PDF, recording, YouTube lecture, or notes. Source.io extracts and transforms it into structured study notes, flashcard decks, adaptive quizzes, audio podcasts, and grounded citations.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-14">
          <Link
            to={user ? "/app" : "/auth"}
            className="w-full sm:w-auto bg-slate-950 hover:bg-slate-800 text-white font-semibold text-sm px-7 py-3 rounded-full shadow-[0_4px_14px_0_rgba(15,23,42,0.25)] hover:shadow-lg transition-[background-color,box-shadow,transform] inline-flex items-center justify-center gap-2"
          >
            {user ? "Go to workspace" : "Start free trial"}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#simulator"
            className="w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-semibold text-sm px-6 py-3 rounded-full border border-slate-200/90 shadow-sm transition-[background-color,color,border-color,box-shadow] inline-flex items-center justify-center gap-2"
          >
            Explore live demo
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </a>
        </div>

        {/* Connector Tree Hierarchy down to Simulator Tabs */}
        <div className="relative pt-6 max-w-3xl mx-auto">
          {/* Vertical stem from CTAs */}
          <div className="w-px h-6 bg-slate-200 mx-auto" />
          {/* Horizontal branching rail */}
          <div className="h-px bg-slate-200 w-4/5 mx-auto" />
          {/* 5 vertical drop pins to the tabs */}
          <div className="grid grid-cols-5 w-4/5 mx-auto h-4">
            <div className="border-l border-slate-200 h-full mx-auto" />
            <div className="border-l border-slate-200 h-full mx-auto" />
            <div className="border-l border-slate-200 h-full mx-auto" />
            <div className="border-l border-slate-200 h-full mx-auto" />
            <div className="border-l border-slate-200 h-full mx-auto" />
          </div>

          {/* 5 Floating Feature Node Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 pb-6 px-2">
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
                  className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-[background-color,color,border-color,box-shadow] ${
                    active 
                      ? "bg-white text-slate-900 shadow-md border border-slate-200/90 ring-2 ring-sky-500/20" 
                      : "bg-white/60 hover:bg-white text-slate-600 hover:text-slate-900 border border-slate-200/60"
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${active ? "text-sky-600" : "text-slate-500"}`} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Workspace Mock Dashboard (Window Container) */}
        <div id="simulator" className="mt-2 text-left bg-white rounded-2xl border border-slate-200/90 shadow-[0_24px_68px_-12px_rgba(15,23,42,0.08)] overflow-hidden transition-[border-color,box-shadow] scroll-mt-28">
          {/* Window Chrome Header */}
          <div className="bg-slate-50/80 border-b border-slate-200/80 px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-slate-300" />
              <span className="h-3 w-3 rounded-full bg-slate-300" />
              <span className="h-3 w-3 rounded-full bg-slate-300" />
            </div>

            <div className="flex-1 max-w-md mx-auto hidden sm:flex items-center justify-center">
              <div className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1 text-xs text-slate-600 flex items-center justify-between shadow-2xs font-mono">
                <span className="truncate">source.io / quantum_computing_intro.pdf</span>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-medium border border-emerald-200/60">Grounded</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
              <span className="hidden md:inline">Whisper + Groq Llama 3</span>
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
            </div>
          </div>

          {/* 4 Feature Metric Cards with Pastel Headers (Matching Reference Mockup) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 sm:p-5 bg-slate-50/40 border-b border-slate-100">
            <div className="bg-white rounded-xl border border-slate-200/70 p-3.5 shadow-2xs hover:border-slate-300 transition-colors">
              <div className="h-1.5 w-8 rounded-full bg-violet-400 mb-2.5" />
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
                <span>Passages</span>
                <span className="text-violet-600 font-mono font-semibold">94% sim</span>
              </div>
              <div className="text-base font-bold text-slate-900">48 Citations</div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200/70 p-3.5 shadow-2xs hover:border-slate-300 transition-colors">
              <div className="h-1.5 w-8 rounded-full bg-rose-400 mb-2.5" />
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
                <span>Flashcards</span>
                <span className="text-rose-600 font-mono font-semibold">3 ready</span>
              </div>
              <div className="text-base font-bold text-slate-900">Spaced Deck</div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200/70 p-3.5 shadow-2xs hover:border-slate-300 transition-colors">
              <div className="h-1.5 w-8 rounded-full bg-sky-400 mb-2.5" />
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
                <span>Quiz Practice</span>
                <span className="text-sky-600 font-mono font-semibold">100% pass</span>
              </div>
              <div className="text-base font-bold text-slate-900">Adaptive Qs</div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200/70 p-3.5 shadow-2xs hover:border-slate-300 transition-colors">
              <div className="h-1.5 w-8 rounded-full bg-amber-400 mb-2.5" />
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
                <span>Podcast Recap</span>
                <span className="text-amber-600 font-mono font-semibold">2 Hosts</span>
              </div>
              <div className="text-base font-bold text-slate-900">4m 12s Audio</div>
            </div>
          </div>

          {/* Interactive Workspace Body Area */}
          <div className="p-5 sm:p-7 min-h-[360px] bg-white">
            {/* Notes Tab */}
            {activeSimTab === "notes" && (
              <div className="max-w-3xl mx-auto space-y-4 animate-fade-in">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-sky-600" /> Introduction to Quantum Computing
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Synthesized from Chapter 1: The Quantum State Representation</p>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-mono font-medium">3 min read</span>
                </div>
                
                <div className="text-sm text-slate-700 leading-relaxed space-y-3 prose-tight">
                  <p>
                    Quantum computation is fundamentally distinguished by its exploitation of <strong>superposition</strong> and <strong>quantum entanglement</strong>. Unlike classical binary systems where bits represent discrete states of either 0 or 1, quantum systems utilize the complex vector space of qubits.
                  </p>

                  <div className="grid sm:grid-cols-2 gap-3 my-4">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="text-xs font-semibold text-sky-700 block mb-1 uppercase tracking-wider font-mono">Principle 1 • Superposition</span>
                      <p className="text-xs text-slate-600 leading-normal">
                        A qubit exists in a normalized linear superposition |ψ⟩ = α|0⟩ + β|1⟩, evaluating multi-path algorithms simultaneously until measurement.
                      </p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="text-xs font-semibold text-sky-700 block mb-1 uppercase tracking-wider font-mono">Principle 2 • Entanglement</span>
                      <p className="text-xs text-slate-600 leading-normal">
                        Entangled Bell pairs establish instant state correlations across spatial separations, enabling dense coding and cryptographic key sharing.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-sky-50/70 border border-sky-100 text-xs text-sky-900 flex items-start gap-2">
                    <ShieldCheck className="h-4 w-4 text-sky-600 shrink-0 mt-0.5" />
                    <span>Every paragraph in this synthesis is indexed to source coordinates [p. 2-5] with 96% verification fidelity.</span>
                  </div>
                </div>
              </div>
            )}

            {/* Flashcards Tab */}
            {activeSimTab === "flashcards" && (
              <div className="max-w-md mx-auto space-y-5 animate-fade-in flex flex-col justify-between py-2 text-center">
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span className="font-mono">Card {cardIdx + 1} of {simFlashcards.length}</span>
                  <button 
                    onClick={() => { setCardIdx(0); setCardFlipped(false); }}
                    className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs transition-colors font-medium"
                  >
                    Reset deck
                  </button>
                </div>

                {/* Flip Card Design */}
                <div
                  className="relative w-full h-56 cursor-pointer select-none rounded-2xl"
                  style={{ perspective: "1000px" }}
                  onClick={() => setCardFlipped(!cardFlipped)}
                  role="button"
                  tabIndex={0}
                  aria-label={cardFlipped ? "Show question" : "Reveal answer"}
                >
                  <div
                    className="absolute inset-0 transition-transform duration-500"
                    style={{
                      transformStyle: "preserve-3d",
                      transform: cardFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                    }}
                  >
                    {/* Front */}
                    <div 
                      className="absolute inset-0 rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/50 p-6 flex flex-col items-center justify-center text-center shadow-md"
                      style={{ backfaceVisibility: "hidden" }}
                    >
                      <span className="px-3 py-1 rounded-full bg-sky-50 text-sky-700 text-[11px] font-mono uppercase font-semibold tracking-wider mb-3 border border-sky-100">
                        Question
                      </span>
                      <p className="text-base sm:text-lg font-semibold text-slate-900 leading-snug">
                        {simFlashcards[cardIdx].front}
                      </p>
                      <p className="absolute bottom-4 text-xs text-slate-400 font-medium">Click to flip & inspect answer</p>
                    </div>

                    {/* Back */}
                    <div 
                      className="absolute inset-0 rounded-2xl border border-sky-300 bg-gradient-to-b from-sky-50/40 to-white p-6 flex flex-col items-center justify-center text-center shadow-md"
                      style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                    >
                      <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-mono uppercase font-semibold tracking-wider mb-3 border border-emerald-200">
                        Explanation
                      </span>
                      <p className="text-sm sm:text-base text-slate-800 leading-relaxed">
                        {simFlashcards[cardIdx].back}
                      </p>
                      <p className="absolute bottom-4 text-xs text-slate-400 font-medium">Click to flip back</p>
                    </div>
                  </div>
                </div>

                {/* Leitner Spaced Repetition Buttons */}
                <div className="flex items-center justify-between gap-2 pt-2">
                  <button 
                    onClick={() => { setCardFlipped(false); setCardIdx(i => Math.max(0, i - 1)); }}
                    disabled={cardIdx === 0}
                    className="px-3.5 py-1.5 rounded-full border border-slate-200 text-xs text-slate-600 disabled:opacity-40 hover:bg-slate-50 font-medium"
                  >
                    Previous
                  </button>
                  <div className="flex gap-1.5">
                    {["Again", "Hard", "Good", "Easy"].map((label) => (
                      <span key={label} className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-medium">
                        {label}
                      </span>
                    ))}
                  </div>
                  <button 
                    onClick={() => { setCardFlipped(false); setCardIdx(i => Math.min(simFlashcards.length - 1, i + 1)); }}
                    disabled={cardIdx === simFlashcards.length - 1}
                    className="px-3.5 py-1.5 rounded-full border border-slate-200 text-xs text-slate-600 disabled:opacity-40 hover:bg-slate-50 font-medium"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* Quiz Tab */}
            {activeSimTab === "quiz" && (
              <div className="max-w-xl mx-auto space-y-4 animate-fade-in">
                <div className="border border-slate-200/90 bg-white rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
                  <div className="flex items-start gap-2.5">
                    <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white text-xs font-mono font-medium mt-0.5">Q1</span>
                    <div>
                      <h4 className="text-sm sm:text-base font-semibold text-slate-900">
                        Which physical decay mechanism transforms a qubit's quantum superposition into classical probability?
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">Difficulty: Intermediate • Single choice</p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    {[
                      { idx: 0, text: "Quantum Teleportation" },
                      { idx: 1, text: "Quantum Decoherence", correct: true },
                      { idx: 2, text: "Phase Gate Inversion" },
                      { idx: 3, text: "Qubit Entanglement Collapse" }
                    ].map((opt) => {
                      const isSelected = selectedChoice === opt.idx;
                      const isCorrect = opt.correct;
                      
                      let btnStyle = "border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/80";
                      if (isSelected) {
                        if (quizSubmitted) {
                          btnStyle = isCorrect ? "border-emerald-500 bg-emerald-50/70 text-emerald-900 ring-2 ring-emerald-500/20" : "border-rose-500 bg-rose-50/70 text-rose-900";
                        } else {
                          btnStyle = "border-sky-500 bg-sky-50/60 text-slate-900 ring-2 ring-sky-500/20";
                        }
                      } else if (quizSubmitted && isCorrect) {
                        btnStyle = "border-emerald-500 bg-emerald-50/70 text-emerald-900";
                      }

                      return (
                        <button
                          key={opt.idx}
                          disabled={quizSubmitted}
                          onClick={() => setSelectedChoice(opt.idx)}
                          className={`w-full text-left p-3 rounded-xl border transition-[background-color,border-color,color] text-xs sm:text-sm font-medium flex items-center justify-between ${btnStyle}`}
                        >
                          <span>{opt.text}</span>
                          {quizSubmitted && isCorrect && <Check className="h-4 w-4 text-emerald-600" />}
                          {quizSubmitted && isSelected && !isCorrect && <X className="h-4 w-4 text-rose-600" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <span className="text-xs text-slate-500">Pick one option to verify your answer</span>
                    {quizSubmitted ? (
                      <button 
                        onClick={() => { setSelectedChoice(null); setQuizSubmitted(false); }}
                        className="px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                      >
                        <RotateCcw className="h-3 w-3" /> Retry
                      </button>
                    ) : (
                      <button 
                        disabled={selectedChoice === null}
                        onClick={() => setQuizSubmitted(true)}
                        className="px-4 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold disabled:opacity-40 transition-colors shadow-sm"
                      >
                        Submit Answer
                      </button>
                    )}
                  </div>

                  {quizSubmitted && (
                    <div className="text-xs text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 leading-relaxed">
                      <strong className="text-slate-900 font-semibold block mb-0.5">Explanation:</strong> 
                      Decoherence occurs when environmental heat, electromagnetic waves, or physical vibrations interact with qubits, causing the loss of quantum state information.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Podcast Tab */}
            {activeSimTab === "podcast" && (
              <div className="max-w-md mx-auto space-y-6 animate-fade-in flex flex-col items-center justify-center py-2 text-center">
                <div className="w-full bg-slate-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
                  <div className="flex items-center justify-between mb-4 text-xs text-slate-400 font-mono">
                    <span>SYNTHESIZED EPISODE #01</span>
                    <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30">2 Hosts AI</span>
                  </div>

                  <h4 className="text-base font-semibold text-white mb-1">
                    Demystifying Superposition & Entanglement
                  </h4>
                  <p className="text-xs text-slate-400 mb-6">Generated dialogue recap from Chapter 1</p>

                  {/* Playback Controls */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setPodcastPlaying(!podcastPlaying)}
                        aria-label={podcastPlaying ? "Pause audio preview" : "Play audio preview"}
                        className="h-11 w-11 rounded-full bg-sky-600 hover:bg-sky-500 text-white flex items-center justify-center transition-[background-color,box-shadow,transform] shadow-lg shrink-0 font-bold"
                      >
                        {podcastPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                      </button>
                      <div className="flex-1 space-y-1">
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-sky-400 transition-[width] duration-300" style={{ width: `${audioProgress}%` }} />
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                          <span>0:48</span>
                          <span>4:12</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dialogue Transcript Snippet */}
                <div className="text-left w-full space-y-2 text-xs bg-slate-50 border border-slate-200/80 p-4 rounded-xl">
                  <div>
                    <span className="font-semibold text-slate-900 font-mono text-[11px]">Host A (Clara):</span>
                    <p className="text-slate-600 mt-0.5">"So when we say a qubit is in superposition, it is not simply alternating between 0 and 1, right?"</p>
                  </div>
                  <div>
                    <span className="font-semibold text-sky-700 font-mono text-[11px]">Host B (Julian):</span>
                    <p className="text-slate-600 mt-0.5">"Exactly. It exists as a linear combination of both until measured. Think of a spinning coin where heads and tails blend continuously."</p>
                  </div>
                </div>
              </div>
            )}

            {/* Grounded Chat Tab */}
            {activeSimTab === "chat" && (
              <div className="max-w-xl mx-auto flex flex-col h-[380px] justify-between text-left animate-fade-in">
                {/* Messages Box */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                  {chatMessages.map((m, idx) => {
                    const isAi = m.role === "assistant";
                    return (
                      <div key={idx} className={`flex ${isAi ? "justify-start" : "justify-end"}`}>
                        <div className={`max-w-[88%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-2xs ${
                          isAi 
                            ? "bg-slate-50 border border-slate-200/90 text-slate-800" 
                            : "bg-slate-900 text-white font-medium"
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
                                <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-mono text-slate-500">
                                  <span className="text-sky-700 font-medium flex items-center gap-1">
                                    <BookmarkCheck className="h-3 w-3" /> {m.citation}
                                  </span>
                                  <span className="bg-sky-50 text-sky-800 px-1.5 py-0.5 rounded border border-sky-200/60">
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

                {/* Suggestions and Input */}
                <div className="border-t border-slate-100 pt-3 mt-2 space-y-2">
                  <div className="flex gap-1.5 flex-wrap">
                    <button 
                      onClick={() => handleSendChat("What is quantum superposition?")}
                      disabled={chatTyping}
                      className="text-xs px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors font-medium"
                    >
                      What is superposition?
                    </button>
                    <button 
                      onClick={() => handleSendChat("Explain entanglement in simple terms.")}
                      disabled={chatTyping}
                      className="text-xs px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors font-medium"
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
                      placeholder="Ask any question about your document..."
                      disabled={chatTyping}
                      aria-label="Ask a question about the document"
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/20 focus-visible:border-sky-500 transition-[border-color,box-shadow]"
                    />
                    <button 
                      onClick={() => handleSendChat(chatInput)}
                      disabled={chatTyping || !chatInput.trim()}
                      className="h-9 w-9 rounded-full bg-slate-950 hover:bg-slate-800 text-white flex items-center justify-center disabled:opacity-40 transition-[background-color,opacity] shrink-0"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Supported Source Formats Pill Bar (Matching Reference Integration Row) */}
      <section className="py-12 px-4 sm:px-6 relative z-10 max-w-5xl mx-auto">
        <div className="text-center mb-6">
          <span className="text-xs font-mono uppercase tracking-widest text-slate-400 font-semibold">
            Universal Ingestion Engine
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
          {[
            { icon: FileText, label: "PDF Documents" },
            { icon: Mic, label: "Audio & Voice" },
            { icon: Video, label: "YouTube Video" },
            { icon: FileCode, label: "DOCX & Markdown" },
            { icon: Cpu, label: "Whisper AI" },
            { icon: Zap, label: "Groq Llama 3" },
            { icon: Globe, label: "Web Articles" },
            { icon: Database, label: "LaTeX & Equations" },
          ].map((item) => (
            <div
              key={item.label}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200/90 shadow-2xs text-xs font-medium text-slate-700 hover:text-slate-900 hover:border-slate-300 transition-[color,border-color,background-color]"
            >
              <item.icon className="h-3.5 w-3.5 text-slate-500" />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Philosophy / Editorial Statement Section (Matching Reference Quote Layout) */}
      <section id="philosophy" className="py-20 px-4 sm:px-6 relative z-10 max-w-4xl mx-auto text-center scroll-mt-24">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-mono uppercase tracking-wider mb-8">
          <Compass className="h-3.5 w-3.5 text-sky-600" />
          <span>Our Core Thesis</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-display font-medium text-slate-900 leading-[1.25] text-balance mb-8">
          We build platforms that help you think bigger, learn faster, and create without friction. We simply{" "}
          <span className="inline-block px-3 py-0.5 rounded-full bg-sky-100 text-sky-950 border border-sky-200/80 font-normal">
            transform complex knowledge into instant, interactive intelligence
          </span>{" "}
          you can actually trust.
        </h2>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <span className="text-xs px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600 font-mono font-medium shadow-2xs">
            100% HALLUCINATION FREE
          </span>
          <span className="text-xs px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600 font-mono font-medium shadow-2xs">
            PASSAGE-LEVEL CITATIONS
          </span>
        </div>
      </section>

      {/* Dual Dark Bento Cards Section (Matching Reference Sleek Hardware Viewports) */}
      <section className="py-16 px-4 sm:px-6 relative z-10 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl font-display font-semibold text-slate-900 tracking-tight mb-3">
            The smarter way to scale learning
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Architected for researchers, students, and engineers who demand mathematical citation accuracy.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Card 1: Multi-Format Synthesis Engine */}
          <div className="bg-[#0b0f19] text-white rounded-3xl p-8 border border-white/10 shadow-2xl relative overflow-hidden flex flex-col justify-between group">
            {/* Ambient inner glow */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <span className="text-xs font-mono uppercase tracking-widest text-sky-400 font-semibold mb-2 block">
                Multi-Modal Synthesis
              </span>
              <h3 className="text-2xl font-display font-medium text-white mb-2">
                One upload. Five distinct cognitive modalities.
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-8 max-w-md">
                Never read in isolation. Seamlessly transition between structured outlines, active-recall flashcards, and conversational audio dialogues.
              </p>
            </div>

            {/* Visual Hardware/App Interface Graphic */}
            <div className="relative z-10 bg-slate-950/80 rounded-2xl border border-white/10 p-5 shadow-inner">
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-mono text-slate-300">Live Synthesis Engine</span>
                </div>
                <span className="text-[11px] font-mono text-sky-400">Groq • 350 tok/s</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
                  <span className="text-slate-400 block text-[10px] font-mono mb-1">NOTES</span>
                  <span className="font-semibold text-white">4,200 Words</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
                  <span className="text-slate-400 block text-[10px] font-mono mb-1">DECKS</span>
                  <span className="font-semibold text-white">28 Cards</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
                  <span className="text-slate-400 block text-[10px] font-mono mb-1">AUDIO</span>
                  <span className="font-semibold text-white">6m 40s</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Grounded Passage Coordinates */}
          <div className="bg-[#0b0f19] text-white rounded-3xl p-8 border border-white/10 shadow-2xl relative overflow-hidden flex flex-col justify-between group">
            {/* Ambient inner glow */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <span className="text-xs font-mono uppercase tracking-widest text-indigo-400 font-semibold mb-2 block">
                Mathematical Grounding
              </span>
              <h3 className="text-2xl font-display font-medium text-white mb-2">
                Every claim anchors to an exact passage.
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-8 max-w-md">
                Vector similarity embeddings rank and score source fragments. Inspect the precise coordinate, page, and timestamp for every single answer.
              </p>
            </div>

            {/* Visual Coordinate Interface Graphic */}
            <div className="relative z-10 bg-slate-950/80 rounded-2xl border border-white/10 p-5 shadow-inner space-y-2.5">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-b border-white/10 pb-2">
                <span>PASSAGE INDEX</span>
                <span>SIMILARITY METRIC</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/5 text-xs">
                <span className="font-mono text-slate-300">§ 1.2 "Superposition state collapse..."</span>
                <span className="font-mono font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">0.96</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/5 text-xs">
                <span className="font-mono text-slate-300">§ 2.4 "Thermal decoherence in qubits..."</span>
                <span className="font-mono font-semibold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">0.91</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Pillar Capability Grid (Matching Reference Soft-Blue Section) */}
      <section id="features" className="py-20 px-4 sm:px-6 relative z-10 max-w-6xl mx-auto scroll-mt-24">
        {/* Soft Ambient Center Glow */}
        <div className="absolute inset-0 ambient-mid-aura pointer-events-none -z-10" />

        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl sm:text-4xl font-display font-semibold text-slate-900 tracking-tight mb-3">
            Turn passive reading into active mastery
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Cognitive science principles codified into intuitive study workflows.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-7 border border-slate-200/90 shadow-sm hover:shadow-md transition-[border-color,box-shadow] flex flex-col justify-between">
            <div>
              <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center mb-5 shadow-sm">
                <Layers className="h-5 w-5 text-sky-300" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Spaced Repetition Decks</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Automated Leitner scheduling calculates optimal review intervals, surfacing tough concepts right before you forget them.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-slate-100 flex items-center text-xs font-semibold text-slate-900">
              <span>Leitner Algorithm</span>
              <ArrowRight className="h-3.5 w-3.5 ml-1 text-slate-400" />
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-7 border border-slate-200/90 shadow-sm hover:shadow-md transition-[border-color,box-shadow] flex flex-col justify-between">
            <div>
              <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center mb-5 shadow-sm">
                <Headphones className="h-5 w-5 text-sky-300" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Conversational Podcasts</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Two simulated AI hosts banter and dissect dense material into accessible dialogue for hands-free listening while walking or commuting.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-slate-100 flex items-center text-xs font-semibold text-slate-900">
              <span>Whisper Audio Engine</span>
              <ArrowRight className="h-3.5 w-3.5 ml-1 text-slate-400" />
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-7 border border-slate-200/90 shadow-sm hover:shadow-md transition-[border-color,box-shadow] flex flex-col justify-between">
            <div>
              <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center mb-5 shadow-sm">
                <ListChecks className="h-5 w-5 text-sky-300" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Diagnostic Testing</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Adaptive multi-choice and short-answer quizzes with context-aware rationales for both correct and distractor choices.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-slate-100 flex items-center text-xs font-semibold text-slate-900">
              <span>Contextual Rationales</span>
              <ArrowRight className="h-3.5 w-3.5 ml-1 text-slate-400" />
            </div>
          </div>
        </div>
      </section>

      {/* 4-Step Visual Workflow Grid (Matching Reference 2x2 Step Diagrams) */}
      <section id="workflow" className="py-20 px-4 sm:px-6 relative z-10 max-w-6xl mx-auto scroll-mt-24">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl sm:text-4xl font-display font-semibold text-slate-900 tracking-tight mb-3">
            Your study flow in four simple steps
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            From raw input to complete subject comprehension in less than 60 seconds.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Step 1 */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-sm">
            <div className="h-44 rounded-xl bg-slate-50 border border-slate-200/60 p-4 mb-6 flex items-center justify-center relative overflow-hidden">
              {/* Diagram: Central Ingestion Hub */}
              <div className="flex items-center justify-center gap-4">
                <div className="flex flex-col gap-2">
                  <span className="px-2.5 py-1 rounded bg-white border border-slate-200 text-[11px] font-mono text-slate-600">PDF</span>
                  <span className="px-2.5 py-1 rounded bg-white border border-slate-200 text-[11px] font-mono text-slate-600">Audio</span>
                </div>
                <div className="h-12 w-12 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-md">
                  <Database className="h-5 w-5 text-sky-300" />
                </div>
                <div className="flex flex-col gap-2">
                  <span className="px-2.5 py-1 rounded bg-white border border-slate-200 text-[11px] font-mono text-slate-600">YouTube</span>
                  <span className="px-2.5 py-1 rounded bg-white border border-slate-200 text-[11px] font-mono text-slate-600">DOCX</span>
                </div>
              </div>
            </div>
            <span className="text-xs font-mono uppercase text-sky-600 font-semibold tracking-wider block mb-1">01. Ingestion</span>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Survey & Parse Any Source</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Upload documents, voice recordings, or YouTube URLs. Whisper AI and OCR parse files locally with layout and timestamp fidelity.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-sm">
            <div className="h-44 rounded-xl bg-slate-50 border border-slate-200/60 p-4 mb-6 flex flex-col justify-center gap-2 relative overflow-hidden">
              {/* Diagram: Document Synthesis Outline */}
              <div className="w-4/5 mx-auto bg-white p-2.5 rounded border border-slate-200/80 shadow-2xs space-y-1.5">
                <div className="h-2 w-1/3 bg-slate-800 rounded" />
                <div className="h-1.5 w-4/5 bg-slate-200 rounded" />
                <div className="h-1.5 w-2/3 bg-slate-200 rounded" />
              </div>
              <div className="w-4/5 mx-auto bg-white p-2.5 rounded border border-slate-200/80 shadow-2xs space-y-1.5">
                <div className="h-2 w-1/4 bg-sky-600 rounded" />
                <div className="h-1.5 w-3/4 bg-slate-200 rounded" />
              </div>
            </div>
            <span className="text-xs font-mono uppercase text-sky-600 font-semibold tracking-wider block mb-1">02. Synthesis</span>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Plot Structured Markdown Notes</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Real-time markdown generation extracts core principles, equations, comparison tables, and definitions without manual prompt engineering.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-sm">
            <div className="h-44 rounded-xl bg-slate-50 border border-slate-200/60 p-4 mb-6 flex items-center justify-center relative overflow-hidden">
              {/* Diagram: Multi-Channel Derivation Tree */}
              <div className="flex items-center gap-3">
                <div className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-mono font-medium">Notes</div>
                <ArrowRight className="h-4 w-4 text-slate-400" />
                <div className="flex flex-col gap-1.5">
                  <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-[11px] text-slate-700">Decks</span>
                  <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-[11px] text-slate-700">Quiz</span>
                  <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-[11px] text-slate-700">Audio</span>
                </div>
              </div>
            </div>
            <span className="text-xs font-mono uppercase text-sky-600 font-semibold tracking-wider block mb-1">03. Derivation</span>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Derive Active Practice Sets</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Automatically generate spaced flashcards, diagnostic quizzes, and two-host podcast audio directly from the synthesized knowledge base.
            </p>
          </div>

          {/* Step 4 */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-sm">
            <div className="h-44 rounded-xl bg-slate-50 border border-slate-200/60 p-4 mb-6 flex items-center justify-center relative overflow-hidden">
              {/* Diagram: Grounded Citation Inspector */}
              <div className="w-4/5 mx-auto bg-white p-3 rounded-lg border border-slate-200 shadow-2xs space-y-2">
                <div className="text-[11px] text-slate-700 font-medium">"Superposition collapses under measurement..."</div>
                <div className="flex items-center justify-between text-[10px] font-mono text-sky-700 bg-sky-50 px-2 py-1 rounded">
                  <span>Passage §1.2 (p. 4)</span>
                  <span>96% match</span>
                </div>
              </div>
            </div>
            <span className="text-xs font-mono uppercase text-sky-600 font-semibold tracking-wider block mb-1">04. Verification</span>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Grounded Citation Inquiries</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Query your documents in conversational natural language. Every answer pinpoints the source excerpt with mathematical similarity scores.
            </p>
          </div>
        </div>
      </section>

      {/* Two-Tier Pricing Comparison (Matching Reference Split Pricing) */}
      <section id="pricing" className="py-20 px-4 sm:px-6 relative z-10 max-w-5xl mx-auto scroll-mt-24">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl sm:text-4xl font-display font-semibold text-slate-900 tracking-tight mb-3">
            Built to fit all researchers and teams
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Start completely free and upgrade whenever you require unlimited source processing.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-stretch">
          {/* Card 1: Starter (Clean White Card) */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-mono uppercase tracking-widest text-slate-500 font-semibold">Starter Tier</span>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl sm:text-5xl font-bold font-display text-slate-900">$0</span>
                <span className="text-xs text-slate-500 font-mono">/ forever free</span>
              </div>
              <p className="text-xs text-slate-500 mb-8">Essential tools for students and casual reading sessions.</p>

              <div className="space-y-3 mb-8">
                {[
                  "Up to 10 document uploads per month",
                  "Automated study notes generation",
                  "20 flashcards per source file",
                  "Interactive quizzes with explanations",
                  "2 audio podcast recaps",
                  "Grounded chat with passage citations",
                ].map((feat) => (
                  <div key={feat} className="flex items-center gap-2.5 text-xs text-slate-700">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <Link
              to="/auth"
              className="w-full text-center py-3 rounded-full border border-slate-200/90 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-900 font-semibold text-xs transition-[color,background-color,border-color,box-shadow] shadow-2xs"
            >
              Get started free
            </Link>
          </div>

          {/* Card 2: Pro Scholar (Deep Obsidian Dark Card) */}
          <div className="bg-[#0b0f19] text-white rounded-3xl p-8 border border-white/10 shadow-2xl flex flex-col justify-between relative overflow-hidden">
            {/* Top ambient highlight */}
            <div className="absolute top-0 right-0 w-60 h-60 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-mono uppercase tracking-widest text-sky-400 font-semibold">Scholar Pro</span>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30 font-semibold">
                  RECOMMENDED
                </span>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl sm:text-5xl font-bold font-display text-white">$19</span>
                <span className="text-xs text-slate-400 font-mono">/ per month</span>
              </div>
              <p className="text-xs text-slate-400 mb-8">Maximum power for graduate researchers, analysts, and engineers.</p>

              <div className="space-y-3 mb-8">
                {[
                  "Unlimited document, video, and audio uploads",
                  "Large files up to 250MB & full books",
                  "Unlimited flashcard decks & quiz exports",
                  "Full-length high-fidelity podcast dialogues",
                  "Groq Llama 3 ultra-fast inference",
                  "Mathematical LaTeX formatting & code blocks",
                  "Priority support & cloud sync",
                ].map((feat) => (
                  <div key={feat} className="flex items-center gap-2.5 text-xs text-slate-200">
                    <Check className="h-4 w-4 text-sky-400 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <Link
              to="/auth"
              className="relative z-10 w-full text-center py-3 rounded-full bg-white hover:bg-slate-100 text-slate-950 font-semibold text-xs transition-[background-color,box-shadow] shadow-md"
            >
              Start 14-day free trial
            </Link>
          </div>
        </div>
      </section>

      {/* Atmospheric Pre-Footer Call to Action Banner */}
      <section className="pt-20 pb-28 px-4 sm:px-6 relative z-10 text-center max-w-4xl mx-auto">
        <div className="absolute inset-0 ambient-bottom-aura pointer-events-none -z-10" />

        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-display font-medium text-slate-900 tracking-tight leading-tight text-balance mb-6">
          Knowledge that works harder <br />
          <span className="italic font-normal text-slate-700">for your mind</span>
        </h2>
        <p className="text-sm sm:text-base text-slate-600 max-w-lg mx-auto mb-8 leading-relaxed">
          Join researchers, engineers, and curious learners mastering complex materials without hallucination anxiety.
        </p>

        <div className="flex items-center justify-center">
          <Link
            to={user ? "/app" : "/auth"}
            className="bg-slate-950 hover:bg-slate-800 text-white font-semibold text-sm px-8 py-3.5 rounded-full shadow-lg transition-[background-color,box-shadow,transform] inline-flex items-center gap-2"
          >
            {user ? "Go to workspace" : "Get started free"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Modern Rounded Footer (Matching Reference Footer Container) */}
      <footer className="px-4 sm:px-6 pb-8 max-w-6xl mx-auto relative z-10">
        <div className="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-10 shadow-sm space-y-10">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8">
            <div className="space-y-3 max-w-sm">
              <Link to="/" className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-slate-900 flex items-center justify-center text-white">
                  <Sparkles className="h-3.5 w-3.5 text-sky-300" />
                </div>
                <span className="font-semibold text-base font-display text-slate-900">
                  Source<span className="text-sky-600">.io</span>
                </span>
              </Link>
              <p className="text-xs text-slate-500 leading-relaxed">
                The multi-modal intelligence workspace that synthesizes complex documents into verified study assets and interactive recall systems.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-xs">
              <div>
                <span className="font-mono uppercase text-slate-400 font-semibold block mb-3">Product</span>
                <ul className="space-y-2 text-slate-600">
                  <li><a href="#simulator" className="hover:text-slate-900 transition-colors">Workspace Demo</a></li>
                  <li><a href="#features" className="hover:text-slate-900 transition-colors">Study Modalities</a></li>
                  <li><a href="#workflow" className="hover:text-slate-900 transition-colors">Ingestion Pipeline</a></li>
                  <li><a href="#pricing" className="hover:text-slate-900 transition-colors">Pricing Plans</a></li>
                </ul>
              </div>

              <div>
                <span className="font-mono uppercase text-slate-400 font-semibold block mb-3">Grounding</span>
                <ul className="space-y-2 text-slate-600">
                  <li><span className="text-slate-500">Whisper ASR</span></li>
                  <li><span className="text-slate-500">Groq Llama 3</span></li>
                  <li><span className="text-slate-500">Vector Embeddings</span></li>
                  <li><span className="text-slate-500">Citation Engine</span></li>
                </ul>
              </div>

              <div>
                <span className="font-mono uppercase text-slate-400 font-semibold block mb-3">Platform</span>
                <ul className="space-y-2 text-slate-600">
                  <li><Link to="/auth" className="hover:text-slate-900 transition-colors">Sign in</Link></li>
                  <li><Link to="/auth" className="hover:text-slate-900 transition-colors">Create account</Link></li>
                  <li><span className="text-slate-500">Privacy Policy</span></li>
                  <li><span className="text-slate-500">Terms of Service</span></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>All systems fully operational</span>
            </div>

            <div>
              © {new Date().getFullYear()} Source.io Inc. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
