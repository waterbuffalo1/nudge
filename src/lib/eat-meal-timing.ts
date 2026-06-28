export type MealPhase =
  | "digestion"
  | "pancreas-ramp-down"
  | "eating-from-storage"
  | "autophagy";

export type LoggedMeal = {
  mealSize: MealSize;
  selectedAt: string;
};

export const MEAL_SIZES = {
  "small snack": {
    digestionHours: 1,
    pancreasRampDownHours: 1,
    autophagyHours: 24,
  },
  "reasonable meal": {
    digestionHours: 2,
    pancreasRampDownHours: 2,
    autophagyHours: 24,
  },
  feast: {
    digestionHours: 3,
    pancreasRampDownHours: 3,
    autophagyHours: 24,
  },
} as const;

export type MealSize = keyof typeof MEAL_SIZES;

export type MealWindows = {
  digestionStart: Date;
  digestionEnd: Date;
  pancreasRampDownStart: Date;
  pancreasRampDownEnd: Date;
};

export function roundToNearest15Minutes(date: Date): Date {
  const rounded = new Date(date);
  const roundedMinutes = Math.round(rounded.getMinutes() / 15) * 15;

  if (roundedMinutes === 60) {
    rounded.setHours(rounded.getHours() + 1, 0, 0, 0);
  } else {
    rounded.setMinutes(roundedMinutes, 0, 0);
  }

  return rounded;
}

/** Nearest-round clock has reached this meal's rounded start time. */
export function isMealCycleStarted(cycleStart: Date, now: Date): boolean {
  return roundToNearest15Minutes(now).getTime() >= cycleStart.getTime();
}

/** Phase boundaries use the same nearest-round clock as cycle start. */
export function getPhaseClock(at: Date): Date {
  return roundToNearest15Minutes(at);
}

export function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

export function getMealWindows(selectedAt: Date, mealSize: MealSize): MealWindows {
  const { digestionHours, pancreasRampDownHours } = MEAL_SIZES[mealSize];
  const digestionStart = roundToNearest15Minutes(selectedAt);
  const digestionEnd = addHours(digestionStart, digestionHours);
  const pancreasRampDownStart = digestionEnd;
  const pancreasRampDownEnd = addHours(
    pancreasRampDownStart,
    pancreasRampDownHours,
  );

  return {
    digestionStart,
    digestionEnd,
    pancreasRampDownStart,
    pancreasRampDownEnd,
  };
}

export function getFillWindowHours(mealSize: MealSize): number {
  const sizes = MEAL_SIZES[mealSize];
  return sizes.digestionHours + sizes.pancreasRampDownHours;
}
