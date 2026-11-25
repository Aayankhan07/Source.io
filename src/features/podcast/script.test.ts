import { describe, expect, it } from "vitest";
import { MAX_SEGMENTS, parseScript, tryParseScript } from "./script";
import { voicesForDuo } from "./voices";

describe("script -> segments", () => {
  it("maps alternating host lines to speaker segments", () => {
    expect(parseScript("Host 1: Hi there.\nHost 2: Hello!\n\nHost 1: Next point.")).toEqual([
      { speaker: "host_1", text: "Hi there." },
      { speaker: "host_2", text: "Hello!" },
      { speaker: "host_1", text: "Next point." },
    ]);
  });

  it("appends continuation lines and tolerates label spacing/case", () => {
    expect(parseScript("host1 : First.\nstill first\nHOST 2:Second.")).toEqual([
      { speaker: "host_1", text: "First. still first" },
      { speaker: "host_2", text: "Second." },
    ]);
  });

  it("caps the number of segments", () => {
    const script = Array.from({ length: 40 }, (_, i) => `Host ${(i % 2) + 1}: line ${i}`).join("\n");
    expect(parseScript(script)).toHaveLength(MAX_SEGMENTS);
  });

  it("rejects one-host scripts; tryParseScript returns null instead", () => {
    expect(() => parseScript("Host 1: Solo.")).toThrow("INVALID_SCRIPT_FORMAT");
    expect(tryParseScript("Host 1: Solo.")).toBeNull();
    expect(tryParseScript(null)).toBeNull();
  });

  it("maps voice duos to two distinct Kokoro voices with a default", () => {
    const v = voicesForDuo("emma-daniel");
    expect(v.host_1).not.toEqual(v.host_2);
    expect(voicesForDuo("unknown")).toEqual(voicesForDuo("chen-marcus"));
  });
});
