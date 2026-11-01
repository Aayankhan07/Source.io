import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
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

const MOCK_CARDS: FlashcardRow[] = [
  {
    id: "card-1",
    document_id: "doc-1",
    front: "What is Quantum Superposition?",
    back: "A principle of quantum mechanics where a system can exist in multiple states simultaneously.",
    order_index: 0,
  },
  {
    id: "card-2",
    document_id: "doc-1",
    front: "What is Wavefunction Collapse?",
    back: "The physical reduction of quantum superposition to a single definite eigenstate upon measurement.",
    order_index: 1,
  },
];

describe("FlashcardsDeck", () => {
  it("renders the first card front initially", () => {
    render(<FlashcardsDeck documentId="doc-1" cards={MOCK_CARDS} onRegenerate={vi.fn()} />);

    expect(screen.getByText("What is Quantum Superposition?")).toBeInTheDocument();
    expect(screen.getByText(/Card/i)).toBeInTheDocument();
    expect(screen.getByText(/0 mastered/i)).toBeInTheDocument();
  });

  it("flips the card to show back on clicking the card", () => {
    render(<FlashcardsDeck documentId="doc-1" cards={MOCK_CARDS} onRegenerate={vi.fn()} />);

    const cardPrompt = screen.getByText("What is Quantum Superposition?");
    const flippableStage = cardPrompt.closest(".perspective-1000");
    expect(flippableStage).toBeInTheDocument();

    fireEvent.click(flippableStage!);

    expect(
      screen.getByText("A principle of quantum mechanics where a system can exist in multiple states simultaneously.")
    ).toBeInTheDocument();
  });

  it("navigates to next card when next button is pressed", () => {
    render(<FlashcardsDeck documentId="doc-1" cards={MOCK_CARDS} onRegenerate={vi.fn()} />);

    const nextBtn = screen.getByLabelText(/next card/i);
    fireEvent.click(nextBtn);

    expect(screen.getByText("What is Wavefunction Collapse?")).toBeInTheDocument();
  });

  it("marks a card as mastered and updates the mastery tally", () => {
    render(<FlashcardsDeck documentId="doc-1" cards={MOCK_CARDS} onRegenerate={vi.fn()} />);

    // Click "Mastered" button
    const masteredBtn = screen.getByTitle(/mark mastered/i);
    fireEvent.click(masteredBtn);

    // Advances to card 2 and records 1 mastered in the badge
    expect(screen.getByText(/1 mastered/i)).toBeInTheDocument();
    expect(screen.getByText("What is Wavefunction Collapse?")).toBeInTheDocument();
  });
});
