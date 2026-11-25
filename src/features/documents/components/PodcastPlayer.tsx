"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  Headphones,
  Download,
  Loader2,
  Sparkles,
  RefreshCw,
  AudioLines,
  Speaker,
  Square,
  Pause,
  Play,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PodcastRow } from "@/features/documents/types";
import { useSettings } from "@/features/settings/context/SettingsContext";
import { usePodcastAudio, type AudioJob } from "@/features/podcast/usePodcastAudio";
import { useDeviceVoices } from "@/features/podcast/useDeviceVoices";
import { tryParseScript, type Segment } from "@/features/podcast/script";
import { modelDownloadMb } from "@/features/podcast/workerProtocol";

export interface PodcastPlayerProps {
  podcast: PodcastRow | null;
  /** Generates (or regenerates) the two-host script on the server. */
  onGenerate: () => void;
  loading: boolean;
}

type PodcastWithPath = PodcastRow & { audio_path?: string | null };

const HOST_LABEL: Record<Segment["speaker"], string> = { host_1: "Host 1", host_2: "Host 2" };

export function PodcastPlayer({ podcast, onGenerate, loading }: PodcastPlayerProps) {
  const row = podcast as PodcastWithPath | null;
  const script = row?.script ?? null;
  const segments = useMemo(() => tryParseScript(script), [script]);
  const { settings } = useSettings();
  const refreshKey = `${row?.id ?? ""}:${row?.status ?? ""}:${row?.audio_path ?? ""}:${row?.audio_url ?? ""}:${script?.length ?? 0}`;
  const audio = usePodcastAudio(row?.document_id ?? null, refreshKey);
  const device = useDeviceVoices(segments);
  const title = row?.title || "Audio recap";
  const generating = loading || row?.status === "generating";

  if (!script) {
    return (
      <div className="bg-card p-8 rounded-3xl border border-border text-center space-y-4 shadow-tactile-card">
        <div className="size-12 rounded-2xl bg-muted border border-border flex items-center justify-center mx-auto mb-2 shadow-tactile-pill">
          <Headphones className="size-6 text-muted-foreground" aria-hidden="true" />
        </div>
        <h3 className="font-semibold text-foreground font-display text-base">No podcast yet</h3>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          {row?.status === "failed"
            ? "The last attempt didn't finish. Nothing was charged for a failed script."
            : "Write a two-host audio walkthrough grounded in your notes. Uses one AI action."}
        </p>
        <Button onClick={onGenerate} disabled={generating} className="rounded-full text-xs h-9 px-4">
          {generating ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" aria-hidden="true" /> : <Sparkles className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />}
          {generating ? "Writing script…" : "Generate podcast script"}
        </Button>
      </div>
    );
  }

  const busy = audio.job.phase !== "idle" && audio.job.phase !== "error";
  const noRendersLeft = audio.rendersRemaining === 0;

  return (
    <div className="bg-card p-6 sm:p-8 rounded-[28px] border border-border shadow-tactile-card space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-10 rounded-2xl bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200/80 dark:border-sky-800/60 flex items-center justify-center shrink-0 shadow-tactile-pill">
            <Headphones className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-bold">Two-host audio recap</span>
            <h3 className="font-bold text-foreground font-display text-base truncate">{title}</h3>
          </div>
        </div>
        <Button
          onClick={() => { device.stop(); onGenerate(); }}
          disabled={generating || busy}
          variant="outline"
          size="sm"
          className="rounded-full text-xs h-8 px-3 gap-1.5"
        >
          {generating ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : <RefreshCw className="size-3.5" aria-hidden="true" />}
          <span>{generating ? "Writing script…" : "New script"}</span>
        </Button>
      </div>

      {busy ? (
        <RenderProgressPanel job={audio.job} modelCached={audio.modelCached} onCancel={audio.cancel} />
      ) : audio.audioUrl ? (
        <CustomAudioPlayer audioUrl={audio.audioUrl} title={title} defaultRate={settings?.playbackSpeed} />
      ) : (
        <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-3">
          <p className="text-sm font-semibold text-foreground">Listen to this script</p>
          {audio.support && !audio.support.ok ? (
            <p className="text-xs text-muted-foreground">{audio.support.reason} You can still listen with your device&apos;s voices.</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Studio voices are created on this device and saved to your library.
              {audio.modelCached === false && audio.support?.ok && (
                <> One-time ~{modelDownloadMb(audio.support.device)} MB voice model download.</>
              )}
              {audio.rendersRemaining !== null && (
                <> {audio.rendersRemaining} audio {audio.rendersRemaining === 1 ? "render" : "renders"} left today.</>
              )}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {audio.support?.ok && (
              <Button
                onClick={() => { device.stop(); void audio.createAudio(script, settings?.podcastVoiceDuo ?? "chen-marcus"); }}
                disabled={!segments || noRendersLeft || audio.urlLoading}
                className="rounded-full text-xs h-9 px-4 gap-1.5"
              >
                <AudioLines className="size-3.5" aria-hidden="true" />
                {noRendersLeft ? "No audio renders left today" : "Create audio"}
              </Button>
            )}
            {device.supported && (
              <Button
                onClick={() => (device.speaking ? device.stop() : device.playFrom(0))}
                disabled={!segments}
                variant="outline"
                className="rounded-full text-xs h-9 px-4 gap-1.5"
              >
                {device.speaking ? <Square className="size-3.5" aria-hidden="true" /> : <Speaker className="size-3.5" aria-hidden="true" />}
                {device.speaking ? "Stop device voices" : "Play with device voices"}
              </Button>
            )}
            {device.speaking && (
              <Button onClick={device.togglePause} variant="outline" className="rounded-full text-xs h-9 px-4 gap-1.5">
                {device.paused ? <Play className="size-3.5" aria-hidden="true" /> : <Pause className="size-3.5" aria-hidden="true" />}
                {device.paused ? "Resume" : "Pause"}
              </Button>
            )}
          </div>
          {audio.job.phase === "error" && (
            <p role="alert" className="text-xs text-destructive">{audio.job.message}</p>
          )}
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-sm text-foreground">Script</h4>
          {device.supported && segments && (
            <span className="text-xs text-muted-foreground">Select a line to hear it with device voices</span>
          )}
        </div>
        {segments ? (
          <ol className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {segments.map((seg, i) => {
              const active = device.current === i;
              return (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => device.supported && device.playFrom(i)}
                    disabled={!device.supported}
                    aria-current={active ? "true" : undefined}
                    className={cn(
                      "w-full text-left p-3.5 rounded-2xl border text-sm leading-relaxed space-y-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      active
                        ? "bg-sky-50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-700"
                        : seg.speaker === "host_1"
                          ? "bg-background border-border hover:bg-muted/40"
                          : "bg-muted/30 border-border/60 hover:bg-muted/50",
                    )}
                  >
                    <span className={cn("block text-xs font-bold", seg.speaker === "host_1" ? "text-foreground" : "text-sky-700 dark:text-sky-400")}>
                      {HOST_LABEL[seg.speaker]}
                    </span>
                    <span className="block text-foreground/90">{seg.text}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        ) : (
          <pre className="whitespace-pre-wrap text-left p-3 bg-muted/40 border border-border rounded-xl font-mono text-xs text-foreground/80 max-h-[500px] overflow-y-auto">
            {script}
          </pre>
        )}
      </div>
    </div>
  );
}

function RenderProgressPanel({ job, modelCached, onCancel }: { job: AudioJob; modelCached: boolean | null; onCancel: () => void }) {
  let label = "Preparing…";
  let fraction: number | null = null;
  let detail: string | null = null;
  if (job.phase === "loading-model") {
    label = modelCached ? "Loading voice model…" : "Downloading voice model (one time)…";
    if (job.total > 0) {
      fraction = job.loaded / job.total;
      detail = `${Math.round(job.loaded / 1_048_576)} of ${Math.round(job.total / 1_048_576)} MB`;
    } else if (!modelCached) {
      detail = `About ${modelDownloadMb(job.device)} MB. It's saved in your browser for next time.`;
    }
  } else if (job.phase === "synthesizing") {
    label = `Voicing line ${job.index + 1} of ${job.total}`;
    fraction = job.total > 0 ? job.index / job.total : null;
    detail = "Keep this tab open. Audio is created on your device.";
  } else if (job.phase === "encoding") {
    label = "Compressing audio…";
  } else if (job.phase === "uploading") {
    label = "Saving audio…";
  }

  return (
    <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-3" aria-live="polite">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          {label}
        </p>
        {(job.phase === "loading-model" || job.phase === "synthesizing") && (
          <Button onClick={onCancel} variant="outline" size="sm" className="rounded-full text-xs h-8 px-3 gap-1.5">
            <X className="size-3.5" aria-hidden="true" />
            Cancel
          </Button>
        )}
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={fraction === null ? undefined : Math.round(fraction * 100)}
        className="h-2 bg-muted rounded-full overflow-hidden"
      >
        <div
          className={cn("h-full bg-sky-600 dark:bg-sky-500 rounded-full transition-all", fraction === null && "w-1/3 animate-pulse")}
          style={fraction === null ? undefined : { width: `${Math.max(2, Math.min(100, fraction * 100))}%` }}
        />
      </div>
      {detail && <p className="text-xs text-muted-foreground">{detail}</p>}
    </div>
  );
}

export interface CustomAudioPlayerProps {
  audioUrl: string;
  title: string;
  defaultRate?: number;
}

const RATES = [1.0, 1.25, 1.5, 1.75, 2.0];

export function CustomAudioPlayer({ audioUrl, title, defaultRate = 1 }: CustomAudioPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState<number>(RATES.includes(defaultRate) ? defaultRate : 1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.playbackRate = playbackRate;
  }, [playbackRate, audioUrl]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play().catch((err) => {
        console.warn("Audio playback not supported or interrupted:", err);
        setPlaying(false);
      });
    }
  };

  const formatSecs = (sec: number) => {
    if (!sec || !Number.isFinite(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const ext = /\.wav(\?|$)/i.test(audioUrl) ? "wav" : /\.mp3(\?|$)/i.test(audioUrl) ? "mp3" : "ogg";
  const fileName = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "podcast"}.${ext}`;

  return (
    <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-3">
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        onLoadedMetadata={(e) => setDuration(Number.isFinite(e.currentTarget.duration) ? e.currentTarget.duration : 0)}
        onDurationChange={(e) => Number.isFinite(e.currentTarget.duration) && setDuration(e.currentTarget.duration)}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={togglePlay}
          className="size-12 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-tactile-pill cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label={playing ? "Pause podcast" : "Play podcast"}
        >
          {playing ? <Pause className="size-5" aria-hidden="true" /> : <Play className="size-5 ml-0.5" aria-hidden="true" />}
        </button>
        <div className="flex-1 space-y-1.5 min-w-0">
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={Math.min(currentTime, duration || 0)}
            onChange={(e) => {
              const t = Number(e.target.value);
              if (audioRef.current) audioRef.current.currentTime = t;
              setCurrentTime(t);
            }}
            disabled={!duration}
            aria-label="Seek"
            aria-valuetext={`${formatSecs(currentTime)} of ${formatSecs(duration)}`}
            className="w-full accent-sky-600 cursor-pointer"
          />
          <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
            <span>{formatSecs(currentTime)}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPlaybackRate(RATES[(RATES.indexOf(playbackRate) + 1) % RATES.length])}
                className="px-2 py-0.5 rounded-full bg-muted border border-border text-xs font-bold text-foreground hover:bg-accent transition-colors cursor-pointer"
                aria-label={`Playback speed ${playbackRate}x. Change speed`}
              >
                {playbackRate}x
              </button>
              <a
                href={audioUrl}
                download={fileName}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-border text-xs text-foreground hover:bg-muted"
                aria-label="Download audio"
              >
                <Download className="size-3.5" aria-hidden="true" />
                <span>Download</span>
              </a>
              <span>{formatSecs(duration)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
