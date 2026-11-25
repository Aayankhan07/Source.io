import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: [
      "src/**/*.{test,spec}.{ts,tsx}",
      "tests/unit/**/*.{test,spec}.{ts,tsx}",
      "supabase/functions/_shared/**/*.test.ts",
    ],
    exclude: ["node_modules", "dist", ".next", "tests/e2e/**"],
    // `npm run test:coverage`. Scope: the shared edge-function helpers and the client lib.
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      reportsDirectory: "./coverage",
      include: ["supabase/functions/_shared/**/*.ts", "src/lib/**/*.{ts,tsx}"],
      exclude: [
        // Test files are not product code.
        "**/*.test.{ts,tsx}",
        "**/*.spec.{ts,tsx}",
        // Deno-only test suites (run by `deno test` in the deno CI job, not by Vitest).
        "**/*_test.ts",
        // Type declarations emit no runtime code.
        "**/*.d.ts",
      ],
      // No module is excluded for wrapping Deno runtime APIs: the ones that do (auth.ts →
      // Deno.env + esm.sh createClient, embeddings.ts → Supabase.ai.Session, analytics.ts →
      // Deno.env) are exercised with stubbed globals / mocked URL imports instead.
      thresholds: {
        "supabase/functions/_shared/**": { lines: 70, functions: 70 },
        "src/lib/**": { lines: 70, functions: 70 },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
});
