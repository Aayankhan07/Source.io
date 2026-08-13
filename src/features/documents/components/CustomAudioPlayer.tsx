import { useState, useRef, useEffect } from "react";
import { Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX, Headphones, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface TranscriptLine {
  speaker: string;
  text: string;
  timeSec: number;
}

interface CustomAudioPlayerProps {
  audioUrl?: string | null;
  script?: string | null;
  title?: string;
  isPlayingSimulated?: boolean;
  onPlayStateChange?: (playing: boolean) => void;
}

export default function CustomAudioPlayer({
  audioUrl,
  script,
  title = "Audio Recap",
  isPlayingSimulated,
  onPlayStateChange,
}: CustomAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  // Parse script into structured lines with estimated timestamps if audio script exists
  const parsedTranscript: TranscriptLine[] = (() => {
    if (!script) {
      return [
        { speaker: "Alex", text: "Welcome to today's study recap! We're breaking down the core concepts from your document.", timeSec: 0 },
        { speaker: "Morgan", text: "Right, specifically focusing on quantum mechanics principles like superposition and entanglement.", timeSec: 8 },
        { speaker: "Alex", text: "Superposition is mind-bending — a qubit can hold multiple states simultaneously until measured.", timeSec: 17 },
        { speaker: "Morgan", text: "And decoherence is the main engineering barrier where environmental noise destroys those states.", timeSec: 26 },
        { speaker: "Alex", text: "That's why these systems require near absolute zero cooling and error correction protocols.", timeSec: 35 },
      ];
    }

    const lines = script.split("\n").filter((l) => l.trim().length > 0);
    const result: TranscriptLine[] = [];
    let currentSpeaker = "Host A";
    let estTime = 0;

    lines.forEach((line) => {
      const speakerMatch = line.match(/^(Alex|Morgan|Host 1|Host 2|Speaker 1|Speaker 2|A|B):\s*(.*)/i);
      if (speakerMatch) {
        currentSpeaker = speakerMatch[1];
        const text = speakerMatch[2];
        result.push({ speaker: currentSpeaker, text, timeSec: estTime });
        estTime += Math.max(5, Math.ceil(text.length / 15));
      } else {
        result.push({ speaker: currentSpeaker, text: line, timeSec: estTime });
        estTime += Math.max(5, Math.ceil(line.length / 15));
      }
    });

    return result;
  })();

  const effectiveDuration = duration || (parsedTranscript.length ? parsedTranscript[parsedTranscript.length - 1].timeSec + 10 : 60);

  // Simulated audio loop fallback if no actual audio file URL is available (e.g. preview mode)
  useEffect(() => {
    if (audioUrl) return;

    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= effectiveDuration) {
            setIsPlaying(false);
            onPlayStateChange?.(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000 / playbackRate);
    }
    return () => clearInterval(interval);
  }, [isPlaying, audioUrl, effectiveDuration, playbackRate, onPlayStateChange]);

  const togglePlay = () => {
    if (audioRef.current && audioUrl) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(console.error);
      }
    }
    const nextState = !isPlaying;
    setIsPlaying(nextState);
    onPlayStateChange?.(nextState);
  };

  const handleSeek = (value: number[]) => {
    const newTime = value[0];
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleSkip = (seconds: number) => {
    const newTime = Math.min(Math.max(0, currentTime + seconds), effectiveDuration);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleSpeedChange = () => {
    const rates = [1, 1.25, 1.5, 2];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const newRate = rates[nextIdx];
    setPlaybackRate(newRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = newRate;
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Find currently active transcript line
  const activeTranscriptIndex = parsedTranscript.reduce((acc, line, idx) => {
    if (currentTime >= line.timeSec) return idx;
    return acc;
  }, 0);

  return (
    <div className="space-y-6 w-full max-w-3xl mx-auto">
      {/* Hidden standard audio element when URL is present */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
          onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
          onEnded={() => {
            setIsPlaying(false);
            onPlayStateChange?.(false);
          }}
        />
      )}

      {/* Main Plate Player Shell */}
      <div className="plate plate-registered p-6 sm:p-8 rounded-sm space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-sm bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Headphones className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-foreground font-display text-base sm:text-lg">{title}</h3>
              <p className="text-xs text-muted-foreground font-mono">Two AI Hosts · Synthesized dialogue recap</p>
            </div>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded-sm bg-surface-sunken border border-border text-muted-foreground flex items-center gap-1.5">
            <span className={cn("h-2 w-2 rounded-full", isPlaying ? "bg-primary animate-pulse" : "bg-muted-foreground/40")} />
            {isPlaying ? "Playing" : "Paused"}
          </span>
        </div>

        {/* Cassette Visualizer */}
        <div className="bg-surface-sunken p-4 rounded-sm border border-border/80 flex items-center justify-between gap-4">
          <div className="cassette-shell w-full max-w-xs mx-auto">
            <div className="cassette-label">
              <div className="cassette-window">
                <div className={cn("cassette-spindle", isPlaying && "animate-spin")} />
                <div className={cn("cassette-spindle", isPlaying && "animate-spin")} />
              </div>
            </div>
          </div>
        </div>

        {/* Timeline Slider & Time Labels */}
        <div className="space-y-2">
          <Slider
            value={[currentTime]}
            min={0}
            max={effectiveDuration}
            step={0.5}
            onValueChange={handleSeek}
            className="cursor-pointer"
          />
          <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(effectiveDuration)}</span>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="flex items-center justify-between gap-2 flex-wrap pt-2 border-t border-border/60">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSpeedChange}
              className="h-8 font-mono text-xs px-2.5 hover:border-primary/50"
            >
              {playbackRate}x
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleMute} className="h-8 w-8 text-muted-foreground hover:text-foreground">
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleSkip(-10)}
              className="h-9 w-9 text-muted-foreground hover:text-foreground"
              aria-label="Skip back 10 seconds"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>

            <Button
              onClick={togglePlay}
              size="icon"
              className="h-11 w-11 rounded-full bg-primary hover:bg-primary-glow text-primary-foreground shadow-glow"
              aria-label={isPlaying ? "Pause audio" : "Play audio"}
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleSkip(10)}
              className="h-9 w-9 text-muted-foreground hover:text-foreground"
              aria-label="Skip forward 10 seconds"
            >
              <RotateCw className="h-4 w-4" />
            </Button>
          </div>

          <div className="text-xs font-mono text-muted-foreground/70 hidden sm:block">
            Click transcript line to seek
          </div>
        </div>
      </div>

      {/* Interactive Transcript Drawer */}
      <div className="plate p-6 rounded-sm space-y-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2 font-mono">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Interactive Dialogue Transcript
          </h4>
          <span className="text-xs text-muted-foreground font-mono">{parsedTranscript.length} dialogue turns</span>
        </div>

        <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
          {parsedTranscript.map((line, idx) => {
            const isActive = idx === activeTranscriptIndex;
            const isAlex = line.speaker.toLowerCase().includes("alex") || line.speaker.toLowerCase().includes("host 1") || line.speaker === "A";
            return (
              <button
                key={idx}
                onClick={() => handleSeek([line.timeSec])}
                className={cn(
                  "w-full text-left p-3 rounded-sm border transition-all text-xs flex gap-3 group focus-ring",
                  isActive
                    ? "bg-primary/10 border-primary/40 text-foreground"
                    : "bg-surface-sunken border-border/60 hover:border-border text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                  <span
                    className={cn(
                      "px-1.5 py-0.5 rounded-sm font-mono text-[10px] uppercase font-bold",
                      isAlex
                        ? "bg-primary/20 text-primary border border-primary/30"
                        : "bg-surface-raised text-muted-foreground border border-border"
                    )}
                  >
                    {line.speaker}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground/70">{formatTime(line.timeSec)}</span>
                </div>
                <p className="flex-1 leading-relaxed text-xs">{line.text}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
