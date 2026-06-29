"use client";

import { useEffect, useState, type ReactNode } from "react";
import { TimeRoller, DayRoller } from "@/components/TimeRoller";
import { EatInfoFontScaleControl } from "@/components/EatInfoFontScaleControl";
import { EatInfoScreen } from "@/components/EatInfoScreen";
import { NavLink } from "@/components/NavLink";
import { LoadingOverlay } from "@/components/PageLoading";
import { useEatInfoFontScale } from "@/lib/eat-info-font-scale";
import { EAT_INFO_1_SECTIONS } from "@/lib/eat-info-content";
import {
  addLoggedMeal,
  clearLoggedMeals,
  dateFromPickerValues,
  dateToPickerValues,
  formatFriendlyTime,
  getCombinedMealStatusRows,
  getCombinedEatState,
  getLatestLoggedMeal,
  getMealWindows,
  getMoonPhaseEmojiForLiverGrams,
  getMoonPhaseEmojiForMeals,
  isEatCycleActive,
  isMealCycleStarted,
  isTimeRangeText,
  LIVER_FLOOR_GRAMS,
  readLoggedMeals,
  roundToNearest15Minutes,
  splitTextAtTimeRanges,
  updateLatestLoggedMeal,
  type LoggedMeal,
  type MealSize,
  type MealTimePickerValues,
  type PickerDayOffset,
  type PickerMeridiem,
} from "@/lib/eat-meal";

type EatStep = "ask" | "no" | "yes" | "edit" | "info";

const NO_SCREEN_MS = 2500;

const MEAL_OPTIONS: MealSize[] = [
  "small snack",
  "reasonable meal",
  "feast",
];

const EDIT_MEAL_OPTIONS: { label: string; value: MealSize }[] = [
  { label: "snack", value: "small snack" },
  { label: "meal", value: "reasonable meal" },
  { label: "feast", value: "feast" },
];

const navLinkClassName =
  "text-sm font-medium text-muted active:text-foreground touch-manipulation";

const eatHeaderRowClassName = "flex items-center gap-1.5";

const eatHeaderIconSlotClassName = "flex w-3.5 shrink-0 justify-center";

const eatHeaderLabelClassName = "text-sm font-medium";

function ResetIcon() {
  return (
    <svg
      className="size-3.5 shrink-0"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path
        d="M13 3v4H9M3 13V9h4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.2 6.2A5.5 5.5 0 0 0 4.1 3.4L3 5M3.8 9.8A5.5 5.5 0 0 0 11.9 12.6L13 11"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg
      className="size-3.5 shrink-0"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path
        d="M10.5 2.5 13.5 5.5 5.5 13.5H2.5V10.5L10.5 2.5Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg
      className="size-3.5 shrink-0"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <circle cx="8" cy="8" r="6.25" />
      <path d="M8 7.25V11" strokeLinecap="round" />
      <circle cx="8" cy="5.15" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

function BackNavLabel() {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="relative top-px" aria-hidden>
        ⬅
      </span>
      back
    </span>
  );
}

function EatHeader({
  infoOpen,
  editOpen,
  onEdit,
  onBackFromEdit,
  onBackFromInfo,
  onInfo,
  onReset,
  fontScaleControl,
}: {
  infoOpen: boolean;
  editOpen: boolean;
  onEdit: () => void;
  onBackFromEdit: () => void;
  onBackFromInfo: () => void;
  onInfo: () => void;
  onReset: () => void;
  fontScaleControl?: ReactNode;
}) {
  return (
    <div className="mb-8 flex items-start justify-between">
      {infoOpen ? (
        <button type="button" className={navLinkClassName} onClick={onBackFromInfo}>
          <BackNavLabel />
        </button>
      ) : editOpen ? (
        <button type="button" className={navLinkClassName} onClick={onBackFromEdit}>
          <BackNavLabel />
        </button>
      ) : (
        <NavLink href="/" className={navLinkClassName}>
          <BackNavLabel />
        </NavLink>
      )}
      <div className="flex flex-col items-end">
        <div className="inline-flex flex-col items-start gap-2">
          {!infoOpen ? (
            <button
              type="button"
              className={`${navLinkClassName} ${eatHeaderRowClassName}`}
              onClick={onInfo}
            >
              <span className={eatHeaderIconSlotClassName}>
                <InfoIcon />
              </span>
              <span className={eatHeaderLabelClassName}>info</span>
            </button>
          ) : null}
          {!infoOpen && !editOpen ? (
            <button
              type="button"
              className={`${navLinkClassName} ${eatHeaderRowClassName}`}
              onClick={onEdit}
            >
              <span className={eatHeaderIconSlotClassName}>
                <EditIcon />
              </span>
              <span className={eatHeaderLabelClassName}>edit</span>
            </button>
          ) : null}
          {infoOpen && fontScaleControl ? fontScaleControl : null}
          {!infoOpen && !editOpen ? (
            <button
              type="button"
              className={`${navLinkClassName} ${eatHeaderRowClassName}`}
              onClick={onReset}
            >
              <span className={eatHeaderIconSlotClassName}>
                <ResetIcon />
              </span>
              <span className={eatHeaderLabelClassName}>reset</span>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

const choiceClassName =
  "min-w-[7rem] touch-manipulation rounded-[2.75rem] border-2 border-border bg-elevated px-8 py-4 font-category text-2xl font-medium text-foreground active:scale-[0.98] transition-transform";

const mealChoiceClassName =
  "w-full max-w-xs touch-manipulation rounded-[2.75rem] border-2 border-border bg-elevated px-8 py-4 font-category text-2xl font-medium text-foreground active:scale-[0.98] transition-transform";

const editMealChoiceClassName =
  "min-w-[4.5rem] touch-manipulation rounded-[2rem] border-2 border-border bg-elevated px-4 py-2 font-category text-xl font-medium text-foreground active:scale-[0.98] transition-transform";

const headerClassName =
  "text-center text-2xl font-semibold tracking-tight text-balance text-foreground";

const editSectionTitleClassName =
  "text-center text-xl font-semibold tracking-tight text-balance text-foreground";

const editSectionClassName =
  "flex w-full flex-col items-center gap-3";

const editSectionsClassName = "flex flex-col items-center gap-8";

const statusClassName =
  "text-left text-xl font-semibold tracking-tight text-foreground";

const statusDetailRowClassName =
  "text-left text-lg font-medium tracking-tight -ml-2 flex items-baseline gap-2";

function getEditDefaults(meals: LoggedMeal[], now: Date) {
  if (meals.length > 0) {
    const latestMeal = getLatestLoggedMeal(meals);
    return {
      mealSize: latestMeal.mealSize,
      ...dateToPickerValues(new Date(latestMeal.selectedAt), now),
    };
  }

  return {
    mealSize: "reasonable meal" as MealSize,
    ...dateToPickerValues(roundToNearest15Minutes(now), now),
  };
}

const statusDoneRowClassName =
  "text-done-soft line-through decoration-done-soft decoration-1";

const statusSectionGapClassName = "gap-10";

const EMOJI_SEGMENT_PATTERN =
  /(\p{Extended_Pictographic}\uFE0F?|\p{Emoji_Presentation})/gu;

function isEmojiSegment(value: string): boolean {
  return /\p{Extended_Pictographic}/u.test(value) || /\p{Emoji_Presentation}/u.test(value);
}

function splitEatPhaseSegments(value: string): string[] {
  return value.split(EMOJI_SEGMENT_PATTERN).filter((part) => part.length > 0);
}

function normalizeForNotoMono(value: string): string {
  // Force text presentation so Noto Emoji renders monochrome glyphs.
  const base = value.replace(/\uFE0F/g, "").replace(/\uFE0E/g, "");
  return `${base}\uFE0E`;
}

function EatPhaseEmoji({
  isDone,
  children,
  inline = false,
}: {
  isDone: boolean;
  children: string;
  inline?: boolean;
}) {
  const className = isDone
    ? inline
      ? "eat-phase-emoji-mono-inline"
      : "eat-phase-emoji-mono shrink-0"
    : inline
      ? "eat-phase-emoji-color-inline"
      : "eat-phase-emoji-color shrink-0 leading-none";

  return (
    <span className={className} aria-hidden={!inline}>
      {isDone ? normalizeForNotoMono(children) : children}
    </span>
  );
}

function renderTextSegment(segment: string, key: string) {
  return splitTextAtTimeRanges(segment).map((part, index) =>
    isTimeRangeText(part) ? (
      <span key={`${key}-${index}`} className="whitespace-nowrap">
        {part}
      </span>
    ) : (
      <span key={`${key}-${index}`}>{part}</span>
    ),
  );
}

function EatPhaseText({ text, isDone }: { text: string; isDone: boolean }) {
  return (
    <>
      {splitEatPhaseSegments(text).map((segment, index) =>
        isEmojiSegment(segment) ? (
          <EatPhaseEmoji key={index} isDone={isDone} inline>
            {segment}
          </EatPhaseEmoji>
        ) : (
          <span key={index}>{renderTextSegment(segment, String(index))}</span>
        ),
      )}
    </>
  );
}

function LiverStorageMoonLabel({
  meals,
  now,
  liverGrams,
  centered = false,
}: {
  meals: LoggedMeal[];
  now: Date;
  liverGrams: number;
  centered?: boolean;
}) {
  const moon = getMoonPhaseEmojiForMeals(meals, now, liverGrams);

  return (
    <p
      className={`${statusClassName} flex items-baseline gap-2 ${
        centered ? "justify-center text-center" : ""
      }`}
    >
      <span>liver storage:</span>
      <span className="liver-moon-emoji" aria-hidden>
        {normalizeForNotoMono(moon)}
      </span>
    </p>
  );
}

function EatStatus({
  meals,
  now,
  liverGrams,
}: {
  meals: LoggedMeal[];
  now: Date;
  liverGrams?: number;
}) {
  const latestMeal = getLatestLoggedMeal(meals);
  const windows = getMealWindows(
    new Date(latestMeal.selectedAt),
    latestMeal.mealSize,
  );
  const statusRows = getCombinedMealStatusRows(meals, now);

  return (
    <div className="flex w-full flex-col">
      <p className={`${statusClassName} mb-10`}>
        last had a {latestMeal.mealSize} at{" "}
        {formatFriendlyTime(windows.digestionStart)}
      </p>
      <div className={`flex flex-col ${statusSectionGapClassName}`}>
        <div className="flex flex-col gap-3">
          {statusRows.map((row, index) => (
            <p
              key={index}
              className={`${statusDetailRowClassName} ${
                row.isDone ? statusDoneRowClassName : "text-muted"
              }`}
            >
              <EatPhaseEmoji isDone={row.isDone}>{row.icon}</EatPhaseEmoji>
              <span>
                <EatPhaseText text={row.text} isDone={row.isDone} />
              </span>
            </p>
          ))}
        </div>
        {liverGrams !== undefined ? (
          <LiverStorageMoonLabel
            meals={meals}
            now={now}
            liverGrams={liverGrams}
          />
        ) : null}
      </div>
    </div>
  );
}

function EatEditScreen({
  mealSize,
  picker,
  onMealSizeChange,
  onPickerChange,
  onSubmit,
}: {
  mealSize: MealSize;
  picker: MealTimePickerValues;
  onMealSizeChange: (mealSize: MealSize) => void;
  onPickerChange: (picker: MealTimePickerValues) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col px-5 pb-[max(2.5rem,env(safe-area-inset-bottom))]">
      <div className={`${editSectionsClassName} pt-[8dvh]`}>
        <section className={editSectionClassName}>
          <p className={editSectionTitleClassName}>what did you have?</p>
          <div className="flex flex-wrap justify-center gap-2">
            {EDIT_MEAL_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`${editMealChoiceClassName} ${
                  mealSize === option.value
                    ? "border-foreground"
                    : "border-border"
                }`}
                onClick={() => onMealSizeChange(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>

        <section className={editSectionClassName}>
          <p className={editSectionTitleClassName}>when did you have it?</p>
          <TimeRoller
            hour12={picker.hour12}
            minute={picker.minute}
            meridiem={picker.meridiem}
            onHourChange={(hour12) =>
              onPickerChange({ ...picker, hour12: hour12 as MealTimePickerValues["hour12"] })
            }
            onMinuteChange={(minute) =>
              onPickerChange({ ...picker, minute: minute as MealTimePickerValues["minute"] })
            }
            onMeridiemChange={(meridiem) =>
              onPickerChange({ ...picker, meridiem: meridiem as PickerMeridiem })
            }
          />
        </section>

        <section className={editSectionClassName}>
          <p className={editSectionTitleClassName}>what day was it?</p>
          <DayRoller
            dayOffset={picker.dayOffset}
            onDayOffsetChange={(dayOffset) =>
              onPickerChange({ ...picker, dayOffset: dayOffset as PickerDayOffset })
            }
          />
        </section>

        <button type="button" className={choiceClassName} onClick={onSubmit}>
          OK
        </button>
      </div>
    </div>
  );
}

export function EatScreen() {
  const [ready, setReady] = useState(false);
  const [step, setStep] = useState<EatStep>("ask");
  const [meals, setMeals] = useState<LoggedMeal[]>([]);
  const [now, setNow] = useState(() => new Date());
  const [editMealSize, setEditMealSize] = useState<MealSize>("reasonable meal");
  const [editPicker, setEditPicker] = useState<MealTimePickerValues>(() =>
    dateToPickerValues(roundToNearest15Minutes(new Date())),
  );
  const [editRelativeTo, setEditRelativeTo] = useState(() => new Date());
  const {
    fontScale,
    canDecrease,
    canIncrease,
    decrease,
    increase,
  } = useEatInfoFontScale();

  useEffect(() => {
    const stored = readLoggedMeals();
    const currentTime = new Date();

    if (stored.length > 0 && isEatCycleActive(stored, currentTime)) {
      setMeals(stored);
      setNow(currentTime);
      setReady(true);
      return;
    }

    if (stored.length > 0) {
      clearLoggedMeals();
    }

    setReady(true);
  }, []);

  useEffect(() => {
    if (step !== "no") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setStep("ask");
    }, NO_SCREEN_MS);

    return () => window.clearTimeout(timeoutId);
  }, [step]);

  const cycleActive = isEatCycleActive(meals, now);
  const metabolicState = getCombinedEatState(meals, now);

  useEffect(() => {
    if (step !== "ask" && step !== "edit") {
      return;
    }

    const intervalMs = cycleActive ? 15_000 : 60_000;
    const intervalId = window.setInterval(() => {
      setNow(new Date());
    }, intervalMs);

    return () => window.clearInterval(intervalId);
  }, [step, cycleActive]);

  useEffect(() => {
    if (meals.length === 0 || isEatCycleActive(meals, now)) {
      return;
    }

    const earliestStart = roundToNearest15Minutes(
      new Date(
        meals.reduce(
          (earliest, meal) =>
            new Date(meal.selectedAt) < new Date(earliest.selectedAt)
              ? meal
              : earliest,
          meals[0]!,
        ).selectedAt,
      ),
    );

    if (!isMealCycleStarted(earliestStart, now)) {
      return;
    }

    clearLoggedMeals();
    setMeals([]);
  }, [meals, now]);

  function handleReset() {
    clearLoggedMeals();
    setMeals([]);
    setStep("ask");
    setNow(new Date());
  }

  function handleEditClose() {
    setStep("ask");
  }

  function handleEditOpen() {
    const openedAt = new Date();
    const defaults = getEditDefaults(meals, openedAt);
    setEditRelativeTo(openedAt);
    setEditMealSize(defaults.mealSize);
    setEditPicker({
      hour12: defaults.hour12,
      minute: defaults.minute,
      meridiem: defaults.meridiem,
      dayOffset: defaults.dayOffset,
    });
    setStep("edit");
  }

  function handleEditSubmit() {
    const selectedAt = dateFromPickerValues({
      ...editPicker,
      relativeTo: editRelativeTo,
    });
    const updated = updateLatestLoggedMeal(editMealSize, selectedAt);
    setMeals(updated);
    setNow(new Date());
    setStep("ask");
  }

  function handleMealSelect(mealSize: MealSize) {
    const updated = addLoggedMeal(mealSize, new Date(), now);
    setMeals(updated);
    setNow(new Date());
    setStep("ask");
  }

  function handleBackFromInfo() {
    setStep("ask");
  }

  function handleInfoOpen() {
    setStep("info");
  }

  const infoOpen = step === "info";

  const fontScaleControl = (
    <EatInfoFontScaleControl
      rowClassName={eatHeaderRowClassName}
      iconSlotClassName={eatHeaderIconSlotClassName}
      labelClassName={`${eatHeaderLabelClassName} text-muted`}
      buttonClassName={navLinkClassName}
      canDecrease={canDecrease}
      canIncrease={canIncrease}
      onDecrease={decrease}
      onIncrease={increase}
    />
  );

  const header = (
    <EatHeader
      infoOpen={infoOpen}
      editOpen={step === "edit"}
      onEdit={handleEditOpen}
      onBackFromEdit={handleEditClose}
      onBackFromInfo={handleBackFromInfo}
      onInfo={handleInfoOpen}
      onReset={handleReset}
      fontScaleControl={fontScaleControl}
    />
  );

  if (!ready) {
    return <LoadingOverlay />;
  }

  if (step === "info") {
    return (
      <>
        {header}
        <div className="flex min-h-[calc(100dvh-6rem)] flex-1 flex-col overflow-hidden">
          <EatInfoScreen sections={EAT_INFO_1_SECTIONS} fontScale={fontScale} />
        </div>
      </>
    );
  }

  if (step === "edit") {
    return (
      <>
        {header}
        <EatEditScreen
          mealSize={editMealSize}
          picker={editPicker}
          onMealSizeChange={setEditMealSize}
          onPickerChange={setEditPicker}
          onSubmit={handleEditSubmit}
        />
      </>
    );
  }

  if (step === "no") {
    return (
      <>
        {header}
        <div className="relative flex min-h-[calc(100dvh-6rem)] flex-1 flex-col">
          <p
            className={`${headerClassName} absolute left-0 right-0 top-[33dvh] -translate-y-1/2 px-5`}
          >
            ok, then don&apos;t eat ◡̈
          </p>
        </div>
      </>
    );
  }

  if (step === "yes") {
    return (
      <>
        {header}
        <div className="relative flex min-h-[calc(100dvh-6rem)] flex-1 flex-col">
          <p
            className={`${headerClassName} absolute left-0 right-0 top-[33dvh] -translate-y-1/2 px-5`}
          >
            ok, let&apos;s eat. how much food are you having?
          </p>

          <div className="absolute left-0 right-0 top-[33dvh] flex translate-y-[4.5rem] flex-col items-center gap-3 px-5">
            {MEAL_OPTIONS.map((mealSize) => (
              <button
                key={mealSize}
                type="button"
                className={mealChoiceClassName}
                onClick={() => handleMealSelect(mealSize)}
              >
                {mealSize}
              </button>
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {header}
      <div className="relative flex min-h-[calc(100dvh-6rem)] flex-1 flex-col px-5">
        {cycleActive ? (
          <div
            className={`flex min-h-[calc(100dvh-6rem)] flex-1 flex-col ${statusSectionGapClassName} pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-[5dvh]`}
          >
            <EatStatus
              meals={meals}
              now={now}
              liverGrams={metabolicState?.liverGrams}
            />
            <div className="flex flex-col items-center gap-4">
              <p className={headerClassName}>still hungry?</p>
              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  className={choiceClassName}
                  onClick={() => setStep("no")}
                >
                  no
                </button>
                <button
                  type="button"
                  className={choiceClassName}
                  onClick={() => setStep("yes")}
                >
                  yes
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex min-h-[calc(100dvh-6rem)] flex-1 flex-col pb-[max(2.5rem,env(safe-area-inset-bottom))]">
            <div className="flex flex-col items-center gap-4 pt-[12dvh]">
              <p className={headerClassName}>hungry?</p>
              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  className={choiceClassName}
                  onClick={() => setStep("no")}
                >
                  no
                </button>
                <button
                  type="button"
                  className={choiceClassName}
                  onClick={() => setStep("yes")}
                >
                  yes
                </button>
              </div>
            </div>
            <div className="mt-auto flex justify-center">
              <LiverStorageMoonLabel
                meals={[]}
                now={now}
                liverGrams={LIVER_FLOOR_GRAMS}
                centered
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
