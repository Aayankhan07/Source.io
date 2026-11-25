import { describe, it, expect, vi, beforeEach } from "vitest";

const { callFunction } = vi.hoisted(() => ({ callFunction: vi.fn() }));
vi.mock("@/lib/services/functions", async () => {
  const actual = await vi.importActual<typeof import("./functions")>("./functions");
  return { ...actual, callFunction };
});
vi.mock("@/integrations/supabase/client", () => ({ supabase: {}, SUPABASE_URL: "", SUPABASE_PUBLISHABLE_KEY: "" }));

import { listApiKeys, saveApiKey, testApiKey, deleteApiKey } from "./apiKeys";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

beforeEach(() => callFunction.mockReset());

describe("api key client", () => {
  it("lists saved keys (empty when none)", async () => {
    callFunction.mockResolvedValueOnce(json({ keys: [{ provider: "groq", last4: "abcd" }] }));
    expect(await listApiKeys()).toEqual([{ provider: "groq", last4: "abcd" }]);
    expect(callFunction).toHaveBeenCalledWith("api_keys", { action: "list" });
    callFunction.mockResolvedValueOnce(json({}));
    expect(await listApiKeys()).toEqual([]);
  });

  it("trims keys before saving and passes actions through", async () => {
    callFunction.mockImplementation(async () => json({ provider: "openai", last4: "wxyz" }));
    expect(await saveApiKey("openai", "  sk-key  ")).toEqual({ provider: "openai", last4: "wxyz" });
    expect(callFunction).toHaveBeenLastCalledWith("api_keys", { action: "save", provider: "openai", key: "sk-key" });
    await testApiKey("openai");
    expect(callFunction).toHaveBeenLastCalledWith("api_keys", { action: "test", provider: "openai" });
    await deleteApiKey("openai");
    expect(callFunction).toHaveBeenLastCalledWith("api_keys", { action: "delete", provider: "openai" });
  });

  it("throws a friendly error when the function fails", async () => {
    callFunction.mockResolvedValueOnce(json({ error: "x", code: "BYOK_KEY_INVALID" }, 400));
    await expect(testApiKey("groq")).rejects.toThrow(/rejected by the provider/);
  });
});
