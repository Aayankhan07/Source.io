import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TactileHeroPrototype } from "./TactileHeroPrototype";

vi.mock("@/features/auth/context/AuthContext", () => ({
  useAuth: () => ({ user: null, loading: false }),
}));

vi.mock("@/hooks/use-theme", () => ({
  useTheme: () => ({ theme: "light", setTheme: vi.fn(), mounted: true }),
}));

// Mock Next.js Link
vi.mock("next/link", () => ({
  default: ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe("TactileHeroPrototype", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the headline with accessible sr-only context and branding", () => {
    render(<TactileHeroPrototype />);

    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toBeInTheDocument();
    expect(h1.textContent).toContain("Master the Text.");
    expect(h1.textContent).toContain("Skip the Grind.");
    expect(h1.textContent).toContain("AI Study Notes & Workspace —");
  });

  it("renders all four study mode tabs", () => {
    render(<TactileHeroPrototype />);

    expect(screen.getByRole("button", { name: /notes/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /flashcards/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /quiz/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /podcast/i })).toBeInTheDocument();
  });

  it("switches active tab when a mode button is clicked", () => {
    render(<TactileHeroPrototype />);

    const flashcardsBtn = screen.getByRole("button", { name: /flashcards/i });
    fireEvent.click(flashcardsBtn);

    // After clicking flashcards, the active badge should show Leitner
    expect(screen.getByText(/Leitner Spaced Repetition/i)).toBeInTheDocument();
  });

  it("opens the 20s launch film video modal when Watch Tour is clicked", () => {
    render(<TactileHeroPrototype />);

    // Video modal should not be visible initially
    expect(screen.queryByText(/Source.io in 20 Seconds/i)).not.toBeInTheDocument();

    // Click the "Watch tour" CTA button
    const watchTourBtn = screen.getByRole("button", { name: /watch tour/i });
    fireEvent.click(watchTourBtn);

    // Modal dialog should appear
    expect(screen.getByText(/Source.io in 20 Seconds/i)).toBeInTheDocument();

    // Video element should be present with correct source and poster
    const video = document.querySelector("video");
    expect(video).toBeInTheDocument();
    expect(video?.getAttribute("src")).toBe("/videos/brag.mp4");
    expect(video?.getAttribute("poster")).toBe("/videos/brag.jpg");
  });

  it("opens the video modal from the top announcement pill", () => {
    render(<TactileHeroPrototype />);

    const pillBtn = screen.getByRole("button", { name: /watch the 20s launch film/i });
    fireEvent.click(pillBtn);

    expect(screen.getByText(/Source.io in 20 Seconds/i)).toBeInTheDocument();
  });
});

