import { DEFAULT_OPUS_PRE_SKIP, muxOggOpus, preSkipFromDescription } from "./ogg";
import { encodeWav } from "./wav";

export type EncoderKind = "opus-ogg" | "wav";

export interface EncoderCapabilities {
  /** WebCodecs AudioEncoder exists. */
  hasAudioEncoder: boolean;
  /** Sample rate the browser's Opus encoder accepts, or null when Opus is unsupported. */
  opusSampleRate: number | null;
  /** This browser can play Ogg Opus back in <audio>. */
  canPlayOggOpus: boolean;
}

export interface EncodedPodcastAudio {
  blob: Blob;
  kind: EncoderKind;
  ext: "ogg" | "wav";
  contentType: string;
}

const OPUS_BITRATE = 32_000;

/**
 * Picks the most compact format this browser can both produce and play.
 * MediaRecorder is deliberately not used: it records in real time, so a 6-minute episode
 * would take 6 minutes to encode. WebCodecs encodes faster than real time.
 */
export function selectEncoder(caps: EncoderCapabilities): EncoderKind {
  if (caps.hasAudioEncoder && caps.opusSampleRate !== null && caps.canPlayOggOpus) return "opus-ogg";
  return "wav";
}

export async function detectEncoderCapabilities(sourceSampleRate: number): Promise<EncoderCapabilities> {
  const hasAudioEncoder = typeof globalThis.AudioEncoder === "function" && typeof globalThis.AudioData === "function";
  let canPlayOggOpus = false;
  try {
    canPlayOggOpus = typeof document !== "undefined" &&
      document.createElement("audio").canPlayType('audio/ogg; codecs="opus"') !== "";
  } catch {
    canPlayOggOpus = false;
  }

  let opusSampleRate: number | null = null;
  if (hasAudioEncoder) {
    for (const sampleRate of [sourceSampleRate, 48_000]) {
      try {
        const res = await AudioEncoder.isConfigSupported({
          codec: "opus",
          sampleRate,
          numberOfChannels: 1,
          bitrate: OPUS_BITRATE,
        });
        if (res.supported) {
          opusSampleRate = sampleRate;
          break;
        }
      } catch {
        // try the next rate
      }
    }
  }
  return { hasAudioEncoder, opusSampleRate, canPlayOggOpus };
}

/** Linear-interpolation resampler, used only when the Opus encoder rejects 24 kHz input. */
export function resampleLinear(pcm: Float32Array, from: number, to: number): Float32Array {
  if (from === to) return pcm;
  const outLength = Math.round((pcm.length * to) / from);
  const out = new Float32Array(outLength);
  const ratio = from / to;
  for (let i = 0; i < outLength; i++) {
    const pos = i * ratio;
    const i0 = Math.floor(pos);
    const i1 = Math.min(i0 + 1, pcm.length - 1);
    const t = pos - i0;
    out[i] = (pcm[i0] ?? 0) * (1 - t) + (pcm[i1] ?? 0) * t;
  }
  return out;
}

async function encodeOpusOgg(pcm: Float32Array, sourceRate: number, encoderRate: number): Promise<Uint8Array> {
  const input = resampleLinear(pcm, sourceRate, encoderRate);
  const packets: Uint8Array[] = [];
  const packetSamples: number[] = [];
  let preSkip: number | null = null;
  let failure: unknown = null;

  const encoder = new AudioEncoder({
    output: (chunk, metadata) => {
      const data = new Uint8Array(chunk.byteLength);
      chunk.copyTo(data);
      packets.push(data);
      packetSamples.push(Math.round(((chunk.duration ?? 20_000) * 48_000) / 1_000_000));
      if (preSkip === null) preSkip = preSkipFromDescription(metadata?.decoderConfig?.description);
    },
    error: (e) => {
      failure = e;
    },
  });
  encoder.configure({ codec: "opus", sampleRate: encoderRate, numberOfChannels: 1, bitrate: OPUS_BITRATE });

  const block = encoderRate; // one second per AudioData
  for (let offset = 0; offset < input.length; offset += block) {
    const frames = input.slice(offset, Math.min(offset + block, input.length));
    const data = new AudioData({
      format: "f32",
      sampleRate: encoderRate,
      numberOfFrames: frames.length,
      numberOfChannels: 1,
      timestamp: Math.round((offset * 1_000_000) / encoderRate),
      data: frames,
    });
    encoder.encode(data);
    data.close();
  }
  await encoder.flush();
  encoder.close();
  if (failure) throw failure;
  if (packets.length === 0) throw new Error("OPUS_NO_OUTPUT");

  return muxOggOpus({
    packets,
    packetSamples,
    totalSamples: (input.length * 48_000) / encoderRate,
    inputSampleRate: sourceRate,
    preSkip: preSkip ?? DEFAULT_OPUS_PRE_SKIP,
  });
}

function toBlob(bytes: Uint8Array, type: string): Blob {
  // Copy into a plain ArrayBuffer so Blob typing is happy across TS lib versions.
  const buf = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buf).set(bytes);
  return new Blob([buf], { type });
}

/** Encodes mono PCM as Ogg Opus when supported, otherwise as 16-bit WAV. */
export async function encodePodcastAudio(pcm: Float32Array, sampleRate: number): Promise<EncodedPodcastAudio> {
  const caps = await detectEncoderCapabilities(sampleRate);
  if (selectEncoder(caps) === "opus-ogg") {
    try {
      const ogg = await encodeOpusOgg(pcm, sampleRate, caps.opusSampleRate!);
      return { blob: toBlob(ogg, "audio/ogg"), kind: "opus-ogg", ext: "ogg", contentType: "audio/ogg" };
    } catch (err) {
      console.warn("Opus encoding failed, falling back to WAV:", err);
    }
  }
  return { blob: toBlob(encodeWav(pcm, sampleRate), "audio/wav"), kind: "wav", ext: "wav", contentType: "audio/wav" };
}
