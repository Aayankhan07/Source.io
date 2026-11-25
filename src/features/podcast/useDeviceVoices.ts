"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { hasSpeechSynthesis } from "./capabilities";
import type { Segment } from "./script";

/** Chooses two distinct system voices, preferring the page language (English by default). */
export function pickHostVoices(
  voices: Pick<SpeechSynthesisVoice, "lang" | "name" | "localService" | "default">[],
  lang = "en",
): [number, number] | null {
  if (voices.length === 0) return null;
  const prefix = lang.slice(0, 2).toLowerCase();
  const indexed = voices.map((v, i) => ({ v, i }));
  const matching = indexed.filter(({ v }) => v.lang?.toLowerCase().startsWith(prefix));
  const pool = matching.length > 0 ? matching : indexed;
  const first = pool.find(({ v }) => v.default) ?? pool[0];
  const second = pool.find(({ i }) => i !== first.i) ?? first;
  return [first.i, second.i];
}

/**
 * Live playback of the script with the browser's built-in speechSynthesis voices.
 * Nothing is recorded or uploaded; this is the fallback for old or low-memory devices.
 */
export function useDeviceVoices(segments: Segment[] | null) {
  // Detected after mount so server and client render the same markup.
  const [supported, setSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [current, setCurrent] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const runRef = useRef(0);

  useEffect(() => {
    setSupported(hasSpeechSynthesis());
  }, []);

  useEffect(() => {
    if (!supported) return;
    const runs = runRef;
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.addEventListener?.("voiceschanged", load);
    return () => {
      window.speechSynthesis.removeEventListener?.("voiceschanged", load);
      runs.current++;
      window.speechSynthesis.cancel();
    };
  }, [supported]);

  const stop = useCallback(() => {
    if (!supported) return;
    runRef.current++;
    window.speechSynthesis.cancel();
    setCurrent(null);
    setPaused(false);
  }, [supported]);

  const playFrom = useCallback((start: number) => {
    if (!supported || !segments || segments.length === 0) return;
    const run = ++runRef.current;
    window.speechSynthesis.cancel();
    setPaused(false);
    const lang = (typeof document !== "undefined" && document.documentElement.lang) || "en";
    const pair = pickHostVoices(voices, lang);
    const speak = (i: number) => {
      if (run !== runRef.current) return;
      if (i >= segments.length) {
        setCurrent(null);
        return;
      }
      setCurrent(i);
      const seg = segments[i];
      const utterance = new SpeechSynthesisUtterance(seg.text);
      if (pair) {
        const voice = voices[seg.speaker === "host_1" ? pair[0] : pair[1]];
        utterance.voice = voice;
        utterance.lang = voice.lang;
        // Same voice for both hosts on devices with one voice: vary pitch so turns stay distinct.
        if (pair[0] === pair[1]) utterance.pitch = seg.speaker === "host_1" ? 0.9 : 1.15;
      }
      utterance.onend = () => speak(i + 1);
      utterance.onerror = () => {
        if (run === runRef.current) setCurrent(null);
      };
      window.speechSynthesis.speak(utterance);
    };
    speak(Math.max(0, start));
  }, [supported, segments, voices]);

  const togglePause = useCallback(() => {
    if (!supported || current === null) return;
    if (paused) {
      window.speechSynthesis.resume();
      setPaused(false);
    } else {
      window.speechSynthesis.pause();
      setPaused(true);
    }
  }, [supported, current, paused]);

  return { supported, speaking: current !== null, paused, current, playFrom, togglePause, stop };
}
