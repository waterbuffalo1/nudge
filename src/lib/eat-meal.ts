export const MEAL_SIZES = {
  "small snack": { processingHours: 1, restHours: 1 },
  "reasonable meal": { processingHours: 2, restHours: 2 },
  "feast": { processingHours: 3, restHours: 3 },
} as const;

export type MealSize = keyof typeof MEAL_SIZES;

export const EAT_LAST_MEAL_KEY = "nudge-eat-last-meal";

export type LastMeal = {
  mealSize: MealSize;
  selectedAt: string;
};

export type MealWindows = {
  processingStart: Date;
  processingEnd: Date;
  restStart: Date;
  restEnd: Date;
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

export function formatFriendlyTime(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    hour12: true,
  };

  if (date.getMinutes() !== 0) {
    options.minute = "2-digit";
  }

  return new Intl.DateTimeFormat(undefined, options)
    .format(date)
    .toLowerCase()
    .replace(/\s/g, "");
}

function getMeridiem(time: string): "am" | "pm" | null {
  if (time.endsWith("am")) return "am";
  if (time.endsWith("pm")) return "pm";
  return null;
}

export function formatTimeRange(start: Date, end: Date): string {
  const startTime = formatFriendlyTime(start);
  const endTime = formatFriendlyTime(end);
  const startMeridiem = getMeridiem(startTime);
  const endMeridiem = getMeridiem(endTime);

  if (startMeridiem && startMeridiem === endMeridiem) {
    return `${startTime.slice(0, -2)}-${endTime}`;
  }

  return `${startTime}-${endTime}`;
}

export function getMealPhase(
  windows: MealWindows,
  now: Date,
): "processing" | "resting" {
  return now < windows.processingEnd ? "processing" : "resting";
}

export function getProcessingStatusText(
  windows: MealWindows,
  now: Date,
): string {
  if (getMealPhase(windows, now) === "processing") {
    return `body is processing food until ${formatFriendlyTime(windows.processingEnd)}...`;
  }

  return `body processed food from ${formatTimeRange(windows.processingStart, windows.processingEnd)}.`;
}

export function getRestStatusText(windows: MealWindows, now: Date): string {
  if (getMealPhase(windows, now) === "processing") {
    return `pancreas will rest from ${formatTimeRange(windows.restStart, windows.restEnd)}.`;
  }

  return `pancreas is resting until ${formatFriendlyTime(windows.restEnd)}...`;
}

export function getMealWindows(selectedAt: Date, mealSize: MealSize): MealWindows {
  const { processingHours, restHours } = MEAL_SIZES[mealSize];
  const processingStart = roundToNearest15Minutes(selectedAt);
  const processingEnd = new Date(
    processingStart.getTime() + processingHours * 60 * 60 * 1000,
  );
  const restStart = processingEnd;
  const restEnd = new Date(restStart.getTime() + restHours * 60 * 60 * 1000);

  return { processingStart, processingEnd, restStart, restEnd };
}

export function isMealActive(lastMeal: LastMeal, now: Date): boolean {
  const windows = getMealWindows(new Date(lastMeal.selectedAt), lastMeal.mealSize);
  return now < windows.restEnd;
}

export function clearLastMeal(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(EAT_LAST_MEAL_KEY);
  }
}

export function readLastMeal(): LastMeal | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(EAT_LAST_MEAL_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as { mealSize: string; selectedAt: string };
    const mealSize = parsed.mealSize === "feast!" ? "feast" : parsed.mealSize;
    if (!(mealSize in MEAL_SIZES) || !parsed.selectedAt) {
      return null;
    }
    return { mealSize: mealSize as MealSize, selectedAt: parsed.selectedAt };
  } catch {
    return null;
  }
}

export function saveLastMeal(mealSize: MealSize, selectedAt: Date): LastMeal {
  const roundedAt = roundToNearest15Minutes(selectedAt);
  const record: LastMeal = {
    mealSize,
    selectedAt: roundedAt.toISOString(),
  };
  window.localStorage.setItem(EAT_LAST_MEAL_KEY, JSON.stringify(record));
  return record;
}
