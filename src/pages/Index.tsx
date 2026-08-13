import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/context/AuthContext";
import { 
  FileText, Headphones, MessagesSquare, ListChecks, Layers,
  ArrowRight, Play, Pause, Check, X, RotateCcw, Send,
} from "lucide-react";
import MarkdownView from "@/components/common/MarkdownView";
import Magnitude from "@/components/common/Magnitude";

export default function Index() {
  const { user } = useAuth();
  const [activeSimTab, setActiveSimTab] = useState<"notes" | "flashcards" | "quiz" | "podcast" | "chat">("notes");

  // Simulated Flashcards State
  const simFlashcards = [
    { front: "What is Superposition in Quantum Computing?", back: "The ability of a quantum system (qubit) to exist in multiple states (0 and 1) simultaneously until it is measured." },
    { front: "Explain Quantum Entanglement.", back: "A phenomenon where two or more particles become interconnected such that the state of one instantly influences the state of the other, regardless of distance." },
    { front: "What is a Qubit?", back: "The basic unit of quantum information, analogous to the classical bit, but capable of superposition and entanglement." }
  ];
  const [cardIdx, setCardIdx] = useState(0);
  const [cardFlipped, setCardFlipped] = useState(false);

  // Simulated Quiz State
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Simulated Podcast State
  const [podcastPlaying, setPodcastPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(35);
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
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    { role: "assistant", content: "Hi! I am your AI Study Buddy. Ask me anything about the Quantum Computing material." }
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
      if (text.toLowerCase().includes("superposition")) {
        fullResponse = "Superposition allows a qubit to hold both 0 and 1 states at once. Think of a spinning coin: while spinning, it is a mixture of heads and tails, only collapsing into one when stopped (measured).";
      } else if (text.toLowerCase().includes("entanglement")) {
        fullResponse = "Einstein called Quantum Entanglement 'spooky action at a distance'. Changing the state of one entangled qubit instantaneously updates its partner, enabling ultra-fast quantum coordination.";
      } else {
        fullResponse = "That is an excellent question! In quantum systems, that concept is crucial for building quantum gates and executing algorithms like Shor's or Grover's.";
      }

      setChatMessages(prev => [...prev, { role: "assistant", content: "" }]);
      
      // Reveal a few characters per tick and replace the message object rather
      // than mutating it in place — mutation defeated referential equality and
      // re-rendered the list ~66x/sec.
      let charIdx = 0;
      const STEP = 3;
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
      }, 30);
    }, 800);
  };

  return (
    <main className="min-h-screen bg-background relative overflow-hidden text-foreground selection:bg-primary/20 selection:text-primary">
      {/* The chart is fielded by coordinate rules, not lit by orbs. */}
      <div className="absolute inset-0 plate-field opacity-60 pointer-events-none" />

      {/* Header */}
      <header className="border-b border-border/60 sticky top-0 bg-background/80 backdrop-blur-md z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="h-8 w-8 rounded-sm flex items-center justify-center overflow-hidden border border-border group-hover:border-primary/50 transition-colors bg-card">
              <img src="/favicon.png" className="h-full w-full object-contain" alt="Logo" />
            </div>
            <span className="font-semibold tracking-tight text-lg font-display text-foreground">Source.io</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">How it works</a>
            <a href="#simulator" className="hover:text-foreground transition-colors">Preview</a>
            <a href="#why-us" className="hover:text-foreground transition-colors">Grounding</a>
          </nav>
          <div className="flex items-center gap-3">
            {user ? (
              <Button asChild size="sm" className="bg-primary hover:bg-primary-glow text-primary-foreground font-medium shadow-glow">
                <Link to="/app" className="flex items-center gap-1">Open app <ArrowRight className="h-3.5 w-3.5" /></Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className="text-foreground/90 hover:text-foreground hover:bg-surface-raised">
                  <Link to="/auth">Sign in</Link>
                </Button>
                <Button asChild size="sm" className="bg-primary hover:bg-primary-glow text-primary-foreground font-medium">
                  <Link to="/auth">Get started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero. The thesis is "one source, five renderings", so the plate itself
          shares the first viewport with the claim instead of sitting below it. */}
      <section id="simulator" className="max-w-7xl mx-auto px-6 pt-16 pb-10 relative z-10 scroll-mt-20">
        <div className="grid lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] gap-10 lg:gap-14 items-center">
          <div className="lg:pb-8">
            <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-display font-bold tracking-tight leading-[1.05] text-balance">
              One source.
              <br />
              <span className="text-primary">Five ways</span> to know it.
            </h1>
            <p className="text-base text-muted-foreground mt-6 leading-relaxed max-w-md">
              Drop in a PDF, a recording, a YouTube link, or raw text. Source.io
              charts it into notes, flashcards, a quiz, an audio recap, and a chat
              that cites the passage every answer came from.
            </p>

            {/* The five renderings, stated as a legend rather than a feature grid. */}
            <ul className="mt-8 grid grid-cols-2 gap-x-6 gap-y-2.5 max-w-sm">
              {[
                { icon: FileText, label: "Study notes" },
                { icon: Layers, label: "Flashcards" },
                { icon: ListChecks, label: "Quiz" },
                { icon: Headphones, label: "Audio recap" },
                { icon: MessagesSquare, label: "Grounded chat" },
              ].map((r) => (
                <li key={r.label} className="flex items-center gap-2 text-sm text-foreground/85">
                  <r.icon className="h-3.5 w-3.5 text-primary shrink-0" />
                  {r.label}
                </li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row gap-3 mt-9">
              <Button asChild size="lg" className="font-semibold px-7">
                <Link to={user ? "/app" : "/auth"}>{user ? "Go to workspace" : "Create free account"}</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="px-7">
                <a href="#features">See how it works</a>
              </Button>
            </div>
          </div>

          {/* Live Workspace Mock Dashboard */}
          <div className="plate plate-registered rounded-sm overflow-hidden flex flex-col h-[26rem] sm:h-[30rem] lg:h-[34rem]">
          {/* Mock Tab Header */}
          <div className="border-b border-border/60 bg-card px-4 py-3 flex items-center justify-between flex-wrap gap-2">
            {/* Plate identification, the way a chart names its sheet. */}
            <div className="flex items-baseline gap-2.5 min-w-0">
              <span className="text-xs font-mono uppercase tracking-widest text-primary">Plate 01</span>
              <span className="text-xs text-muted-foreground truncate font-mono">Introduction to Quantum Computing</span>
            </div>
            
            {/* Horizontal simulated tabs bar — ruled baseline plate index */}
            <div className="flex items-center gap-1 border-b border-border/40 overflow-x-auto">
              {([
                { id: "notes", label: "Study Notes", icon: FileText },
                { id: "flashcards", label: "Flashcards", icon: Layers },
                { id: "quiz", label: "Quiz Practice", icon: ListChecks },
                { id: "podcast", label: "Podcast recap", icon: Headphones },
                { id: "chat", label: "AI Grounded Chat", icon: MessagesSquare }
              ] as const).map((t) => {
                const Icon = t.icon;
                const active = activeSimTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveSimTab(t.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 border-b-2 text-xs font-medium transition-all focus-ring ${
                      active 
                        ? "border-primary text-primary font-semibold bg-primary/5" 
                        : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Content Area */}
          <div className="flex-1 overflow-y-auto p-6 bg-background/40">
            {/* Notes Tab Content */}
            {activeSimTab === "notes" && (
              <div className="max-w-3xl mx-auto space-y-4 animate-fade-in text-left">
                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" /> Introduction to Quantum Computing
                  </h3>
                  <span className="text-xs text-muted-foreground uppercase tracking-widest">Source material notes</span>
                </div>
                <div className="prose-invert-tight">
                  <MarkdownView>
                    {`Here are the core concepts distilled from your reading:

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

> Quantum algorithms (like Shor's algorithm for prime factorization) exploit superposition states to test billions of outcomes in parallel.`}
                  </MarkdownView>
                </div>
              </div>
            )}

            {/* Flashcards Tab Content */}
            {activeSimTab === "flashcards" && (
              <div className="max-w-md mx-auto space-y-6 animate-fade-in flex flex-col justify-between h-full py-4 text-center">
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>Card {cardIdx + 1} of {simFlashcards.length}</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => { setCardIdx(0); setCardFlipped(false); }}
                      className="px-2 py-1 rounded bg-surface-raised border border-border/60 text-foreground/90 hover:text-foreground text-xs focus-ring"
                    >
                      Reset deck
                    </button>
                  </div>
                </div>

                {/* Flip Card Design */}
                <div
                  className="relative w-full h-56 cursor-pointer select-none rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  style={{ perspective: "1000px" }}
                  onClick={() => setCardFlipped(!cardFlipped)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setCardFlipped((f) => !f);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-pressed={cardFlipped}
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
                      className="absolute inset-0 rounded-sm border border-border bg-card p-6 flex flex-col items-center justify-center text-center shadow-md"
                      style={{ backfaceVisibility: "hidden" }}
                    >
                      <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs uppercase font-bold tracking-widest mb-4">Question</span>
                      <p className="text-base sm:text-lg font-semibold text-foreground leading-relaxed">{simFlashcards[cardIdx].front}</p>
                      <p className="absolute bottom-4 text-xs text-muted-foreground">Tap to flip & reveal answer</p>
                    </div>

                    {/* Back */}
                    <div 
                      className="absolute inset-0 rounded-sm border border-primary/20 bg-card p-6 flex flex-col items-center justify-center text-center shadow-md"
                      style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                    >
                      <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 text-xs uppercase font-bold tracking-widest mb-4">Answer explanation</span>
                      <p className="text-sm sm:text-base text-foreground leading-relaxed">{simFlashcards[cardIdx].back}</p>
                      <p className="absolute bottom-4 text-xs text-muted-foreground">Tap to flip back</p>
                    </div>
                  </div>
                </div>

                {/* Spaced repetition deck score buttons preview */}
                <div className="flex items-center justify-between gap-3">
                  <Button 
                    variant="outline" 
                    onClick={(e) => { e.stopPropagation(); setCardFlipped(false); setCardIdx(i => Math.max(0, i - 1)); }}
                    disabled={cardIdx === 0}
                    className="border-border/60 bg-surface-raised text-muted-foreground hover:text-foreground"
                  >
                    Previous
                  </Button>
                  <div className="flex gap-1.5">
                    {["Again", "Hard", "Good", "Easy"].map((label) => (
                      <span key={label} className="text-xs px-2 py-1 rounded bg-surface-elevated border border-border/60 text-muted-foreground font-mono">
                        {label}
                      </span>
                    ))}
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={(e) => { e.stopPropagation(); setCardFlipped(false); setCardIdx(i => Math.min(simFlashcards.length - 1, i + 1)); }}
                    disabled={cardIdx === simFlashcards.length - 1}
                    className="border-border/60 bg-surface-raised text-muted-foreground hover:text-foreground"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}

            {/* Quiz Tab Content */}
            {activeSimTab === "quiz" && (
              <div className="max-w-xl mx-auto space-y-6 animate-fade-in text-left">
                <div className="border border-border/60 bg-card/40 rounded-sm p-5 space-y-4">
                  <div className="flex items-start gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-primary/20 text-primary text-xs font-mono mt-0.5">Q1</span>
                    <h4 className="text-sm font-semibold text-foreground">Which quantum state decay process is caused by interaction with environmental noise?</h4>
                  </div>

                  <div className="space-y-2">
                    {[
                      { idx: 0, text: "Quantum Entanglement" },
                      { idx: 1, text: "Quantum Decoherence" },
                      { idx: 2, text: "Qubit Phase Transformation" },
                      { idx: 3, text: "Superposition Inversion" }
                    ].map((opt) => {
                      const isCorrectOpt = opt.idx === 1;
                      const isSelected = selectedChoice === opt.idx;
                      
                      let btnStyle = "border-border/60 hover:bg-surface-raised hover:border-border";
                      if (isSelected) {
                        if (quizSubmitted) {
                          btnStyle = isCorrectOpt ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300" : "border-red-500/50 bg-red-500/10 text-red-300";
                        } else {
                          btnStyle = "border-primary bg-primary/10 text-foreground";
                        }
                      } else if (quizSubmitted && isCorrectOpt) {
                        btnStyle = "border-emerald-500/40 bg-emerald-500/5 text-emerald-400";
                      }

                      return (
                        <button
                          key={opt.idx}
                          disabled={quizSubmitted}
                          onClick={() => setSelectedChoice(opt.idx)}
                          className={`w-full text-left p-3 rounded-sm border transition-all text-xs flex items-center justify-between ${btnStyle}`}
                        >
                          <span>{opt.text}</span>
                          {quizSubmitted && isCorrectOpt && <Check className="h-4 w-4 text-emerald-400" />}
                          {quizSubmitted && isSelected && !isCorrectOpt && <X className="h-4 w-4 text-red-400" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/60">
                    <span className="text-xs text-muted-foreground">Select one option to submit</span>
                    {quizSubmitted ? (
                      <Button 
                        onClick={() => { setSelectedChoice(null); setQuizSubmitted(false); }}
                        size="sm"
                        className="bg-surface-raised text-foreground hover:bg-surface-elevated border border-border"
                      >
                        <RotateCcw className="h-3 w-3 mr-1" /> Retry
                      </Button>
                    ) : (
                      <Button 
                        disabled={selectedChoice === null}
                        onClick={() => setQuizSubmitted(true)}
                        size="sm"
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        Submit Answer
                      </Button>
                    )}
                  </div>

                  {quizSubmitted && (
                    <div className="text-xs text-muted-foreground leading-relaxed bg-card p-3 rounded border border-border/60">
                      <strong className="text-foreground font-medium">Explanation:</strong> Decoherence represents the loss of quantum state in a qubit due to interaction with external interference like heat or electromagnetic waves.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Podcast Tab Content */}
            {activeSimTab === "podcast" && (
              <div className="max-w-md mx-auto space-y-8 animate-fade-in flex flex-col items-center justify-center py-6 text-center">
                {/* Cassette Animation */}
                <div className="cassette-shell">
                  <div className="cassette-label">
                    <div className="cassette-window">
                      <div className={`cassette-spindle ${podcastPlaying ? "spindle-spinning" : ""}`} />
                      <div className={`cassette-spindle ${podcastPlaying ? "spindle-spinning-reverse" : ""}`} />
                    </div>
                  </div>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs font-mono text-muted-foreground uppercase tracking-widest">
                    Quantum recap
                  </div>
                </div>

                <div className="space-y-2 w-full">
                  <h4 className="text-sm font-semibold text-foreground">Quantum Computing Audio Summary</h4>
                  <p className="text-xs text-muted-foreground">2-host conversational dialogue script generated from notes</p>
                </div>

                {/* Podcast Progress controls */}
                <div className="w-full space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <button
                      onClick={() => setPodcastPlaying(!podcastPlaying)}
                      aria-label={podcastPlaying ? "Pause preview" : "Play preview"}
                      aria-pressed={podcastPlaying}
                      className="h-10 w-10 rounded-full bg-primary hover:bg-primary-glow text-primary-foreground flex items-center justify-center transition-all shadow-glow shrink-0 focus-ring"
                    >
                      {podcastPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                    </button>
                    <div className="flex-1 space-y-1">
                      <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                        <div className="h-full bg-primary transition-all duration-300" style={{ width: `${audioProgress}%` }} />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground font-mono">
                        <span>0:42</span>
                        <span>2:15</span>
                      </div>
                    </div>
                  </div>

                  {/* Simulated Script extract */}
                  <div className="text-xs text-muted-foreground bg-card border border-border/60 p-3 rounded text-left space-y-1 max-h-24 overflow-y-auto font-mono">
                    <div className="text-foreground font-semibold">Host A (AI):</div>
                    <div className="mb-2">So, superposition is basically a qubit spinning in place, representing multiple states at once?</div>
                    <div className="text-foreground font-semibold">Host B (AI):</div>
                    <div>Exactly. It is like a coin spinning on a table. Before it lands, it is a blur of both heads and tails...</div>
                  </div>
                </div>
              </div>
            )}

            {/* Chat Tab Content */}
            {activeSimTab === "chat" && (
              <div className="max-w-xl mx-auto flex flex-col h-[400px] justify-between py-2 text-left">
                {/* Messages Box */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                  {chatMessages.map((m, idx) => {
                    const isAi = m.role === "assistant";
                    return (
                      <div key={idx} className={`flex ${isAi ? "justify-start" : "justify-end"}`}>
                        <div className={`max-w-[85%] rounded-sm px-3.5 py-2 text-xs leading-relaxed ${
                          isAi 
                            ? "bg-surface-raised border border-border/60 text-foreground" 
                            : "bg-primary text-primary-foreground font-medium"
                        }`}>
                          {m.content === "" ? (
                            <div className="flex items-center gap-1.5 text-muted-foreground font-mono text-xs">
                              <span className="h-1.5 w-1.5 rounded-full bg-neutral-500 animate-pulse-slow" style={{ animationDelay: "0ms" }} />
                              <span className="h-1.5 w-1.5 rounded-full bg-neutral-500 animate-pulse-slow" style={{ animationDelay: "200ms" }} />
                              <span className="h-1.5 w-1.5 rounded-full bg-neutral-500 animate-pulse-slow" style={{ animationDelay: "400ms" }} />
                            </div>
                          ) : m.content}
                        </div>
                      </div>
                    );
                  })}
                  {chatTyping && chatMessages[chatMessages.length - 1]?.content === "" && (
                    <div className="flex justify-start">
                      <div className="bg-surface-raised border border-border/60 rounded-sm px-3 py-2 text-muted-foreground text-xs">
                        Assistant is typing…
                      </div>
                    </div>
                  )}
                </div>

                {/* Suggestions and Input */}
                <div className="border-t border-border/60 pt-3 mt-3 space-y-2">
                  <div className="flex gap-1.5 flex-wrap">
                    <button 
                      onClick={() => handleSendChat("What is quantum superposition?")}
                      disabled={chatTyping}
                      className="text-xs px-2 py-1 rounded bg-surface-raised border border-border/60 text-muted-foreground hover:text-foreground hover:border-border transition-all font-mono focus-ring"
                    >
                      What is superposition?
                    </button>
                    <button 
                      onClick={() => handleSendChat("Explain quantum entanglement in simple terms.")}
                      disabled={chatTyping}
                      className="text-xs px-2 py-1 rounded bg-surface-raised border border-border/60 text-muted-foreground hover:text-foreground hover:border-border transition-all font-mono focus-ring"
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
                      placeholder="Ask anything about the material..."
                      disabled={chatTyping}
                      aria-label="Ask a question about the material"
                      className="flex-1 bg-surface-raised border border-border/60 rounded-sm px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/70 focus:border-primary/50 transition-colors focus-ring"
                    />
                    <Button 
                      onClick={() => handleSendChat(chatInput)}
                      disabled={chatTyping || !chatInput.trim()}
                      size="sm"
                      className="bg-primary hover:bg-primary-glow text-primary-foreground font-semibold px-3.5"
                    >
                      <Send className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
          </div>
        </div>
      </section>

      {/* Feature cards Grid */}
      {/* How it works — the pipeline as a ruled register, not a card grid.
          Each step names what the product actually does to the source. */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-24 relative z-10">
        <div className="max-w-2xl mb-14">
          <h2 className="text-3xl font-display font-bold tracking-tight mb-3">
            Every answer traces back to a passage.
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Source.io reads the source once, then keeps a coordinate on everything it
            generates. Notes cite it. Chat cites it. Nothing is asserted without a
            place you can go and check.
          </p>
        </div>

        {/* The register: ruled rows, not boxes. */}
        <div className="border-t border-border">
          {[
            {
              n: "01",
              title: "Survey the source",
              body: "PDFs and DOCX are read in your browser. Audio and video go through Whisper. YouTube arrives as a transcript. Everything becomes text with its position preserved.",
            },
            {
              n: "02",
              title: "Plot the notes",
              body: "Structured markdown streams in as it is written — headings, tables, formulas. You watch the plate being drawn rather than waiting on a spinner.",
            },
            {
              n: "03",
              title: "Derive the study set",
              body: "Flashcards, a mixed-type quiz with explanations, and a two-host audio recap, all generated from the notes rather than from the raw source.",
            },
            {
              n: "04",
              title: "Index for questions",
              body: "The notes are split into passages and embedded. Ask anything and the answer comes back with the passages it used, ranked by how strongly each one carries it.",
            },
          ].map((step) => (
            <div
              key={step.n}
              className="grid sm:grid-cols-[4rem_minmax(0,18rem)_minmax(0,1fr)] gap-x-6 gap-y-2 py-7 border-b border-border"
            >
              <span className="font-mono text-xs text-primary pt-1 tracking-widest">{step.n}</span>
              <h3 className="font-display text-lg text-foreground">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-measure">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Grounding, shown rather than claimed. */}
      <section id="why-us" className="max-w-6xl mx-auto px-6 pb-24 relative z-10">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] gap-12 items-center">
          <div className="plate plate-registered rounded-sm p-6 sm:p-8">
            <p className="text-sm text-foreground/85 leading-[1.75] font-reading">
              Decoherence is the loss of a qubit's quantum state through interaction with
              its environment — stray heat, vibration, electromagnetic noise. It is the
              central engineering obstacle to scaling quantum computers
              <span className="text-primary font-medium"> [1]</span>, which is why most
              designs operate near absolute zero
              <span className="text-primary font-medium"> [2]</span>.
            </p>

            <div className="mt-5 pt-4 border-t border-border flex flex-wrap gap-2">
              {[
                { n: 1, sim: 0.94 },
                { n: 2, sim: 0.71 },
                { n: 3, sim: 0.48 },
              ].map((c) => (
                <span
                  key={c.n}
                  className="inline-flex items-center gap-1.5 text-xs font-mono px-2 py-0.5 rounded-sm bg-surface-sunken border border-border text-muted-foreground"
                >
                  <Magnitude value={c.sim} className="text-primary" />
                  [{c.n}]
                  <span className="text-muted-foreground/70">{(c.sim * 100).toFixed(0)}%</span>
                </span>
              ))}
            </div>

            <p className="mt-4 text-xs text-muted-foreground/70 font-mono">
              Illustrative excerpt — not a real user document.
            </p>
          </div>

          <div>
            <h2 className="text-3xl font-display font-bold tracking-tight mb-4">
              Strength you can see.
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Citations carry a magnitude. The larger the dot, the more of the answer
              that passage is holding up — the same way a star chart ranks brightness by
              size rather than by shouting.
            </p>
            <p className="text-sm text-muted-foreground/80 leading-relaxed">
              Open any citation to read the exact passage it came from, with its position
              in your document.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 py-12 relative z-10 text-center text-xs text-muted-foreground bg-background">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/favicon.png" className="h-5 w-5 object-contain" alt="Logo" />
            <span className="font-semibold text-muted-foreground font-display">Source.io</span>
          </div>
          <div>
            Built with React, Supabase & Groq
          </div>
          <div className="flex gap-4">
            <span className="text-muted-foreground/70">Privacy Policy</span>
            <span className="text-muted-foreground/70">Terms of Use</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
