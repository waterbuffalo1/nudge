import {
  formatFatStorageLabel,
  hoursToReachLiverFloor,
  simulateMetabolicState,
  AUTOPHAGY_HOURS,
  FAT_STORAGE_BASELINE_GRAMS,
  LIVER_FLOOR_GRAMS,
  type MetabolicState,
} from "./eat-metabolic";
import {
  addHours,
  getMealWindows,
  getPhaseClock,
  roundToNearest15Minutes,
  type LoggedMeal,
  type MealPhase,
  type MealSize,
  type MealWindows,
  MEAL_SIZES,
} from "./eat-meal-timing";

export {
  MEAL_SIZES,
  getMealWindows,
  getPhaseClock,
  isMealCycleStarted,
  roundToNearest15Minutes,
  type LoggedMeal,
  type MealPhase,
  type MealSize,
  type MealWindows,
} from "./eat-meal-timing";
export {
  formatFatStorageLabel,
  getCumulativeFillGrams,
  getDrainableLiverGrams,
  getLiverCapacityPercent,
  getLiverGramsForMoonDisplay,
  getLiverMoonFillPercent,
  getMoonPhaseEmojiForLiverGrams,
  getMoonPhaseEmojiForLiverPercent,
  getMoonPhaseEmojiForMeals,
  hoursToReachLiverFloor,
  liverAfterDrainHours,
  simulateMetabolicState,
  LIVER_CAP_GRAMS,
  LIVER_DRAINABLE_CAP_GRAMS,
  LIVER_FLOOR_GRAMS,
  FAT_STORAGE_BASELINE_GRAMS,
  type MetabolicState,
} from "./eat-metabolic";
export { getFillWindowHours } from "./eat-meal-timing";

export const EAT_MEALS_KEY = "nudge-eat-meals";
export const EAT_LAST_MEAL_KEY = "nudge-eat-last-meal";
export const EAT_UPDATED_EVENT = "nudge-eat-updated";

export type LastMeal = LoggedMeal;
export type CombinedEatState = MetabolicState & {
  latestWindows: MealWindows;
};

const MEAL_PHASE_ORDER: MealPhase[] = [
  "digestion",
  "pancreas-ramp-down",
  "eating-from-storage",
  "autophagy",
];

export const PICKER_MINUTES = [0, 15, 30, 45] as const;
export const PICKER_HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
export const PICKER_DAY_OFFSETS = [0, 1, 2] as const;
export type PickerMeridiem = "am" | "pm";
export type PickerDayOffset = (typeof PICKER_DAY_OFFSETS)[number];

export const PICKER_DAY_LABELS: Record<PickerDayOffset, string> = {
  0: "today",
  1: "yesterday",
  2: "day before yesterday",
};

export type MealTimePickerValues = {
  hour12: (typeof PICKER_HOURS)[number];
  minute: (typeof PICKER_MINUTES)[number];
  meridiem: PickerMeridiem;
  dayOffset: PickerDayOffset;
};

export function startOfLocalDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function dayOffsetFromDate(
  date: Date,
  relativeTo: Date = new Date(),
): PickerDayOffset {
  const dayMs = 86_400_000;
  const offset = Math.round(
    (startOfLocalDay(relativeTo).getTime() - startOfLocalDay(date).getTime()) /
      dayMs,
  );

  if (offset <= 0) {
    return 0;
  }

  if (offset === 1) {
    return 1;
  }

  return 2;
}

export function baseDateFromDayOffset(
  dayOffset: PickerDayOffset,
  relativeTo: Date = new Date(),
): Date {
  const result = startOfLocalDay(relativeTo);
  result.setDate(result.getDate() - dayOffset);
  return result;
}

export function dateToPickerValues(
  date: Date,
  relativeTo: Date = new Date(),
): MealTimePickerValues {
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
    dayOffset: dayOffsetFromDate(date, relativeTo),
  };
}

export function dateFromPickerValues({
  hour12,
  minute,
  meridiem,
  dayOffset,
  baseDate,
  relativeTo = new Date(),
}: MealTimePickerValues & { baseDate?: Date; relativeTo?: Date }): Date {
  const result = baseDate
    ? startOfLocalDay(baseDate)
    : baseDateFromDayOffset(dayOffset, relativeTo);
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
  const rounded = roundToNearest15Minutes(date);
  const options: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    hour12: true,
  };

  if (rounded.getMinutes() !== 0) {
    options.minute = "2-digit";
  }

  return new Intl.DateTimeFormat(undefined, options)
    .format(rounded)
    .toLowerCase()
    .replace(/\s/g, "");
}

function getMeridiem(time: string): "am" | "pm" | null {
  if (time.endsWith("am")) return "am";
  if (time.endsWith("pm")) return "pm";
  return null;
}

export const TIME_RANGE_HYPHEN = "\u2011";

const TIME_RANGE_TEXT_PATTERN =
  /^\d{1,2}(?::\d{2})?(?:am|pm)[\u2011-]\d{1,2}(?::\d{2})?(?:am|pm)$/i;

export function isTimeRangeText(value: string): boolean {
  return TIME_RANGE_TEXT_PATTERN.test(value);
}

export function splitTextAtTimeRanges(value: string): string[] {
  const pattern =
    /\d{1,2}(?::\d{2})?(?:am|pm)[\u2011-]\d{1,2}(?::\d{2})?(?:am|pm)/gi;
  const parts: string[] = [];
  let lastIndex = 0;

  for (const match of value.matchAll(pattern)) {
    const start = match.index ?? 0;
    if (start > lastIndex) {
      parts.push(value.slice(lastIndex, start));
    }
    parts.push(match[0]);
    lastIndex = start + match[0].length;
  }

  if (lastIndex < value.length) {
    parts.push(value.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [value];
}

export function formatTimeRange(start: Date, end: Date): string {
  const startTime = formatFriendlyTime(start);
  const endTime = formatFriendlyTime(end);
  const startMeridiem = getMeridiem(startTime);
  const endMeridiem = getMeridiem(endTime);

  if (startMeridiem && startMeridiem === endMeridiem) {
    return `${startTime.slice(0, -2)}${TIME_RANGE_HYPHEN}${endTime}`;
  }

  return `${startTime}${TIME_RANGE_HYPHEN}${endTime}`;
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

function getLatestMealPhase(
  windows: MealWindows,
  now: Date,
): "digestion" | "pancreas-ramp-down" | "past-pancreas" {
  const clock = getPhaseClock(now);

  if (
    clock.getTime() >= windows.digestionStart.getTime() &&
    now.getTime() < windows.pancreasRampDownEnd.getTime()
  ) {
    if (now.getTime() < windows.digestionEnd.getTime()) {
      return "digestion";
    }

    return "pancreas-ramp-down";
  }

  return "past-pancreas";
}

export function getMealPhase(windows: MealWindows, now: Date): MealPhase {
  const latestPhase = getLatestMealPhase(windows, now);

  if (latestPhase === "digestion") {
    return "digestion";
  }

  if (latestPhase === "pancreas-ramp-down") {
    return "pancreas-ramp-down";
  }

  return "eating-from-storage";
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

function getPhaseRange(
  phase: MealPhase,
  windows: MealWindows,
  state?: CombinedEatState,
): {
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
        start: windows.pancreasRampDownEnd,
        end: state?.autophagyStartedAt ?? windows.pancreasRampDownEnd,
      };
    case "autophagy":
      return {
        start: state?.autophagyStartedAt ?? windows.pancreasRampDownEnd,
        end: state?.autophagyEnd ?? windows.pancreasRampDownEnd,
      };
  }
}

function getPhaseStatusText(
  phase: MealPhase,
  windows: MealWindows,
  now: Date,
  currentPhase: MealPhase,
  copy: {
    future: (range: string) => string;
    current: (until: string) => string;
    past: (range: string) => string;
  },
  state?: CombinedEatState,
): string {
  const relation = getPhaseRelation(phase, currentPhase);
  const { start, end } = getPhaseRange(phase, windows, state);

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
  currentPhase: MealPhase = getMealPhase(windows, now),
): string {
  return getPhaseStatusText("digestion", windows, now, currentPhase, {
    future: (range) => `body will process food from ${range}.`,
    current: (until) => `body is processing food until ${until}...`,
    past: (range) => `body processed food from ${range}.`,
  });
}

export function getPancreasRampDownStatusText(
  windows: MealWindows,
  now: Date,
  currentPhase: MealPhase = getMealPhase(windows, now),
): string {
  return getPhaseStatusText("pancreas-ramp-down", windows, now, currentPhase, {
    future: (range) =>
      `pancreas will ramp down and we will approach our blood sugar baseline from ${range}.`,
    current: (until) =>
      `pancreas is ramping down and we will approach our blood sugar baseline until ${until}...`,
    past: (range) =>
      `pancreas ramped down and we approached our blood sugar baseline from ${range}.`,
  });
}

function getLiverAutophagyTiming(state: CombinedEatState, now: Date) {
  const drainStart = state.latestWindows.pancreasRampDownEnd;

  let switchZoneAt: Date;
  if (state.currentPhase === "eating-from-storage") {
    switchZoneAt = addHours(now, hoursToReachLiverFloor(state.liverGrams));
  } else if (
    state.currentPhase === "autophagy" &&
    state.autophagyStartedAt
  ) {
    switchZoneAt = state.autophagyStartedAt;
  } else {
    const projected = simulateMetabolicState(state.meals, drainStart);
    const gramsAtDrain =
      projected?.liverGrams ??
      Math.max(state.liverGrams, LIVER_FLOOR_GRAMS);
    switchZoneAt = addHours(drainStart, hoursToReachLiverFloor(gramsAtDrain));
  }

  const autophagyEnd =
    state.currentPhase === "autophagy" && state.autophagyEnd
      ? state.autophagyEnd
      : addHours(switchZoneAt, AUTOPHAGY_HOURS);

  return { drainStart, switchZoneAt, autophagyEnd };
}

export function getEatingFromStorageStatusText(
  state: CombinedEatState,
  now: Date,
): string {
  const { drainStart, switchZoneAt } = getLiverAutophagyTiming(state, now);
  const relation = getPhaseRelation("eating-from-storage", state.currentPhase);

  if (relation === "current") {
    return `snacking on liver glycogen (nom nom nom) until ${formatRelativeTime(switchZoneAt, now)}...`;
  }

  if (switchZoneAt.getTime() <= drainStart.getTime()) {
    const at = formatRelativeTime(drainStart, now);
    if (relation === "future") {
      return `will snack on liver glycogen (nom nom nom) at ${at}.`;
    }
    return `snacked on liver glycogen (nom nom nom) at ${at}.`;
  }

  const range = formatRelativeTimeRange(drainStart, switchZoneAt, now);

  if (relation === "future") {
    return `will snack on liver glycogen (nom nom nom) from ${range}.`;
  }

  return `snacked on liver glycogen (nom nom nom) from ${range}.`;
}

export function getAutophagyStatusText(
  state: CombinedEatState,
  now: Date,
): string {
  const { switchZoneAt } = getLiverAutophagyTiming(state, now);
  const relation = getPhaseRelation("autophagy", state.currentPhase);

  if (relation === "current") {
    return `autophagy. cleaning crew is working! 🧹`;
  }

  if (relation === "future") {
    return `autophagy. let's clean those streets! 🧹 starting at ${formatRelativeTime(switchZoneAt, now)}.`;
  }

  return `autophagy. cleaned those streets! 🧹`;
}

export function getFatStorageStatusText(state: CombinedEatState): string {
  return `fat storage: ${formatFatStorageLabel(FAT_STORAGE_BASELINE_GRAMS, state.fatDeltaGrams)}`;
}

export type MealStatusRow = {
  icon: string;
  text: string;
  isDone: boolean;
};

export type EatHomeCardLine = {
  leadingIcon?: string;
  text: string;
  italic?: boolean;
};

function eatPhaseLine(
  leadingIcon: string,
  text: string,
): EatHomeCardLine {
  return { leadingIcon, text };
}

function eatActivityNudge(
  leadingIcon: string,
  text: string,
): EatHomeCardLine {
  return { leadingIcon, text, italic: true };
}

const EAT_HOME_LINES_BY_PHASE: Record<MealPhase, EatHomeCardLine[]> = {
  digestion: [
    eatPhaseLine("🔨", "digesting..."),
    eatActivityNudge("🚶🏻‍♀️", "good time to go for a walk!"),
  ],
  "pancreas-ramp-down": [
    eatPhaseLine("🫁", "insulin dropping..."),
    eatActivityNudge("🧘", "time to relax or stretch"),
  ],
  "eating-from-storage": [
    eatPhaseLine("🍯", "snacking on liver..."),
    eatActivityNudge("🏋🏻‍♀️", "good time for calisthenics!"),
  ],
  autophagy: [
    eatPhaseLine("🧹", "cleaning up ◡̈"),
    eatActivityNudge("🏃🏻‍♀️", "great time to run!"),
  ],
};

export function getCombinedEatState(
  meals: LoggedMeal[],
  now: Date,
): CombinedEatState | null {
  const state = simulateMetabolicState(meals, now);
  if (!state) {
    return null;
  }

  return {
    ...state,
    latestWindows: getMealWindows(
      new Date(state.latestMeal.selectedAt),
      state.latestMeal.mealSize,
    ),
  };
}

export function getCombinedMealPhase(
  meals: LoggedMeal[],
  now: Date,
): MealPhase | null {
  return getCombinedEatState(meals, now)?.currentPhase ?? null;
}

export function getCombinedMealStatusRows(
  meals: LoggedMeal[],
  now: Date,
): MealStatusRow[] {
  const state = getCombinedEatState(meals, now);
  if (!state) {
    return [];
  }

  const { latestWindows, currentPhase } = state;

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
    row("digestion", "🔨", getDigestionStatusText(latestWindows, now, currentPhase)),
    row(
      "pancreas-ramp-down",
      "🫁",
      getPancreasRampDownStatusText(latestWindows, now, currentPhase),
    ),
    row("eating-from-storage", "🍯", getEatingFromStorageStatusText(state, now)),
    row("autophagy", "♻️", getAutophagyStatusText(state, now)),
  ];
}

export function getEatHomeCardLines(now: Date): EatHomeCardLine[] | null {
  const meals = readLoggedMeals();
  const state = getCombinedEatState(meals, now);
  if (!state) {
    return null;
  }

  return EAT_HOME_LINES_BY_PHASE[state.currentPhase];
}

export function isEatCycleActive(meals: LoggedMeal[], now: Date): boolean {
  return getCombinedEatState(meals, now) !== null;
}

function parseLoggedMeal(raw: unknown): LoggedMeal | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const parsed = raw as { mealSize: string; selectedAt: string };
  const mealSize = parsed.mealSize === "feast!" ? "feast" : parsed.mealSize;
  if (!(mealSize in MEAL_SIZES) || !parsed.selectedAt) {
    return null;
  }

  return { mealSize: mealSize as MealSize, selectedAt: parsed.selectedAt };
}

export function getLatestLoggedMeal(meals: LoggedMeal[]): LoggedMeal {
  return meals.reduce((latest, meal) =>
    new Date(meal.selectedAt) > new Date(latest.selectedAt) ? meal : latest,
  );
}

export function findLatestLoggedMealIndex(meals: LoggedMeal[]): number {
  let latestIndex = 0;

  for (let index = 1; index < meals.length; index += 1) {
    const current = new Date(meals[index]!.selectedAt);
    const best = new Date(meals[latestIndex]!.selectedAt);
    if (current >= best) {
      latestIndex = index;
    }
  }

  return latestIndex;
}

export function readLoggedMeals(): LoggedMeal[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(EAT_MEALS_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as unknown[];
      if (Array.isArray(parsed)) {
        return parsed
          .map(parseLoggedMeal)
          .filter((meal): meal is LoggedMeal => meal !== null);
      }
    } catch {
      // fall through to legacy migration
    }
  }

  const legacyRaw = window.localStorage.getItem(EAT_LAST_MEAL_KEY);
  if (legacyRaw) {
    try {
      const legacyMeal = parseLoggedMeal(JSON.parse(legacyRaw));
      window.localStorage.removeItem(EAT_LAST_MEAL_KEY);
      if (legacyMeal) {
        writeLoggedMeals([legacyMeal]);
        return [legacyMeal];
      }
    } catch {
      window.localStorage.removeItem(EAT_LAST_MEAL_KEY);
    }
  }

  return [];
}

function notifyEatStorageChanged(): void {
  if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
    window.dispatchEvent(new Event(EAT_UPDATED_EVENT));
  }
}

export function writeLoggedMeals(meals: LoggedMeal[]): void {
  if (typeof window === "undefined") {
    return;
  }

  if (meals.length === 0) {
    clearLoggedMeals();
    return;
  }

  window.localStorage.setItem(EAT_MEALS_KEY, JSON.stringify(meals));
  notifyEatStorageChanged();
}

export function clearLoggedMeals(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(EAT_MEALS_KEY);
  window.localStorage.removeItem(EAT_LAST_MEAL_KEY);
  notifyEatStorageChanged();
}

export function addLoggedMeal(
  mealSize: MealSize,
  selectedAt: Date,
  now: Date,
): LoggedMeal[] {
  const meals = readLoggedMeals();
  const record: LoggedMeal = {
    mealSize,
    selectedAt: roundToNearest15Minutes(selectedAt).toISOString(),
  };
  const activeMeals = isEatCycleActive(meals, now) ? meals : [];
  const updated = [...activeMeals, record];
  writeLoggedMeals(updated);
  return updated;
}

export function updateLatestLoggedMeal(
  mealSize: MealSize,
  selectedAt: Date,
): LoggedMeal[] {
  const meals = readLoggedMeals();
  const now = new Date();
  if (meals.length === 0) {
    return addLoggedMeal(mealSize, selectedAt, now);
  }

  const latestIndex = findLatestLoggedMealIndex(meals);
  const updated = meals.map((meal, index) =>
    index === latestIndex
      ? {
          mealSize,
          selectedAt: roundToNearest15Minutes(selectedAt).toISOString(),
        }
      : meal,
  );
  writeLoggedMeals(updated);
  return updated;
}
