import { describe, expect, it } from "vitest";
import {
  formatFriendlyTime,
  formatTimeRange,
  getMealPhase,
  getMealWindows,
  getProcessingStatusText,
  getRestStatusText,
  isMealActive,
  roundToNearest15Minutes,
} from "./eat-meal";

describe("roundToNearest15Minutes", () => {
  it("rounds down to the nearest 15 minutes", () => {
    expect(roundToNearest15Minutes(new Date("2026-06-17T18:07:00-04:00"))).toEqual(
      new Date("2026-06-17T18:00:00-04:00"),
    );
  });

  it("rounds up to the nearest 15 minutes", () => {
    expect(roundToNearest15Minutes(new Date("2026-06-17T18:08:00-04:00"))).toEqual(
      new Date("2026-06-17T18:15:00-04:00"),
    );
  });

  it("rolls into the next hour at 60 minutes", () => {
    expect(roundToNearest15Minutes(new Date("2026-06-17T18:53:00-04:00"))).toEqual(
      new Date("2026-06-17T19:00:00-04:00"),
    );
  });
});

describe("eat meal windows", () => {
  it("uses 1+1 hours for a small snack", () => {
    const selectedAt = new Date("2026-06-17T18:07:00-04:00");
    const windows = getMealWindows(selectedAt, "small snack");

    expect(windows.processingStart).toEqual(new Date("2026-06-17T18:00:00-04:00"));
    expect(windows.processingEnd).toEqual(new Date("2026-06-17T19:00:00-04:00"));
    expect(windows.restEnd).toEqual(new Date("2026-06-17T20:00:00-04:00"));
  });

  it("uses 2+2 hours for a reasonable meal", () => {
    const selectedAt = new Date("2026-06-17T18:07:00-04:00");
    const windows = getMealWindows(selectedAt, "reasonable meal");

    expect(windows.processingEnd).toEqual(new Date("2026-06-17T20:00:00-04:00"));
    expect(windows.restEnd).toEqual(new Date("2026-06-17T22:00:00-04:00"));
  });

  it("formats friendly local times", () => {
    const start = new Date("2026-06-17T18:00:00-04:00");
    const end = new Date("2026-06-17T20:00:00-04:00");

    expect(formatFriendlyTime(start)).toMatch(/6pm/i);
    expect(formatTimeRange(start, end)).toMatch(/6-8pm/i);
  });

  it("keeps both meridiems when a range crosses am and pm", () => {
    const start = new Date("2026-06-17T11:30:00-04:00");
    const end = new Date("2026-06-17T13:00:00-04:00");

    expect(formatTimeRange(start, end)).toMatch(/11:30am-1pm/i);
  });

  it("keeps minutes when not on the hour", () => {
    const time = new Date("2026-06-17T18:15:00-04:00");

    expect(formatFriendlyTime(time)).toMatch(/6:15pm/i);
  });

  it("treats a meal as active until pancreas rest ends", () => {
    const selectedAt = roundToNearest15Minutes(
      new Date("2026-06-17T18:07:00-04:00"),
    );
    const lastMeal = {
      mealSize: "reasonable meal" as const,
      selectedAt: selectedAt.toISOString(),
    };

    expect(
      isMealActive(lastMeal, new Date("2026-06-17T21:00:00-04:00")),
    ).toBe(true);
    expect(
      isMealActive(lastMeal, new Date("2026-06-17T22:00:00-04:00")),
    ).toBe(false);
  });

  it("uses until for the current phase and from for the other", () => {
    const windows = getMealWindows(
      new Date("2026-06-17T18:00:00-04:00"),
      "reasonable meal",
    );
    const duringProcessing = new Date("2026-06-17T18:30:00-04:00");
    const duringRest = new Date("2026-06-17T21:00:00-04:00");

    expect(getMealPhase(windows, duringProcessing)).toBe("processing");
    expect(getProcessingStatusText(windows, duringProcessing)).toBe(
      "body is processing food until 8pm...",
    );
    expect(getRestStatusText(windows, duringProcessing)).toBe(
      "pancreas will rest from 8-10pm.",
    );

    expect(getMealPhase(windows, duringRest)).toBe("resting");
    expect(getProcessingStatusText(windows, duringRest)).toBe(
      "body processed food from 6-8pm.",
    );
    expect(getRestStatusText(windows, duringRest)).toBe(
      "pancreas is resting until 10pm...",
    );
  });
});
