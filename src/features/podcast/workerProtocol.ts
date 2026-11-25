import type { Segment } from "./script";
import type { HostVoices } from "./voices";

export const KOKORO_MODEL_ID = "onnx-community/Kokoro-82M-v1.0-ONNX";

export type RenderDevice = "webgpu" | "wasm";

/** q8 (~90 MB) on the CPU/WASM path; fp32 (~310 MB) on WebGPU, where quantized ops are unreliable. */
export function modelDtypeFor(device: RenderDevice): "q8" | "fp32" {
  return device === "webgpu" ? "fp32" : "q8";
}

export function modelDownloadMb(device: RenderDevice): number {
  return device === "webgpu" ? 310 : 90;
}

export type WorkerRequest = {
  type: "render";
  segments: Segment[];
  voices: HostVoices;
  allowWebGpu: boolean;
};

export type WorkerResponse =
  | { type: "stage"; stage: "loading-model" | "synthesizing"; device: RenderDevice }
  | { type: "model-progress"; loaded: number; total: number }
  | { type: "segment"; index: number; total: number }
  | { type: "done"; pcm: Float32Array; sampleRate: number }
  | { type: "error"; message: string };
