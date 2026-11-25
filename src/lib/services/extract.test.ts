import { describe, it, expect, vi, beforeEach } from "vitest";

const { extractText, getDocumentProxy, extractRawText } = vi.hoisted(() => ({
  extractText: vi.fn(),
  getDocumentProxy: vi.fn(async () => ({})),
  extractRawText: vi.fn(),
}));
vi.mock("unpdf", () => ({ extractText, getDocumentProxy }));
vi.mock("mammoth", () => ({ default: { extractRawText } }));

import { extractFileText } from "./extract";

// jsdom 20 File has no arrayBuffer(); the extractors only need name + arrayBuffer.
const file = (name: string) => ({ name, arrayBuffer: async () => new ArrayBuffer(4) }) as unknown as File;

beforeEach(() => {
  extractText.mockReset();
  extractRawText.mockReset();
});

describe("extractFileText", () => {
  it("labels each PDF page", async () => {
    extractText.mockResolvedValueOnce({ text: ["  First page  \n", "", null] });
    const out = await extractFileText(file("notes.PDF"));
    expect(out.sourceType).toBe("pdf");
    expect(out.text).toBe("--- Slide / Page 1 ---\nFirst page\n\n--- Slide / Page 2 ---\n\n\n--- Slide / Page 3 ---");
  });

  it("handles merged PDF text", async () => {
    extractText.mockResolvedValueOnce({ text: "Hello   \nworld  " });
    expect((await extractFileText(file("a.pdf"))).text).toBe("Hello\nworld");
    extractText.mockResolvedValueOnce({ text: undefined });
    expect((await extractFileText(file("a.pdf"))).text).toBe("");
  });

  it("extracts DOCX and legacy DOC text", async () => {
    extractRawText.mockResolvedValueOnce({ value: "  Body text " });
    expect(await extractFileText(file("essay.docx"))).toEqual({ text: "Body text", sourceType: "docx" });
    extractRawText.mockResolvedValueOnce({});
    expect(await extractFileText(file("old.doc"))).toEqual({ text: "", sourceType: "docx" });
  });

  it("rejects unsupported files", async () => {
    await expect(extractFileText(file("image.png"))).rejects.toThrow(/Unsupported/);
    await expect(extractFileText(file("noextension"))).rejects.toThrow(/Unsupported/);
  });
});
