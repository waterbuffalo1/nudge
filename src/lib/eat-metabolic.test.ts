import { describe, expect, it } from "vitest";
import {
  AUTOPHAGY_HOURS,
  formatFatStorageLabel,
  getCumulativeFillGrams,
  getDrainableLiverGrams,
  isLatestMealInDigestionOrPancreas,
  LIVER_CAP_GRAMS,
  LIVER_FLOOR_GRAMS,
  liverAfterDrainHours,
  simulateMetabolicState,
} from "./eat-metabolic";
import {
  addHours,
  getFillWindowHours,
  roundToNearest15Minutes,
} from "./eat-meal-timing";

describe("getCumulativeFillGrams", () => {
  const meal = {
    mealSize: "reasonable meal" as const,
    selectedAt: "2026-06-17T18:00:00-04:00",
  };
  const start = roundToNearest15Minutes(new Date(meal.selectedAt));
  const totalHours = getFillWindowHours(meal.mealSize);
  const totalGrams = 45;

  it("returns zero before the meal starts", () => {
    expect(getCumulativeFillGrams(meal, start)).toBe(0);
    expect(getCumulativeFillGrams(meal, new Date(start.getTime() - 1))).toBe(0);
  });

  it("follows the 15/70/15 fill curve", () => {
    const quarterProgress = addHours(start, totalHours * 0.075);
    const midProgress = addHours(start, totalHours * 0.5);
    const nearEnd = addHours(start, totalHours * 0.99);

    expect(getCumulativeFillGrams(meal, quarterProgress)).toBeCloseTo(
      totalGrams * 0.075,
      1,
    );
    // 50% through the window lands in the flat middle segment.
    expect(getCumulativeFillGrams(meal, midProgress)).toBeCloseTo(
      totalGrams * 0.15 + totalGrams * 0.7 * 0.5,
      1,
    );
    expect(getCumulativeFillGrams(meal, nearEnd)).toBeCloseTo(totalGrams, 0);
  });

  it("returns the full deposit after the fill window ends", () => {
    const after = addHours(start, totalHours + 1);
    expect(getCumulativeFillGrams(meal, after)).toBe(totalGrams);
  });
});

describe("simulateMetabolicState", () => {
  it("returns null before the cycle start time", () => {
    const now = new Date("2026-06-17T17:50:00-04:00");
    const meals = [
      {
        mealSize: "reasonable meal" as const,
        selectedAt: roundToNearest15Minutes(
          new Date("2026-06-17T18:08:00-04:00"),
        ).toISOString(),
      },
    ];

    expect(simulateMetabolicState(meals, now)).toBeNull();
  });

  it("overflows excess glycogen to fat when the liver is full", () => {
    const feastAt = roundToNearest15Minutes(new Date("2026-06-17T08:00:00-04:00"));
    const secondFeastAt = roundToNearest15Minutes(
      new Date("2026-06-17T09:00:00-04:00"),
    );
    const meals = [
      { mealSize: "feast" as const, selectedAt: feastAt.toISOString() },
      { mealSize: "feast" as const, selectedAt: secondFeastAt.toISOString() },
    ];
    const checkAt = new Date("2026-06-17T14:45:00-04:00");

    const singleFeast = simulateMetabolicState([meals[0]!], checkAt);
    const bothFeasts = simulateMetabolicState(meals, checkAt);

    expect(bothFeasts?.liverGrams).toBeCloseTo(LIVER_CAP_GRAMS, 0);
    expect(bothFeasts!.fatDeltaGrams).toBeGreaterThan(
      singleFeast!.fatDeltaGrams,
    );
  });

  it("fills the liver during digestion and drains only afterward", () => {
    const feastAt = roundToNearest15Minutes(new Date("2026-06-17T08:00:00-04:00"));
    const meals = [{ mealSize: "feast" as const, selectedAt: feastAt.toISOString() }];
    const earlyDigestion = addHours(feastAt, 0.5);
    const lateDigestion = addHours(feastAt, 1.5);
    const afterPancreas = addHours(feastAt, 7);
    const laterDrain = addHours(afterPancreas, 2);

    const early = simulateMetabolicState(meals, earlyDigestion);
    const late = simulateMetabolicState(meals, lateDigestion);
    const draining = simulateMetabolicState(meals, afterPancreas);
    const drained = simulateMetabolicState(meals, laterDrain);

    expect(late!.liverGrams).toBeGreaterThan(early!.liverGrams);
    expect(isLatestMealInDigestionOrPancreas(meals, earlyDigestion)).toBe(true);
    expect(isLatestMealInDigestionOrPancreas(meals, afterPancreas)).toBe(false);
    expect(drained!.liverGrams).toBeLessThan(draining!.liverGrams);
  });

  it("returns null after the autophagy window ends", () => {
    const feastAt = new Date("2026-06-17T08:00:00-04:00");
    const meals = [{ mealSize: "feast" as const, selectedAt: feastAt.toISOString() }];
    const floorTime = new Date("2026-06-18T03:30:00-04:00");
    const afterCycle = addHours(
      simulateMetabolicState(meals, floorTime)!.autophagyStartedAt!,
      AUTOPHAGY_HOURS + 1,
    );

    expect(simulateMetabolicState(meals, afterCycle)).toBeNull();
  });
});

describe("liver helpers", () => {
  it("treats grams at or below the floor as undrainable", () => {
    expect(getDrainableLiverGrams(LIVER_FLOOR_GRAMS)).toBe(0);
    expect(getDrainableLiverGrams(LIVER_FLOOR_GRAMS - 1)).toBe(0);
    expect(getDrainableLiverGrams(90)).toBe(72);
  });

  it("drains exponentially toward the floor", () => {
    expect(liverAfterDrainHours(90, 4)).toBeCloseTo(55.7, 1);
    expect(liverAfterDrainHours(90, 13.4)).toBeCloseTo(LIVER_FLOOR_GRAMS, 0);
  });

  it("formats fat storage labels with baseline and delta", () => {
    expect(formatFatStorageLabel(3.6, 0)).toBe("3.6g");
    expect(formatFatStorageLabel(3.6, 1.2)).toBe("3.6g + 1.2g");
    expect(formatFatStorageLabel(3.6, -0.5)).toBe("3.6g − 0.5g");
  });
});
