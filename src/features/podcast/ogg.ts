// Minimal Ogg Opus muxer (RFC 7845) for packets produced by WebCodecs' AudioEncoder.

const OPUS_GRANULE_RATE = 48_000;
/** libopus encoder lookahead at 48 kHz, used when the encoder does not report its own pre-skip. */
export const DEFAULT_OPUS_PRE_SKIP = 312;

let crcTable: Uint32Array | null = null;
function getCrcTable(): Uint32Array {
  if (crcTable) return crcTable;
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let r = i << 24;
    for (let j = 0; j < 8; j++) r = r & 0x80000000 ? (r << 1) ^ 0x04c11db7 : r << 1;
    table[i] = r >>> 0;
  }
  crcTable = table;
  return table;
}

/** Ogg's CRC-32 (polynomial 0x04c11db7, no reflection, initial value 0). */
export function oggCrc32(bytes: Uint8Array): number {
  const table = getCrcTable();
  let crc = 0;
  for (let i = 0; i < bytes.length; i++) crc = ((crc << 8) ^ table[((crc >>> 24) ^ bytes[i]) & 0xff]) >>> 0;
  return crc >>> 0;
}

function writeAscii(target: Uint8Array, offset: number, text: string) {
  for (let i = 0; i < text.length; i++) target[offset + i] = text.charCodeAt(i);
}

function buildPage(
  packets: Uint8Array[],
  granule: number,
  serial: number,
  sequence: number,
  flags: number,
): Uint8Array {
  const lacing: number[] = [];
  for (const p of packets) {
    let len = p.length;
    while (len >= 255) {
      lacing.push(255);
      len -= 255;
    }
    lacing.push(len);
  }
  const bodySize = packets.reduce((n, p) => n + p.length, 0);
  const page = new Uint8Array(27 + lacing.length + bodySize);
  const view = new DataView(page.buffer);
  writeAscii(page, 0, "OggS");
  page[4] = 0; // version
  page[5] = flags;
  view.setUint32(6, granule % 0x1_0000_0000, true);
  view.setUint32(10, Math.floor(granule / 0x1_0000_0000), true);
  view.setUint32(14, serial, true);
  view.setUint32(18, sequence, true);
  view.setUint32(22, 0, true); // CRC placeholder
  page[26] = lacing.length;
  page.set(lacing, 27);
  let offset = 27 + lacing.length;
  for (const p of packets) {
    page.set(p, offset);
    offset += p.length;
  }
  view.setUint32(22, oggCrc32(page), true);
  return page;
}

function opusHead(channels: number, preSkip: number, inputSampleRate: number): Uint8Array {
  const head = new Uint8Array(19);
  const view = new DataView(head.buffer);
  writeAscii(head, 0, "OpusHead");
  head[8] = 1; // version
  head[9] = channels;
  view.setUint16(10, preSkip, true);
  view.setUint32(12, inputSampleRate, true);
  view.setInt16(16, 0, true); // output gain
  head[18] = 0; // channel mapping family
  return head;
}

function opusTags(vendor: string): Uint8Array {
  const tags = new Uint8Array(8 + 4 + vendor.length + 4);
  const view = new DataView(tags.buffer);
  writeAscii(tags, 0, "OpusTags");
  view.setUint32(8, vendor.length, true);
  writeAscii(tags, 12, vendor);
  view.setUint32(12 + vendor.length, 0, true); // no user comments
  return tags;
}

/** Reads the pre-skip from an OpusHead decoder description, if the encoder supplied one. */
export function preSkipFromDescription(description: ArrayBuffer | ArrayBufferView | undefined): number | null {
  if (!description) return null;
  const bytes = ArrayBuffer.isView(description)
    ? new Uint8Array(description.buffer, description.byteOffset, description.byteLength)
    : new Uint8Array(description);
  if (bytes.length < 19 || String.fromCharCode(...Array.from(bytes.subarray(0, 8))) !== "OpusHead") return null;
  return bytes[10] | (bytes[11] << 8);
}

export interface OggOpusInput {
  packets: Uint8Array[];
  /** Duration of each packet in 48 kHz samples (20 ms = 960). */
  packetSamples: number[];
  /** Length of the original audio in 48 kHz samples, for end trimming. */
  totalSamples: number;
  inputSampleRate: number;
  channels?: number;
  preSkip?: number;
}

/** Wraps Opus packets in an Ogg container playable by <audio>. */
export function muxOggOpus(input: OggOpusInput): Uint8Array {
  const channels = input.channels ?? 1;
  const preSkip = input.preSkip ?? DEFAULT_OPUS_PRE_SKIP;
  const serial = (Math.random() * 0xffffffff) >>> 0;
  const pages: Uint8Array[] = [];
  let sequence = 0;

  pages.push(buildPage([opusHead(channels, preSkip, input.inputSampleRate)], 0, serial, sequence++, 0x02));
  pages.push(buildPage([opusTags("Source.io kokoro-js")], 0, serial, sequence++, 0));

  const endGranule = preSkip + Math.round(input.totalSamples);
  let granule = 0;
  let batch: Uint8Array[] = [];
  let lacingCount = 0;
  let batchSamples = 0;
  const flush = (last: boolean) => {
    if (batch.length === 0 && !last) return;
    const g = last ? Math.min(granule, endGranule) : granule;
    pages.push(buildPage(batch, g, serial, sequence++, last ? 0x04 : 0));
    batch = [];
    lacingCount = 0;
    batchSamples = 0;
  };

  input.packets.forEach((packet, i) => {
    const lacing = Math.floor(packet.length / 255) + 1;
    if (lacingCount + lacing > 255 || batchSamples >= OPUS_GRANULE_RATE) flush(false);
    batch.push(packet);
    lacingCount += lacing;
    const samples = input.packetSamples[i] ?? 960;
    batchSamples += samples;
    granule += samples;
  });
  flush(true);

  const total = pages.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const p of pages) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
}
