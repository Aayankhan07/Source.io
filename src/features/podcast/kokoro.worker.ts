// Web Worker: synthesizes a two-host podcast script with Kokoro-82M (kokoro-js).
// kokoro-js and transformers.js are loaded with a dynamic import, so they never enter the main bundle.
// The model files are cached by transformers.js in Cache Storage after the first download.
import type { RenderDevice, WorkerRequest, WorkerResponse } from "./workerProtocol";
import { KOKORO_MODEL_ID, modelDtypeFor } from "./workerProtocol";
import { concatPcm, KOKORO_SAMPLE_RATE } from "./wav";

type KokoroModule = typeof import("kokoro-js");
type Kokoro = Awaited<ReturnType<KokoroModule["KokoroTTS"]["from_pretrained"]>>;

const ctx = self as unknown as {
  postMessage(message: WorkerResponse, transfer?: Transferable[]): void;
  addEventListener(type: "message", listener: (event: MessageEvent<WorkerRequest>) => void): void;
};

const post = (message: WorkerResponse, transfer?: Transferable[]) => ctx.postMessage(message, transfer);

/** Pause between hosts, in seconds. */
const TURN_GAP_SECONDS = 0.35;

async function hasWebGpu(): Promise<boolean> {
  try {
    const gpu = (navigator as unknown as { gpu?: { requestAdapter(): Promise<unknown> } }).gpu;
    if (!gpu) return false;
    return (await gpu.requestAdapter()) != null;
  } catch {
    return false;
  }
}

async function loadModel(device: RenderDevice): Promise<Kokoro> {
  const { KokoroTTS } = await import("kokoro-js");
  const files = new Map<string, { loaded: number; total: number }>();
  return await KokoroTTS.from_pretrained(KOKORO_MODEL_ID, {
    dtype: modelDtypeFor(device),
    device,
    progress_callback: (info: { status: string; file?: string; loaded?: number; total?: number }) => {
      if (info.status !== "progress" || !info.file) return;
      files.set(info.file, { loaded: info.loaded ?? 0, total: info.total ?? 0 });
      let loaded = 0;
      let total = 0;
      files.forEach((f) => {
        loaded += f.loaded;
        total += f.total;
      });
      post({ type: "model-progress", loaded, total });
    },
  });
}

async function synthesize(tts: Kokoro, text: string, voice: string): Promise<Float32Array> {
  // stream() splits long turns into sentences, keeping each call under the model's token limit.
  const parts: Float32Array[] = [];
  for await (const chunk of tts.stream(text, { voice: voice as never })) {
    parts.push(chunk.audio.audio as Float32Array);
  }
  return concatPcm(parts, KOKORO_SAMPLE_RATE, 0);
}

let busy = false;

ctx.addEventListener("message", async (event) => {
  const msg = event.data;
  if (msg?.type !== "render" || busy) return;
  busy = true;
  try {
    let device: RenderDevice = msg.allowWebGpu && (await hasWebGpu()) ? "webgpu" : "wasm";
    post({ type: "stage", stage: "loading-model", device });
    let tts: Kokoro;
    try {
      tts = await loadModel(device);
    } catch (err) {
      if (device !== "webgpu") throw err;
      device = "wasm";
      post({ type: "stage", stage: "loading-model", device });
      tts = await loadModel(device);
    }

    post({ type: "stage", stage: "synthesizing", device });
    const chunks: Float32Array[] = [];
    for (let i = 0; i < msg.segments.length; i++) {
      post({ type: "segment", index: i, total: msg.segments.length });
      const segment = msg.segments[i];
      const voice = msg.voices[segment.speaker];
      try {
        chunks.push(await synthesize(tts, segment.text, voice));
      } catch (err) {
        if (device !== "webgpu") throw err;
        // Some GPUs fail at inference time; finish on the CPU instead.
        device = "wasm";
        post({ type: "stage", stage: "loading-model", device });
        tts = await loadModel(device);
        post({ type: "stage", stage: "synthesizing", device });
        chunks.push(await synthesize(tts, segment.text, voice));
      }
    }

    const pcm = concatPcm(chunks, KOKORO_SAMPLE_RATE, TURN_GAP_SECONDS);
    post({ type: "done", pcm, sampleRate: KOKORO_SAMPLE_RATE }, [pcm.buffer]);
  } catch (err) {
    post({ type: "error", message: err instanceof Error ? err.message : String(err) });
  } finally {
    busy = false;
  }
});
