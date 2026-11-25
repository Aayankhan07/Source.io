import { describe, it, expect } from "vitest";
import {
  allocateEvenly,
  condenseNotes,
  isBoundaryLine,
  packIntoGroups,
  SECTION_TARGET_CHARS,
  splitIntoSections,
} from "./sections";

const words = (n: number, seed = "word") => Array.from({ length: n }, (_, i) => `${seed}${i}`).join(" ");
const stripWs = (s: string) => s.replace(/\s+/g, "");

describe("splitIntoSections", () => {
  it("returns a short source as one section", () => {
    expect(splitIntoSections("Photosynthesis makes glucose.")).toEqual(["Photosynthesis makes glucose."]);
    expect(splitIntoSections("   ")).toEqual([]);
  });

  it("splits a long paged source at page markers into ~target-size sections", () => {
    // 60 pages of ~3,000 chars = ~180k chars -> about 12 sections of ~15k.
    const pages = Array.from({ length: 60 }, (_, i) => `--- Page ${i + 1} ---\n${words(330, `p${i}w`)}`);
    const raw = pages.join("\n");
    const sections = splitIntoSections(raw);
    expect(sections.length).toBeGreaterThanOrEqual(10);
    expect(sections.length).toBeLessThanOrEqual(14);
    for (const s of sections) {
      expect(s.length).toBeLessThanOrEqual(Math.floor(SECTION_TARGET_CHARS * 1.25));
      // Every section starts at a page boundary.
      expect(s.startsWith("--- Page ")).toBe(true);
    }
    // Nothing is dropped.
    expect(stripWs(sections.join(""))).toBe(stripWs(raw));
  });

  it("prefers headings as cut points", () => {
    const chapters = Array.from({ length: 6 }, (_, i) => `# Chapter ${i + 1}\n\n${words(1200, `c${i}w`)}`);
    const sections = splitIntoSections(chapters.join("\n\n"), 15_000);
    for (const s of sections) expect(s.startsWith("# Chapter")).toBe(true);
  });

  it("hard-splits a source with no boundaries without losing text", () => {
    const raw = "x".repeat(40_000);
    const sections = splitIntoSections(raw, 15_000);
    expect(sections.length).toBe(3);
    expect(sections.join("")).toBe(raw);
  });

  it("splits one huge paragraph at sentence ends and keeps punctuation", () => {
    const raw = Array.from({ length: 2000 }, (_, i) => `Sentence number ${i} is here.`).join(" ");
    const sections = splitIntoSections(raw, 15_000);
    expect(sections.length).toBeGreaterThan(1);
    for (const s of sections.slice(0, -1)) expect(s.endsWith(".")).toBe(true);
    expect(stripWs(sections.join(""))).toBe(stripWs(raw));
  });

  it("merges a tiny tail into the previous section", () => {
    const raw = `# A\n${"a ".repeat(7_750)}\n# C\n${"c ".repeat(300)}`;
    const sections = splitIntoSections(raw, 15_000);
    expect(sections.length).toBe(1);
    expect(sections[0]).toContain("# C");
  });
});

describe("isBoundaryLine", () => {
  it("detects page markers, headings and form feeds", () => {
    expect(isBoundaryLine("--- Slide / Page 4 ---")).toBe(true);
    expect(isBoundaryLine("## Results")).toBe(true);
    expect(isBoundaryLine("Chapter 12")).toBe(true);
    expect(isBoundaryLine("\fNext page")).toBe(true);
    expect(isBoundaryLine("The chapter ends here.")).toBe(false);
    expect(isBoundaryLine("")).toBe(false);
  });
});

describe("allocateEvenly / packIntoGroups / condenseNotes", () => {
  it("allocates totals evenly", () => {
    expect(allocateEvenly(10, 4)).toEqual([3, 3, 2, 2]);
    expect(allocateEvenly(2, 4)).toEqual([1, 1, 0, 0]);
    expect(allocateEvenly(5, 0)).toEqual([]);
  });

  it("packs consecutive parts within the limit", () => {
    expect(packIntoGroups(["aaaa", "bbbb", "cccc", "dddddddddddd"], 10)).toEqual([[0, 1], [2], [3]]);
  });

  it("keeps the key lines of long notes", () => {
    const md = `## Part 1: Cells\n${"filler sentence. ".repeat(200)}\n- **Cell**: unit of life\n| Concept | Meaning |\n#### ✅ Quick Revision\n- Mitochondria make ATP`;
    const out = condenseNotes(md, 500);
    expect(out.length).toBeLessThanOrEqual(500);
    expect(out).toContain("## Part 1: Cells");
    expect(out).toContain("Mitochondria make ATP");
    expect(out).not.toContain("filler sentence");
  });
});
