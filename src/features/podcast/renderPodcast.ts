import type { Segment } from "./script";
import type { HostVoices } from "./voices";
import type { RenderDevice, WorkerRequest, WorkerResponse } from "./workerProtocol";

export type RenderProgress =
  | { stage: "loading-model"; device: RenderDevice; loaded: number; total: number }
  | { stage: "synthesizing"; device: RenderDevice; index: number; total: number };

/**
 * Renders the dialogue to mono PCM in a dedicated Web Worker. Aborting terminates the
 * worker, which also releases the model's memory.
 */
export function renderPodcastPcm(
  segments: Segment[],
  voices: HostVoices,
  options: { allowWebGpu: boolean; signal?: AbortSignal; onProgress?: (p: RenderProgress) => void },
): Promise<{ pcm: Float32Array; sampleRate: number }> {
  return new Promise((resolve, reject) => {
    if (options.signal?.aborted) {
      reject(new DOMException("Cancelled", "AbortError"));
      return;
    }
    const worker = new Worker(new URL("./kokoro.worker.ts", import.meta.url), { type: "module" });
    let device: RenderDevice = "wasm";
    let settled = false;
    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      options.signal?.removeEventListener("abort", onAbort);
      worker.terminate();
      fn();
    };
    const onAbort = () => finish(() => reject(new DOMException("Cancelled", "AbortError")));
    options.signal?.addEventListener("abort", onAbort);

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const msg = event.data;
      switch (msg.type) {
        case "stage":
          device = msg.device;
          if (msg.stage === "loading-model") options.onProgress?.({ stage: "loading-model", device, loaded: 0, total: 0 });
          break;
        case "model-progress":
          options.onProgress?.({ stage: "loading-model", device, loaded: msg.loaded, total: msg.total });
          break;
        case "segment":
          options.onProgress?.({ stage: "synthesizing", device, index: msg.index, total: msg.total });
          break;
        case "done":
          finish(() => resolve({ pcm: msg.pcm, sampleRate: msg.sampleRate }));
          break;
        case "error":
          finish(() => reject(new Error(msg.message)));
          break;
      }
    };
    worker.onerror = (event) => {
      event.preventDefault();
      finish(() => reject(new Error(event.message || "The voice model stopped unexpectedly.")));
    };

    const request: WorkerRequest = { type: "render", segments, voices, allowWebGpu: options.allowWebGpu };
    worker.postMessage(request);
  });
}
