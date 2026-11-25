import { describe, it, expect } from "vitest";
import { bytesToBase64, EncryptionUnavailableError, importMasterKey, keyLast4, openSecret, sealSecret } from "./secretBox";

const masterB64 = bytesToBase64(new Uint8Array(32).map((_, i) => i + 1));

describe("secretBox (AES-256-GCM)", () => {
  it("round-trips a key", async () => {
    const key = await importMasterKey(masterB64);
    const sealed = await sealSecret(key, "AIzaSyExampleKey1234567890", "user-1:gemini");
    expect(sealed.ciphertext).not.toContain("AIza");
    expect(await openSecret(key, sealed, "user-1:gemini")).toBe("AIzaSyExampleKey1234567890");
  });

  it("uses a fresh IV each time", async () => {
    const key = await importMasterKey(masterB64);
    const a = await sealSecret(key, "same", "aad");
    const b = await sealSecret(key, "same", "aad");
    expect(a.iv).not.toBe(b.iv);
    expect(a.ciphertext).not.toBe(b.ciphertext);
  });

  it("refuses to decrypt with a different AAD (other user / provider) or master key", async () => {
    const key = await importMasterKey(masterB64);
    const sealed = await sealSecret(key, "gsk_secret", "user-1:groq");
    await expect(openSecret(key, sealed, "user-2:groq")).rejects.toThrow();
    const other = await importMasterKey(bytesToBase64(new Uint8Array(32).fill(9)));
    await expect(openSecret(other, sealed, "user-1:groq")).rejects.toThrow();
  });

  it("fails closed without a valid 32-byte master key", async () => {
    await expect(importMasterKey(undefined)).rejects.toBeInstanceOf(EncryptionUnavailableError);
    await expect(importMasterKey("")).rejects.toBeInstanceOf(EncryptionUnavailableError);
    await expect(importMasterKey(bytesToBase64(new Uint8Array(16)))).rejects.toBeInstanceOf(EncryptionUnavailableError);
    await expect(importMasterKey("%%%not-base64%%%")).rejects.toBeInstanceOf(EncryptionUnavailableError);
  });

  it("shows only the last 4 characters", () => {
    expect(keyLast4("gsk_abcdefghijklmnopWXYZ")).toBe("WXYZ");
  });
});
