import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Shuffle, RotateCcw, Keyboard, CheckCircle } from "lucide-react";
import type { FlashcardRow } from "@/features/documents/store/workspace";
import { useToast } from "@/hooks/use-toast";

function shuffleArr<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function FlashcardsDeck({ cards }: { cards: FlashcardRow[] }) {
  const { toast } = useToast();
  const [order, setOrder] = useState<number[]>(() => cards.map((_, i) => i));
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  
  // Track ratings for stats
  const [ratings, setRatings] = useState<Record<string, string>>({});

  const ordered = useMemo(() => order.map((i) => cards[i]).filter(Boolean), [order, cards]);
  const total = ordered.length;
  const card = ordered[idx];

  const go = (delta: number) => {
    setFlipped(false);
    setIdx((i) => Math.max(0, Math.min(total - 1, i + delta)));
  };

  const rate = (quality: "again" | "hard" | "good" | "easy") => {
    if (!card) return;
    setRatings(prev => ({ ...prev, [card.id]: quality }));
    toast({
      title: `Rated ${quality.toUpperCase()}`,
      description: "Card scheduled for review.",
      duration: 1000,
    });
    // Auto-advance if not at the end
    if (idx < total - 1) {
      setTimeout(() => {
        go(1);
      }, 300);
    }
  };

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when typing in inputs/textareas
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        setFlipped(f => !f);
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        go(-1);
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        go(1);
      } else if (flipped) {
        if (e.key === "1") rate("again");
        else if (e.key === "2") rate("hard");
        else if (e.key === "3") rate("good");
        else if (e.key === "4") rate("easy");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [idx, total, flipped, card]);

  if (!card) return null;

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Action Header controls */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs border-white/10 text-white bg-white/5 font-mono">
            {idx + 1} / {total}
          </Badge>
          <div className="hidden sm:flex items-center gap-1 text-[10px] text-neutral-500 font-mono">
            <Keyboard className="h-3.5 w-3.5" /> Space to flip · Arrows to navigate
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="xs"
            className="border-white/10 text-neutral-300 hover:text-white bg-white/5 text-xs py-1"
            onClick={() => { setOrder(shuffleArr(order)); setIdx(0); setFlipped(false); }}
          >
            <Shuffle className="h-3.5 w-3.5 mr-1" /> Shuffle
          </Button>
          <Button
            variant="outline"
            size="xs"
            className="border-white/10 text-neutral-300 hover:text-white bg-white/5 text-xs py-1"
            onClick={() => { setOrder(cards.map((_, i) => i)); setIdx(0); setFlipped(false); setRatings({}); }}
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset
          </Button>
        </div>
      </div>

      {/* Card stack layout wrapper */}
      <div className="relative w-full h-80 sm:h-80 select-none pb-4">
        {/* Background stack card shadows to simulate deck */}
        {total - idx > 2 && (
          <div className="absolute inset-x-4 bottom-0 h-72 rounded-xl border border-white/5 bg-[#0f0f13]/40 translate-y-4 scale-95 pointer-events-none transition-transform" />
        )}
        {total - idx > 1 && (
          <div className="absolute inset-x-2 bottom-1 h-72 rounded-xl border border-white/5 bg-[#121217]/70 translate-y-2 scale-[0.98] pointer-events-none transition-transform" />
        )}

        {/* Floating Flip Card */}
        <div
          className="relative w-full h-72 cursor-pointer"
          style={{ perspective: "1200px" }}
          onClick={() => setFlipped((f) => !f)}
          role="button"
          aria-label="Flip card"
        >
          <div
            className="absolute inset-0 transition-transform duration-500"
            style={{
              transformStyle: "preserve-3d",
              transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
            }}
          >
            {/* Front Question Face */}
            <div
              className="absolute inset-0 rounded-xl border border-white/10 bg-[#121217] p-6 sm:p-8 flex flex-col items-center justify-center text-center shadow-2xl glass-panel relative interactive-card"
              style={{ backfaceVisibility: "hidden" }}
            >
              <Badge variant="secondary" className="mb-4 text-[10px] uppercase tracking-wider font-bold bg-primary/10 text-primary border-primary/20">Question</Badge>
              <p className="text-base sm:text-lg font-bold text-white leading-relaxed max-w-lg font-display">{card.front}</p>
              
              {ratings[card.id] && (
                <div className="absolute top-4 right-4 flex items-center gap-1 text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  <CheckCircle className="h-3 w-3" /> Reviewed
                </div>
              )}
              <p className="absolute bottom-4 text-xs text-neutral-500">Tap card or press <code className="bg-[#21212c] px-1 rounded text-neutral-400">Space</code> to reveal answer</p>
            </div>

            {/* Back Answer Face */}
            <div
              className="absolute inset-0 rounded-xl border border-primary/20 bg-[#121217] p-6 sm:p-8 flex flex-col items-center justify-center text-center shadow-2xl glass-panel interactive-card"
              style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
            >
              <Badge className="mb-4 text-[10px] uppercase tracking-wider font-bold bg-purple-500/20 text-purple-400 border-purple-500/30">Answer explanation</Badge>
              <p className="text-sm sm:text-base text-neutral-200 leading-relaxed max-w-lg">{card.back}</p>
              <p className="absolute bottom-4 text-xs text-neutral-500">Tap to flip back</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress navigation & Spaced Repetition Feedback Controls */}
      <div className="space-y-4">
        {flipped && (
          <div className="glass-panel p-4 rounded-xl border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in">
            <span className="text-[11px] text-neutral-400 font-mono">How well did you recall this?</span>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button 
                onClick={(e) => { e.stopPropagation(); rate("again"); }} 
                className="flex-1 sm:flex-none text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 py-1"
                size="sm"
              >
                Again (1)
              </Button>
              <Button 
                onClick={(e) => { e.stopPropagation(); rate("hard"); }} 
                className="flex-1 sm:flex-none text-xs bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 py-1"
                size="sm"
              >
                Hard (2)
              </Button>
              <Button 
                onClick={(e) => { e.stopPropagation(); rate("good"); }} 
                className="flex-1 sm:flex-none text-xs bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 py-1"
                size="sm"
              >
                Good (3)
              </Button>
              <Button 
                onClick={(e) => { e.stopPropagation(); rate("easy"); }} 
                className="flex-1 sm:flex-none text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 py-1"
                size="sm"
              >
                Easy (4)
              </Button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
          <Button variant="outline" onClick={() => go(-1)} disabled={idx === 0} className="border-white/10 text-white hover:bg-white/5">
            <ChevronLeft className="h-4 w-4 mr-1 shrink-0" /> Prev
          </Button>
          <div className="flex-1">
            <div className="h-1.5 rounded-full bg-neutral-800 overflow-hidden shadow-inner">
              <div
                className="h-full bg-primary transition-all duration-300 shadow-glow"
                style={{ width: `${((idx + 1) / total) * 100}%` }}
              />
            </div>
          </div>
          <Button variant="outline" onClick={() => go(1)} disabled={idx === total - 1} className="border-white/10 text-white hover:bg-white/5">
            Next <ChevronRight className="h-4 w-4 ml-1 shrink-0" />
          </Button>
        </div>
      </div>
    </div>
  );
}
