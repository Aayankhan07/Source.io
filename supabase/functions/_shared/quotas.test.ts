import { describe, it, expect, vi } from "vitest";
import { consumeDailyQuota, enforceDailyQuota, consumeDailyTtsQuota } from "./quotas";

const fakeAdmin = (rpc: () => Promise<unknown>) => ({ rpc }) as never;

describe("quotas fail closed", () => {
  vi.spyOn(console, "error").mockImplementation(() => {});

  it("denies when RPC errors", async () => {
    const r = await consumeDailyQuota(fakeAdmin(async () => ({ data: null, error: { message: "boom" } })), "u");
    expect(r).toEqual({ allowed: false, unavailable: true });
  });

  it("denies when RPC throws", async () => {
    const r = await consumeDailyTtsQuota(
      fakeAdmin(async () => {
        throw new Error("net");
      }),
      "u",
    );
    expect(r).toEqual({ allowed: false, unavailable: true });
  });

  it("allows when RPC returns true", async () => {
    const r = await consumeDailyQuota(fakeAdmin(async () => ({ data: true, error: null })), "u");
    expect(r).toEqual({ allowed: true });
  });

  it("denies without unavailable flag when over quota", async () => {
    const r = await consumeDailyQuota(fakeAdmin(async () => ({ data: false, error: null })), "u");
    expect(r).toEqual({ allowed: false });
  });

  it("enforce returns 503 when unavailable, 429 when exceeded, null when BYOK", async () => {
    const err = await enforceDailyQuota(
      fakeAdmin(async () => ({ data: null, error: { message: "x" } })),
      "u",
      {},
      { isByok: false },
    );
    expect(err?.status).toBe(503);
    const over = await enforceDailyQuota(fakeAdmin(async () => ({ data: false, error: null })), "u", {}, { isByok: false });
    expect(over?.status).toBe(429);
    const byok = await enforceDailyQuota(fakeAdmin(async () => ({ data: false, error: null })), "u", {}, { isByok: true });
    expect(byok).toBeNull();
  });
});
