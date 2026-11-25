import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { FlashcardsDeck } from "./FlashcardsDeck";
import type { FlashcardRow } from "@/features/documents/types";

vi.mock("@/features/settings/context/SettingsContext", () => ({
  useSettings: () => ({
    notesSettings: {
      fontSize: "base",
      fontFamily: "sans",
      lineHeight: "normal",
      renderKaTeX: true,
    },
    updateSettings: vi.fn(),
  }),
}));

const authState: { user: { id: string } | null } = { user: null };
vi.mock("@/features/auth/context/AuthContext", () => ({
  useAuth: () => authState,
}));

const upsert = vi.fn();
const reviewRows: { flashcard_id: string; box: number; due_at: string; review_count: number; last_result: string | null }[] = [];
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => Promise.resolve({ data: reviewRows, error: null }),
      }),
      upsert: (...args: unknown[]) => {
        upsert(...args);
        return Promise.resolve({ error: null });
      },
    }),
  },
}));

const DOC_ID = "11111111-1111-4111-8111-111111111111";
const USER_ID = "22222222-2222-4222-8222-222222222222";

const MOCK_CARDS: FlashcardRow[] = [
  {
    id: "card-1",
    document_id: DOC_ID,
    front: "What is Quantum Superposition?",
    back: "A principle of quantum mechanics where a system can exist in multiple states simultaneously.",
    order_index: 0,
  },
  {
    id: "card-2",
    document_id: DOC_ID,
    front: "What is Wavefunction Collapse?",
    back: "The physical reduction of quantum superposition to a single definite eigenstate upon measurement.",
    order_index: 1,
  },
];

function renderDeck(documentId = DOC_ID) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return render(<FlashcardsDeck documentId={documentId} cards={MOCK_CARDS} onRegenerate={vi.fn()} />, { wrapper });
}

describe("FlashcardsDeck", () => {
  beforeEach(() => {
    authState.user = null;
    upsert.mockClear();
    reviewRows.length = 0;
  });

  it("renders the first card front initially", () => {
    renderDeck();

    expect(screen.getByText("What is Quantum Superposition?")).toBeInTheDocument();
    expect(screen.getByText(/Card 1 of 2/i)).toBeInTheDocument();
    expect(screen.getByText(/0 remembered/i)).toBeInTheDocument();
  });

  it("flips the card to reveal the answer and the grading buttons", () => {
    renderDeck();

    expect(screen.queryByRole("button", { name: /^good/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /reveal answer/i }));

    expect(
      screen.getByText("A principle of quantum mechanics where a system can exist in multiple states simultaneously.")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^again/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^good: next review in 2 days/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^easy: next review in 4 days/i })).toBeInTheDocument();
  });

  it("navigates to next card when next button is pressed", () => {
    renderDeck();

    fireEvent.click(screen.getByRole("button", { name: /next card/i }));

    expect(screen.getByText("What is Wavefunction Collapse?")).toBeInTheDocument();
  });

  it("grading Good advances and updates the tally", () => {
    renderDeck();

    fireEvent.click(screen.getByRole("button", { name: /reveal answer/i }));
    fireEvent.click(screen.getByRole("button", { name: /^good/i }));

    expect(screen.getByText(/1 remembered/i)).toBeInTheDocument();
    expect(screen.getByText(/Card 2 of 2/i)).toBeInTheDocument();
  });

  it("keyboard shortcuts are scoped to the deck and only grade after reveal", () => {
    renderDeck();
    const stage = screen.getByRole("button", { name: /reveal answer/i });

    // "2" before reveal does nothing.
    fireEvent.keyDown(stage, { key: "2" });
    expect(screen.getByText(/Card 1 of 2/i)).toBeInTheDocument();

    // A key pressed outside the deck is ignored.
    fireEvent.keyDown(window, { key: " " });
    expect(screen.getByRole("button", { name: /reveal answer/i })).toBeInTheDocument();

    fireEvent.keyDown(stage, { key: " " });
    expect(screen.getByRole("button", { name: /show question/i })).toBeInTheDocument();

    fireEvent.keyDown(screen.getByRole("button", { name: /show question/i }), { key: "3" });
    expect(screen.getByText(/Card 2 of 2/i)).toBeInTheDocument();
    expect(screen.getByText(/1 remembered/i)).toBeInTheDocument();
  });

  it("does not swallow Space on focused buttons inside the deck", () => {
    renderDeck();
    const shuffle = screen.getByRole("button", { name: /shuffle deck/i });
    const evt = fireEvent.keyDown(shuffle, { key: " " });

    // Not prevented -> the button keeps its native Space activation; card not flipped.
    expect(evt).toBe(true);
    expect(screen.getByRole("button", { name: /reveal answer/i })).toBeInTheDocument();
  });

  it("does not persist reviews for demo decks or signed-out users", () => {
    renderDeck("demo-quantum");
    fireEvent.click(screen.getByRole("button", { name: /reveal answer/i }));
    fireEvent.click(screen.getByRole("button", { name: /^good/i }));

    expect(upsert).not.toHaveBeenCalled();
    expect(screen.queryByText(/Due today/i)).not.toBeInTheDocument();
  });

  it("saves the Leitner review for signed-in users and shows due count", async () => {
    authState.user = { id: USER_ID };
    renderDeck();

    expect(await screen.findByText(/Due today: 2/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /reveal answer/i }));
    fireEvent.click(screen.getByRole("button", { name: /^easy/i }));

    await waitFor(() => expect(upsert).toHaveBeenCalledTimes(1));
    const [row, opts] = upsert.mock.calls[0];
    expect(row).toMatchObject({
      user_id: USER_ID,
      document_id: DOC_ID,
      flashcard_id: "card-1",
      box: 3,
      last_result: "easy",
      review_count: 1,
    });
    expect(opts).toEqual({ onConflict: "user_id,flashcard_id" });
    // Optimistic update: card-1 is no longer due.
    expect(await screen.findByText(/Due today: 1/i)).toBeInTheDocument();
  });

  it("review due mode puts due cards first", async () => {
    authState.user = { id: USER_ID };
    reviewRows.push({
      flashcard_id: "card-1",
      box: 4,
      due_at: new Date(Date.now() + 5 * 86_400_000).toISOString(),
      review_count: 3,
      last_result: "good",
    });
    renderDeck();

    expect(await screen.findByText(/Due today: 1/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /review due cards/i }));

    expect(screen.getByText("What is Wavefunction Collapse?")).toBeInTheDocument();
    expect(screen.getByText(/Card 1 of 2/i)).toBeInTheDocument();
  });
});
