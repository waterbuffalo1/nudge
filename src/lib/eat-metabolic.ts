import type { LoggedMeal, MealPhase } from "./eat-meal-timing";
import {
  addHours,
  getFillWindowHours,
  getMealWindows,
  getPhaseClock,
  isMealCycleStarted,
  roundToNearest15Minutes,
  type MealSize,
} from "./eat-meal-timing";

export const LIVER_CAP_GRAMS = 90;
export const LIVER_FLOOR_GRAMS = 18;
export const LIVER_DRAINABLE_CAP_GRAMS = LIVER_CAP_GRAMS - LIVER_FLOOR_GRAMS;
export const LIVER_DRAIN_K = 0.12;
export const AUTOPHAGY_HOURS = 24;
export const FAT_BURN_GRAMS_PER_HOUR = 4;
export const FAT_STORAGE_BASELINE_GRAMS = 3.6;

export const MEAL_LIVER_DEPOSIT_GRAMS: Record<MealSize, number> = {
  "small snack": 8,
  "reasonable meal": 45,
  feast: 90,
};

export type MetabolicState = {
  meals: LoggedMeal[];
  latestMeal: LoggedMeal;
  currentPhase: MealPhase;
  liverGrams: number;
  fatDeltaGrams: number;
  autophagyStartedAt: Date | null;
  autophagyEnd: Date | null;
};

export function getCumulativeFillGrams(meal: LoggedMeal, at: Date): number {
  const start = roundToNearest15Minutes(new Date(meal.selectedAt));
  const totalHours = getFillWindowHours(meal.mealSize);
  const totalGrams = MEAL_LIVER_DEPOSIT_GRAMS[meal.mealSize];
  const end = addHours(start, totalHours);

  if (at.getTime() <= start.getTime()) {
    return 0;
  }

  if (at.getTime() >= end.getTime()) {
    return totalGrams;
  }

  const progress =
    (at.getTime() - start.getTime()) / (end.getTime() - start.getTime());

  if (progress <= 0.15) {
    return totalGrams * 0.15 * (progress / 0.15);
  }

  if (progress <= 0.85) {
    const firstSegment = totalGrams * 0.15;
    const secondProgress = (progress - 0.15) / 0.7;
    return firstSegment + totalGrams * 0.7 * secondProgress;
  }

  const firstSegment = totalGrams * 0.15;
  const secondSegment = totalGrams * 0.7;
  const thirdProgress = (progress - 0.85) / 0.15;
  return firstSegment + secondSegment + totalGrams * 0.15 * thirdProgress;
}

export function getLatestMealAt(meals: LoggedMeal[], at: Date): LoggedMeal | null {
  let latest: LoggedMeal | null = null;

  for (const meal of meals) {
    const mealStart = roundToNearest15Minutes(new Date(meal.selectedAt));
    if (
      mealStart.getTime() > at.getTime() &&
      !isMealCycleStarted(mealStart, at)
    ) {
      continue;
    }

    if (
      !latest ||
      mealStart.getTime() >
        roundToNearest15Minutes(new Date(latest.selectedAt)).getTime()
    ) {
      latest = meal;
    }
  }

  return latest;
}

export function isLatestMealInDigestionOrPancreas(
  meals: LoggedMeal[],
  at: Date,
): boolean {
  const latest = getLatestMealAt(meals, at);
  if (!latest) {
    return false;
  }

  const windows = getMealWindows(new Date(latest.selectedAt), latest.mealSize);
  const clock = getPhaseClock(at);
  return (
    clock.getTime() >= windows.digestionStart.getTime() &&
    at.getTime() < windows.pancreasRampDownEnd.getTime()
  );
}

export function getDrainableLiverGrams(liverGrams: number): number {
  return Math.max(0, liverGrams - LIVER_FLOOR_GRAMS);
}

export function liverAfterDrainHours(
  grams: number,
  drainHours: number,
): number {
  return Math.max(LIVER_FLOOR_GRAMS, grams * Math.exp(-LIVER_DRAIN_K * drainHours));
}

export function hoursToReachLiverFloor(fromGrams: number): number {
  if (fromGrams <= LIVER_FLOOR_GRAMS) {
    return 0;
  }

  return -Math.log(LIVER_FLOOR_GRAMS / fromGrams) / LIVER_DRAIN_K;
}

export function hoursToDrainToLevel(fromGrams: number, toGrams: number): number {
  if (fromGrams <= toGrams) {
    return 0;
  }

  return -Math.log(toGrams / fromGrams) / LIVER_DRAIN_K;
}

function applyFill(
  liverGrams: number,
  fatDeltaGrams: number,
  meals: LoggedMeal[],
  from: Date,
  to: Date,
): { liverGrams: number; fatDeltaGrams: number } {
  let fillAmount = 0;

  for (const meal of meals) {
    fillAmount +=
      getCumulativeFillGrams(meal, to) - getCumulativeFillGrams(meal, from);
  }

  if (fillAmount <= 0) {
    return { liverGrams, fatDeltaGrams };
  }

  const space = LIVER_CAP_GRAMS - liverGrams;

  if (fillAmount <= space) {
    return {
      liverGrams: liverGrams + fillAmount,
      fatDeltaGrams,
    };
  }

  return {
    liverGrams: LIVER_CAP_GRAMS,
    fatDeltaGrams: fatDeltaGrams + (fillAmount - space),
  };
}

function getSimulationEventTimes(meals: LoggedMeal[], endTime: Date): number[] {
  const times = new Set<number>();

  for (const meal of meals) {
    const start = roundToNearest15Minutes(new Date(meal.selectedAt));
    const windows = getMealWindows(start, meal.mealSize);

    times.add(start.getTime());
    times.add(addHours(start, getFillWindowHours(meal.mealSize)).getTime());
    times.add(windows.digestionEnd.getTime());
    times.add(windows.pancreasRampDownEnd.getTime());
  }

  times.add(endTime.getTime());
  return [...times].sort((left, right) => left - right);
}

type SimulationScratch = {
  liverGrams: number;
  fatDeltaGrams: number;
  atAutophagyFloor: boolean;
  autophagyStartedAt: Date | null;
};

function processDrainSegment(
  scratch: SimulationScratch,
  t0: Date,
  t1: Date,
): SimulationScratch {
  const dtHours = (t1.getTime() - t0.getTime()) / 3_600_000;
  if (dtHours <= 0 || scratch.liverGrams <= LIVER_FLOOR_GRAMS) {
    return scratch;
  }

  const drained = scratch.liverGrams * Math.exp(-LIVER_DRAIN_K * dtHours);

  if (drained <= LIVER_FLOOR_GRAMS) {
    const hoursToFloor = hoursToReachLiverFloor(scratch.liverGrams);
    const floorAt = new Date(t0.getTime() + hoursToFloor * 3_600_000);
    const remainingHours =
      (t1.getTime() - floorAt.getTime()) / 3_600_000;

    return {
      liverGrams: LIVER_FLOOR_GRAMS,
      fatDeltaGrams:
        scratch.fatDeltaGrams -
        Math.max(0, remainingHours) * FAT_BURN_GRAMS_PER_HOUR,
      atAutophagyFloor: true,
      autophagyStartedAt: scratch.autophagyStartedAt ?? floorAt,
    };
  }

  return {
    ...scratch,
    liverGrams: drained,
  };
}

function processAutophagySegment(
  scratch: SimulationScratch,
  t0: Date,
  t1: Date,
): SimulationScratch {
  if (!scratch.atAutophagyFloor || !scratch.autophagyStartedAt) {
    return scratch;
  }

  const dtHours = (t1.getTime() - t0.getTime()) / 3_600_000;
  return {
    ...scratch,
    fatDeltaGrams: scratch.fatDeltaGrams - dtHours * FAT_BURN_GRAMS_PER_HOUR,
  };
}

function inferCurrentPhase(
  meals: LoggedMeal[],
  at: Date,
  scratch: SimulationScratch,
): MealPhase {
  if (isLatestMealInDigestionOrPancreas(meals, at)) {
    const latest = getLatestMealAt(meals, at)!;
    const windows = getMealWindows(new Date(latest.selectedAt), latest.mealSize);

    if (at.getTime() < windows.digestionEnd.getTime()) {
      return "digestion";
    }

    return "pancreas-ramp-down";
  }

  if (scratch.atAutophagyFloor) {
    return "autophagy";
  }

  return "eating-from-storage";
}

export function simulateMetabolicState(
  meals: LoggedMeal[],
  now: Date,
): MetabolicState | null {
  if (meals.length === 0) {
    return null;
  }

  const sortedMeals = [...meals].sort(
    (left, right) =>
      new Date(left.selectedAt).getTime() - new Date(right.selectedAt).getTime(),
  );
  const cycleStart = roundToNearest15Minutes(
    new Date(sortedMeals[0]!.selectedAt),
  );

  if (!isMealCycleStarted(cycleStart, now)) {
    return null;
  }

  const eventTimes = getSimulationEventTimes(sortedMeals, now);
  let scratch: SimulationScratch = {
    liverGrams: LIVER_FLOOR_GRAMS,
    fatDeltaGrams: 0,
    atAutophagyFloor: false,
    autophagyStartedAt: null,
  };

  for (let index = 0; index < eventTimes.length - 1; index += 1) {
    const t0 = new Date(eventTimes[index]!);
    const t1 = new Date(
      Math.min(eventTimes[index + 1]!, now.getTime()),
    );

    if (t1.getTime() <= t0.getTime()) {
      continue;
    }

    if (
      scratch.autophagyStartedAt &&
      t0.getTime() >= addHours(scratch.autophagyStartedAt, AUTOPHAGY_HOURS).getTime()
    ) {
      return null;
    }

    const filled = applyFill(
      scratch.liverGrams,
      scratch.fatDeltaGrams,
      sortedMeals,
      t0,
      t1,
    );
    scratch.liverGrams = filled.liverGrams;
    scratch.fatDeltaGrams = filled.fatDeltaGrams;

    if (scratch.liverGrams > LIVER_FLOOR_GRAMS) {
      scratch.atAutophagyFloor = false;
      scratch.autophagyStartedAt = null;
    }

    const inDigestionOrPancreas = isLatestMealInDigestionOrPancreas(
      sortedMeals,
      t1,
    );

    if (inDigestionOrPancreas) {
      scratch.atAutophagyFloor = false;
      scratch.autophagyStartedAt = null;
      continue;
    }

    if (!scratch.atAutophagyFloor && scratch.liverGrams > LIVER_FLOOR_GRAMS) {
      scratch = processDrainSegment(scratch, t0, t1);
      continue;
    }

    if (scratch.atAutophagyFloor) {
      scratch = processAutophagySegment(scratch, t0, t1);
    }
  }

  if (
    scratch.autophagyStartedAt &&
    now.getTime() >=
      addHours(scratch.autophagyStartedAt, AUTOPHAGY_HOURS).getTime()
  ) {
    return null;
  }

  const latestMeal = getLatestMealAt(sortedMeals, now);
  if (!latestMeal) {
    return null;
  }

  return {
    meals: sortedMeals,
    latestMeal,
    currentPhase: inferCurrentPhase(sortedMeals, now, scratch),
    liverGrams: scratch.liverGrams,
    fatDeltaGrams: scratch.fatDeltaGrams,
    autophagyStartedAt: scratch.autophagyStartedAt,
    autophagyEnd: scratch.autophagyStartedAt
      ? addHours(scratch.autophagyStartedAt, AUTOPHAGY_HOURS)
      : null,
  };
}

export function formatFatStorageLabel(
  baselineGrams = FAT_STORAGE_BASELINE_GRAMS,
  deltaGrams: number,
): string {
  const roundedDelta = Math.round(deltaGrams * 10) / 10;

  if (roundedDelta === 0) {
    return `${baselineGrams}g`;
  }

  const sign = roundedDelta > 0 ? "+" : "−";
  const magnitude = Math.abs(roundedDelta);
  const formattedMagnitude =
    magnitude % 1 === 0 ? `${magnitude}` : magnitude.toFixed(1);

  return `${baselineGrams}g ${sign} ${formattedMagnitude}g`;
}

const LIVER_MOON_PHASES = [
  { fillPercent: 25, emoji: "🌔" },
  { fillPercent: 50, emoji: "🌓" },
  { fillPercent: 75, emoji: "🌒" },
  { fillPercent: 100, emoji: "🌑" },
] as const;

export function getLiverCapacityPercent(liverGrams: number): number {
  return (getDrainableLiverGrams(liverGrams) / LIVER_DRAINABLE_CAP_GRAMS) * 100;
}

/** Total tank fill including the 18g reserve; used for moon display. */
export function getLiverMoonFillPercent(liverGrams: number): number {
  return (liverGrams / LIVER_CAP_GRAMS) * 100;
}

export function getMoonPhaseEmojiForLiverPercent(percent: number): string {
  const clamped = Math.max(0, Math.min(100, percent));
  let closest: (typeof LIVER_MOON_PHASES)[number] = LIVER_MOON_PHASES[0]!;
  let minDistance = Infinity;

  for (const phase of LIVER_MOON_PHASES) {
    const distance = Math.abs(clamped - phase.fillPercent);
    if (distance < minDistance) {
      minDistance = distance;
      closest = phase;
    }
  }

  return closest.emoji;
}

/** Moon maps total tank fill to quarter/half/three-quarter/full dark: 25/50/75/100%. */
export function getMoonPhaseEmojiForLiverGrams(liverGrams: number): string {
  return getMoonPhaseEmojiForLiverPercent(getLiverMoonFillPercent(liverGrams));
}

/** During digestion/pancreas, show the projected fill peak; otherwise actual grams. */
export function getLiverGramsForMoonDisplay(
  meals: LoggedMeal[],
  now: Date,
  actualLiverGrams: number,
): number {
  if (!isLatestMealInDigestionOrPancreas(meals, now)) {
    return actualLiverGrams;
  }

  let projectionMs = 0;
  for (const meal of meals) {
    const start = roundToNearest15Minutes(new Date(meal.selectedAt));
    const fillEnd = addHours(start, getFillWindowHours(meal.mealSize)).getTime();
    if (now.getTime() < fillEnd) {
      projectionMs = Math.max(projectionMs, fillEnd - 60_000);
    }
  }

  if (projectionMs <= now.getTime()) {
    return actualLiverGrams;
  }

  return simulateMetabolicState(meals, new Date(projectionMs))?.liverGrams ?? actualLiverGrams;
}

export function getMoonPhaseEmojiForMeals(
  meals: LoggedMeal[],
  now: Date,
  actualLiverGrams: number,
): string {
  return getMoonPhaseEmojiForLiverGrams(
    getLiverGramsForMoonDisplay(meals, now, actualLiverGrams),
  );
}
