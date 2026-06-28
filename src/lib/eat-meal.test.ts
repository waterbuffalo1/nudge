import { describe, expect, it } from "vitest";
import {
  addLoggedMeal,
  dateFromPickerValues,
  dateToPickerValues,
  formatFriendlyTime,
  formatRelativeTime,
  formatRelativeTimeRange,
  formatTimeRange,
  getCombinedMealPhase,
  getCumulativeFillGrams,
  getCurrentMealStatusRow,
  getDigestionStatusText,
  getEatHomeCardLines,
  getFillWindowHours,
  getMealPhase,
  getMealStatusRows,
  getMealWindows,
  getPancreasRampDownStatusText,
  hoursToReachLiverFloor,
  isEatCycleActive,
  liverAfterDrainHours,
  LIVER_FLOOR_GRAMS,
  roundToNearest15Minutes,
  simulateMetabolicState,
} from "./eat-meal";
import { MEAL_LIVER_DEPOSIT_GRAMS } from "./eat-metabolic";

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
  it("uses digestion and pancreas windows for a snack", () => {
    const selectedAt = new Date("2026-06-17T18:07:00-04:00");
    const windows = getMealWindows(selectedAt, "small snack");

    expect(windows.digestionStart).toEqual(new Date("2026-06-17T18:00:00-04:00"));
    expect(windows.digestionEnd).toEqual(new Date("2026-06-17T19:00:00-04:00"));
    expect(windows.pancreasRampDownEnd).toEqual(new Date("2026-06-17T20:00:00-04:00"));
    expect(getFillWindowHours("small snack")).toBe(2);
    expect(MEAL_LIVER_DEPOSIT_GRAMS["small snack"]).toBe(8);
  });

  it("uses digestion and pancreas windows for a reasonable meal", () => {
    const selectedAt = new Date("2026-06-17T18:07:00-04:00");
    const windows = getMealWindows(selectedAt, "reasonable meal");

    expect(windows.digestionEnd).toEqual(new Date("2026-06-17T20:00:00-04:00"));
    expect(windows.pancreasRampDownEnd).toEqual(new Date("2026-06-17T22:00:00-04:00"));
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

  it("drains exponentially until the metabolic switch floor", () => {
    expect(liverAfterDrainHours(90, 4)).toBeCloseTo(55.7, 1);
    expect(hoursToReachLiverFloor(90)).toBeCloseTo(13.4, 1);
    expect(liverAfterDrainHours(90, hoursToReachLiverFloor(90))).toBeCloseTo(
      LIVER_FLOOR_GRAMS,
      1,
    );
  });

  it("uses until for the current phase and from for the others", () => {
    const windows = getMealWindows(
      new Date("2026-06-17T18:00:00-04:00"),
      "reasonable meal",
    );
    const duringDigestion = new Date("2026-06-17T18:30:00-04:00");
    const duringPancreasRampDown = new Date("2026-06-17T21:00:00-04:00");

    expect(getMealPhase(windows, duringDigestion)).toBe("digestion");
    expect(getDigestionStatusText(windows, duringDigestion)).toBe(
      "body is processing food until 8pm tonight...",
    );
    expect(getPancreasRampDownStatusText(windows, duringDigestion)).toBe(
      "pancreas will ramp down and we will approach our blood sugar baseline from 8-10pm.",
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

    const statusRows = getMealStatusRows(windows, duringPancreasRampDown);
    expect(statusRows[0]?.isDone).toBe(true);
    expect(statusRows[1]?.isDone).toBe(false);

    const currentStatus = getCurrentMealStatusRow(windows, duringPancreasRampDown);
    expect(currentStatus.text).toBe(
      "pancreas is ramping down and we will approach our blood sugar baseline until 10pm tonight...",
    );
  });

  it("returns home card lines during supported eat phases only", () => {
    const selectedAt = roundToNearest15Minutes(
      new Date("2026-06-17T18:07:00-04:00"),
    );
    const meals = [
      {
        mealSize: "reasonable meal" as const,
        selectedAt: selectedAt.toISOString(),
      },
    ];
    const duringPancreasRampDown = new Date("2026-06-17T21:00:00-04:00");
    const duringDigestion = new Date("2026-06-17T18:30:00-04:00");
    const duringLiver = new Date("2026-06-17T23:00:00-04:00");

    const originalWindow = globalThis.window;
    const storage = new Map<string, string>([
      ["nudge-eat-meals", JSON.stringify(meals)],
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
      expect(getEatHomeCardLines(duringDigestion)).toEqual([
        { leadingIcon: "⚙️", text: "digesting..." },
        {
          leadingIcon: "🚶🏻‍♀️",
          text: "good time to go for a walk!",
          italic: true,
        },
      ]);
      expect(getEatHomeCardLines(duringPancreasRampDown)).toEqual([
        { leadingIcon: "🫁", text: "insulin dropping..." },
        {
          leadingIcon: "🧘",
          text: "time to relax or stretch",
          italic: true,
        },
      ]);
      expect(getEatHomeCardLines(duringLiver)).toEqual([
        { leadingIcon: "🍯", text: "snacking on liver..." },
        {
          leadingIcon: "🏋🏻‍♀️",
          text: "good time for calisthenics!",
          italic: true,
        },
      ]);
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

  it("overlaps liver across meals and keeps latest digestion and pancreas", () => {
    const feastAt = new Date("2026-06-17T08:00:00-04:00");
    const snackAt = new Date("2026-06-17T12:00:00-04:00");
    const meals = [
      { mealSize: "feast" as const, selectedAt: feastAt.toISOString() },
      { mealSize: "small snack" as const, selectedAt: snackAt.toISOString() },
    ];

    expect(
      getCombinedMealPhase(meals, new Date("2026-06-17T12:30:00-04:00")),
    ).toBe("digestion");
    expect(
      getCombinedMealPhase(meals, new Date("2026-06-17T13:30:00-04:00")),
    ).toBe("pancreas-ramp-down");
    expect(
      getCombinedMealPhase(meals, new Date("2026-06-17T15:00:00-04:00")),
    ).toBe("eating-from-storage");
  });

  it("starts autophagy at the liver floor and ends the cycle after 24 hours", () => {
    const feastAt = new Date("2026-06-17T08:00:00-04:00");
    const meals = [{ mealSize: "feast" as const, selectedAt: feastAt.toISOString() }];
    const floorTime = new Date("2026-06-18T03:30:00-04:00");
    const duringAutophagy = new Date("2026-06-18T08:00:00-04:00");
    const afterCycle = new Date("2026-06-19T04:00:00-04:00");

    const atFloor = simulateMetabolicState(meals, floorTime);
    expect(atFloor?.currentPhase).toBe("autophagy");
    expect(atFloor?.liverGrams).toBeCloseTo(LIVER_FLOOR_GRAMS, 1);

    const during = simulateMetabolicState(meals, duringAutophagy);
    expect(during?.currentPhase).toBe("autophagy");
    expect(during?.fatDeltaGrams).toBeLessThan(0);

    expect(isEatCycleActive(meals, afterCycle)).toBe(false);
  });

  it("always appends a meal during an active cycle", () => {
    const feastAt = new Date("2026-06-17T08:00:00-04:00");
    const meals = [
      { mealSize: "feast" as const, selectedAt: feastAt.toISOString() },
    ];
    const oneHourLater = new Date("2026-06-17T09:00:00-04:00");

    const originalWindow = globalThis.window;
    const storage = new Map<string, string>([
      ["nudge-eat-meals", JSON.stringify(meals)],
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
      const snackAt = new Date("2026-06-17T12:00:00-04:00");
      const updated = addLoggedMeal("small snack", snackAt, oneHourLater);

      expect(updated).toHaveLength(2);
      expect(updated[1]?.mealSize).toBe("small snack");
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

  it("starts a fresh cycle when the previous one has expired", () => {
    const expiredSnack = {
      mealSize: "small snack" as const,
      selectedAt: new Date("2026-06-10T12:00:00-04:00").toISOString(),
    };
    const later = new Date("2026-06-18T21:00:00-04:00");

    expect(isEatCycleActive([expiredSnack], later)).toBe(false);

    const originalWindow = globalThis.window;
    const storage = new Map<string, string>([
      ["nudge-eat-meals", JSON.stringify([expiredSnack])],
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
      const newMealAt = new Date("2026-06-18T21:00:00-04:00");
      const updated = addLoggedMeal("reasonable meal", newMealAt, later);

      expect(updated).toHaveLength(1);
      expect(updated[0]?.mealSize).toBe("reasonable meal");
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

  it("caps liver fill and sends overflow to fat storage", () => {
    const feastAt = new Date("2026-06-17T08:00:00-04:00");
    const snackAt = new Date("2026-06-17T12:00:00-04:00");
    const meals = [
      { mealSize: "feast" as const, selectedAt: feastAt.toISOString() },
      { mealSize: "small snack" as const, selectedAt: snackAt.toISOString() },
    ];
    const afterSnackFill = new Date("2026-06-17T14:00:00-04:00");

    const state = simulateMetabolicState(meals, afterSnackFill);
    expect(state?.liverGrams).toBeLessThanOrEqual(90);
    expect(getCumulativeFillGrams(meals[1]!, afterSnackFill)).toBe(8);
  });
});
