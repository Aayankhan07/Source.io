import { describe, it, expect } from "vitest";
import { buildCaptureRequest, POSTHOG_DEFAULT_HOST, tierTransitionEvent } from "./analytics";

describe("tierTransitionEvent", () => {
  it("free -> pro is upgrade_completed for the Scholar plan", () => {
    expect(tierTransitionEvent("free", "pro")).toEqual({ event: "upgrade_completed", props: { plan: "scholar" } });
    expect(tierTransitionEvent(null, "pro")?.event).toBe("upgrade_completed");
  });

  it("pro -> free is subscription_ended", () => {
    expect(tierTransitionEvent("pro", "free")?.event).toBe("subscription_ended");
  });

  it("no tier change emits nothing (renewals, payment updates)", () => {
    expect(tierTransitionEvent("pro", "pro")).toBeNull();
    expect(tierTransitionEvent("free", "free")).toBeNull();
    expect(tierTransitionEvent(undefined, "free")).toBeNull();
  });
});

const USER = "11111111-1111-4111-8111-111111111111";
const NOW = new Date("2026-11-26T12:00:00Z");

describe("buildCaptureRequest", () => {
  it("builds a PostHog capture payload keyed by the Supabase user id", () => {
    const req = buildCaptureRequest("phc_test", undefined, USER, "upgrade_completed", { plan: "scholar" }, NOW);
    expect(req).toEqual({
      url: `${POSTHOG_DEFAULT_HOST}/capture/`,
      body: {
        api_key: "phc_test",
        event: "upgrade_completed",
        distinct_id: USER,
        properties: { plan: "scholar", $lib: "source-io-edge" },
        timestamp: "2026-11-26T12:00:00.000Z",
      },
    });
  });

  it("uses a custom host without a trailing slash", () => {
    const req = buildCaptureRequest("phc_test", "https://eu.i.posthog.com/", USER, "subscription_ended", {}, NOW);
    expect(req?.url).toBe("https://eu.i.posthog.com/capture/");
    expect(req?.body.event).toBe("subscription_ended");
  });

  it("is a no-op without a project key", () => {
    expect(buildCaptureRequest(undefined, undefined, USER, "upgrade_completed")).toBeNull();
    expect(buildCaptureRequest("  ", undefined, USER, "upgrade_completed")).toBeNull();
  });

  it("refuses distinct ids that are not Supabase user ids (no emails)", () => {
    expect(buildCaptureRequest("phc_test", undefined, "someone@example.com", "upgrade_completed")).toBeNull();
    expect(buildCaptureRequest("phc_test", undefined, "", "upgrade_completed")).toBeNull();
  });
});
