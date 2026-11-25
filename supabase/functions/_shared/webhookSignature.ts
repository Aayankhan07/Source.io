const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(v: unknown): v is string {
  return typeof v === "string" && UUID_RE.test(v);
}

/** Verifies a hex-encoded HMAC-SHA256 signature (Lemon Squeezy `X-Signature`). Never throws. */
export async function verifyHmacSha256Hex(secret: string, signatureHex: string, body: string): Promise<boolean> {
  if (!secret || !signatureHex || signatureHex.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(signatureHex)) {
    return false;
  }
  try {
    const bytes = new Uint8Array(signatureHex.length / 2);
    for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(signatureHex.slice(i * 2, i * 2 + 2), 16);
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    return await crypto.subtle.verify("HMAC", key, bytes, new TextEncoder().encode(body));
  } catch {
    return false;
  }
}
