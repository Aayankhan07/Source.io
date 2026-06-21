import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/context/AuthContext";
import { 
  Sparkles, FileText, Headphones, MessagesSquare, ListChecks, Layers, 
  ArrowRight, Play, Pause, ChevronRight, Check, X, RotateCcw, Send,
  Cpu, Zap, Shield, BookOpen
} from "lucide-react";
import MarkdownView from "@/components/common/MarkdownView";

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
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

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
      
      let charIdx = 0;
      const typeInterval = setInterval(() => {
        setChatMessages(prev => {
          const next = [...prev];
          const lastMsg = next[next.length - 1];
          if (lastMsg && lastMsg.role === "assistant") {
            lastMsg.content = fullResponse.slice(0, charIdx + 1);
          }
          return next;
        });
        charIdx++;
        if (charIdx >= fullResponse.length) {
          clearInterval(typeInterval);
          setChatTyping(false);
        }
      }, 15);
    }, 800);
  };

  return (
    <main className="min-h-screen bg-[#09090b] relative overflow-hidden text-foreground selection:bg-primary/20 selection:text-primary">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#a855f7]/10 blur-[120px] pointer-events-none" />

      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff05_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      {/* Header */}
      <header className="border-b border-white/5 sticky top-0 bg-[#09090b]/80 backdrop-blur-md z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center overflow-hidden border border-white/10 group-hover:border-primary/50 transition-colors bg-card">
              <img src="/favicon.png" className="h-full w-full object-contain" alt="Logo" />
            </div>
            <span className="font-semibold tracking-tight text-lg font-display bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent">Source.io</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-neutral-400">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#simulator" className="hover:text-foreground transition-colors">Live Preview</a>
            <a href="#why-us" className="hover:text-foreground transition-colors">Why Source.io</a>
          </nav>
          <div className="flex items-center gap-3">
            {user ? (
              <Button asChild size="sm" className="bg-primary hover:bg-primary-glow text-primary-foreground font-medium shadow-glow">
                <Link to="/app" className="flex items-center gap-1">Open app <ArrowRight className="h-3.5 w-3.5" /></Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className="text-neutral-300 hover:text-white hover:bg-white/5">
                  <Link to="/auth">Sign in</Link>
                </Button>
                <Button asChild size="sm" className="bg-white hover:bg-neutral-200 text-black font-medium transition-all">
                  <Link to="/auth">Get started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-6 pt-24 pb-16 text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs text-neutral-300 mb-8 animate-fade-in">
          <Sparkles className="h-3 w-3 text-primary animate-pulse" />
          <span className="font-display tracking-wide font-medium">Re-Imagined AI Study Workspace</span>
        </div>
        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-8 font-display leading-[1.1]">
          Learn anything 10x faster <br className="hidden sm:inline" />
          with <span className="bg-gradient-primary bg-clip-text text-transparent glow-text">structured assets</span>.
        </h1>
        <p className="text-base sm:text-lg text-neutral-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Drop any PDF, document, audio recording, YouTube link, or raw text. Source.io immediately crafts rich interactive notes, spaced-repetition flashcards, adaptive quizzes, podcast recaps, and a grounded AI chat companion.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button asChild size="lg" className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-8 py-6 rounded-xl shadow-glow w-full sm:w-auto">
            <Link to={user ? "/app" : "/auth"}>{user ? "Go to workspace" : "Create free account"}</Link>
          </Button>
          <a href="#simulator" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="border-white/10 bg-white/5 text-white hover:bg-white/10 px-8 py-6 rounded-xl w-full">
              Try live preview
            </Button>
          </a>
        </div>
      </section>

      {/* Interactive Simulator Section */}
      <section id="simulator" className="max-w-5xl mx-auto px-6 py-12 relative z-10 scroll-mt-20">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold tracking-tight font-display mb-3">Live Interactive Simulator</h2>
          <p className="text-neutral-400 text-sm max-w-md mx-auto">
            Experience our upgraded dashboard controls. Click the tabs below to preview each study companion generated in real time.
          </p>
        </div>

        {/* Live Workspace Mock Dashboard */}
        <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex flex-col h-[520px] max-h-[520px]">
          {/* Mock Tab Header */}
          <div className="border-b border-white/5 bg-[#0f0f12] px-4 py-3 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-red-500/80" />
              <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
              <span className="h-3 w-3 rounded-full bg-green-500/80" />
              <span className="text-xs text-neutral-500 ml-2 font-mono">workspace_preview.json</span>
            </div>
            
            {/* Horizontal simulated tabs bar */}
            <div className="flex items-center gap-1 bg-[#1a1a24] p-0.5 rounded-lg border border-white/5">
              {[
                { id: "notes", label: "Study Notes", icon: FileText },
                { id: "flashcards", label: "Flashcards", icon: Layers },
                { id: "quiz", label: "Quiz Practice", icon: ListChecks },
                { id: "podcast", label: "Podcast recap", icon: Headphones },
                { id: "chat", label: "AI Grounded Chat", icon: MessagesSquare }
              ].map((t) => {
                const Icon = t.icon;
                const active = activeSimTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveSimTab(t.id as any)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      active 
                        ? "bg-primary text-primary-foreground shadow-sm font-semibold" 
                        : "text-neutral-400 hover:text-white hover:bg-white/5"
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
          <div className="flex-1 overflow-y-auto p-6 bg-[#09090b]/40">
            {/* Notes Tab Content */}
            {activeSimTab === "notes" && (
              <div className="max-w-3xl mx-auto space-y-4 animate-fade-in text-left">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" /> Introduction to Quantum Computing
                  </h3>
                  <span className="text-[10px] text-neutral-500 uppercase tracking-widest">Source material notes</span>
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
| Core Unit | Bits (0 or 1) | Qubits (|0⟩, |1⟩, or both) |
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
                <div className="flex justify-between items-center text-xs text-neutral-400">
                  <span>Card {cardIdx + 1} of {simFlashcards.length}</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => { setCardIdx(0); setCardFlipped(false); }}
                      className="px-2 py-1 rounded bg-white/5 border border-white/5 text-neutral-300 hover:text-white text-[11px]"
                    >
                      Reset deck
                    </button>
                  </div>
                </div>

                {/* Flip Card Design */}
                <div 
                  className="relative w-full h-56 cursor-pointer select-none"
                  style={{ perspective: "1000px" }}
                  onClick={() => setCardFlipped(!cardFlipped)}
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
                      className="absolute inset-0 rounded-xl border border-white/10 bg-card p-6 flex flex-col items-center justify-center text-center shadow-md"
                      style={{ backfaceVisibility: "hidden" }}
                    >
                      <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] uppercase font-bold tracking-widest mb-4">Question</span>
                      <p className="text-base sm:text-lg font-semibold text-white leading-relaxed">{simFlashcards[cardIdx].front}</p>
                      <p className="absolute bottom-4 text-xs text-neutral-500">Tap to flip & reveal answer</p>
                    </div>

                    {/* Back */}
                    <div 
                      className="absolute inset-0 rounded-xl border border-primary/20 bg-card p-6 flex flex-col items-center justify-center text-center shadow-md"
                      style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                    >
                      <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 text-[10px] uppercase font-bold tracking-widest mb-4">Answer explanation</span>
                      <p className="text-sm sm:text-base text-neutral-200 leading-relaxed">{simFlashcards[cardIdx].back}</p>
                      <p className="absolute bottom-4 text-xs text-neutral-500">Tap to flip back</p>
                    </div>
                  </div>
                </div>

                {/* Spaced repetition deck score buttons preview */}
                <div className="flex items-center justify-between gap-3">
                  <Button 
                    variant="outline" 
                    onClick={(e) => { e.stopPropagation(); setCardFlipped(false); setCardIdx(i => Math.max(0, i - 1)); }}
                    disabled={cardIdx === 0}
                    className="border-white/5 bg-white/5 text-neutral-400 hover:text-white"
                  >
                    Previous
                  </Button>
                  <div className="flex gap-1.5">
                    {["Again", "Hard", "Good", "Easy"].map((label) => (
                      <span key={label} className="text-[10px] px-2 py-1 rounded bg-[#1e1e24] border border-white/5 text-neutral-400 font-mono">
                        {label}
                      </span>
                    ))}
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={(e) => { e.stopPropagation(); setCardFlipped(false); setCardIdx(i => Math.min(simFlashcards.length - 1, i + 1)); }}
                    disabled={cardIdx === simFlashcards.length - 1}
                    className="border-white/5 bg-white/5 text-neutral-400 hover:text-white"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}

            {/* Quiz Tab Content */}
            {activeSimTab === "quiz" && (
              <div className="max-w-xl mx-auto space-y-6 animate-fade-in text-left">
                <div className="border border-white/5 bg-card/40 rounded-xl p-5 space-y-4">
                  <div className="flex items-start gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-primary/20 text-primary text-[10px] font-mono mt-0.5">Q1</span>
                    <h4 className="text-sm font-semibold text-white">Which quantum state decay process is caused by interaction with environmental noise?</h4>
                  </div>

                  <div className="space-y-2">
                    {[
                      { idx: 0, text: "Quantum Entanglement" },
                      { idx: 1, text: "Quantum Decoherence (Correct Option)" },
                      { idx: 2, text: "Qubit Phase Transformation" },
                      { idx: 3, text: "Superposition Inversion" }
                    ].map((opt) => {
                      const isCorrectOpt = opt.idx === 1;
                      const isSelected = selectedChoice === opt.idx;
                      
                      let btnStyle = "border-white/5 hover:bg-white/5 hover:border-white/20";
                      if (isSelected) {
                        if (quizSubmitted) {
                          btnStyle = isCorrectOpt ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300" : "border-red-500/50 bg-red-500/10 text-red-300";
                        } else {
                          btnStyle = "border-primary bg-primary/10 text-white";
                        }
                      } else if (quizSubmitted && isCorrectOpt) {
                        btnStyle = "border-emerald-500/40 bg-emerald-500/5 text-emerald-400";
                      }

                      return (
                        <button
                          key={opt.idx}
                          disabled={quizSubmitted}
                          onClick={() => setSelectedChoice(opt.idx)}
                          className={`w-full text-left p-3 rounded-lg border transition-all text-xs flex items-center justify-between ${btnStyle}`}
                        >
                          <span>{opt.text}</span>
                          {quizSubmitted && isCorrectOpt && <Check className="h-4 w-4 text-emerald-400" />}
                          {quizSubmitted && isSelected && !isCorrectOpt && <X className="h-4 w-4 text-red-400" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <span className="text-[10px] text-neutral-500">Select one option to submit</span>
                    {quizSubmitted ? (
                      <Button 
                        onClick={() => { setSelectedChoice(null); setQuizSubmitted(false); }}
                        size="sm"
                        className="bg-white/5 text-white hover:bg-white/10 border border-white/10"
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
                    <div className="text-[11px] text-neutral-400 leading-relaxed bg-[#0f0f12] p-3 rounded border border-white/5">
                      <strong className="text-white font-medium">Explanation:</strong> Decoherence represents the loss of quantum state in a qubit due to interaction with external interference like heat or electromagnetic waves.
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
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] font-mono text-neutral-500 uppercase tracking-widest">
                    Quantum recap
                  </div>
                </div>

                <div className="space-y-2 w-full">
                  <h4 className="text-sm font-semibold text-white">Quantum Computing Audio Summary</h4>
                  <p className="text-xs text-neutral-500">2-host conversational dialogue script generated from notes</p>
                </div>

                {/* Podcast Progress controls */}
                <div className="w-full space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <button 
                      onClick={() => setPodcastPlaying(!podcastPlaying)}
                      className="h-10 w-10 rounded-full bg-primary hover:bg-primary-glow text-primary-foreground flex items-center justify-center transition-all shadow-glow shrink-0"
                    >
                      {podcastPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                    </button>
                    <div className="flex-1 space-y-1">
                      <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                        <div className="h-full bg-primary transition-all duration-300" style={{ width: `${audioProgress}%` }} />
                      </div>
                      <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
                        <span>0:42</span>
                        <span>2:15</span>
                      </div>
                    </div>
                  </div>

                  {/* Simulated Script extract */}
                  <div className="text-[11px] text-neutral-400 bg-[#0f0f12] border border-white/5 p-3 rounded text-left space-y-1 max-h-24 overflow-y-auto font-mono">
                    <div className="text-white font-semibold">Host A (AI):</div>
                    <div className="mb-2">So, superposition is basically a qubit spinning in place, representing multiple states at once?</div>
                    <div className="text-white font-semibold">Host B (AI):</div>
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
                        <div className={`max-w-[85%] rounded-xl px-3.5 py-2 text-xs leading-relaxed ${
                          isAi 
                            ? "bg-[#111116] border border-white/5 text-neutral-200" 
                            : "bg-primary text-primary-foreground font-medium"
                        }`}>
                          {m.content === "" ? (
                            <div className="flex items-center gap-1.5 text-neutral-500 font-mono text-[10px]">
                              <span className="h-1.5 w-1.5 rounded-full bg-neutral-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                              <span className="h-1.5 w-1.5 rounded-full bg-neutral-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                              <span className="h-1.5 w-1.5 rounded-full bg-neutral-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                            </div>
                          ) : m.content}
                        </div>
                      </div>
                    );
                  })}
                  {chatTyping && chatMessages[chatMessages.length - 1]?.content === "" && (
                    <div className="flex justify-start">
                      <div className="bg-[#111116] border border-white/5 rounded-xl px-3 py-2 text-neutral-500 text-[10px]">
                        Assistant is typing…
                      </div>
                    </div>
                  )}
                </div>

                {/* Suggestions and Input */}
                <div className="border-t border-white/5 pt-3 mt-3 space-y-2">
                  <div className="flex gap-1.5 flex-wrap">
                    <button 
                      onClick={() => handleSendChat("What is quantum superposition?")}
                      disabled={chatTyping}
                      className="text-[10px] px-2 py-1 rounded bg-white/5 border border-white/5 text-neutral-400 hover:text-white hover:border-white/20 transition-all font-mono"
                    >
                      What is superposition?
                    </button>
                    <button 
                      onClick={() => handleSendChat("Explain quantum entanglement in simple terms.")}
                      disabled={chatTyping}
                      className="text-[10px] px-2 py-1 rounded bg-white/5 border border-white/5 text-neutral-400 hover:text-white hover:border-white/20 transition-all font-mono"
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
                      className="flex-1 bg-[#121217] border border-white/5 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-primary/50 transition-colors"
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
      </section>

      {/* Feature cards Grid */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-20 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight font-display mb-3 interactive-heading">Structured Study Tooling</h2>
          <p className="text-neutral-400 text-sm max-w-md mx-auto">
            Everything you need to master complex documents. Transformed into interactive modules instantly.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            { 
              icon: FileText, 
              title: "Interactive Study Notes", 
              desc: "Markdown formatted summary outlines, nested tables, formula blocks, and logical sections streamed word-by-word." 
            },
            { 
              icon: Layers, 
              title: "Smart Flashcards", 
              desc: "Spaced-repetition card decks generated from your content with keyboard shortcuts and ratings support." 
            },
            { 
              icon: ListChecks, 
              title: "Comprehensive Quizzes", 
              desc: "Multi-type queries (MCQs, True/False, short answers) complete with instant validation and detailed explanations." 
            },
            { 
              icon: Headphones, 
              title: "Conversational Podcasts", 
              desc: "Turn passive documents into an audio recap featuring a dynamic two-speaker conversation generated in 60 seconds." 
            },
            { 
              icon: MessagesSquare, 
              title: "Grounded Chatbot", 
              desc: "Ask specific questions to clarify passages and inspect context citations pointing back directly to the source." 
            },
            { 
              icon: Sparkles, 
              title: "Universal Transcriber", 
              desc: "Upload YouTube URLs, voice notes, PDFs, word documents or raw pastes to synthesize them unified into your library." 
            }
          ].map((f, idx) => (
            <div 
              key={idx} 
              className="glass-panel p-6 rounded-xl border border-white/5 glass-panel-hover interactive-card flex flex-col items-start text-left"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-lg text-white mb-2 font-display">{f.title}</h3>
              <p className="text-sm text-neutral-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why Source.io Section */}
      <section id="why-us" className="max-w-5xl mx-auto px-6 py-20 relative z-10 border-t border-white/5 text-center">
        <h2 className="text-3xl font-bold tracking-tight font-display mb-12 interactive-heading">Designed for Mastery</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <div className="h-12 w-12 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mx-auto mb-4">
              <Cpu className="h-6 w-6" />
            </div>
            <h4 className="text-lg font-semibold text-white font-display">Fast Synthesis</h4>
            <p className="text-neutral-400 text-sm leading-relaxed max-w-xs mx-auto">
              Our background ingestion pipelines extract text locally and transcribe audio via whisper API at hyper-speed.
            </p>
          </div>
          <div className="space-y-3">
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto mb-4">
              <Shield className="h-6 w-6" />
            </div>
            <h4 className="text-lg font-semibold text-white font-display">Grounded Context</h4>
            <p className="text-neutral-400 text-sm leading-relaxed max-w-xs mx-auto">
              No generic hallucinations. Responses are tightly grounded in vector chunks extracted from your uploads.
            </p>
          </div>
          <div className="space-y-3">
            <div className="h-12 w-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mx-auto mb-4">
              <BookOpen className="h-6 w-6" />
            </div>
            <h4 className="text-lg font-semibold text-white font-display">Active Retention</h4>
            <p className="text-neutral-400 text-sm leading-relaxed max-w-xs mx-auto">
              By combining podcasts, notes, flashcards, and quizzes, we activate multiple brain sensory areas to improve recall.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 relative z-10 text-center text-xs text-neutral-500 bg-[#09090b]">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/favicon.png" className="h-5 w-5 object-contain" alt="Logo" />
            <span className="font-semibold text-neutral-400 font-display">Source.io</span>
          </div>
          <div>
            Built with React, Supabase & Gemini · Dark mode default
          </div>
          <div className="flex gap-4">
            <a href="#" className="hover:underline hover:text-neutral-300">Privacy Policy</a>
            <a href="#" className="hover:underline hover:text-neutral-300">Terms of Use</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
