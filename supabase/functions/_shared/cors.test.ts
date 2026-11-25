import { describe, it, expect } from "vitest";
import { buildCorsHeaders } from "./cors";

describe("buildCorsHeaders", () => {
  it("uses * when env unset and never echoes origin", () => {
    expect(buildCorsHeaders("https://evil.com", undefined)["Access-Control-Allow-Origin"]).toBe("*");
    expect(buildCorsHeaders("https://evil.com", "*")["Access-Control-Allow-Origin"]).toBe("*");
  });

  it("echoes an allow-listed origin", () => {
    const h = buildCorsHeaders("https://sourceio.app", "https://sourceio.app,http://localhost:3000");
    expect(h["Access-Control-Allow-Origin"]).toBe("https://sourceio.app");
  });

  it("returns first allowed origin for unknown origins", () => {
    const h = buildCorsHeaders("https://evil.com", "https://sourceio.app,http://localhost:3000");
    expect(h["Access-Control-Allow-Origin"]).toBe("https://sourceio.app");
  });

  it("does not allow x-byok headers", () => {
    expect(buildCorsHeaders(null, undefined)["Access-Control-Allow-Headers"]).not.toContain("x-byok");
  });
});
