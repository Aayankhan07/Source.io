import { describe, expect, it } from "vitest";
import { computeStudyStreak, localDayKey } from "./streak";

const NY = "America/New_York";
const TOKYO = "Asia/Tokyo";
const UTC = "UTC";

describe("localDayKey", () => {
  it("uses the given timezone, not the machine's", () => {
    const instant = new Date("2026-11-26T03:00:00Z");
    expect(localDayKey(instant, UTC)).toBe("2026-11-26");
    expect(localDayKey(instant, NY)).toBe("2026-11-25");
    expect(localDayKey(instant, TOKYO)).toBe("2026-11-26");
  });
});

describe("computeStudyStreak", () => {
  const now = new Date("2026-11-26T15:00:00Z"); // 10:00 in New York, 00:00 (27th) in Tokyo

  it("returns zeros with no activity", () => {
    expect(computeStudyStreak([], now, UTC)).toEqual({
      current: 0,
      longest: 0,
      activeToday: false,
      lastStudyDay: null,
    });
  });

  it("counts consecutive days ending today; multiple events per day count once", () => {
    const s = computeStudyStreak(
      ["2026-11-24T10:00:00Z", "2026-11-25T09:00:00Z", "2026-11-25T20:00:00Z", "2026-11-26T08:00:00Z"],
      now,
      UTC,
    );
    expect(s).toMatchObject({ current: 3, longest: 3, activeToday: true, lastStudyDay: "2026-11-26" });
  });

  it("keeps a streak that ended yesterday alive until today ends", () => {
    const s = computeStudyStreak(["2026-11-24T10:00:00Z", "2026-11-25T10:00:00Z"], now, UTC);
    expect(s).toMatchObject({ current: 2, activeToday: false });
  });

  it("breaks the current streak after a missed day but remembers the longest", () => {
    const s = computeStudyStreak(
      ["2026-11-10T10:00:00Z", "2026-11-11T10:00:00Z", "2026-11-12T10:00:00Z", "2026-11-12T11:00:00Z", "2026-11-24T10:00:00Z"],
      now,
      UTC,
    );
    expect(s).toMatchObject({ current: 0, longest: 3, lastStudyDay: "2026-11-24" });
  });

  it("uses local-day boundaries: late-evening activity counts for that local day", () => {
    // 01:30 UTC on the 26th is 20:30 on the 25th in New York.
    const ts = ["2026-11-25T01:30:00Z", "2026-11-26T01:30:00Z"];
    expect(computeStudyStreak(ts, now, NY)).toMatchObject({ current: 2, activeToday: false, lastStudyDay: "2026-11-25" });
    // In UTC the same instants fall on the 25th and 26th, so today is active.
    expect(computeStudyStreak(ts, now, UTC)).toMatchObject({ current: 2, activeToday: true, lastStudyDay: "2026-11-26" });
  });

  it("rolls 'today' over at local midnight", () => {
    // In Tokyo `now` is already the 27th, so activity on the 25th (Tokyo) is two days ago: streak broken.
    const ts = ["2026-11-24T05:00:00Z", "2026-11-25T05:00:00Z"]; // 14:00 on 24th / 25th in Tokyo
    expect(computeStudyStreak(ts, now, TOKYO)).toMatchObject({ current: 0, longest: 2 });
    expect(computeStudyStreak(ts, now, NY)).toMatchObject({ current: 2 });
  });

  it("handles a DST change without breaking the run", () => {
    // US DST ended 2026-11-01. Evening activity across the switch stays consecutive.
    const ts = ["2026-10-31T23:00:00Z", "2026-11-01T23:00:00Z", "2026-11-02T23:00:00Z"];
    const at = new Date("2026-11-03T12:00:00Z");
    expect(computeStudyStreak(ts, at, NY)).toMatchObject({ current: 3, longest: 3 });
  });

  it("ignores invalid, null and future timestamps", () => {
    const s = computeStudyStreak(["nope", null, undefined, "2026-11-30T00:00:00Z", new Date("2026-11-26T01:00:00Z")], now, UTC);
    expect(s).toMatchObject({ current: 1, longest: 1, activeToday: true });
  });

  it("handles month and year boundaries", () => {
    const ts = ["2026-12-30T12:00:00Z", "2026-12-31T12:00:00Z", "2027-01-01T12:00:00Z"];
    expect(computeStudyStreak(ts, new Date("2027-01-01T18:00:00Z"), UTC)).toMatchObject({ current: 3, longest: 3 });
  });
});
