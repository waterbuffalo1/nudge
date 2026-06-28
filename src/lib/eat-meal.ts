import {
  formatFatStorageLabel,
  hoursToReachLiverFloor,
  simulateMetabolicState,
  FAT_STORAGE_BASELINE_GRAMS,
  LIVER_FLOOR_GRAMS,
  type MetabolicState,
} from "./eat-metabolic";
import {
  addHours,
  getMealWindows,
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
  roundToNearest15Minutes,
  type LoggedMeal,
  type MealPhase,
  type MealSize,
  type MealWindows,
} from "./eat-meal-timing";
export {
  formatFatStorageLabel,
  getCumulativeFillGrams,
  hoursToReachLiverFloor,
  liverAfterDrainHours,
  simulateMetabolicState,
  LIVER_CAP_GRAMS,
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

function getLatestMealPhase(
  windows: MealWindows,
  now: Date,
): "digestion" | "pancreas-ramp-down" | "past-pancreas" {
  if (now.getTime() < windows.digestionEnd.getTime()) {
    return "digestion";
  }

  if (now.getTime() < windows.pancreasRampDownEnd.getTime()) {
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

function formatGrams(grams: number): string {
  const rounded = Math.round(grams * 10) / 10;
  return rounded % 1 === 0 ? `${rounded}` : rounded.toFixed(1);
}

export function getLiverTankStatusText(
  state: CombinedEatState,
  now: Date,
): string {
  const relation = getPhaseRelation("eating-from-storage", state.currentPhase);

  if (relation === "past") {
    return `liver reached the metabolic switch zone at ${formatGrams(LIVER_FLOOR_GRAMS)}g.`;
  }

  if (relation === "future") {
    return `liver will drain toward the metabolic switch zone (~${formatGrams(LIVER_FLOOR_GRAMS)}g)...`;
  }

  if (state.liverGrams <= LIVER_FLOOR_GRAMS) {
    return `liver at metabolic switch zone (${formatGrams(state.liverGrams)}g)...`;
  }

  const switchAt = addHours(now, hoursToReachLiverFloor(state.liverGrams));
  return `liver pantry at ${formatGrams(state.liverGrams)}g... draining to switch zone until ${formatRelativeTime(switchAt, now)}...`;
}

export function getAutophagyTankStatusText(
  state: CombinedEatState,
  now: Date,
): string {
  const relation = getPhaseRelation("autophagy", state.currentPhase);
  const fatLabel = formatFatStorageLabel(
    FAT_STORAGE_BASELINE_GRAMS,
    state.fatDeltaGrams,
  );

  if (relation === "past") {
    return `autophagy finished. fat storage ${fatLabel}.`;
  }

  if (relation === "future") {
    return `autophagy will start at the metabolic switch zone. fat storage ${fatLabel}.`;
  }

  const until = state.autophagyEnd
    ? formatRelativeTime(state.autophagyEnd, now)
    : "soon";
  return `autophagy. cleaning crew is working! 🧹 until ${until}... fat storage ${fatLabel}.`;
}

export function getFatStorageStatusText(state: CombinedEatState): string {
  return `fat storage: ${formatFatStorageLabel(FAT_STORAGE_BASELINE_GRAMS, state.fatDeltaGrams)}`;
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
    row("digestion", "⚙️", getDigestionStatusText(windows, now, currentPhase)),
    row(
      "pancreas-ramp-down",
      "🫁",
      getPancreasRampDownStatusText(windows, now, currentPhase),
    ),
    row(
      "eating-from-storage",
      "🍯",
      "liver will drain after pancreas finishes...",
    ),
    row("autophagy", "♻️", "autophagy starts at the metabolic switch zone..."),
  ];
}

export function getCurrentMealStatusRow(
  windows: MealWindows,
  now: Date,
): MealStatusRow {
  const currentPhase = getMealPhase(windows, now);
  const rows = getMealStatusRows(windows, now);
  const index = MEAL_PHASE_ORDER.indexOf(currentPhase);

  return rows[index] ?? rows[0]!;
}

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
    eatPhaseLine("⚙️", "digesting..."),
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
    row("digestion", "⚙️", getDigestionStatusText(latestWindows, now, currentPhase)),
    row(
      "pancreas-ramp-down",
      "🫁",
      getPancreasRampDownStatusText(latestWindows, now, currentPhase),
    ),
    row("eating-from-storage", "🍯", getLiverTankStatusText(state, now)),
    row("autophagy", "♻️", getAutophagyTankStatusText(state, now)),
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
  if (meals.length === 0) {
    return addLoggedMeal(mealSize, selectedAt, new Date());
  }

  const latestMeal = getLatestLoggedMeal(meals);
  const updated = meals.map((meal) =>
    meal.selectedAt === latestMeal.selectedAt &&
    meal.mealSize === latestMeal.mealSize
      ? {
          mealSize,
          selectedAt: roundToNearest15Minutes(selectedAt).toISOString(),
        }
      : meal,
  );
  writeLoggedMeals(updated);
  return updated;
}
