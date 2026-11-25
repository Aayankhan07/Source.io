import { describe, it, expect, vi } from "vitest";
import {
  consumeDailyQuota,
  enforceDailyQuota,
  consumeDailyTtsQuota,
  refundDailyQuota,
  refundDailyTtsQuota,
} from "./quotas";

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

describe("quota refunds", () => {
  vi.spyOn(console, "error").mockImplementation(() => {});

  it("calls refund_daily_quota with user and cost", async () => {
    const rpc = vi.fn(async () => ({ data: true, error: null }));
    expect(await refundDailyQuota({ rpc } as never, "u1", 2)).toBe(true);
    expect(rpc).toHaveBeenCalledWith("refund_daily_quota", { p_user_id: "u1", p_cost: 2 });
  });

  it("calls refund_daily_tts_quota for TTS", async () => {
    const rpc = vi.fn(async () => ({ data: true, error: null }));
    expect(await refundDailyTtsQuota({ rpc } as never, "u1")).toBe(true);
    expect(rpc).toHaveBeenCalledWith("refund_daily_tts_quota", { p_user_id: "u1", p_cost: 1 });
  });

  it("returns false when nothing was refunded (e.g. day rolled over)", async () => {
    expect(await refundDailyQuota(fakeAdmin(async () => ({ data: false, error: null })), "u")).toBe(false);
  });

  it("never throws: RPC error or exception yields false", async () => {
    expect(await refundDailyQuota(fakeAdmin(async () => ({ data: null, error: { message: "x" } })), "u")).toBe(false);
    expect(
      await refundDailyQuota(
        fakeAdmin(async () => {
          throw new Error("net");
        }),
        "u",
      ),
    ).toBe(false);
  });

  it("ignores non-positive or fractional costs without calling the RPC", async () => {
    const rpc = vi.fn();
    expect(await refundDailyQuota({ rpc } as never, "u", 0)).toBe(false);
    expect(await refundDailyQuota({ rpc } as never, "u", -1)).toBe(false);
    expect(await refundDailyQuota({ rpc } as never, "u", 1.5)).toBe(false);
    expect(rpc).not.toHaveBeenCalled();
  });
});
