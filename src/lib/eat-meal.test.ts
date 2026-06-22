import { describe, expect, it } from "vitest";
import {
  dateFromPickerValues,
  dateToPickerValues,
  formatFriendlyTime,
  formatRelativeTime,
  formatRelativeTimeRange,
  formatTimeRange,
  getActiveMealCardStatus,
  getActiveMealStatus,
  getAutophagyStatusText,
  getCurrentMealStatusRow,
  getDigestionStatusText,
  getEatingFromStorageStatusText,
  getMealPhase,
  getMealStatusRows,
  getMealWindows,
  getPancreasRampDownStatusText,
  isMealActive,
  roundToNearest15Minutes,
  shouldApplyNewMeal,
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
  it("uses the full snack timeline", () => {
    const selectedAt = new Date("2026-06-17T18:07:00-04:00");
    const windows = getMealWindows(selectedAt, "small snack");

    expect(windows.digestionStart).toEqual(new Date("2026-06-17T18:00:00-04:00"));
    expect(windows.digestionEnd).toEqual(new Date("2026-06-17T19:00:00-04:00"));
    expect(windows.pancreasRampDownEnd).toEqual(new Date("2026-06-17T20:00:00-04:00"));
    expect(windows.eatingFromStorageEnd).toEqual(new Date("2026-06-18T02:00:00-04:00"));
    expect(windows.autophagyEnd).toEqual(new Date("2026-06-19T02:00:00-04:00"));
  });

  it("uses the full reasonable meal timeline", () => {
    const selectedAt = new Date("2026-06-17T18:07:00-04:00");
    const windows = getMealWindows(selectedAt, "reasonable meal");

    expect(windows.digestionEnd).toEqual(new Date("2026-06-17T20:00:00-04:00"));
    expect(windows.pancreasRampDownEnd).toEqual(new Date("2026-06-17T22:00:00-04:00"));
    expect(windows.eatingFromStorageEnd).toEqual(new Date("2026-06-18T08:00:00-04:00"));
    expect(windows.autophagyEnd).toEqual(new Date("2026-06-19T08:00:00-04:00"));
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

  it("treats a meal as active until autophagy ends", () => {
    const selectedAt = roundToNearest15Minutes(
      new Date("2026-06-17T18:07:00-04:00"),
    );
    const lastMeal = {
      mealSize: "reasonable meal" as const,
      selectedAt: selectedAt.toISOString(),
    };

    expect(
      isMealActive(lastMeal, new Date("2026-06-19T07:00:00-04:00")),
    ).toBe(true);
    expect(
      isMealActive(lastMeal, new Date("2026-06-19T08:00:00-04:00")),
    ).toBe(false);
  });

  it("uses until for the current phase and from for the others", () => {
    const windows = getMealWindows(
      new Date("2026-06-17T18:00:00-04:00"),
      "reasonable meal",
    );
    const duringDigestion = new Date("2026-06-17T18:30:00-04:00");
    const duringPancreasRampDown = new Date("2026-06-17T21:00:00-04:00");
    const duringEatingFromStorage = new Date("2026-06-17T23:00:00-04:00");
    const duringAutophagy = new Date("2026-06-18T10:00:00-04:00");

    expect(getMealPhase(windows, duringDigestion)).toBe("digestion");
    expect(getDigestionStatusText(windows, duringDigestion)).toBe(
      "body is processing food until 8pm tonight...",
    );
    expect(getPancreasRampDownStatusText(windows, duringDigestion)).toBe(
      "pancreas will ramp down and we will approach our blood sugar baseline from 8-10pm.",
    );
    expect(getEatingFromStorageStatusText(windows, duringDigestion)).toBe(
      "will snack on liver glycogen (nom nom nom) from 10pm tonight until 8am tomorrow.",
    );
    expect(getAutophagyStatusText(windows, duringDigestion)).toBe(
      "autophagy. let's clean those streets! 🧹 from 8am tomorrow until 8am the day after that.",
    );

    expect(getMealPhase(windows, duringPancreasRampDown)).toBe(
      "pancreas-ramp-down",
    );
    expect(getDigestionStatusText(windows, duringPancreasRampDown)).toBe(
      "body processed food from 6-8pm.",
    );
    expect(getPancreasRampDownStatusText(windows, duringPancreasRampDown)).toBe(
      "pancreas is ramping down and we will approach our blood sugar baseline until 10pm tonight...",
    );

    expect(getMealPhase(windows, duringEatingFromStorage)).toBe(
      "eating-from-storage",
    );
    expect(getEatingFromStorageStatusText(windows, duringEatingFromStorage)).toBe(
      "snacking on liver glycogen (nom nom nom) until 8am tomorrow...",
    );

    expect(getMealPhase(windows, duringAutophagy)).toBe("autophagy");
    expect(getAutophagyStatusText(windows, duringAutophagy)).toBe(
      "autophagy. cleaning crew is working! 🧹 until 8am tomorrow...",
    );

    const statusRows = getMealStatusRows(windows, duringPancreasRampDown);
    expect(statusRows[0]?.isDone).toBe(true);
    expect(statusRows[1]?.isDone).toBe(false);
    expect(statusRows[2]?.isDone).toBe(false);

    const currentStatus = getCurrentMealStatusRow(windows, duringPancreasRampDown);
    expect(currentStatus.text).toBe(
      "pancreas is ramping down and we will approach our blood sugar baseline until 10pm tonight...",
    );
  });

  it("returns the active meal status for the home eat card", () => {
    const selectedAt = roundToNearest15Minutes(
      new Date("2026-06-17T18:07:00-04:00"),
    );
    const lastMeal = {
      mealSize: "reasonable meal" as const,
      selectedAt: selectedAt.toISOString(),
    };
    const duringEatingFromStorage = new Date("2026-06-17T23:00:00-04:00");

    const originalWindow = globalThis.window;
    const storage = new Map<string, string>([
      ["nudge-eat-last-meal", JSON.stringify(lastMeal)],
    ]);

    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        localStorage: {
          getItem: (key: string) => storage.get(key) ?? null,
          setItem: (key: string, value: string) => {
            storage.set(key, value);
          },
          removeItem: (key: string) => {
            storage.delete(key);
          },
        },
      },
    });

    try {
      const status = getActiveMealCardStatus(duringEatingFromStorage);
      expect(status).toEqual({
        icon: "🍯",
        label: "snacking on liver glycogen (nom nom nom)...",
      });
    } finally {
      if (originalWindow) {
        Object.defineProperty(globalThis, "window", {
          configurable: true,
          value: originalWindow,
        });
      } else {
        Reflect.deleteProperty(globalThis, "window");
      }
    }
  });

  it("formats cross-day ranges with tomorrow and the day after that", () => {
    const now = new Date("2026-06-17T22:30:00-04:00");
    const start = new Date("2026-06-17T23:00:00-04:00");
    const end = new Date("2026-06-18T01:00:00-04:00");
    const tomorrowStart = new Date("2026-06-18T04:00:00-04:00");
    const tomorrowEnd = new Date("2026-06-18T06:00:00-04:00");

    expect(formatRelativeTimeRange(start, end, now)).toBe(
      "11pm-1am tomorrow",
    );
    expect(formatRelativeTimeRange(tomorrowStart, tomorrowEnd, now)).toBe(
      "4-6am tomorrow",
    );
    expect(formatRelativeTime(new Date("2026-06-18T20:00:00-04:00"), now)).toBe(
      "8pm tomorrow",
    );
  });

  it("converts between picker values and dates", () => {
    const baseDate = new Date("2026-06-17T00:00:00-04:00");
    const picked = dateFromPickerValues({
      hour12: 6,
      minute: 15,
      meridiem: "pm",
      baseDate,
    });

    expect(picked).toEqual(new Date("2026-06-17T18:15:00-04:00"));
    expect(dateToPickerValues(picked)).toEqual({
      hour12: 6,
      minute: 15,
      meridiem: "pm",
    });
  });

  it("upgrades the timeline when a larger meal is logged during an active one", () => {
    const feastAt = new Date("2026-06-17T15:00:00-04:00");
    const activeFeast = {
      mealSize: "feast" as const,
      selectedAt: feastAt.toISOString(),
    };
    const oneHourLater = new Date("2026-06-17T16:00:00-04:00");

    expect(
      shouldApplyNewMeal(activeFeast, "small snack", oneHourLater),
    ).toBe(false);
    expect(
      shouldApplyNewMeal(activeFeast, "reasonable meal", oneHourLater),
    ).toBe(false);
    expect(shouldApplyNewMeal(activeFeast, "feast", oneHourLater)).toBe(false);

    const snackAt = new Date("2026-06-17T15:00:00-04:00");
    const activeSnack = {
      mealSize: "small snack" as const,
      selectedAt: snackAt.toISOString(),
    };

    expect(
      shouldApplyNewMeal(activeSnack, "reasonable meal", oneHourLater),
    ).toBe(true);
    expect(shouldApplyNewMeal(activeSnack, "feast", oneHourLater)).toBe(true);
    expect(
      shouldApplyNewMeal(activeSnack, "small snack", oneHourLater),
    ).toBe(false);
  });

  it("always applies a meal when nothing is active", () => {
    const expiredSnack = {
      mealSize: "small snack" as const,
      selectedAt: new Date("2026-06-17T12:00:00-04:00").toISOString(),
    };
    const later = new Date("2026-06-18T21:00:00-04:00");

    expect(isMealActive(expiredSnack, later)).toBe(false);
    expect(shouldApplyNewMeal(expiredSnack, "small snack", later)).toBe(true);
    expect(shouldApplyNewMeal(null, "reasonable meal", later)).toBe(true);
  });
});
