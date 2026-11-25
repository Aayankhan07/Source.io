import { permanentRedirect } from "next/navigation";

// The NotebookLM comparison lives at /vs-notebooklm; keep one canonical URL.
export default function NotebookLMAlternativeRedirect() {
  permanentRedirect("/vs-notebooklm");
}
