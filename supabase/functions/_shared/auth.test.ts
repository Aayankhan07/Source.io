import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";

// auth.ts imports createClient from esm.sh (a Deno URL import); replace it with a fake client.
const { getClaims, createClient } = vi.hoisted(() => {
  const getClaims = vi.fn();
  const createClient = vi.fn((_url: string, _key: string, _opts?: unknown) => ({ auth: { getClaims } }));
  return { getClaims, createClient };
});
vi.mock("https://esm.sh/@supabase/supabase-js@2.57.4", () => ({ createClient }));

const env: Record<string, string | undefined> = {
  SUPABASE_URL: "https://x.supabase.co",
  SUPABASE_ANON_KEY: "anon",
  SUPABASE_SERVICE_ROLE_KEY: "service",
};
vi.stubGlobal("Deno", { env: { get: (k: string) => env[k] } });
afterAll(() => vi.unstubAllGlobals());

const { authenticateRequest } = await import("./auth");

const cors = { "Access-Control-Allow-Origin": "*" };
const req = (auth?: string) => new Request("https://x/fn", { headers: auth ? { Authorization: auth } : {} });

beforeEach(() => {
  getClaims.mockReset();
  createClient.mockClear();
  delete env.GROQ_API_KEY;
});

describe("authenticateRequest", () => {
  it("rejects requests without a bearer token", async () => {
    const res = await authenticateRequest(req(), cors);
    expect(res.errorResponse?.status).toBe(401);
    expect(createClient).not.toHaveBeenCalled();
  });

  it("rejects invalid tokens", async () => {
    getClaims.mockResolvedValue({ data: null, error: new Error("bad jwt") });
    const res = await authenticateRequest(req("Bearer t"), cors);
    expect(res.errorResponse?.status).toBe(401);
    expect(res.errorResponse?.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });

  it("returns clients and the user id for valid tokens", async () => {
    getClaims.mockResolvedValue({ data: { claims: { sub: "user-1" } }, error: null });
    const res = await authenticateRequest(req("Bearer tok"), cors);
    expect(res.errorResponse).toBeNull();
    expect(res).toMatchObject({ userId: "user-1", authHeader: "Bearer tok", apiKey: undefined });
    expect(getClaims).toHaveBeenCalledWith("tok");
    expect(createClient).toHaveBeenCalledWith("https://x.supabase.co", "anon", {
      global: { headers: { Authorization: "Bearer tok" } },
    });
    expect(createClient).toHaveBeenCalledWith("https://x.supabase.co", "service");
  });

  it("requires an API key when asked, preferring the body key over env", async () => {
    const missing = await authenticateRequest(req("Bearer t"), cors, { requireApiKey: { envVar: "GROQ_API_KEY" } });
    expect(missing.errorResponse?.status).toBe(500);
    expect(await missing.errorResponse!.json()).toEqual({ error: "GROQ_API_KEY not configured" });

    const custom = await authenticateRequest(req("Bearer t"), cors, {
      requireApiKey: { envVar: "GROQ_API_KEY", errorMessage: "no key" },
    });
    expect(await custom.errorResponse!.json()).toEqual({ error: "no key" });

    getClaims.mockResolvedValue({ data: { claims: { sub: "u" } }, error: null });
    env.GROQ_API_KEY = "env-key";
    expect(
      await authenticateRequest(req("Bearer t"), cors, { requireApiKey: { envVar: "GROQ_API_KEY" } }),
    ).toMatchObject({ apiKey: "env-key" });
    expect(
      await authenticateRequest(req("Bearer t"), cors, { requireApiKey: { envVar: "GROQ_API_KEY", bodyKey: "body" } }),
    ).toMatchObject({ apiKey: "body" });
  });
});
