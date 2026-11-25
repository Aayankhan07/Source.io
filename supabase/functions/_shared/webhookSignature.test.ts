import { describe, it, expect } from "vitest";
import { createHmac } from "node:crypto";
import { verifyHmacSha256Hex, isUuid } from "./webhookSignature";

const body = JSON.stringify({ meta: { event_name: "order_created" } });
const sig = createHmac("sha256", "s3cret").update(body).digest("hex");

describe("webhook signature", () => {
  it("accepts a valid signature", async () => {
    expect(await verifyHmacSha256Hex("s3cret", sig, body)).toBe(true);
  });

  it("rejects wrong secret, empty secret, empty or malformed signature, tampered body", async () => {
    expect(await verifyHmacSha256Hex("other", sig, body)).toBe(false);
    expect(await verifyHmacSha256Hex("", sig, body)).toBe(false);
    expect(await verifyHmacSha256Hex("s3cret", "", body)).toBe(false);
    expect(await verifyHmacSha256Hex("s3cret", "zz", body)).toBe(false);
    expect(await verifyHmacSha256Hex("s3cret", sig, body + " ")).toBe(false);
  });

  it("validates uuids and rejects filter-injection strings", () => {
    expect(isUuid("1b4e28ba-2fa1-11d2-883f-0016d3cca427")).toBe(true);
    expect(isUuid("x,user_id.neq.0")).toBe(false);
    expect(isUuid(undefined)).toBe(false);
  });
});
