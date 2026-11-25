// Structured JSON-lines logger for edge functions.
// Each line: {"ts","level","fn","requestId","userId","msg", ...extra}. Supabase log explorer
// indexes JSON fields, so errors can be filtered by fn/requestId/userId.

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface Logger {
  readonly fn: string;
  readonly requestId: string;
  userId: string | undefined;
  debug(msg: string, extra?: Record<string, unknown>): void;
  info(msg: string, extra?: Record<string, unknown>): void;
  warn(msg: string, extra?: Record<string, unknown>): void;
  error(msg: string, extra?: Record<string, unknown>): void;
}

/** Turns Error objects (and other non-JSON values) into something JSON.stringify keeps. */
export function serializeError(err: unknown): unknown {
  if (err instanceof Error) {
    const out: Record<string, unknown> = { name: err.name, message: err.message };
    const code = (err as { code?: unknown }).code;
    if (code !== undefined) out.code = code;
    return out;
  }
  if (err && typeof err === "object") {
    // Supabase/PostgREST errors are plain objects with message/code/details.
    const e = err as Record<string, unknown>;
    if ("message" in e) {
      return { message: e.message, code: e.code, details: e.details, hint: e.hint };
    }
  }
  return err;
}

export function formatLogLine(
  level: LogLevel,
  base: { fn: string; requestId: string; userId?: string },
  msg: string,
  extra?: Record<string, unknown>,
): string {
  const fields: Record<string, unknown> = {};
  if (extra) {
    for (const [k, v] of Object.entries(extra)) fields[k] = serializeError(v);
  }
  return JSON.stringify({
    ts: new Date().toISOString(),
    level,
    fn: base.fn,
    requestId: base.requestId,
    userId: base.userId ?? null,
    msg,
    ...fields,
  });
}

export function createLogger(fn: string, ctx: { requestId?: string; userId?: string } = {}): Logger {
  const logger: Logger = {
    fn,
    requestId: ctx.requestId ?? crypto.randomUUID(),
    userId: ctx.userId,
    debug: (msg, extra) => console.debug(formatLogLine("debug", logger, msg, extra)),
    info: (msg, extra) => console.log(formatLogLine("info", logger, msg, extra)),
    warn: (msg, extra) => console.warn(formatLogLine("warn", logger, msg, extra)),
    error: (msg, extra) => console.error(formatLogLine("error", logger, msg, extra)),
  };
  return logger;
}
