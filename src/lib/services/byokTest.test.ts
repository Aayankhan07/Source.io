import { describe, it, expect, vi, beforeEach } from "vitest";
import { testProviderApiKey } from "./byokTest";

describe("byokTest service", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fails immediately when an empty API key is provided", async () => {
    const res = await testProviderApiKey("groq", "   ");
    expect(res.ok).toBe(false);
    expect(res.message).toBe("Please enter an API key to test.");
  });

  it("handles successful Groq verification with rate limits", async () => {
    const mockHeaders = new Headers({
      "x-ratelimit-remaining-requests": "14",
      "x-ratelimit-limit-requests": "30",
      "x-ratelimit-remaining-tokens": "5900",
      "x-ratelimit-limit-tokens": "6000",
    });

    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ choices: [{ message: { content: "hello" } }] }), {
        status: 200,
        headers: mockHeaders,
      })
    );

    const res = await testProviderApiKey("groq", "gsk_test12345");
    expect(res.ok).toBe(true);
    expect(res.provider).toBe("groq");
    expect(res.message).toContain("Connection successful! Groq is connected");
    expect(res.remainingRequests).toBe(14);
    expect(res.limitRequests).toBe(30);
  });

  it("handles 401 invalid key response properly", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Invalid API key" }), {
        status: 401,
      })
    );

    const res = await testProviderApiKey("groq", "invalid_key");
    expect(res.ok).toBe(false);
    expect(res.message).toBe("This API key is invalid. Check it or create a new one.");
  });

  it("handles 429 rate limit quota response properly", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
        status: 429,
      })
    );

    const res = await testProviderApiKey("gemini", "gemini_key_exceeded");
    expect(res.ok).toBe(false);
    expect(res.message).toContain("allowance is currently used up");
  });

  it("handles network failure gracefully without throwing", async () => {
    vi.spyOn(global, "fetch").mockRejectedValueOnce(new Error("DNS lookup failed"));

    const res = await testProviderApiKey("openai", "sk-proj-test");
    expect(res.ok).toBe(false);
    expect(res.message).toContain("Network error connecting to provider");
  });
});

