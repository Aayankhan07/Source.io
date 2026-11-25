import type { Speaker } from "./script";

/** Voice ids from kokoro-js's Kokoro-82M v1.0 voice list. */
export type KokoroVoiceId =
  | "af_heart"
  | "af_bella"
  | "am_michael"
  | "am_fenrir"
  | "bf_emma"
  | "bm_george";

export type HostVoices = Record<Speaker, KokoroVoiceId>;

export interface VoiceDuo {
  /** Matches PodcastVoiceDuo in settings/types.ts. */
  value: "chen-marcus" | "rachel-alex" | "emma-daniel";
  title: string;
  hosts: string;
  desc: string;
  style: string;
  voices: HostVoices;
}

export const VOICE_DUOS: VoiceDuo[] = [
  {
    value: "chen-marcus",
    title: "Clear & Analytical",
    hosts: "Michael & Heart (US English)",
    desc: "Balanced pacing for deep-dive explanations.",
    style: "Default",
    voices: { host_1: "am_michael", host_2: "af_heart" },
  },
  {
    value: "rachel-alex",
    title: "Lively & Upbeat",
    hosts: "Bella & Fenrir (US English)",
    desc: "Brighter, more energetic voices.",
    style: "Dynamic",
    voices: { host_1: "af_bella", host_2: "am_fenrir" },
  },
  {
    value: "emma-daniel",
    title: "Warm & British",
    hosts: "Emma & George (UK English)",
    desc: "Calm British voices for relaxed revision.",
    style: "Calm",
    voices: { host_1: "bf_emma", host_2: "bm_george" },
  },
];

export function voicesForDuo(duo: string | null | undefined): HostVoices {
  return (VOICE_DUOS.find((d) => d.value === duo) ?? VOICE_DUOS[0]).voices;
}
