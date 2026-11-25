import { describe, it, expect, vi, beforeEach } from "vitest";

const { callFunction, uploadToSignedUrl, track } = vi.hoisted(() => ({
  callFunction: vi.fn(),
  uploadToSignedUrl: vi.fn(),
  track: vi.fn(),
}));
vi.mock("@/lib/services/functions", async () => {
  const actual = await vi.importActual<typeof import("./functions")>("./functions");
  return { ...actual, callFunction };
});
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { storage: { from: () => ({ uploadToSignedUrl }) } },
  SUPABASE_URL: "",
  SUPABASE_PUBLISHABLE_KEY: "",
}));
vi.mock("@/lib/analytics/track", () => ({ track }));

import { generatePodcast, getPodcastAudioUrl, uploadPodcastAudio, AudioQuotaExceededError } from "./podcast";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const audio = { blob: new Blob(["a"]), ext: "ogg" as const, contentType: "audio/ogg" };

beforeEach(() => {
  callFunction.mockReset();
  uploadToSignedUrl.mockReset();
  track.mockReset();
});

describe("generatePodcast", () => {
  it("sends a generated idempotency key by default", async () => {
    callFunction.mockResolvedValueOnce(json({ ok: true, status: "ready" }));
    expect(await generatePodcast("doc", { podcastStyle: "debate" })).toEqual({ ok: true, status: "ready" });
    const [name, body] = callFunction.mock.calls[0];
    expect(name).toBe("generate_podcast");
    expect(body).toMatchObject({ document_id: "doc", podcast_style: "debate" });
    expect(body.idempotency_key).toMatch(/^doc:podcast:/);
  });

  it("uses a provided idempotency key and maps failures", async () => {
    callFunction.mockResolvedValueOnce(json({ ok: true }));
    await generatePodcast("doc", { idempotencyKey: "k" });
    expect(callFunction.mock.calls[0][1].idempotency_key).toBe("k");
    callFunction.mockResolvedValueOnce(json({ error: "x", code: "QUOTA_EXCEEDED" }, 429));
    await expect(generatePodcast("doc")).rejects.toThrow(/AI actions/);
  });
});

describe("getPodcastAudioUrl", () => {
  it("returns the signed url and remaining renders", async () => {
    callFunction.mockResolvedValueOnce(json({ url: "https://a", renders_remaining: 3 }));
    expect(await getPodcastAudioUrl("doc")).toEqual({ url: "https://a", rendersRemaining: 3 });
    callFunction.mockResolvedValueOnce(json({}));
    expect(await getPodcastAudioUrl("doc")).toEqual({ url: null, rendersRemaining: null });
  });

  it("maps audio-specific error codes", async () => {
    callFunction.mockResolvedValueOnce(json({ code: "AUDIO_QUOTA_EXCEEDED" }, 429));
    await expect(getPodcastAudioUrl("doc")).rejects.toBeInstanceOf(AudioQuotaExceededError);
    callFunction.mockResolvedValueOnce(json({ code: "NO_SCRIPT" }, 400));
    await expect(getPodcastAudioUrl("doc")).rejects.toThrow("Generate the podcast script first.");
    callFunction.mockResolvedValueOnce(new Response("plain failure", { status: 500 }));
    await expect(getPodcastAudioUrl("doc")).rejects.toThrow("plain failure");
  });
});

describe("uploadPodcastAudio", () => {
  it("reserves, uploads, finishes and tracks", async () => {
    callFunction
      .mockResolvedValueOnce(json({ path: "p", token: "t", renders_remaining: 1 }))
      .mockResolvedValueOnce(json({ url: "https://final" }));
    uploadToSignedUrl.mockResolvedValueOnce({ error: null });
    expect(await uploadPodcastAudio("doc", audio)).toEqual({ url: "https://final", rendersRemaining: 1 });
    expect(uploadToSignedUrl).toHaveBeenCalledWith("p", "t", audio.blob, { contentType: "audio/ogg", upsert: false });
    expect(track).toHaveBeenCalledWith("podcast_audio_created");
  });

  it("handles missing optional values", async () => {
    callFunction.mockResolvedValueOnce(json({ path: "p", token: "t" })).mockResolvedValueOnce(json({}));
    uploadToSignedUrl.mockResolvedValueOnce({ error: null });
    expect(await uploadPodcastAudio("doc", audio)).toEqual({ url: null, rendersRemaining: null });
  });

  it("fails at each step with a clear error", async () => {
    callFunction.mockResolvedValueOnce(json({ code: "AUDIO_QUOTA_EXCEEDED" }, 429));
    await expect(uploadPodcastAudio("doc", audio)).rejects.toBeInstanceOf(AudioQuotaExceededError);

    callFunction.mockResolvedValueOnce(json({ path: "p", token: "t" }));
    uploadToSignedUrl.mockResolvedValueOnce({ error: { message: "denied" } });
    await expect(uploadPodcastAudio("doc", audio)).rejects.toThrow("Audio upload failed: denied");

    callFunction.mockResolvedValueOnce(json({ path: "p", token: "t" })).mockResolvedValueOnce(json({ error: "nope" }, 500));
    uploadToSignedUrl.mockResolvedValueOnce({ error: null });
    await expect(uploadPodcastAudio("doc", audio)).rejects.toThrow("nope");
    expect(track).not.toHaveBeenCalled();
  });
});
