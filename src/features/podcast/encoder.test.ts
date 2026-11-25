import { describe, expect, it } from "vitest";
import { resampleLinear, selectEncoder } from "./encoder";
import { muxOggOpus, oggCrc32, preSkipFromDescription } from "./ogg";
import { concatPcm, encodeWav } from "./wav";

describe("selectEncoder", () => {
  const full = { hasAudioEncoder: true, opusSampleRate: 24_000, canPlayOggOpus: true };
  it("prefers Opus when the browser can encode and play it", () => {
    expect(selectEncoder(full)).toBe("opus-ogg");
  });
  it("falls back to WAV without WebCodecs, without Opus support, or without Ogg playback", () => {
    expect(selectEncoder({ ...full, hasAudioEncoder: false })).toBe("wav");
    expect(selectEncoder({ ...full, opusSampleRate: null })).toBe("wav");
    expect(selectEncoder({ ...full, canPlayOggOpus: false })).toBe("wav");
  });
});

describe("encodeWav", () => {
  it("writes a 16-bit mono PCM WAV header and clamped samples", () => {
    const bytes = encodeWav(new Float32Array([0, 1, -1, 2, -0.5]), 24_000);
    const view = new DataView(bytes.buffer);
    const ascii = (o: number) => String.fromCharCode(...bytes.slice(o, o + 4));
    expect(bytes.length).toBe(44 + 5 * 2);
    expect(ascii(0)).toBe("RIFF");
    expect(view.getUint32(4, true)).toBe(36 + 10);
    expect(ascii(8)).toBe("WAVE");
    expect(view.getUint16(20, true)).toBe(1); // PCM
    expect(view.getUint16(22, true)).toBe(1); // mono
    expect(view.getUint32(24, true)).toBe(24_000);
    expect(view.getUint32(28, true)).toBe(48_000);
    expect(view.getUint16(34, true)).toBe(16);
    expect(ascii(36)).toBe("data");
    expect(view.getUint32(40, true)).toBe(10);
    expect([0, 1, 2, 3, 4].map((i) => view.getInt16(44 + i * 2, true))).toEqual([0, 32767, -32768, 32767, -16384]);
  });

  it("concatPcm inserts silence between chunks only", () => {
    const out = concatPcm([new Float32Array([1, 1]), new Float32Array([2])], 10, 0.2);
    expect(Array.from(out)).toEqual([1, 1, 0, 0, 2]);
  });
});

describe("Ogg Opus muxing", () => {
  it("builds valid CRC'd pages with OpusHead first and EOS last", () => {
    const packets = [new Uint8Array([1, 2, 3]), new Uint8Array(300).fill(7)];
    const ogg = muxOggOpus({ packets, packetSamples: [960, 960], totalSamples: 1500, inputSampleRate: 24_000, preSkip: 312 });
    expect(String.fromCharCode(...ogg.slice(0, 4))).toBe("OggS");
    expect(ogg[5]).toBe(0x02); // BOS
    expect(String.fromCharCode(...ogg.slice(28, 36))).toBe("OpusHead");

    // Walk pages, verify each CRC and find the final granule.
    let offset = 0;
    let lastFlags = 0;
    let lastGranule = 0;
    let pages = 0;
    while (offset < ogg.length) {
      const nsegs = ogg[offset + 26];
      const lacing = ogg.slice(offset + 27, offset + 27 + nsegs);
      const size = 27 + nsegs + lacing.reduce((a, b) => a + b, 0);
      const page = ogg.slice(offset, offset + size);
      const view = new DataView(page.buffer);
      const crc = view.getUint32(22, true);
      view.setUint32(22, 0, true);
      expect(oggCrc32(page)).toBe(crc);
      lastFlags = page[5];
      lastGranule = view.getUint32(6, true);
      offset += size;
      pages++;
    }
    expect(pages).toBe(3);
    expect(lastFlags).toBe(0x04); // EOS
    expect(lastGranule).toBe(312 + 1500); // end-trimmed
  });

  it("reads pre-skip from an OpusHead description", () => {
    const head = new Uint8Array(19);
    head.set(Array.from("OpusHead", (c) => c.charCodeAt(0)));
    head[10] = 0x38;
    head[11] = 0x01;
    expect(preSkipFromDescription(head)).toBe(312);
    expect(preSkipFromDescription(new Uint8Array(4))).toBeNull();
  });

  it("resampleLinear doubles length when upsampling 24k -> 48k", () => {
    expect(resampleLinear(new Float32Array([0, 1]), 24_000, 48_000).length).toBe(4);
  });
});
