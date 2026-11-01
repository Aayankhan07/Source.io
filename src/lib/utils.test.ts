import { describe, it, expect } from "vitest";
import { cn, errorMessage, calculateReadTime } from "./utils";

describe("utils", () => {
  describe("cn", () => {
    it("merges class names correctly", () => {
      expect(cn("px-2 py-1", "bg-white")).toBe("px-2 py-1 bg-white");
    });

    it("resolves Tailwind conflicts using twMerge", () => {
      expect(cn("px-2 text-red-500", "px-4 text-blue-500")).toBe("px-4 text-blue-500");
    });

    it("handles falsy and conditional values cleanly", () => {
      const isHidden = false;
      const isVisible = true;
      expect(cn("base-class", isHidden && "hidden", isVisible && "block", null, undefined)).toBe(
        "base-class block"
      );
    });
  });

  describe("errorMessage", () => {
    it("extracts message from standard Error instance", () => {
      const err = new Error("Failed to process document");
      expect(errorMessage(err)).toBe("Failed to process document");
    });

    it("converts string thrown values", () => {
      expect(errorMessage("Direct string error")).toBe("Direct string error");
    });

    it("converts unknown objects to string representation", () => {
      expect(errorMessage(12345)).toBe("12345");
      expect(errorMessage({ code: 500 })).toBe("[object Object]");
    });
  });

  describe("calculateReadTime", () => {
    it("returns zero words and minimum 1 minute for empty or null inputs", () => {
      expect(calculateReadTime(null)).toEqual({ words: 0, readMinutes: 1 });
      expect(calculateReadTime(undefined)).toEqual({ words: 0, readMinutes: 1 });
      expect(calculateReadTime("")).toEqual({ words: 0, readMinutes: 1 });
      expect(calculateReadTime("    ")).toEqual({ words: 0, readMinutes: 1 });
    });

    it("calculates words and readMinutes based on default 200 WPM", () => {
      const shortText = "The quick brown fox jumps over the lazy dog";
      const res = calculateReadTime(shortText);
      expect(res.words).toBe(9);
      expect(res.readMinutes).toBe(1);

      // 450 words at 200 WPM should round up to ceil(450 / 200) = 3 minutes
      const wordsArray = new Array(450).fill("word");
      const longText = wordsArray.join(" ");
      const longRes = calculateReadTime(longText);
      expect(longRes.words).toBe(450);
      expect(longRes.readMinutes).toBe(3);
    });

    it("supports custom WPM speeds", () => {
      const wordsArray = new Array(300).fill("word");
      const text = wordsArray.join(" ");
      // At 100 WPM, 300 words takes 3 minutes
      expect(calculateReadTime(text, 100)).toEqual({ words: 300, readMinutes: 3 });
      // At 300 WPM, 300 words takes 1 minute
      expect(calculateReadTime(text, 300)).toEqual({ words: 300, readMinutes: 1 });
    });
  });
});

