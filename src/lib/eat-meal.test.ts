import { describe, expect, it } from "vitest";
import {
  addLoggedMeal,
  dateFromPickerValues,
  dateToPickerValues,
  findLatestLoggedMealIndex,
  formatFriendlyTime,
  formatRelativeTime,
  formatRelativeTimeRange,
  formatTimeRange,
  TIME_RANGE_HYPHEN,
  getCombinedMealPhase,
  getCombinedMealStatusRows,
  getCumulativeFillGrams,
  getDigestionStatusText,
  getEatHomeCardLines,
  getFillWindowHours,
  getLiverCapacityPercent,
  getLiverMoonFillPercent,
  getDrainableLiverGrams,
  getMealPhase,
  getMealWindows,
  getMoonPhaseEmojiForLiverGrams,
  getMoonPhaseEmojiForLiverPercent,
  getMoonPhaseEmojiForMeals,
  getLiverGramsForMoonDisplay,
  getPancreasRampDownStatusText,
  hoursToReachLiverFloor,
  isEatCycleActive,
  liverAfterDrainHours,
  LIVER_CAP_GRAMS,
  LIVER_FLOOR_GRAMS,
  roundToNearest15Minutes,
  updateLatestLoggedMeal,
  simulateMetabolicState,
} from "./eat-meal";
import { addHours, type LoggedMeal, type MealSize } from "./eat-meal-timing";
import { MEAL_LIVER_DEPOSIT_GRAMS } from "./eat-metabolic";

function testMeal(mealSize: MealSize, selectedAt: Date): LoggedMeal {
  return {
    mealSize,
    selectedAt: roundToNearest15Minutes(selectedAt).toISOString(),
  };
}

function liverGramsAt(meals: LoggedMeal[], at: Date): number {
  return simulateMetabolicState(meals, at)?.liverGrams ?? LIVER_FLOOR_GRAMS;
}

function liverCapacityAt(meals: LoggedMeal[], at: Date): number {
  return getLiverCapacityPercent(liverGramsAt(meals, at));
}

function atNearFullDeposit(start: Date, fillHours: number): Date {
  return new Date(addHours(start, fillHours).getTime() - 60_000);
}

describe("liver moon display", () => {
  it("starts a cycle when nearest rounding places the meal at the current window", () => {
    const now = new Date("2026-06-17T18:08:00-04:00");
    const rounded = roundToNearest15Minutes(now);
    const meals = [{ mealSize: "reasonable meal" as const, selectedAt: rounded.toISOString() }];

    expect(rounded.getTime()).toBeGreaterThan(now.getTime());
    expect(isEatCycleActive(meals, now)).toBe(true);
  });

  describe("grams → moon phase (mapping only)", () => {
    it.each([
      { grams: 18, moon: "🌔", note: "18g floor (~20% total → quarter dark)" },
      { grams: 26, moon: "🌔", note: "snack full 26g (~29% total)" },
      { grams: 45, moon: "🌓", note: "50% total tank" },
      { grams: 63, moon: "🌒", note: "reasonable meal full 63g (~70% total → three-quarter dark)" },
      { grams: 90, moon: "🌑", note: "90g cap (100% total → fully dark)" },
    ] as const)("$note → $moon", ({ grams, moon }) => {
      expect(getMoonPhaseEmojiForLiverGrams(grams)).toBe(moon);
    });

    it.each([
      { percent: 25, moon: "🌔" },
      { percent: 50, moon: "🌓" },
      { percent: 75, moon: "🌒" },
      { percent: 100, moon: "🌑" },
    ] as const)("$percent% total fill → $moon", ({ percent, moon }) => {
      expect(getMoonPhaseEmojiForLiverPercent(percent)).toBe(moon);
    });
  });

  describe("simulated meals → liver grams", () => {
    it("meal an hour ago plus snack now deposits above the floor", () => {
      const now = new Date("2026-06-28T18:30:00-04:00");
      const mealAt = roundToNearest15Minutes(new Date("2026-06-28T17:30:00-04:00"));
      const snackAt = roundToNearest15Minutes(new Date("2026-06-28T18:30:00-04:00"));
      const meals = [
        { mealSize: "reasonable meal" as const, selectedAt: mealAt.toISOString() },
        { mealSize: "small snack" as const, selectedAt: snackAt.toISOString() },
      ];

      expect(simulateMetabolicState(meals, now)?.liverGrams).toBeCloseTo(29.25, 1);
    });

    it("feast depositing for an hour lands above the floor", () => {
      const now = new Date("2026-06-28T18:30:00-04:00");
      const feastAt = roundToNearest15Minutes(new Date("2026-06-28T17:30:00-04:00"));
      const meals = [{ mealSize: "feast" as const, selectedAt: feastAt.toISOString() }];

      expect(simulateMetabolicState(meals, now)?.liverGrams).toBeCloseTo(33, 0);
    });

    it("feast near end of fill window reaches the cap", () => {
      const feastAt = roundToNearest15Minutes(new Date("2026-06-28T12:30:00-04:00"));
      const now = new Date(feastAt.getTime() + 5.9 * 3_600_000);
      const meals = [{ mealSize: "feast" as const, selectedAt: feastAt.toISOString() }];

      expect(simulateMetabolicState(meals, now)?.liverGrams).toBeCloseTo(LIVER_CAP_GRAMS, 0);
    });
  });

  describe("simulation + mapping (end-to-end)", () => {
    it("meal an hour ago plus snack now raises total fill even within the quarter-dark bucket", () => {
      const now = new Date("2026-06-28T18:30:00-04:00");
      const mealAt = roundToNearest15Minutes(new Date("2026-06-28T17:30:00-04:00"));
      const snackAt = roundToNearest15Minutes(new Date("2026-06-28T18:30:00-04:00"));
      const meals = [
        { mealSize: "reasonable meal" as const, selectedAt: mealAt.toISOString() },
        { mealSize: "small snack" as const, selectedAt: snackAt.toISOString() },
      ];
      const liverGrams = simulateMetabolicState(meals, now)!.liverGrams;
      const floorMoon = getMoonPhaseEmojiForLiverGrams(LIVER_FLOOR_GRAMS);

      expect(floorMoon).toBe("🌔");
      expect(getMoonPhaseEmojiForLiverGrams(liverGrams)).toBe("🌔");
      expect(getLiverMoonFillPercent(liverGrams)).toBeGreaterThan(
        getLiverMoonFillPercent(LIVER_FLOOR_GRAMS),
      );
    });

    it("feast at cap shows the darkest moon", () => {
      const feastAt = roundToNearest15Minutes(new Date("2026-06-28T12:30:00-04:00"));
      const now = new Date(feastAt.getTime() + 5.9 * 3_600_000);
      const meals = [{ mealSize: "feast" as const, selectedAt: feastAt.toISOString() }];
      const liverGrams = simulateMetabolicState(meals, now)!.liverGrams;

      expect(liverGrams).toBeCloseTo(LIVER_CAP_GRAMS, 0);
      expect(getMoonPhaseEmojiForLiverGrams(liverGrams)).toBe("🌑");
    });

    it("shows a mostly dark moon for a reasonable meal at full deposit", () => {
      const start = roundToNearest15Minutes(new Date("2026-06-28T12:00:00-04:00"));
      const now = atNearFullDeposit(start, 4);
      const meals = [testMeal("reasonable meal", start)];
      const liverGrams = LIVER_FLOOR_GRAMS + MEAL_LIVER_DEPOSIT_GRAMS["reasonable meal"];

      expect(liverGramsAt(meals, now)).toBeCloseTo(liverGrams, 0);
      expect(getMoonPhaseEmojiForMeals(meals, now, liverGrams)).toBe("🌒");
    });

    it("shows a feast at peak fill during digestion even before glycogen arrives", () => {
      const now = new Date("2026-06-28T18:08:00-04:00");
      const meals = [
        {
          mealSize: "feast" as const,
          selectedAt: roundToNearest15Minutes(now).toISOString(),
        },
      ];
      const actualGrams = simulateMetabolicState(meals, now)!.liverGrams;

      expect(actualGrams).toBeCloseTo(LIVER_FLOOR_GRAMS, 0);
      expect(getMoonPhaseEmojiForLiverGrams(actualGrams)).toBe("🌔");
      expect(getLiverGramsForMoonDisplay(meals, now, actualGrams)).toBeCloseTo(
        LIVER_CAP_GRAMS,
        0,
      );
      expect(getMoonPhaseEmojiForMeals(meals, now, actualGrams)).toBe("🌑");
    });

    it("uses actual liver grams for the moon once draining has started", () => {
      const feastAt = roundToNearest15Minutes(new Date("2026-06-28T12:00:00-04:00"));
      const now = new Date("2026-06-28T20:00:00-04:00");
      const meals = [{ mealSize: "feast" as const, selectedAt: feastAt.toISOString() }];
      const actualGrams = simulateMetabolicState(meals, now)!.liverGrams;

      expect(getCombinedMealPhase(meals, now)).toBe("eating-from-storage");
      expect(getLiverGramsForMoonDisplay(meals, now, actualGrams)).toBeCloseTo(
        actualGrams,
        1,
      );
      expect(getMoonPhaseEmojiForMeals(meals, now, actualGrams)).toBe(
        getMoonPhaseEmojiForLiverGrams(actualGrams),
      );
    });
  });

  describe("fresh cycle: reset, then one meal (independent scenarios)", () => {
    const cycleStart = roundToNearest15Minutes(new Date("2026-06-28T12:00:00-04:00"));

    it("reset → 🌔 at the 18g floor (quarter-dark / three-quarters-light minimum)", () => {
      expect(getMoonPhaseEmojiForMeals([], cycleStart, LIVER_FLOOR_GRAMS)).toBe(
        "🌔",
      );
    });

    it.each([
      {
        mealSize: "small snack" as const,
        totalGrams: LIVER_FLOOR_GRAMS + MEAL_LIVER_DEPOSIT_GRAMS["small snack"],
        moon: "🌔",
        note: "18g + 8g = 26g (~29% total) → still quarter-dark",
      },
      {
        mealSize: "reasonable meal" as const,
        totalGrams:
          LIVER_FLOOR_GRAMS + MEAL_LIVER_DEPOSIT_GRAMS["reasonable meal"],
        moon: "🌒",
        note: "18g + 45g = 63g (~70% total) → three-quarter dark",
      },
      {
        mealSize: "feast" as const,
        totalGrams: LIVER_CAP_GRAMS,
        moon: "🌑",
        note: "18g + 90g → capped at 90g (100% total) → fully dark",
      },
    ])("$note", ({ mealSize, totalGrams, moon }) => {
      const meals = [testMeal(mealSize, cycleStart)];
      const at = atNearFullDeposit(cycleStart, getFillWindowHours(mealSize));
      const liverGrams = liverGramsAt(meals, at);

      expect(liverGrams).toBeCloseTo(totalGrams, 0);
      expect(getMoonPhaseEmojiForMeals(meals, at, liverGrams)).toBe(moon);
    });

    it.each([
      {
        mealSize: "small snack" as const,
        moon: "🌔",
      },
      {
        mealSize: "reasonable meal" as const,
        moon: "🌒",
      },
      {
        mealSize: "feast" as const,
        moon: "🌑",
      },
    ])(
      "just logged $mealSize during digestion → projected peak moon $moon",
      ({ mealSize, moon }) => {
        const now = new Date("2026-06-28T18:08:00-04:00");
        const meals = [
          {
            mealSize,
            selectedAt: roundToNearest15Minutes(now).toISOString(),
          },
        ];
        const actualGrams = simulateMetabolicState(meals, now)!.liverGrams;

        expect(actualGrams).toBeCloseTo(LIVER_FLOOR_GRAMS, 0);
        expect(getMoonPhaseEmojiForMeals(meals, now, actualGrams)).toBe(moon);
      },
    );
  });
});

describe("liver capacity fill", () => {
  it("starts a new cycle at the 18g floor before any glycogen deposits", () => {
    const start = roundToNearest15Minutes(new Date("2026-06-28T12:00:00-04:00"));
    const meals = [testMeal("reasonable meal", start)];

    expect(liverGramsAt(meals, start)).toBe(LIVER_FLOOR_GRAMS);
    expect(liverCapacityAt(meals, start)).toBeCloseTo(0);
    expect(getDrainableLiverGrams(liverGramsAt(meals, start))).toBe(0);
  });

  it.each([
    { mealSize: "small snack" as const, fillHours: 2, depositGrams: 8 },
    { mealSize: "reasonable meal" as const, fillHours: 4, depositGrams: 45 },
    { mealSize: "feast" as const, fillHours: 6, depositGrams: 90 },
  ])(
    "logging $mealSize adds $depositGrams g once its fill window completes",
    ({ mealSize, fillHours, depositGrams }) => {
      const start = roundToNearest15Minutes(new Date("2026-06-28T12:00:00-04:00"));
      const meals = [testMeal(mealSize, start)];
      const beforeGrams = liverGramsAt(meals, start);
      const nearFullDeposit = atNearFullDeposit(start, fillHours);
      const afterGrams = liverGramsAt(meals, nearFullDeposit);
      const maxLiverIncrease = LIVER_CAP_GRAMS - LIVER_FLOOR_GRAMS;

      expect(beforeGrams).toBe(LIVER_FLOOR_GRAMS);
      expect(afterGrams - beforeGrams).toBeCloseTo(
        Math.min(depositGrams, maxLiverIncrease),
        0,
      );
      expect(getCumulativeFillGrams(meals[0]!, nearFullDeposit)).toBeCloseTo(
        depositGrams,
        0,
      );
    },
  );

  it.each([
    { mealSize: "small snack" as const },
    { mealSize: "reasonable meal" as const },
    { mealSize: "feast" as const },
  ])(
    "logging $mealSize increases liver by the cumulative deposit curve one hour in",
    ({ mealSize }) => {
      const start = roundToNearest15Minutes(new Date("2026-06-28T12:00:00-04:00"));
      const meals = [testMeal(mealSize, start)];
      const oneHourIn = addHours(start, 1);
      const beforeGrams = liverGramsAt(meals, start);
      const expectedAdded = getCumulativeFillGrams(meals[0]!, oneHourIn);
      const afterGrams = liverGramsAt(meals, oneHourIn);

      expect(expectedAdded).toBeGreaterThan(0);
      expect(afterGrams - beforeGrams).toBeCloseTo(expectedAdded, 2);
    },
  );

  it("adds a second meal's deposit on top of the existing liver load", () => {
    const mealStart = roundToNearest15Minutes(new Date("2026-06-28T12:00:00-04:00"));
    const snackStart = addHours(mealStart, 1);
    const checkAt = new Date(snackStart.getTime() + 1.983 * 3_600_000);
    const beforeMeals = [testMeal("reasonable meal", mealStart)];
    const afterMeals = [...beforeMeals, testMeal("small snack", snackStart)];

    const beforeGrams = liverGramsAt(beforeMeals, checkAt);
    const afterGrams = liverGramsAt(afterMeals, checkAt);
    const snackDeposit =
      getCumulativeFillGrams(afterMeals[1]!, checkAt) -
      getCumulativeFillGrams(afterMeals[1]!, snackStart);

    expect(snackDeposit).toBeCloseTo(MEAL_LIVER_DEPOSIT_GRAMS["small snack"], 0);
    expect(afterGrams - beforeGrams).toBeCloseTo(snackDeposit, 1);
    expect(liverCapacityAt(afterMeals, checkAt)).toBeGreaterThan(
      liverCapacityAt(beforeMeals, checkAt),
    );
  });

  it("does not push liver grams above the cap when already full", () => {
    const feastStart = roundToNearest15Minutes(new Date("2026-06-28T08:00:00-04:00"));
    const atCap = new Date(feastStart.getTime() + 5.9 * 3_600_000);
    const checkAt = new Date(atCap.getTime() + 1.983 * 3_600_000);
    const beforeMeals = [testMeal("feast", feastStart)];
    const afterMeals = [...beforeMeals, testMeal("small snack", atCap)];

    expect(liverGramsAt(beforeMeals, atCap)).toBeCloseTo(LIVER_CAP_GRAMS, 0);
    expect(liverGramsAt(afterMeals, checkAt)).toBeCloseTo(LIVER_CAP_GRAMS, 0);
    expect(liverCapacityAt(afterMeals, checkAt)).toBeCloseTo(100);
  });

  it("maps a fully deposited reasonable meal to the expected drainable capacity", () => {
    const start = roundToNearest15Minutes(new Date("2026-06-28T12:00:00-04:00"));
    const meals = [testMeal("reasonable meal", start)];
    const nearFullDeposit = atNearFullDeposit(start, 4);

    expect(liverGramsAt(meals, nearFullDeposit)).toBeCloseTo(
      LIVER_FLOOR_GRAMS + MEAL_LIVER_DEPOSIT_GRAMS["reasonable meal"],
      0,
    );
    expect(liverCapacityAt(meals, nearFullDeposit)).toBeCloseTo(
      (MEAL_LIVER_DEPOSIT_GRAMS["reasonable meal"] / (LIVER_CAP_GRAMS - LIVER_FLOOR_GRAMS)) *
        100,
      0,
    );
  });
});

describe("meal phase clock", () => {
  it("treats a just-logged meal as in digestion before the rounded wall-clock start", () => {
    const now = new Date("2026-06-28T18:08:00-04:00");
    const meals = [
      {
        mealSize: "reasonable meal" as const,
        selectedAt: roundToNearest15Minutes(now).toISOString(),
      },
    ];

    expect(roundToNearest15Minutes(now).getTime()).toBeGreaterThan(now.getTime());
    expect(getCombinedMealPhase(meals, now)).toBe("digestion");
  });

  it("uses the latest meal's digestion when a new meal is logged during an older cycle", () => {
    const now = new Date("2026-06-28T18:08:00-04:00");
    const meals = [
      {
        mealSize: "reasonable meal" as const,
        selectedAt: roundToNearest15Minutes(
          new Date("2026-06-28T15:30:00-04:00"),
        ).toISOString(),
      },
      {
        mealSize: "small snack" as const,
        selectedAt: roundToNearest15Minutes(now).toISOString(),
      },
    ];

    expect(getCombinedMealPhase(meals, now)).toBe("digestion");
    expect(
      getCombinedMealStatusRows(meals, now).find((row) => row.icon === "🔨")?.isDone,
    ).toBe(false);
  });
});

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
    expect(formatTimeRange(start, end)).toBe(`6${TIME_RANGE_HYPHEN}8pm`);
  });

  it("keeps both meridiems when a range crosses am and pm", () => {
    const start = new Date("2026-06-17T11:30:00-04:00");
    const end = new Date("2026-06-17T13:00:00-04:00");

    expect(formatTimeRange(start, end)).toBe(`11:30am${TIME_RANGE_HYPHEN}1pm`);
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
      `pancreas will ramp down and we will approach our blood sugar baseline from 8${TIME_RANGE_HYPHEN}10pm.`,
    );

    expect(getMealPhase(windows, duringPancreasRampDown)).toBe(
      "pancreas-ramp-down",
    );
    expect(getDigestionStatusText(windows, duringPancreasRampDown)).toBe(
      `body processed food from 6${TIME_RANGE_HYPHEN}8pm.`,
    );
    expect(getPancreasRampDownStatusText(windows, duringPancreasRampDown)).toBe(
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
        { leadingIcon: "🔨", text: "digesting..." },
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
      `11pm${TIME_RANGE_HYPHEN}1am tomorrow`,
    );
    expect(formatRelativeTimeRange(tomorrowStart, tomorrowEnd, now)).toBe(
      `4${TIME_RANGE_HYPHEN}6am tomorrow`,
    );
    expect(formatRelativeTime(new Date("2026-06-18T20:00:00-04:00"), now)).toBe(
      "8pm tomorrow",
    );
  });

  it("converts between picker values and dates", () => {
    const relativeTo = new Date("2026-06-17T12:00:00-04:00");
    const picked = dateFromPickerValues({
      hour12: 6,
      minute: 15,
      meridiem: "pm",
      dayOffset: 0,
      relativeTo,
    });

    expect(picked).toEqual(new Date("2026-06-17T18:15:00-04:00"));
    expect(dateToPickerValues(picked, relativeTo)).toEqual({
      hour12: 6,
      minute: 15,
      meridiem: "pm",
      dayOffset: 0,
    });
  });

  it("applies day offset when saving picker values", () => {
    const relativeTo = new Date("2026-06-17T12:00:00-04:00");
    const picked = dateFromPickerValues({
      hour12: 9,
      minute: 0,
      meridiem: "pm",
      dayOffset: 1,
      relativeTo,
    });

    expect(picked).toEqual(new Date("2026-06-16T21:00:00-04:00"));
    expect(
      dateToPickerValues(new Date("2026-06-16T21:00:00-04:00"), relativeTo),
    ).toEqual({
      hour12: 9,
      minute: 0,
      meridiem: "pm",
      dayOffset: 1,
    });
  });

  it("anchors edit submit to when edit opened, not submit time", () => {
    const editOpenedAt = new Date("2026-06-17T23:30:00-04:00");
    const submitAt = new Date("2026-06-18T00:05:00-04:00");
    const picker = dateToPickerValues(
      new Date("2026-06-17T18:00:00-04:00"),
      editOpenedAt,
    );

    const anchored = dateFromPickerValues({ ...picker, relativeTo: editOpenedAt });
    const unanchored = dateFromPickerValues({ ...picker, relativeTo: submitAt });

    expect(anchored).toEqual(new Date("2026-06-17T18:00:00-04:00"));
    expect(unanchored).toEqual(new Date("2026-06-18T18:00:00-04:00"));
  });

  it("updates only the latest meal when duplicates share timestamp and size", () => {
    const sharedAt = new Date("2026-06-17T12:00:00-04:00").toISOString();
    const meals = [
      { mealSize: "small snack" as const, selectedAt: sharedAt },
      { mealSize: "small snack" as const, selectedAt: sharedAt },
      {
        mealSize: "feast" as const,
        selectedAt: new Date("2026-06-17T08:00:00-04:00").toISOString(),
      },
    ];

    expect(findLatestLoggedMealIndex(meals)).toBe(1);

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
      const newTime = new Date("2026-06-17T13:00:00-04:00");
      const updated = updateLatestLoggedMeal("reasonable meal", newTime);

      expect(updated).toHaveLength(3);
      expect(updated[0]).toEqual(meals[0]);
      expect(updated[1]?.mealSize).toBe("reasonable meal");
      expect(updated[1]?.selectedAt).toBe(
        roundToNearest15Minutes(newTime).toISOString(),
      );
      expect(updated[2]).toEqual(meals[2]);
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

  it("keeps an 18g liver reserve and projects snack liver drain after pancreas", () => {
    const snackAt = new Date("2026-06-17T18:00:00-04:00");
    const meals = [
      { mealSize: "small snack" as const, selectedAt: snackAt.toISOString() },
    ];
    const duringPancreas = new Date("2026-06-17T19:00:00-04:00");

    expect(simulateMetabolicState(meals, duringPancreas)?.liverGrams).toBeGreaterThan(
      LIVER_FLOOR_GRAMS,
    );
    expect(hoursToReachLiverFloor(LIVER_FLOOR_GRAMS + 8)).toBeCloseTo(3.0, 0);

    const liverText =
      getCombinedMealStatusRows(meals, duringPancreas).find(
        (row) => row.icon === "🍯",
      )?.text ?? "";
    expect(liverText).toMatch(/^will snack on liver glycogen/);
    expect(liverText).not.toContain(`8${TIME_RANGE_HYPHEN}8pm`);
    expect(liverText).toMatch(/from 8/);
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
