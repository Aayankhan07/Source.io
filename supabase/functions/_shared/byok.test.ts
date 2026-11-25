import { describe, it, expect } from "vitest";
import { chooseKeys, keyAad, keyMatchesProvider, loadUserKey, resolveGroqKey } from "./byok";
import { bytesToBase64, EncryptionUnavailableError, importMasterKey, sealSecret } from "./secretBox";

describe("resolveGroqKey", () => {
  it("is BYOK only when the user's key is actually used", () => {
    expect(resolveGroqKey("gsk_user", "gsk_platform")).toEqual({ apiKey: "gsk_user", isByok: true });
  });

  it("falls back to platform key and charges quota", () => {
    expect(resolveGroqKey(undefined, "gsk_platform")).toEqual({ apiKey: "gsk_platform", isByok: false });
    expect(resolveGroqKey("   ", "gsk_platform")).toEqual({ apiKey: "gsk_platform", isByok: false });
  });

  it("rejects non-Groq keys instead of forwarding them to Groq", () => {
    expect(resolveGroqKey("AIzaSyGeminiKey", "gsk_platform")).toEqual({ apiKey: "gsk_platform", isByok: false });
  });

  it("returns undefined when nothing configured", () => {
    expect(resolveGroqKey(undefined, undefined)).toEqual({ apiKey: undefined, isByok: false });
  });
});

const GROQ = "gsk_" + "a".repeat(40);
const GEMINI = "AIza" + "b".repeat(35);

describe("keyMatchesProvider", () => {
  it("binds key shapes to providers", () => {
    expect(keyMatchesProvider("groq", GROQ)).toBe(true);
    expect(keyMatchesProvider("gemini", GROQ)).toBe(false);
    expect(keyMatchesProvider("gemini", GEMINI)).toBe(true);
    expect(keyMatchesProvider("openai", "sk-" + "c".repeat(40))).toBe(true);
    expect(keyMatchesProvider("groq", "gsk_short")).toBe(false);
    expect(keyMatchesProvider("groq", `gsk_${"a".repeat(20)} x`)).toBe(false);
  });
});

describe("chooseKeys", () => {
  const platform = { groq: "gsk_platform", gemini: "AIza_platform" };

  it("uses only the user's keys when any are stored (isByok)", () => {
    const r = chooseKeys({ gemini: GEMINI }, undefined, platform);
    expect(r.isByok).toBe(true);
    expect(Object.keys(r.keys)).toEqual(["gemini"]);
    expect(r.keys.gemini).toEqual({ provider: "gemini", apiKey: GEMINI, userOwned: true });
  });

  it("prefers the stored Groq key over the legacy body key", () => {
    const r = chooseKeys({ groq: GROQ }, "gsk_bodykey_bodykey_bodykey", platform);
    expect(r.keys.groq?.apiKey).toBe(GROQ);
  });

  it("keeps the legacy body gsk_ key working", () => {
    const r = chooseKeys({}, "gsk_bodykey_bodykey_bodykey", platform);
    expect(r).toEqual({ keys: { groq: { provider: "groq", apiKey: "gsk_bodykey_bodykey_bodykey", userOwned: true } }, isByok: true });
  });

  it("uses platform keys (and the quota) without user keys", () => {
    const r = chooseKeys({}, "AIzaNotForGroq", platform);
    expect(r.isByok).toBe(false);
    expect(r.keys.groq?.userOwned).toBe(false);
    expect(r.keys.gemini?.apiKey).toBe("AIza_platform");
  });

  it("ignores a stored key that does not match its provider", () => {
    const r = chooseKeys({ groq: GEMINI }, undefined, platform);
    expect(r.isByok).toBe(false);
  });
});

describe("loadUserKey", () => {
  const master = bytesToBase64(new Uint8Array(32).fill(7));
  const fakeAdmin = (row: unknown, error: unknown = null) =>
    ({
      from: () => ({
        select: () => ({
          eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: row, error }) }) }),
        }),
      }),
    }) as never;

  it("decrypts the stored key for that user and provider", async () => {
    const sealed = await sealSecret(await importMasterKey(master), GEMINI, keyAad("u1", "gemini"));
    expect(await loadUserKey(fakeAdmin(sealed), "u1", "gemini", master)).toBe(GEMINI);
  });

  it("returns null when nothing is stored", async () => {
    expect(await loadUserKey(fakeAdmin(null), "u1", "groq", master)).toBeNull();
  });

  it("fails closed without the encryption key or on DB errors", async () => {
    const sealed = await sealSecret(await importMasterKey(master), GEMINI, keyAad("u1", "gemini"));
    await expect(loadUserKey(fakeAdmin(sealed), "u1", "gemini", undefined)).rejects.toBeInstanceOf(EncryptionUnavailableError);
    await expect(loadUserKey(fakeAdmin(null, { message: "boom" }), "u1", "gemini", master)).rejects.toThrow(/boom/);
  });

  it("will not decrypt a ciphertext copied to another user", async () => {
    const sealed = await sealSecret(await importMasterKey(master), GEMINI, keyAad("u1", "gemini"));
    await expect(loadUserKey(fakeAdmin(sealed), "u2", "gemini", master)).rejects.toThrow();
  });
});
