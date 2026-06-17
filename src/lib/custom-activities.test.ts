import { describe, expect, it } from "vitest";
import {
  ACTIVITY_NAME_MAX,
  validateCustomActivityInput,
} from "./custom-activities";

describe("validateCustomActivityInput", () => {
  it("requires a non-empty name", () => {
    expect(validateCustomActivityInput({ name: "   " })).toEqual({
      ok: false,
      error: "activity title is required",
    });
  });

  it("trims and accepts valid input", () => {
    expect(
      validateCustomActivityInput({
        name: "  stretch  ",
        emoji: "🤸",
        doneMessage: "so flexible",
      }),
    ).toEqual({
      ok: true,
      data: {
        name: "stretch",
        emoji: "🤸",
        doneMessage: "so flexible",
      },
    });
  });

  it("rejects names over the max length", () => {
    const name = "a".repeat(ACTIVITY_NAME_MAX + 1);
    const result = validateCustomActivityInput({ name });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain(String(ACTIVITY_NAME_MAX));
    }
  });

  it("allows empty emoji and done message", () => {
    expect(validateCustomActivityInput({ name: "walk" })).toEqual({
      ok: true,
      data: {
        name: "walk",
        emoji: "",
        doneMessage: undefined,
      },
    });
  });
});
