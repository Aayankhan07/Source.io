export interface ChangelogEntry {
  /** ISO date. */
  date: string;
  title: string;
  body: string;
  status?: "rolling-out";
  link?: { href: string; label: string };
}

/** Real, shipped changes only. Newest first. */
export const CHANGELOG: ChangelogEntry[] = [
  {
    date: "2026-11-26",
    title: "Full-document notes, section by section",
    body: "Notes are being generated from the whole document, one section at a time, instead of from the opening pages only.",
    status: "rolling-out",
  },
  {
    date: "2026-11-26",
    title: "Source passages under every chat answer",
    body: "Chat answers now list the passages of your document they used. Click a passage to read it, with its similarity score.",
  },
  {
    date: "2026-11-26",
    title: "Audio recaps play in your browser",
    body: "Two-host audio recaps are now read aloud by your browser's built-in voices. The script is not sent to a speech service.",
  },
  {
    date: "2026-11-26",
    title: "Clear plan limits",
    body: "Daily AI actions, documents, pages per document and upload sizes now come from one definition and are the same on the pricing page, in the app and in our public docs.",
    link: { href: "/pricing", label: "See pricing" },
  },
  {
    date: "2026-11-26",
    title: "A dashboard that shows only your real activity",
    body: "The dashboard no longer shows placeholder numbers. Charts and stats appear once you have studied, and are built only from your own activity, such as flashcard reviews.",
  },
  {
    date: "2026-11-26",
    title: "Public demo, no sign-up needed",
    body: "Browse sample workspaces with notes, flashcards, a quiz, an audio recap script and chat, generated from real study documents.",
    link: { href: "/demo", label: "Open the demo" },
  },
  {
    date: "2026-11-26",
    title: "Privacy policy, terms and refund policy",
    body: "We published a privacy policy naming every provider that processes your data, terms of service, and a refund and cancellation policy.",
    link: { href: "/privacy", label: "Read the privacy policy" },
  },
];

export const CHANGELOG_UPDATED = CHANGELOG.reduce((latest, e) => (e.date > latest ? e.date : latest), "1970-01-01");
