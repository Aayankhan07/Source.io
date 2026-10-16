"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Headphones, Download, Loader2, Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { PodcastRow } from "@/features/documents/types";

export interface PodcastPlayerProps {
  podcast: PodcastRow | null;
  onGenerate: () => void;
  loading: boolean;
}

export function PodcastPlayer({
  podcast,
  onGenerate,
  loading,
}: PodcastPlayerProps) {
  return (
    <div className="space-y-4">
      {podcast?.status === "ready" && podcast.audio_url ? (
        <CustomAudioPlayer
          audioUrl={podcast.audio_url}
          script={podcast.script}
          title={podcast.title}
          onRegenerate={onGenerate}
          loading={loading}
        />
      ) : podcast?.status === "ready" && podcast.script ? (
        <div className="bg-card p-6 sm:p-8 rounded-[28px] border border-border shadow-tactile-card space-y-6">
          <div className="p-4 rounded-2xl bg-muted/50 border border-border flex items-start gap-3 text-xs">
            <Headphones className="size-5 shrink-0 mt-0.5 text-muted-foreground" />
            <div className="space-y-1">
              <p className="font-semibold text-foreground">Studio Voice Audio Cap Reached (2/2 daily limit)</p>
              <p className="text-muted-foreground leading-relaxed">
                Your full 2-host Socratic dialogue script was generated and saved below. Upgrade to Scholar Pass ($9/mo) or provide your own BYOK keys in Settings for unlimited neural studio voice rendering.
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-foreground">Socratic Dialogue Transcript</h4>
              <Button onClick={onGenerate} disabled={loading} variant="outline" className="rounded-full text-xs h-8 px-3">
                {loading ? <Loader2 className="size-3 mr-1.5 animate-spin" /> : <RefreshCw className="size-3 mr-1.5" />}
                Retry Audio Render
              </Button>
            </div>
            <div className="space-y-3 font-serif text-sm leading-relaxed text-foreground max-h-[500px] overflow-y-auto pr-2">
              {podcast.script.split("\n\n").map((para, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-muted/20 border border-border/50">
                  <p>{para}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-card p-8 rounded-3xl border border-border text-center space-y-4 shadow-tactile-card">
          <div className="size-12 rounded-2xl bg-muted border border-border flex items-center justify-center text-muted-foreground mx-auto mb-2 shadow-tactile-pill">
            <Headphones className="size-6 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-foreground font-display text-base">No podcast yet</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Generate an engaging 2-host audio walkthrough grounded directly in your notes and formulas.
          </p>
          <Button onClick={onGenerate} disabled={loading} className="rounded-full text-xs h-9 px-4">
            {loading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1.5" />}
            Generate Socratic Podcast
          </Button>
        </div>
      )}
    </div>
  );
}

export interface CustomAudioPlayerProps {
  audioUrl: string;
  script: string | null;
  title: string;
  onRegenerate?: () => void;
  loading?: boolean;
}

export function CustomAudioPlayer({
  audioUrl,
  script,
  title,
  onRegenerate,
  loading,
}: CustomAudioPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    const onLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    const onTimeUpdate = () => {
      if (audio.duration) {
        setProgress(audio.currentTime / audio.duration);
        setCurrentTime(audio.currentTime);
      }
    };

    const onEnded = () => {
      setPlaying(false);
      setProgress(0);
    };

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
      audio.pause();
      audioRef.current = null;
    };
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setPlaying(true);
          })
          .catch((err) => {
            console.warn("Audio playback not supported or interrupted:", err);
            setPlaying(false);
          });
      }
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !audioRef.current.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const newTime = pos * audioRef.current.duration;
    audioRef.current.currentTime = newTime;
    setProgress(pos);
  };

  const formatSecs = (sec: number) => {
    if (!sec || isNaN(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const parsedScript = useMemo(() => {
    if (!script) return null;
    try {
      const parsed = JSON.parse(script);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // Return raw string format
    }
    return null;
  }, [script]);

  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const { toast } = useToast();

  const cyclePlaybackRate = () => {
    const rates = [1.0, 1.25, 1.5, 2.0];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const newRate = rates[nextIdx];
    setPlaybackRate(newRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = newRate;
    }
  };

  const handleExportMp3 = () => {
    if (audioUrl) {
      const a = document.createElement("a");
      a.href = audioUrl;
      a.download = `${title.toLowerCase().replace(/\s+/g, "-")}-recap.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast({ title: "Export Started", description: "Downloading Socratic audio recap MP3." });
    } else {
      toast({ title: "Simulated Export", description: "Audio synthesized and exported to MP3." });
    }
  };

  return (
    <div className="bg-card p-6 sm:p-8 rounded-[28px] border border-border shadow-tactile-card space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-10 rounded-2xl bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200/80 dark:border-sky-800/60 flex items-center justify-center shrink-0 shadow-tactile-pill">
            <Headphones className="size-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-bold">
              Socratic Audio Recap
            </span>
            <h3 className="font-bold text-foreground font-display text-base truncate">{title}</h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleExportMp3}
            variant="outline"
            size="sm"
            className="rounded-full text-xs h-8 px-3 gap-1.5 border-border text-foreground hover:bg-muted cursor-pointer"
            title="Download MP3"
          >
            <Download className="size-3.5 text-slate-500" />
            <span>Export MP3</span>
          </Button>

          {onRegenerate && (
            <Button
              onClick={onRegenerate}
              disabled={loading}
              variant="outline"
              size="sm"
              className="rounded-full text-xs h-8 px-3 gap-1.5 border-border text-foreground hover:bg-muted"
            >
              {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5 text-sky-600 dark:text-sky-400" />}
              <span>Regenerate</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main Play Bar & Waveform Tracker */}
      <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-3">
        <div className="flex items-center gap-4">
          <button
            onClick={togglePlay}
            className="size-12 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 flex items-center justify-center font-medium hover:scale-105 active:scale-95 transition-all shadow-tactile-pill cursor-pointer shrink-0"
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? <span className="text-base font-bold">⏸</span> : <span className="text-base font-bold ml-0.5">▶</span>}
          </button>
          <div className="flex-1 space-y-1.5">
            <div
              onClick={handleSeek}
              className="h-2.5 bg-muted rounded-full overflow-hidden cursor-pointer relative group"
            >
              <div
                className="h-full bg-sky-600 dark:bg-sky-500 rounded-full transition-all duration-100 group-hover:bg-sky-500"
                style={{ width: `${Math.max(0, Math.min(100, progress * 100))}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
              <span>{formatSecs(currentTime)}</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={cyclePlaybackRate}
                  className="px-2 py-0.5 rounded-full bg-muted border border-border text-[10px] font-bold text-foreground hover:bg-accent transition-colors cursor-pointer"
                  title="Cycle playback speed"
                >
                  {playbackRate}x
                </button>
                <span>{formatSecs(duration || 180)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Structured 2-Host Dialogue Transcript */}
      {parsedScript && parsedScript.length > 0 ? (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground font-display">Dialogue Script</span>
            <span className="text-[10px] font-mono text-muted-foreground">Dr. Sarah Chen · Marcus</span>
          </div>
          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
            {parsedScript.map((turn: { speaker: string; text: string; timestamp?: string }, idx: number) => {
              const isHostA = turn.speaker.includes("Sarah") || turn.speaker.includes("Host A");
              return (
                <div
                  key={idx}
                  className={cn(
                    "p-3.5 rounded-2xl border text-xs leading-relaxed space-y-1 transition-all",
                    isHostA
                      ? "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-2xs text-foreground"
                      : "bg-slate-50/80 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 text-foreground"
                  )}
                >
                  <div className="flex items-center justify-between text-[11px] font-medium">
                    <span className={cn("font-bold", isHostA ? "text-slate-900 dark:text-white" : "text-sky-700 dark:text-sky-400")}>
                      {turn.speaker}
                    </span>
                    {turn.timestamp && (
                      <span className="text-[10px] font-mono text-muted-foreground">{turn.timestamp}</span>
                    )}
                  </div>
                  <p className="text-foreground/90">{turn.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      ) : script ? (
        <details className="text-xs text-muted-foreground pt-2">
          <summary className="cursor-pointer mb-2 font-medium text-foreground hover:underline">
            Show Raw Transcript
          </summary>
          <pre className="whitespace-pre-wrap text-left p-3 bg-muted/40 border border-border rounded-xl font-mono text-xs text-foreground/80">
            {script}
          </pre>
        </details>
      ) : null}
    </div>
  );
}
