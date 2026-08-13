import { describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";

// Integration test against the live Supabase project. Vitest loads .env through
// Vite, so these are undefined when no credentials are configured and the suite
// skips itself rather than failing the run.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

const hasCredentials = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);

describe.skipIf(!hasCredentials)("Supabase Connection Test", () => {
  it("should connect to Supabase successfully", async () => {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_PUBLISHABLE_KEY!);

    // We try to fetch profiles to verify the connection
    const { error } = await supabase.from("profiles").select("*").limit(1);

    expect(error).toBeNull();
  });
});
