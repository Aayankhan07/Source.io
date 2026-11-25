"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getPodcastAudioUrl, uploadPodcastAudio } from "@/lib/services/podcast";
import { detectRenderSupport, isVoiceModelCached, type RenderSupport } from "./capabilities";
import { renderPodcastPcm, type RenderProgress } from "./renderPodcast";
import { parseScript } from "./script";
import { voicesForDuo } from "./voices";

export type AudioJob =
  | { phase: "idle" }
  | { phase: "loading-model"; device: "webgpu" | "wasm"; loaded: number; total: number }
  | { phase: "synthesizing"; index: number; total: number }
  | { phase: "encoding" }
  | { phase: "uploading" }
  | { phase: "error"; message: string };

/**
 * Loads the current audio URL (1-hour signed URL) and renders new audio in the browser.
 * `refreshKey` should change whenever the podcast row changes (new script or new audio).
 */
export function usePodcastAudio(documentId: string | null | undefined, refreshKey: string) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [rendersRemaining, setRendersRemaining] = useState<number | null>(null);
  const [urlLoading, setUrlLoading] = useState(false);
  const [job, setJob] = useState<AudioJob>({ phase: "idle" });
  const [support, setSupport] = useState<RenderSupport | null>(null);
  const [modelCached, setModelCached] = useState<boolean | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setSupport(detectRenderSupport());
    let alive = true;
    isVoiceModelCached().then((cached) => {
      if (alive) setModelCached(cached);
    });
    return () => {
      alive = false;
      abortRef.current?.abort();
    };
  }, []);

  const refreshUrl = useCallback(async (signal?: AbortSignal) => {
    if (!documentId) return;
    setUrlLoading(true);
    try {
      const res = await getPodcastAudioUrl(documentId, signal);
      if (signal?.aborted) return;
      setAudioUrl(res.url);
      setRendersRemaining(res.rendersRemaining);
    } catch (err) {
      if ((err as Error)?.name !== "AbortError") console.warn("podcast audio url failed", err);
    } finally {
      if (!signal?.aborted) setUrlLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    const ctrl = new AbortController();
    void refreshUrl(ctrl.signal);
    return () => ctrl.abort();
  }, [refreshUrl, refreshKey]);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setJob({ phase: "idle" });
  }, []);

  /** Renders the script locally, uploads it, and returns true on success. */
  const createAudio = useCallback(async (script: string, voiceDuo: string): Promise<boolean> => {
    if (!documentId || !support?.ok) return false;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const segments = parseScript(script);
      setJob({ phase: "loading-model", device: support.device, loaded: 0, total: 0 });
      const { pcm, sampleRate } = await renderPodcastPcm(segments, voicesForDuo(voiceDuo), {
        allowWebGpu: support.device === "webgpu",
        signal: ctrl.signal,
        onProgress: (p: RenderProgress) => {
          if (ctrl.signal.aborted) return;
          setJob(p.stage === "loading-model"
            ? { phase: "loading-model", device: p.device, loaded: p.loaded, total: p.total }
            : { phase: "synthesizing", index: p.index, total: p.total });
        },
      });
      setModelCached(true);
      if (ctrl.signal.aborted) return false;

      setJob({ phase: "encoding" });
      const { encodePodcastAudio } = await import("./encoder");
      const encoded = await encodePodcastAudio(pcm, sampleRate);
      if (ctrl.signal.aborted) return false;

      setJob({ phase: "uploading" });
      const res = await uploadPodcastAudio(documentId, encoded);
      if (res.rendersRemaining !== null) setRendersRemaining(res.rendersRemaining);
      if (res.url) setAudioUrl(res.url);
      else await refreshUrl();
      setJob({ phase: "idle" });
      return true;
    } catch (err) {
      if ((err as Error)?.name === "AbortError" || ctrl.signal.aborted) {
        setJob({ phase: "idle" });
        return false;
      }
      const raw = err instanceof Error ? err.message : String(err);
      const message = raw === "INVALID_SCRIPT_FORMAT"
        ? "This script can't be voiced. Regenerate the script and try again."
        : /memory|allocation|out of bounds/i.test(raw)
          ? "Your device ran out of memory while creating audio. Try playing with device voices instead."
          : raw;
      setJob({ phase: "error", message });
      return false;
    } finally {
      if (abortRef.current === ctrl) abortRef.current = null;
    }
  }, [documentId, support, refreshUrl]);

  return {
    audioUrl,
    rendersRemaining,
    urlLoading,
    job,
    support,
    modelCached,
    createAudio,
    cancel,
    refreshUrl,
  };
}
