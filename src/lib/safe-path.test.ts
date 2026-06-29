import { describe, expect, it } from "vitest";
import { safeInternalPath } from "./safe-path";

describe("safeInternalPath", () => {
  it("returns home for missing or unsafe values", () => {
    expect(safeInternalPath(null)).toBe("/");
    expect(safeInternalPath(undefined)).toBe("/");
    expect(safeInternalPath("")).toBe("/");
    expect(safeInternalPath("//evil.com")).toBe("/");
    expect(safeInternalPath("https://evil.com")).toBe("/");
  });

  it("blocks login loops", () => {
    expect(safeInternalPath("/login")).toBe("/");
    expect(safeInternalPath("/login?from=/")).toBe("/");
  });

  it("allows normal internal paths", () => {
    expect(safeInternalPath("/")).toBe("/");
    expect(safeInternalPath("/eat")).toBe("/eat");
    expect(safeInternalPath("/move?tab=1")).toBe("/move?tab=1");
  });
});
