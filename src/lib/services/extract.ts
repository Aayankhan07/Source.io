// Client-side text extraction for PDF and DOCX files.
import { extractText, getDocumentProxy } from "unpdf";
import mammoth from "mammoth";

async function extractPdfText(file: File): Promise<string> {
  const ab = await file.arrayBuffer();
  const pdf = await getDocumentProxy(new Uint8Array(ab));
  const { text } = await extractText(pdf, { mergePages: false });
  if (Array.isArray(text)) {
    return text
      .map((pageText, idx) => `--- Slide / Page ${idx + 1} ---\n${String(pageText || "").trim()}`)
      .join("\n\n")
      .replace(/[ \t]+\n/g, "\n")
      .trim();
  }
  const out = String(text ?? "");
  return out.replace(/\s+\n/g, "\n").trim();
}

async function extractDocxText(file: File): Promise<string> {
  const ab = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: ab });
  return (result.value ?? "").trim();
}

export async function extractFileText(file: File): Promise<{ text: string; sourceType: "pdf" | "docx" }> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return { text: await extractPdfText(file), sourceType: "pdf" };
  if (ext === "docx" || ext === "doc") return { text: await extractDocxText(file), sourceType: "docx" };
  throw new Error("Unsupported file type for client-side extraction");
}
