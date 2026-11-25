import { describe, expect, it } from "vitest";
import { safeNextPath } from "./safeNextPath";

describe("safeNextPath", () => {
  it("keeps same-origin relative paths", () => {
    expect(safeNextPath("/app/doc/1?tab=notes")).toBe("/app/doc/1?tab=notes");
  });
  it("rejects absolute, protocol-relative and backslash URLs", () => {
    for (const v of ["https://evil.example", "//evil.example", "/\\evil.example", "app", "", null, undefined]) {
      expect(safeNextPath(v)).toBe("/app");
    }
  });
});
