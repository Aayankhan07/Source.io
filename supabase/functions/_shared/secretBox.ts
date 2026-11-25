// AES-256-GCM encryption for user API keys stored in public.user_api_keys (roadmap §6.0).
// The 32-byte master key comes from env BYOK_ENCRYPTION_KEY (base64). Without it, every
// operation fails closed: keys are never stored or read in plaintext.
// Uses only WebCrypto, so it runs in Deno and in Node (vitest).

export class EncryptionUnavailableError extends Error {
  readonly code = "BYOK_ENCRYPTION_UNAVAILABLE";
  constructor(message = "BYOK_ENCRYPTION_KEY is not configured or invalid") {
    super(message);
    this.name = "EncryptionUnavailableError";
  }
}

export interface SealedSecret {
  /** base64 of AES-GCM ciphertext + 16-byte tag. */
  ciphertext: string;
  /** base64 of the 12-byte random IV. */
  iv: string;
}

export function bytesToBase64(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

export function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Imports the base64 master key. Throws EncryptionUnavailableError unless it decodes to 32 bytes. */
export async function importMasterKey(base64Key: string | undefined | null): Promise<CryptoKey> {
  const trimmed = base64Key?.trim();
  if (!trimmed) throw new EncryptionUnavailableError();
  let raw: Uint8Array;
  try {
    raw = base64ToBytes(trimmed);
  } catch {
    throw new EncryptionUnavailableError("BYOK_ENCRYPTION_KEY is not valid base64");
  }
  if (raw.length !== 32) {
    throw new EncryptionUnavailableError("BYOK_ENCRYPTION_KEY must decode to exactly 32 bytes");
  }
  return await crypto.subtle.importKey("raw", raw as BufferSource, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

const enc = new TextEncoder();
const dec = new TextDecoder();

/**
 * Encrypts `plaintext`. `aad` (for example "userId:provider") is authenticated but not stored,
 * so a ciphertext copied to another user's or provider's row will not decrypt.
 */
export async function sealSecret(key: CryptoKey, plaintext: string, aad: string): Promise<SealedSecret> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as BufferSource, additionalData: enc.encode(aad) as BufferSource },
    key,
    enc.encode(plaintext) as BufferSource,
  );
  return { ciphertext: bytesToBase64(new Uint8Array(ct)), iv: bytesToBase64(iv) };
}

/** Decrypts a SealedSecret. Throws if the key, IV, AAD or ciphertext do not match. */
export async function openSecret(key: CryptoKey, sealed: SealedSecret, aad: string): Promise<string> {
  const pt = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: base64ToBytes(sealed.iv) as BufferSource,
      additionalData: enc.encode(aad) as BufferSource,
    },
    key,
    base64ToBytes(sealed.ciphertext) as BufferSource,
  );
  return dec.decode(pt);
}

/** Last 4 characters shown in the UI; never more. */
export function keyLast4(key: string): string {
  const t = key.trim();
  return t.length <= 4 ? t : t.slice(-4);
}
