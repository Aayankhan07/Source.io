// Two-tier TTS: try Microsoft Edge TTS first (high-quality neural voices),
// fall back to Google Translate TTS (free, no auth) on failure.

const EDGE_TTS_TRUSTED_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
const EDGE_TTS_WSS = "wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1";
const WIN_EPOCH = 11644473600n;
const GOOGLE_TTS_BASE = "https://translate.google.com/translate_tts";

function chunkText(text: string, maxLen = 180): string[] {
  const sentences = text.replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let current = "";
  for (const s of sentences) {
    if ((current + " " + s).trim().length > maxLen) {
      if (current) chunks.push(current.trim());
      if (s.length > maxLen) {
        for (let i = 0; i < s.length; i += maxLen) chunks.push(s.slice(i, i + maxLen));
        current = "";
      } else current = s;
    } else current = (current + " " + s).trim();
  }
  if (current) chunks.push(current.trim());
  return chunks;
}

function concat(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((s, c) => s + c.byteLength, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) { out.set(c, off); off += c.byteLength; }
  return out;
}

// ---------- Edge TTS ----------
async function generateSecMsGec(): Promise<string> {
  const unixSec = BigInt(Math.floor(Date.now() / 1000));
  const ticks = ((unixSec + WIN_EPOCH) - ((unixSec + WIN_EPOCH) % 300n)) * 10_000_000n;
  const data = new TextEncoder().encode(`${ticks.toString()}${EDGE_TTS_TRUSTED_TOKEN}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0").toUpperCase()).join("");
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function ssmlFor(text: string, voice: string): string {
  return `<speak version='1.0' xml:lang='en-US'><voice xml:lang='en-US' xml:gender='Female' name='${voice}'><prosody pitch='+0Hz' rate='+0%' volume='+0%'>${escapeXml(text)}</prosody></voice></speak>`;
}

async function synthesizeEdge(text: string, voice: string): Promise<Uint8Array> {
  const sec = await generateSecMsGec();
  const connectionId = crypto.randomUUID().replace(/-/g, "");
  const url = `${EDGE_TTS_WSS}?TrustedClientToken=${EDGE_TTS_TRUSTED_TOKEN}&Sec-MS-GEC=${sec}&Sec-MS-GEC-Version=1-130.0.2849.68&ConnectionId=${connectionId}`;

  return await new Promise<Uint8Array>((resolve, reject) => {
    const ws = new WebSocket(url);
    const audioParts: Uint8Array[] = [];
    let done = false;
    const finish = (err: Error | null, data?: Uint8Array) => {
      if (done) return; done = true;
      try { ws.close(); } catch { /* ignore */ }
      err ? reject(err) : resolve(data!);
    };
    const timeout = setTimeout(() => finish(new Error("EDGE_TTS_TIMEOUT")), 30_000);

    ws.binaryType = "arraybuffer";
    ws.onopen = () => {
      const ts = new Date().toISOString();
      const config =
        `X-Timestamp:${ts}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n` +
        `{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"false"},"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}`;
      ws.send(config);
      const ssml =
        `X-RequestId:${connectionId}\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:${ts}Z\r\nPath:ssml\r\n\r\n` +
        ssmlFor(text, voice);
      ws.send(ssml);
    };
    ws.onmessage = (evt) => {
      if (typeof evt.data === "string") {
        if (evt.data.includes("Path:turn.end")) { clearTimeout(timeout); finish(null, concat(audioParts)); }
      } else {
        const buf = new Uint8Array(evt.data as ArrayBuffer);
        // Binary frame: first 2 bytes = header length (big-endian)
        const headerLen = (buf[0] << 8) | buf[1];
        audioParts.push(buf.slice(2 + headerLen));
      }
    };
    ws.onerror = () => { clearTimeout(timeout); finish(new Error("EDGE_TTS_WS_ERROR")); };
    ws.onclose = (e) => { if (!done) { clearTimeout(timeout); finish(new Error(`EDGE_TTS_CLOSED:${e.code}`)); } };
  });
}

// ---------- Google fallback ----------
async function fetchGoogleChunk(text: string): Promise<Uint8Array> {
  const url = `${GOOGLE_TTS_BASE}?ie=UTF-8&q=${encodeURIComponent(text)}&tl=en&client=tw-ob&total=1&idx=0&textlen=${text.length}`;
  const resp = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Referer": "https://translate.google.com/",
    },
  });
  if (!resp.ok) throw new Error(`GOOGLE_TTS_FAILED:${resp.status}`);
  return new Uint8Array(await resp.arrayBuffer());
}

async function synthesizeGoogle(text: string): Promise<Uint8Array> {
  const pieces = chunkText(text);
  const audios: Uint8Array[] = [];
  for (const piece of pieces) {
    let lastErr: unknown = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try { audios.push(await fetchGoogleChunk(piece)); lastErr = null; break; }
      catch (e) { lastErr = e; await new Promise((r) => setTimeout(r, 300 * (attempt + 1))); }
    }
    if (lastErr) throw lastErr;
  }
  return concat(audios);
}

// ---------- Public API ----------
export async function synthesize(text: string, voice: string): Promise<Uint8Array> {
  try {
    return await synthesizeEdge(text, voice);
  } catch (e) {
    console.warn("Edge TTS failed, falling back to Google TTS:", e instanceof Error ? e.message : e);
    return await synthesizeGoogle(text);
  }
}
