import { describe, expect, it } from "vitest";
import { getNudgeDate } from "./nudge-date";

describe("getNudgeDate", () => {
  it("uses the same calendar date at or after 5am", () => {
    const date = new Date("2026-06-17T12:00:00-07:00");
    expect(getNudgeDate(date, "America/Los_Angeles")).toBe("2026-06-17");
  });

  it("uses the previous calendar date before 5am", () => {
    const date = new Date("2026-06-17T04:30:00-07:00");
    expect(getNudgeDate(date, "America/Los_Angeles")).toBe("2026-06-16");
  });

  it("treats 5am as the start of the new day", () => {
    const date = new Date("2026-06-17T05:00:00-07:00");
    expect(getNudgeDate(date, "America/Los_Angeles")).toBe("2026-06-17");
  });
});
