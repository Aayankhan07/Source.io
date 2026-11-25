import { test, expect, type Page } from "@playwright/test";

/**
 * Authenticated happy-path journey against a real Supabase backend + AI pipeline.
 *
 * Requires a dedicated test account:
 *   E2E_USER_EMAIL=... E2E_USER_PASSWORD=... npx playwright test tests/e2e/journey.spec.ts
 *
 * The account must have a free document slot (< 3 saved documents). The test
 * deletes the document it creates at the end so runs are repeatable.
 */
const E2E_EMAIL = process.env.E2E_USER_EMAIL;
const E2E_PASSWORD = process.env.E2E_USER_PASSWORD;

// Tab labels vary by the account's role preset (see TAB_LABELS in src/types/customization.ts).
const NOTES_TAB = /^(Notes|Study Guide|Cornell Notes|Synthesis|Lit Review|Lesson Plan)$/;
const CARDS_TAB = /^(Flashcards|Word Cards|Leitner Deck|Key Claims|Handout Cards)(\s*\d+)?$/;
const QUIZ_TAB = /^(Quiz|Practice Check|Exam Practice|Board Quiz|Method Audit|Exam Builder)$/;

function buildSampleText(runId: string): string {
  // ~1500 chars of factual, citeable material. The run id keeps the content hash
  // unique so the upload never short-circuits into the duplicate-document path.
  return [
    `Photosynthesis study sheet (run ${runId}).`,
    "Photosynthesis is the process by which green plants, algae and some bacteria convert light energy into chemical energy stored in glucose.",
    "It takes place mainly in the chloroplasts of leaf mesophyll cells. Chloroplasts contain the green pigment chlorophyll, which absorbs red and blue light most strongly and reflects green light.",
    "The overall balanced equation is 6CO2 + 6H2O + light energy -> C6H12O6 + 6O2.",
    "Photosynthesis has two linked stages. The light-dependent reactions occur in the thylakoid membranes. There, light excites electrons in photosystem II and photosystem I, water is split (photolysis) to release oxygen as a by-product, and the energy carriers ATP and NADPH are produced.",
    "The light-independent reactions, known as the Calvin cycle, occur in the stroma. The enzyme RuBisCO fixes carbon dioxide onto ribulose bisphosphate (RuBP). Using ATP and NADPH from the light reactions, the cycle produces glyceraldehyde-3-phosphate (G3P), which the plant uses to build glucose, sucrose and starch.",
    "Three main factors limit the rate of photosynthesis: light intensity, carbon dioxide concentration and temperature. Temperature matters because the Calvin cycle is enzyme-controlled; above roughly 40 degrees Celsius enzymes such as RuBisCO begin to denature.",
    "C4 plants such as maize and sugarcane first fix carbon into a four-carbon compound, which reduces photorespiration in hot, bright climates. CAM plants such as cacti open their stomata at night to conserve water.",
  ].join("\n\n");
}

/** Resolve the post-login landing: complete onboarding if RequireAuth sends us there. */
async function reachWorkspaceHome(page: Page) {
  const skipOnboarding = page.getByRole("button", { name: /Skip with Defaults/i });
  const uploadButton = page.getByRole("button", { name: /^(Upload|Upload First Source)$/ }).first();

  // Onboarding status loads asynchronously from Supabase, so the redirect can
  // happen after the dashboard first paints. Re-check a few times.
  for (let attempt = 0; attempt < 3; attempt++) {
    await expect(skipOnboarding.or(uploadButton).first()).toBeVisible({ timeout: 30_000 });
    if (await skipOnboarding.isVisible()) {
      await skipOnboarding.click();
      await page.waitForURL((url) => url.pathname === "/app", { timeout: 30_000 });
      continue;
    }
    await page.waitForLoadState("networkidle").catch(() => {});
    if (!/\/app\/onboarding/.test(new URL(page.url()).pathname)) return uploadButton;
  }
  return uploadButton;
}

test.describe("Authenticated study journey", () => {
  test.skip(
    !E2E_EMAIL || !E2E_PASSWORD,
    "Set E2E_USER_EMAIL and E2E_USER_PASSWORD to run the authenticated journey.",
  );

  test("sign in, upload text, stream notes, open study modes and ask a cited question", async ({ page }) => {
    test.setTimeout(6 * 60_000);
    const runId = `${Date.now()}`;
    const title = `E2E Photosynthesis ${runId}`;

    // 1. Sign in
    await page.goto("/auth");
    await expect(page.getByRole("heading", { name: /Welcome back/i })).toBeVisible();
    await page.getByLabel("Email address").fill(E2E_EMAIL!);
    await page.getByLabel("Password").fill(E2E_PASSWORD!);
    await page.getByRole("button", { name: /Sign in to Workspace/i }).click();
    await page.waitForURL(/\/app(\/onboarding)?(\?.*)?$/, { timeout: 30_000 });

    // 2. Land on /app (skipping onboarding if shown)
    const uploadButton = await reachWorkspaceHome(page);

    // 3. Open the upload dialog and paste text
    await uploadButton.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("Add Study Material")).toBeVisible();
    await dialog.getByRole("tab", { name: /Text/i }).click();
    await dialog.getByLabel("Title").fill(title);
    await dialog.getByLabel("Paste your material").fill(buildSampleText(runId));
    await dialog.getByRole("button", { name: /^Add Text$/ }).click();

    // 4. Document workspace opens
    await page.waitForURL(/\/app\/doc\/[^/?]+/, { timeout: 30_000 });
    const docUrl = page.url();

    try {
      // 5. Notes stream in. Regenerate appears once markdown exists and is
      //    re-enabled when streaming completes.
      const regenerate = page.getByRole("button", { name: /^Regenerate$/ }).first();
      await expect(regenerate).toBeVisible({ timeout: 120_000 });
      await expect(regenerate).toBeEnabled({ timeout: 120_000 });
      await expect(page.getByText("Generating notes…")).toBeHidden({ timeout: 120_000 });

      // 6. Flashcards tab
      await page.getByRole("tab", { name: CARDS_TAB }).click();
      await expect(
        page
          .getByText(/No flashcards yet|Generate Flashcard Deck|Review Full Deck|Press Space to reveal answer/i)
          .first(),
      ).toBeVisible({ timeout: 60_000 });

      // 7. Quiz tab
      await page.getByRole("tab", { name: QUIZ_TAB }).click();
      await expect(
        page
          .getByText(/Generate Practice Quiz|Generating Quiz|Retake Quiz|Generate New Questions|Submit|Previous/i)
          .first(),
      ).toBeVisible({ timeout: 60_000 });

      // 8. Back to notes and ask a grounded question in the Ask Copilot panel
      await page.getByRole("tab", { name: NOTES_TAB }).click();
      const openCopilot = page.getByRole("button", { name: /^Ask Copilot$/ });
      if (await openCopilot.isVisible().catch(() => false)) await openCopilot.click();

      const askInput = page.getByPlaceholder("Ask a question about this lecture…").filter({ visible: true });
      await expect(askInput).toBeVisible({ timeout: 30_000 });
      await askInput.fill("Where in the chloroplast does the Calvin cycle take place?");
      await page.getByRole("button", { name: "Send" }).filter({ visible: true }).click();

      // The question is echoed, the reply finishes streaming (input re-enables once
      // `sending` clears) and is grounded with at least one citation chip.
      await expect(page.getByText(/Where in the chloroplast does the Calvin cycle/).filter({ visible: true })).toBeVisible();
      await expect(askInput).toBeEnabled({ timeout: 120_000 });
      const citations = page.getByRole("list", { name: "Citations" }).filter({ visible: true }).last();
      await expect(citations.getByRole("listitem").first()).toBeVisible({ timeout: 120_000 });
    } finally {
      // Free the slot so the next run has room (3-document limit). Best-effort.
      try {
        if (!page.isClosed()) {
          if (page.url() !== docUrl) await page.goto(docUrl);
          await page.getByRole("tab", { name: NOTES_TAB }).click({ timeout: 10_000 });
          await page.getByTitle("Delete document").filter({ visible: true }).first().click({ timeout: 10_000 });
          await page
            .getByRole("alertdialog")
            .getByRole("button", { name: "Delete document" })
            .click({ timeout: 10_000 });
          await page.waitForURL((url) => url.pathname === "/app", { timeout: 15_000 });
        }
      } catch (err) {
        console.warn(`[journey] cleanup failed, delete "${title}" manually:`, err);
      }
    }
  });
});
