/** Kokoro-82M outputs mono float PCM at 24 kHz. */
export const KOKORO_SAMPLE_RATE = 24_000;

/** Joins PCM chunks with `gapSeconds` of silence between them. */
export function concatPcm(chunks: Float32Array[], sampleRate: number, gapSeconds = 0): Float32Array {
  const gap = Math.max(0, Math.round(gapSeconds * sampleRate));
  const total = chunks.reduce((n, c) => n + c.length, 0) + gap * Math.max(0, chunks.length - 1);
  const out = new Float32Array(total);
  let offset = 0;
  chunks.forEach((chunk, i) => {
    out.set(chunk, offset);
    offset += chunk.length + (i < chunks.length - 1 ? gap : 0);
  });
  return out;
}

/** Encodes mono float PCM ([-1, 1]) as a 16-bit little-endian PCM WAV file. */
export function encodeWav(pcm: Float32Array, sampleRate: number): Uint8Array {
  const bytesPerSample = 2;
  const dataSize = pcm.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  const writeAscii = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
  };

  writeAscii(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(8, "WAVE");
  writeAscii(12, "fmt ");
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * bytesPerSample, true); // byte rate
  view.setUint16(32, bytesPerSample, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeAscii(36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < pcm.length; i++) {
    const s = Math.max(-1, Math.min(1, pcm[i] || 0));
    view.setInt16(offset, s < 0 ? Math.round(s * 0x8000) : Math.round(s * 0x7fff), true);
    offset += 2;
  }
  return new Uint8Array(buffer);
}
