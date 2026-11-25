import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";

const { posthog } = vi.hoisted(() => ({
  posthog: {
    init: vi.fn(),
    capture: vi.fn(),
    identify: vi.fn(),
    reset: vi.fn(),
    get_distinct_id: vi.fn(() => "anon"),
  },
}));
vi.mock("posthog-js", () => ({ default: posthog }));

type TrackModule = typeof import("./track");

/** track.ts reads NEXT_PUBLIC_POSTHOG_KEY at import time, so load a fresh copy per scenario. */
async function load(key?: string): Promise<TrackModule> {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", key ?? "");
  return await import("./track");
}

beforeEach(() => {
  for (const fn of Object.values(posthog)) fn.mockClear();
});
afterEach(() => vi.unstubAllEnvs());

describe("analytics disabled", () => {
  it("is a no-op without a key", async () => {
    const t = await load();
    expect(t.analyticsEnabled).toBe(false);
    expect(await t.initAnalytics()).toBeNull();
    t.track("upgrade_clicked", { location: "x" });
    t.identifyUser("u");
    t.resetAnalytics();
    expect(posthog.init).not.toHaveBeenCalled();
  });
});

describe("analytics enabled", () => {
  it("initialises once and replays queued events", async () => {
    const t = await load("phc_key");
    t.track("signup_completed", { method: "email" });
    t.identifyUser("user-1");
    const ph = await t.initAnalytics();
    expect(ph).toBe(posthog);
    expect(await t.initAnalytics()).toBe(posthog);
    expect(posthog.init).toHaveBeenCalledTimes(1);
    expect(posthog.capture).toHaveBeenCalledWith("signup_completed", { method: "email" });
    expect(posthog.identify).toHaveBeenCalledWith("user-1");

    // Once loaded, calls go straight to the client; identical ids are not re-identified.
    posthog.get_distinct_id.mockReturnValueOnce("user-1");
    t.identifyUser("user-1");
    expect(posthog.identify).toHaveBeenCalledTimes(1);
    posthog.capture.mockImplementationOnce(() => {
      throw new Error("blocked");
    });
    expect(() => t.track("quiz_completed", { score_pct: 80 })).not.toThrow();
    t.resetAnalytics();
    expect(posthog.reset).toHaveBeenCalled();
    posthog.reset.mockImplementationOnce(() => {
      throw new Error("x");
    });
    expect(() => t.resetAnalytics()).not.toThrow();
  });

  it("strips query strings from captured URLs", async () => {
    const t = await load("phc_key");
    await t.initAnalytics();
    const opts = posthog.init.mock.calls[0][1] as { before_send: (e: unknown) => unknown };
    expect(opts.before_send(null)).toBeNull();
    const event = {
      properties: { $current_url: "https://source.io/app?code=secret", $referrer: "/auth?next=/x", $prev_pageview_pathname: 5 },
    };
    opts.before_send(event);
    expect(event.properties.$current_url).toBe("https://source.io/app");
    expect(event.properties.$referrer).toBe(`${window.location.origin}/auth`);
  });

  it("drops the queue when posthog fails to load or init", async () => {
    const t = await load("phc_key");
    posthog.init.mockImplementationOnce(() => {
      throw new Error("init failed");
    });
    t.track("upgrade_clicked");
    expect(await t.initAnalytics()).toBeNull();
    expect(posthog.capture).not.toHaveBeenCalled();
  });

  it("ignores errors from replayed calls", async () => {
    const t = await load("phc_key");
    posthog.capture.mockImplementationOnce(() => {
      throw new Error("x");
    });
    t.track("upgrade_clicked");
    await expect(t.initAnalytics()).resolves.toBe(posthog);
  });

  it("AnalyticsProvider boots analytics after mount", async () => {
    await load("phc_key");
    const { AnalyticsProvider } = await import("./AnalyticsProvider");
    const { container } = render(<AnalyticsProvider />);
    expect(container.innerHTML).toBe("");
    await vi.waitFor(() => expect(posthog.init).toHaveBeenCalled());
  });
});
