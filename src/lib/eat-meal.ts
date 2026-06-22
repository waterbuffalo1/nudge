export const MEAL_SIZES = {
  "small snack": {
    digestionHours: 1,
    pancreasRampDownHours: 1,
    eatingFromStorageHours: 6,
    autophagyHours: 24,
  },
  "reasonable meal": {
    digestionHours: 2,
    pancreasRampDownHours: 2,
    eatingFromStorageHours: 10,
    autophagyHours: 24,
  },
  feast: {
    digestionHours: 3,
    pancreasRampDownHours: 3,
    eatingFromStorageHours: 14,
    autophagyHours: 24,
  },
} as const;

export type MealSize = keyof typeof MEAL_SIZES;

export const MEAL_SIZE_RANK: Record<MealSize, number> = {
  "small snack": 1,
  "reasonable meal": 2,
  feast: 3,
};

export function shouldApplyNewMeal(
  currentMeal: LastMeal | null,
  newMealSize: MealSize,
  now: Date,
): boolean {
  if (!currentMeal || !isMealActive(currentMeal, now)) {
    return true;
  }

  return MEAL_SIZE_RANK[newMealSize] > MEAL_SIZE_RANK[currentMeal.mealSize];
}

export type LogMealResult = {
  applied: boolean;
  meal: LastMeal;
};

export function logMeal(
  mealSize: MealSize,
  selectedAt: Date,
  currentMeal: LastMeal | null,
  now: Date,
): LogMealResult {
  if (!shouldApplyNewMeal(currentMeal, mealSize, now)) {
    return { applied: false, meal: currentMeal! };
  }

  return { applied: true, meal: saveLastMeal(mealSize, selectedAt) };
}

export const EAT_LAST_MEAL_KEY = "nudge-eat-last-meal";

export type LastMeal = {
  mealSize: MealSize;
  selectedAt: string;
};

export type MealPhase =
  | "digestion"
  | "pancreas-ramp-down"
  | "eating-from-storage"
  | "autophagy";

export type MealWindows = {
  digestionStart: Date;
  digestionEnd: Date;
  pancreasRampDownStart: Date;
  pancreasRampDownEnd: Date;
  eatingFromStorageStart: Date;
  eatingFromStorageEnd: Date;
  autophagyStart: Date;
  autophagyEnd: Date;
};

const MEAL_PHASE_ORDER: MealPhase[] = [
  "digestion",
  "pancreas-ramp-down",
  "eating-from-storage",
  "autophagy",
];

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

export const PICKER_MINUTES = [0, 15, 30, 45] as const;
export const PICKER_HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
export type PickerMeridiem = "am" | "pm";

export type MealTimePickerValues = {
  hour12: (typeof PICKER_HOURS)[number];
  minute: (typeof PICKER_MINUTES)[number];
  meridiem: PickerMeridiem;
};

export function dateToPickerValues(date: Date): MealTimePickerValues {
  const hours = date.getHours();
  const minute = (Math.round(date.getMinutes() / 15) * 15) % 60 as MealTimePickerValues["minute"];
  const meridiem: PickerMeridiem = hours >= 12 ? "pm" : "am";
  let hour12 = hours % 12;
  if (hour12 === 0) {
    hour12 = 12;
  }

  return {
    hour12: hour12 as MealTimePickerValues["hour12"],
    minute,
    meridiem,
  };
}

export function dateFromPickerValues({
  hour12,
  minute,
  meridiem,
  baseDate = new Date(),
}: MealTimePickerValues & { baseDate?: Date }): Date {
  const result = new Date(baseDate);
  let hour24: number;

  if (meridiem === "am") {
    hour24 = hour12 === 12 ? 0 : hour12;
  } else {
    hour24 = hour12 === 12 ? 12 : hour12 + 12;
  }

  result.setHours(hour24, minute, 0, 0);
  return result;
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

function startOfLocalDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function getDayOffset(date: Date, now: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round(
    (startOfLocalDay(date).getTime() - startOfLocalDay(now).getTime()) / msPerDay,
  );
}

function getDayLabel(offset: number, date: Date): string {
  if (offset <= 0) {
    return date.getHours() >= 18 ? "tonight" : "";
  }

  if (offset === 1) {
    return "tomorrow";
  }

  return "the day after that";
}

export function formatRelativeTime(date: Date, now: Date): string {
  const time = formatFriendlyTime(date);
  const label = getDayLabel(getDayOffset(date, now), date);

  return label ? `${time} ${label}` : time;
}

export function formatRelativeTimeRange(
  start: Date,
  end: Date,
  now: Date,
): string {
  const startOffset = getDayOffset(start, now);
  const endOffset = getDayOffset(end, now);

  if (startOffset === endOffset) {
    const range = formatTimeRange(start, end);

    if (startOffset === 0) {
      return range;
    }

    const label = getDayLabel(startOffset, start);
    return label ? `${range} ${label}` : range;
  }

  const startTime = formatFriendlyTime(start);
  const endTime = formatFriendlyTime(end);

  if (startOffset === 0 && endOffset === 1) {
    const sameClockTime =
      start.getHours() === end.getHours() &&
      start.getMinutes() === end.getMinutes();
    const endsInMorning = end.getHours() >= 6 && end.getHours() < 12;

    if (sameClockTime || endsInMorning) {
      const startPart = start.getHours() >= 18 ? `${startTime} tonight` : startTime;
      return `${startPart} until ${endTime} tomorrow`;
    }

    return `${formatTimeRange(start, end)} tomorrow`;
  }

  if (startOffset === 1 && endOffset === 2) {
    return `${startTime} tomorrow until ${endTime} the day after that`;
  }

  if (startOffset === 0 && endOffset === 2) {
    const startPart =
      start.getHours() >= 18 ? `${startTime} tonight` : startTime;
    return `${startPart} until ${endTime} the day after that`;
  }

  const startLabel = getDayLabel(startOffset, start);
  const endLabel = getDayLabel(endOffset, end);
  const startPart = startLabel ? `${startTime} ${startLabel}` : startTime;
  const endPart = endLabel ? `${endTime} ${endLabel}` : endTime;

  return `${startPart} until ${endPart}`;
}

function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

export function getMealWindows(selectedAt: Date, mealSize: MealSize): MealWindows {
  const {
    digestionHours,
    pancreasRampDownHours,
    eatingFromStorageHours,
    autophagyHours,
  } = MEAL_SIZES[mealSize];
  const digestionStart = roundToNearest15Minutes(selectedAt);
  const digestionEnd = addHours(digestionStart, digestionHours);
  const pancreasRampDownStart = digestionEnd;
  const pancreasRampDownEnd = addHours(
    pancreasRampDownStart,
    pancreasRampDownHours,
  );
  const eatingFromStorageStart = pancreasRampDownEnd;
  const eatingFromStorageEnd = addHours(
    eatingFromStorageStart,
    eatingFromStorageHours,
  );
  const autophagyStart = eatingFromStorageEnd;
  const autophagyEnd = addHours(autophagyStart, autophagyHours);

  return {
    digestionStart,
    digestionEnd,
    pancreasRampDownStart,
    pancreasRampDownEnd,
    eatingFromStorageStart,
    eatingFromStorageEnd,
    autophagyStart,
    autophagyEnd,
  };
}

export function getMealPhase(windows: MealWindows, now: Date): MealPhase {
  if (now < windows.digestionEnd) {
    return "digestion";
  }

  if (now < windows.pancreasRampDownEnd) {
    return "pancreas-ramp-down";
  }

  if (now < windows.eatingFromStorageEnd) {
    return "eating-from-storage";
  }

  return "autophagy";
}

type PhaseRelation = "past" | "current" | "future";

function getPhaseRelation(
  phase: MealPhase,
  currentPhase: MealPhase,
): PhaseRelation {
  const phaseIndex = MEAL_PHASE_ORDER.indexOf(phase);
  const currentIndex = MEAL_PHASE_ORDER.indexOf(currentPhase);

  if (phaseIndex < currentIndex) {
    return "past";
  }

  if (phaseIndex > currentIndex) {
    return "future";
  }

  return "current";
}

function getPhaseRange(phase: MealPhase, windows: MealWindows): {
  start: Date;
  end: Date;
} {
  switch (phase) {
    case "digestion":
      return { start: windows.digestionStart, end: windows.digestionEnd };
    case "pancreas-ramp-down":
      return {
        start: windows.pancreasRampDownStart,
        end: windows.pancreasRampDownEnd,
      };
    case "eating-from-storage":
      return {
        start: windows.eatingFromStorageStart,
        end: windows.eatingFromStorageEnd,
      };
    case "autophagy":
      return { start: windows.autophagyStart, end: windows.autophagyEnd };
  }
}

function getPhaseStatusText(
  phase: MealPhase,
  windows: MealWindows,
  now: Date,
  copy: {
    future: (range: string) => string;
    current: (until: string) => string;
    past: (range: string) => string;
  },
): string {
  const relation = getPhaseRelation(phase, getMealPhase(windows, now));
  const { start, end } = getPhaseRange(phase, windows);

  if (relation === "current") {
    return copy.current(formatRelativeTime(end, now));
  }

  const range = formatRelativeTimeRange(start, end, now);

  if (relation === "future") {
    return copy.future(range);
  }

  return copy.past(range);
}

export function getDigestionStatusText(
  windows: MealWindows,
  now: Date,
): string {
  return getPhaseStatusText("digestion", windows, now, {
    future: (range) => `body will process food from ${range}.`,
    current: (until) => `body is processing food until ${until}...`,
    past: (range) => `body processed food from ${range}.`,
  });
}

export function getPancreasRampDownStatusText(
  windows: MealWindows,
  now: Date,
): string {
  return getPhaseStatusText("pancreas-ramp-down", windows, now, {
    future: (range) =>
      `pancreas will ramp down and we will approach our blood sugar baseline from ${range}.`,
    current: (until) =>
      `pancreas is ramping down and we will approach our blood sugar baseline until ${until}...`,
    past: (range) =>
      `pancreas ramped down and we approached our blood sugar baseline from ${range}.`,
  });
}

export function getEatingFromStorageStatusText(
  windows: MealWindows,
  now: Date,
): string {
  return getPhaseStatusText("eating-from-storage", windows, now, {
    future: (range) =>
      `will snack on liver glycogen (nom nom nom) from ${range}.`,
    current: (until) =>
      `snacking on liver glycogen (nom nom nom) until ${until}...`,
    past: (range) =>
      `snacked on liver glycogen (nom nom nom) from ${range}.`,
  });
}

export function getAutophagyStatusText(
  windows: MealWindows,
  now: Date,
): string {
  return getPhaseStatusText("autophagy", windows, now, {
    future: (range) =>
      `autophagy. let's clean those streets! 🧹 from ${range}.`,
    current: (until) =>
      `autophagy. cleaning crew is working! 🧹 until ${until}...`,
    past: (range) =>
      `autophagy. cleaned those streets! 🧹 from ${range}.`,
  });
}

export type MealStatusRow = {
  icon: string;
  text: string;
  isDone: boolean;
};

export function getMealStatusRows(
  windows: MealWindows,
  now: Date,
): MealStatusRow[] {
  const currentPhase = getMealPhase(windows, now);

  function row(
    phase: MealPhase,
    icon: string,
    text: string,
  ): MealStatusRow {
    return {
      icon,
      text,
      isDone: getPhaseRelation(phase, currentPhase) === "past",
    };
  }

  return [
    row("digestion", "⚙️", getDigestionStatusText(windows, now)),
    row(
      "pancreas-ramp-down",
      "🫁",
      getPancreasRampDownStatusText(windows, now),
    ),
    row(
      "eating-from-storage",
      "🍯",
      getEatingFromStorageStatusText(windows, now),
    ),
    row("autophagy", "♻️", getAutophagyStatusText(windows, now)),
  ];
}

/** @deprecated Use getDigestionStatusText */
export function getProcessingStatusText(
  windows: MealWindows,
  now: Date,
): string {
  return getDigestionStatusText(windows, now);
}

/** @deprecated Use getPancreasRampDownStatusText */
export function getRestStatusText(windows: MealWindows, now: Date): string {
  return getPancreasRampDownStatusText(windows, now);
}

export function isMealActive(lastMeal: LastMeal, now: Date): boolean {
  const windows = getMealWindows(new Date(lastMeal.selectedAt), lastMeal.mealSize);
  return now < windows.autophagyEnd;
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
