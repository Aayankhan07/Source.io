import { describe, it, expect, vi, beforeEach } from "vitest";
import { acquireJobLock, heartbeatJob, completeJob, STALE_JOB_MS } from "./jobLock";

type Result = { data?: unknown; error?: { code?: string; message: string } | null };
type Call = { op: string; payload?: unknown; filters: Array<[string, string, unknown]> };

/**
 * Minimal PostgREST-like fake: every awaited query consumes the next scripted result,
 * in order, and is recorded in `calls`.
 */
function fakeAdmin(results: Array<Result | Error>) {
  const calls: Call[] = [];
  const queue = [...results];
  const next = async (): Promise<Result> => {
    const r = queue.shift();
    if (!r) throw new Error("unexpected extra query");
    if (r instanceof Error) throw r;
    return { data: r.data ?? null, error: r.error ?? null };
  };
  const builder = (call: Call) => {
    const b: Record<string, unknown> = {};
    const chain = (name: string) => (col?: string, val?: unknown) => {
      if (col !== undefined) call.filters.push([name, col, val]);
      return b;
    };
    for (const m of ["eq", "in", "lt", "order", "limit"]) b[m] = chain(m);
    b.select = () => b;
    b.single = () => next();
    b.maybeSingle = () => next();
    b.then = (res: (v: Result) => unknown, rej: (e: unknown) => unknown) => next().then(res, rej);
    return b;
  };
  const admin = {
    from: () => ({
      select: () => {
        const call: Call = { op: "select", filters: [] };
        calls.push(call);
        return builder(call);
      },
      update: (payload: unknown) => {
        const call: Call = { op: "update", payload, filters: [] };
        calls.push(call);
        return builder(call);
      },
      insert: (payload: unknown) => {
        const call: Call = { op: "insert", payload, filters: [] };
        calls.push(call);
        return builder(call);
      },
    }),
  };
  return { admin: admin as never, calls };
}

const base = { userId: "u1", documentId: "d1", kind: "generate_notes" as const };

describe("acquireJobLock", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("acquires by inserting after reaping stale jobs", async () => {
    const { admin, calls } = fakeAdmin([{}, { data: { id: "job-1" } }]);
    const r = await acquireJobLock(admin, base);
    expect(r).toEqual({ acquired: true, jobId: "job-1" });
    expect(calls.map((c) => c.op)).toEqual(["update", "insert"]);
    const reap = calls[0];
    expect(reap.filters).toContainEqual(["in", "status", ["queued", "running"]]);
    const lt = reap.filters.find((f) => f[0] === "lt");
    expect(lt?.[1]).toBe("updated_at");
    const cutoff = Date.parse(String(lt?.[2]));
    expect(Date.now() - cutoff).toBeGreaterThanOrEqual(STALE_JOB_MS - 1000);
  });

  it("returns busy with the active job id on 23505", async () => {
    const { admin } = fakeAdmin([
      {},
      { error: { code: "23505", message: "duplicate key" } },
      { data: { id: "active-job" } },
    ]);
    const r = await acquireJobLock(admin, base);
    expect(r.acquired).toBe(false);
    expect(r.jobId).toBe("active-job");
    expect(r.unavailable).toBeUndefined();
  });

  it("fails CLOSED when the insert errors for another reason", async () => {
    const { admin } = fakeAdmin([{}, { error: { code: "08006", message: "connection lost" } }]);
    const r = await acquireJobLock(admin, base);
    expect(r.acquired).toBe(false);
    expect(r.unavailable).toBe(true);
  });

  it("fails CLOSED when the database throws", async () => {
    const { admin } = fakeAdmin([new Error("network down")]);
    const r = await acquireJobLock(admin, base);
    expect(r).toMatchObject({ acquired: false, unavailable: true });
  });

  it("fails CLOSED when reaping stale jobs errors", async () => {
    const { admin } = fakeAdmin([{ error: { message: "boom" } }]);
    const r = await acquireJobLock(admin, base);
    expect(r).toMatchObject({ acquired: false, unavailable: true });
  });

  it("does not redo a succeeded idempotent request", async () => {
    const { admin } = fakeAdmin([{ data: { id: "done-job", status: "succeeded" } }]);
    const r = await acquireJobLock(admin, { ...base, idempotencyKey: "k1" });
    expect(r).toMatchObject({ acquired: false, alreadyCompleted: true, jobId: "done-job" });
  });

  it("force + 23505 on the idempotency key reclaims the row and returns its jobId", async () => {
    const { admin, calls } = fakeAdmin([
      {}, // supersede active jobs
      { error: { code: "23505", message: "dup idempotency key" } }, // insert
      { data: { id: "old-job", status: "succeeded", document_id: "d1" } }, // lookup by key
      { data: { id: "old-job" } }, // reclaim update
    ]);
    const r = await acquireJobLock(admin, { ...base, idempotencyKey: "k1", force: true });
    expect(r).toEqual({ acquired: true, jobId: "old-job" });
    // force supersedes every active job, not only stale ones
    expect(calls[0].filters.find((f) => f[0] === "lt")).toBeUndefined();
    expect(calls[3].op).toBe("update");
    expect(calls[3].payload).toMatchObject({ status: "running" });
  });

  it("reclaims a previously failed job with the same idempotency key", async () => {
    const { admin } = fakeAdmin([
      { data: { id: "failed-job", status: "failed" } }, // idempotency pre-check
      {}, // reap
      { error: { code: "23505", message: "dup idempotency key" } },
      { data: { id: "failed-job", status: "failed", document_id: "d1" } },
      { data: { id: "failed-job" } },
    ]);
    const r = await acquireJobLock(admin, { ...base, idempotencyKey: "k2" });
    expect(r).toEqual({ acquired: true, jobId: "failed-job" });
  });
});

describe("heartbeatJob / completeJob", () => {
  it("heartbeat returns true only while the job is running", async () => {
    expect(await heartbeatJob(fakeAdmin([{ data: { id: "j" } }]).admin, "j")).toBe(true);
    expect(await heartbeatJob(fakeAdmin([{ data: null }]).admin, "j")).toBe(false);
    expect(await heartbeatJob(fakeAdmin([]).admin, undefined)).toBe(false);
  });

  it("heartbeat never throws", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(await heartbeatJob(fakeAdmin([new Error("x")]).admin, "j")).toBe(false);
  });

  it("completeJob reports write failures", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await completeJob(fakeAdmin([{}]).admin, "j", true)).toBe(true);
    expect(await completeJob(fakeAdmin([{ error: { message: "x" } }]).admin, "j", false, "err")).toBe(false);
  });
});
