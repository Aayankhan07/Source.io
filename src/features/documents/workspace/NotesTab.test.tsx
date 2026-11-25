import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { DocumentRow } from "@/features/documents/types";

vi.mock("@/components/common/MarkdownView", () => ({
  default: ({ children }: { children: string }) => <div data-testid="markdown-view">{children}</div>,
}));
vi.mock("@/features/documents/components/AskPanel", () => ({
  AskPanel: () => <div data-testid="ask-panel" />,
}));
vi.mock("@/features/documents/components/WorkspaceOutline", () => ({
  default: () => <div data-testid="outline" />,
}));
vi.mock("@/features/documents/components/NotesSettingsPopover", () => ({ default: () => null }));
vi.mock("@/components/common/AiFeedbackButtons", () => ({ AiFeedbackButtons: () => null }));
vi.mock("@/components/ui/resizable", () => ({
  ResizablePanelGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ResizablePanel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ResizableHandle: () => null,
}));
vi.mock("@/features/settings/context/SettingsContext", () => ({
  useSettings: () => ({
    settings: { readingTargetWpm: 200, preferredModel: "llama-3.3-70b" },
    notesSettings: { showPageSummaryBanner: true },
  }),
}));
vi.mock("@/features/documents/context/AppShellContext", () => ({
  useAppShell: () => ({ setCopilotOpen: () => {} }),
}));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: () => {} }) }));

import { NotesTab } from "./NotesTab";

const doc: DocumentRow = {
  id: "doc-1",
  title: "Photosynthesis",
  source_type: "text",
  status: "ready",
  error_code: null,
  created_at: "2026-11-01T00:00:00Z",
};

function mockViewport(desktop: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: desktop,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

const originalMatchMedia = window.matchMedia;
afterEach(() => {
  window.matchMedia = originalMatchMedia;
});

function renderNotes(overrides: Partial<React.ComponentProps<typeof NotesTab>> = {}) {
  return render(
    <NotesTab
      doc={doc}
      note={{ id: "n1", document_id: "doc-1", markdown: "# Light reactions\n\nText." }}
      assetsLoading={false}
      streaming={false}
      progress={null}
      incomplete={null}
      onGenerate={() => {}}
      onRequestDelete={() => {}}
      headings={[{ id: "light-reactions", text: "Light reactions", level: 1 }]}
      {...overrides}
    />,
  );
}

describe("NotesTab", () => {
  it.each([
    ["desktop", true],
    ["mobile", false],
  ])("mounts the notes and the Ask panel exactly once on %s", (_label, desktop) => {
    mockViewport(desktop);
    renderNotes();
    expect(screen.getAllByTestId("markdown-view")).toHaveLength(1);
    expect(screen.getAllByTestId("ask-panel")).toHaveLength(1);
    expect(screen.queryAllByTestId("outline")).toHaveLength(desktop ? 1 : 0);
  });

  it("gives the mobile view the same actions as desktop", () => {
    mockViewport(false);
    renderNotes();
    expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Export PDF/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete document" })).toBeInTheDocument();
  });

  it("shows section progress while generating and a continue action when paused", () => {
    mockViewport(false);
    const { rerender } = renderNotes({ note: null, streaming: true, progress: { section: 2, total: 5, cached: false } });
    expect(screen.getAllByText("Generating notes… Section 2 of 5").length).toBeGreaterThan(0);

    const onGenerate = vi.fn();
    rerender(
      <NotesTab
        doc={doc}
        note={{ id: "draft", document_id: "doc-1", markdown: "# Part" }}
        assetsLoading={false}
        streaming={false}
        progress={null}
        incomplete="Paused after 2 of 5 sections."
        onGenerate={onGenerate}
        onRequestDelete={() => {}}
        headings={[]}
      />,
    );
    screen.getByRole("button", { name: /Continue generating/ }).click();
    expect(onGenerate).toHaveBeenCalledWith();
  });

  it("shows the processing state on mobile", () => {
    mockViewport(false);
    renderNotes({ note: null, doc: { ...doc, status: "processing" } });
    expect(screen.getByText("Parsing source file...")).toBeInTheDocument();
  });
});
