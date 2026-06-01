import { describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Read environment variables directly from .env file to ensure exact matches
const envPath = path.resolve(__dirname, "../../.env");
const envContent = fs.readFileSync(envPath, "utf-8");

const env: Record<string, string> = {};
envContent.split("\n").forEach((line) => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || "";
    // Remove quotes
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.substring(1, value.length - 1);
    }
    env[key] = value;
  }
});

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY;

describe("Supabase Connection Test", () => {
  it("should connect to Supabase successfully", async () => {
    expect(SUPABASE_URL).toBeDefined();
    expect(SUPABASE_PUBLISHABLE_KEY).toBeDefined();

    console.log("Testing Supabase connection with URL:", SUPABASE_URL);
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
    
    // We try to fetch profiles to verify the connection
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .limit(1);

    if (error) {
      console.error("Supabase connection error:", error);
    } else {
      console.log("Supabase connection successful. Retrieved profiles:", data);
    }

    expect(error).toBeNull();
  });
});
