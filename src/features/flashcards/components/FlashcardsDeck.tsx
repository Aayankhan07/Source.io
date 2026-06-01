import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Shuffle, RotateCcw } from "lucide-react";
import type { FlashcardRow } from "@/features/documents/store/workspace";

function shuffleArr<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function FlashcardsDeck({ cards }: { cards: FlashcardRow[] }) {
  const [order, setOrder] = useState<number[]>(() => cards.map((_, i) => i));
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const ordered = useMemo(() => order.map((i) => cards[i]).filter(Boolean), [order, cards]);
  const total = ordered.length;
  const card = ordered[idx];

  const go = (delta: number) => {
    setFlipped(false);
    setIdx((i) => Math.max(0, Math.min(total - 1, i + delta)));
  };

  if (!card) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-xs">
          {idx + 1} / {total}
        </Badge>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setOrder(shuffleArr(order)); setIdx(0); setFlipped(false); }}
          >
            <Shuffle className="h-3.5 w-3.5 mr-1.5" /> Shuffle
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setOrder(cards.map((_, i) => i)); setIdx(0); setFlipped(false); }}
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Reset
          </Button>
        </div>
      </div>

      {/* Flip card */}
      <div
        className="relative w-full h-72 sm:h-80 cursor-pointer select-none"
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
          <div
            className="absolute inset-0 rounded-xl border border-border bg-card p-6 sm:p-8 flex flex-col items-center justify-center text-center shadow-sm"
            style={{ backfaceVisibility: "hidden" }}
          >
            <Badge variant="secondary" className="mb-4 text-[10px] uppercase tracking-wide">Question</Badge>
            <p className="text-lg sm:text-xl font-medium leading-relaxed">{card.front}</p>
            <p className="absolute bottom-3 text-xs text-muted-foreground">Tap to reveal</p>
          </div>
          <div
            className="absolute inset-0 rounded-xl border border-primary/30 bg-card p-6 sm:p-8 flex flex-col items-center justify-center text-center shadow-sm"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <Badge className="mb-4 text-[10px] uppercase tracking-wide bg-primary/20 text-primary border-primary/30">Answer</Badge>
            <p className="text-base sm:text-lg leading-relaxed">{card.back}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => go(-1)} disabled={idx === 0}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Prev
        </Button>
        <div className="flex-1 mx-4">
          <div className="h-1 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${((idx + 1) / total) * 100}%` }}
            />
          </div>
        </div>
        <Button variant="outline" onClick={() => go(1)} disabled={idx === total - 1}>
          Next <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
