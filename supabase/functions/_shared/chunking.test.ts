import { describe, it, expect } from "vitest";
import { chunkText, missingOrderIndexes, OVERLAP, TARGET_CHARS, toVectorLiteral } from "./chunking";

describe("chunkText", () => {
  it("returns nothing for empty input", () => {
    expect(chunkText("")).toEqual([]);
    expect(chunkText(null)).toEqual([]);
    expect(chunkText("   \n\t ")).toEqual([]);
  });

  it("normalizes whitespace and keeps short text in one chunk", () => {
    expect(chunkText("  hello \n\n world  ")).toEqual(["hello world"]);
  });

  it("splits long text into overlapping windows", () => {
    const text = Array.from({ length: 4000 }, (_, i) => String.fromCharCode(97 + (i % 26))).join("");
    const chunks = chunkText(text);
    expect(chunks.length).toBe(Math.ceil((text.length - OVERLAP) / (TARGET_CHARS - OVERLAP)));
    expect(chunks.every((c) => c.length <= TARGET_CHARS)).toBe(true);
    expect(chunks[1].startsWith(text.slice(TARGET_CHARS - OVERLAP, TARGET_CHARS))).toBe(true);
    expect(chunks[chunks.length - 1].endsWith(text.slice(-10))).toBe(true);
  });

  it("is deterministic (index rows are keyed by order_index)", () => {
    const text = "word ".repeat(2000);
    expect(chunkText(text)).toEqual(chunkText(text));
  });
});

describe("helpers", () => {
  it("formats vector literals", () => {
    expect(toVectorLiteral([0.5, -1, 0])).toBe("[0.5,-1,0]");
    expect(toVectorLiteral(new Float32Array([1, 2]))).toBe("[1,2]");
  });

  it("finds missing order indexes", () => {
    expect(missingOrderIndexes(5, [0, 2, 4, 9])).toEqual([1, 3]);
    expect(missingOrderIndexes(0, [])).toEqual([]);
    expect(missingOrderIndexes(3, [])).toEqual([0, 1, 2]);
  });
});
