import { KOKORO_MODEL_ID, type RenderDevice } from "./workerProtocol";

export type RenderSupport =
  | { ok: true; device: RenderDevice; reason?: undefined }
  | { ok: false; reason: string; device?: undefined };

interface NavigatorLike {
  userAgent?: string;
  deviceMemory?: number;
  gpu?: unknown;
}

/**
 * Whether this browser can run Kokoro-82M locally. Old browsers and low-memory devices
 * (under 4 GB, or iOS where WebAssembly memory is tightly capped) use device voices instead.
 */
export function detectRenderSupport(
  env: { Worker?: unknown; WebAssembly?: unknown; navigator?: NavigatorLike } = globalThis as never,
): RenderSupport {
  if (typeof env.Worker !== "function" || typeof env.WebAssembly !== "object" || !env.WebAssembly) {
    return { ok: false, reason: "This browser can't run the voice model." };
  }
  const nav = env.navigator ?? {};
  if (typeof nav.deviceMemory === "number" && nav.deviceMemory < 4) {
    return { ok: false, reason: "This device doesn't have enough memory for the voice model." };
  }
  if (/iPhone|iPad|iPod/i.test(nav.userAgent ?? "")) {
    return { ok: false, reason: "Studio voices aren't available on iPhone or iPad yet." };
  }
  return { ok: true, device: nav.gpu ? "webgpu" : "wasm" };
}

/** Best effort: true when transformers.js already cached the Kokoro model files. */
export async function isVoiceModelCached(): Promise<boolean> {
  try {
    if (typeof caches === "undefined") return false;
    const cache = await caches.open("transformers-cache");
    const keys = await cache.keys();
    return keys.some((req) => req.url.includes(KOKORO_MODEL_ID) && req.url.endsWith(".onnx"));
  } catch {
    return false;
  }
}

export function hasSpeechSynthesis(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window && typeof SpeechSynthesisUtterance === "function";
}
