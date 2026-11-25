import { describe, it, expect, vi } from "vitest";
import { createLogger, formatLogLine, serializeError } from "./log";

describe("structured logger", () => {
  it("emits one JSON line with fn, requestId, userId, level and msg", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const log = createLogger("chat", { requestId: "req-1" });
    log.userId = "user-1";
    log.error("upstream failed", { status: 502 });
    expect(spy).toHaveBeenCalledOnce();
    const line = JSON.parse(String(spy.mock.calls[0][0]));
    expect(line).toMatchObject({
      level: "error",
      fn: "chat",
      requestId: "req-1",
      userId: "user-1",
      msg: "upstream failed",
      status: 502,
    });
    expect(typeof line.ts).toBe("string");
    spy.mockRestore();
  });

  it("generates a requestId when none is given", () => {
    expect(createLogger("x").requestId).toMatch(/[0-9a-f-]{36}/);
  });

  it("serializes Error and PostgREST error objects", () => {
    const e = Object.assign(new Error("boom"), { code: "X1" });
    expect(serializeError(e)).toEqual({ name: "Error", message: "boom", code: "X1" });
    expect(serializeError({ message: "dup", code: "23505", details: "d", hint: null })).toEqual({
      message: "dup",
      code: "23505",
      details: "d",
      hint: null,
    });
    const line = JSON.parse(formatLogLine("warn", { fn: "f", requestId: "r" }, "m", { err: e }));
    expect(line.err.message).toBe("boom");
    expect(line.userId).toBeNull();
  });
});
