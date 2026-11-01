import { test, expect } from "@playwright/test";

test.describe("Source.io End-to-End User Journeys", () => {
  test("Homepage loads with branding, interactive modes, and video launch modal", async ({ page }) => {
    await page.goto("/");

    // 1. Verify title & brand presence
    await expect(page).toHaveTitle(/AI Study Notes, Flashcards & Quizzes with Citations \| Source.io/i);

    // 2. Verify H1 content
    const heading = page.locator("h1");
    await expect(heading).toContainText("Master the Text.");
    await expect(heading).toContainText("Skip the Grind.");

    // 3. Verify Mode tabs and switch to Flashcards
    const flashcardsTab = page.getByRole("button", { name: "Flashcards" });
    await expect(flashcardsTab).toBeVisible();
    await flashcardsTab.click();
    await expect(page.getByText(/Leitner Spaced Repetition/i)).toBeVisible();

    // 4. Open 20s Launch Film Video Modal
    const watchTourBtn = page.getByRole("button", { name: /watch tour/i });
    await expect(watchTourBtn).toBeVisible();
    await watchTourBtn.click();

    // 5. Verify modal dialog with video
    const modalTitle = page.getByText(/Source.io in 20 Seconds/i);
    await expect(modalTitle).toBeVisible();

    const video = page.locator("video");
    await expect(video).toBeVisible();
    await expect(video).toHaveAttribute("src", "/videos/brag.mp4");

    // 6. Close the video modal via Escape
    await page.keyboard.press("Escape");
    await expect(modalTitle).not.toBeVisible();
  });

  test("Comparison page (/vs-notebooklm) displays feature table and breadcrumbs", async ({ page }) => {
    await page.goto("/vs-notebooklm");

    // Verify title optimized for SERPs
    await expect(page).toHaveTitle("Source.io vs NotebookLM: Feature & Citation Comparison");

    // Verify main comparison heading
    const title = page.locator("h1");
    await expect(title).toContainText("Source.io vs. Google NotebookLM");

    // Verify comparison table exists
    const table = page.locator("table");
    await expect(table).toBeVisible();
    await expect(table).toContainText("Learning Capability");
    await expect(table).toContainText("Page & Line-Level Citations");
  });

  test("Pricing page (/pricing) displays plans and features", async ({ page }) => {
    await page.goto("/pricing");

    await expect(page).toHaveTitle(/Pricing & Plans/i);
    await expect(page.getByText(/Free Forever/i).first()).toBeVisible();
    await expect(page.getByText(/Scholar Pass/i).first()).toBeVisible();
  });

  test("Unauthenticated access to /app redirects to /auth", async ({ page }) => {
    await page.goto("/app");

    // RequireAuth redirects guest to /auth
    await page.waitForURL(/\/auth/);
    await expect(page.locator("h2, h1")).toContainText(/Welcome back|Sign in|Source\.io/i);
  });

  test("Non-existent URL renders custom 404 recovery screen", async ({ page }) => {
    await page.goto("/random-unmatched-route-xyz");

    await expect(page.getByText("Error 404")).toBeVisible();
    await expect(page.getByText("This page doesn't exist")).toBeVisible();

    // Click back to home
    const homeBtn = page.getByRole("link", { name: /back to home/i });
    await expect(homeBtn).toBeVisible();
    await homeBtn.click();

    await page.waitForURL("/");
    await expect(page).toHaveTitle(/Source.io/i);
  });
});

