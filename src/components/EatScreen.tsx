"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { TimeRoller } from "@/components/TimeRoller";
import {
  clearLastMeal,
  dateFromPickerValues,
  dateToPickerValues,
  formatFriendlyTime,
  getMealStatusRows,
  getMealWindows,
  isMealActive,
  logMeal,
  readLastMeal,
  roundToNearest15Minutes,
  saveLastMeal,
  type LastMeal,
  type MealSize,
  type MealTimePickerValues,
  type PickerMeridiem,
} from "@/lib/eat-meal";

type EatStep = "ask" | "no" | "yes" | "edit";

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

function EatHeader({
  activeMeal,
  onEdit,
  onReset,
}: {
  activeMeal: LastMeal | null;
  onEdit: () => void;
  onReset: () => void;
}) {
  return (
    <div className="mb-8 flex items-start justify-between">
      <Link href="/" className={navLinkClassName}>
        ← back
      </Link>
      <div className="flex flex-col items-end gap-2">
        <button
          type="button"
          className={`${navLinkClassName} flex items-center gap-1.5`}
          onClick={onEdit}
        >
          <EditIcon />
          edit
        </button>
        {activeMeal ? (
          <button
            type="button"
            className={`${navLinkClassName} flex items-center gap-1.5`}
            onClick={onReset}
          >
            <ResetIcon />
            reset
          </button>
        ) : null}
      </div>
    </div>
  );
}

const choiceClassName =
  "min-w-[7rem] touch-manipulation rounded-[2.75rem] border-2 border-border bg-elevated px-8 py-4 font-category text-2xl font-medium text-foreground active:scale-[0.98] transition-transform";

const mealChoiceClassName =
  "w-full max-w-xs touch-manipulation rounded-[2.75rem] border-2 border-border bg-elevated px-8 py-4 font-category text-2xl font-medium text-foreground active:scale-[0.98] transition-transform";

const editMealChoiceClassName =
  "min-w-[5.5rem] touch-manipulation rounded-[2.75rem] border-2 border-border bg-elevated px-6 py-3 font-category text-xl font-medium text-foreground active:scale-[0.98] transition-transform";

const headerClassName =
  "text-center text-2xl font-semibold tracking-tight text-balance text-foreground";

const editSectionTitleClassName =
  "text-center text-xl font-semibold tracking-tight text-balance text-foreground";

const statusClassName =
  "text-left text-xl font-semibold tracking-tight text-foreground";

const statusDetailRowClassName =
  "text-left text-lg font-medium tracking-tight -ml-2 flex items-baseline gap-2";

function getEditDefaults(lastMeal: LastMeal | null, now: Date) {
  if (lastMeal) {
    return {
      mealSize: lastMeal.mealSize,
      ...dateToPickerValues(new Date(lastMeal.selectedAt)),
    };
  }

  return {
    mealSize: "reasonable meal" as MealSize,
    ...dateToPickerValues(roundToNearest15Minutes(now)),
  };
}

const statusDoneRowClassName =
  "text-done-soft line-through decoration-done-soft decoration-1";

const EMOJI_SEGMENT_PATTERN =
  /(\p{Extended_Pictographic}\uFE0F?|\p{Emoji_Presentation})/gu;

function isEmojiSegment(value: string): boolean {
  return /\p{Extended_Pictographic}/u.test(value) || /\p{Emoji_Presentation}/u.test(value);
}

function splitEatPhaseSegments(value: string): string[] {
  return value.split(EMOJI_SEGMENT_PATTERN).filter((part) => part.length > 0);
}

function normalizeForNotoMono(value: string): string {
  // Noto Emoji renders text-presentation glyphs; VS16 often forces a color fallback.
  return value.replace(/\uFE0F/g, "");
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

function EatPhaseText({ text, isDone }: { text: string; isDone: boolean }) {
  return (
    <>
      {splitEatPhaseSegments(text).map((segment, index) =>
        isEmojiSegment(segment) ? (
          <EatPhaseEmoji key={index} isDone={isDone} inline>
            {segment}
          </EatPhaseEmoji>
        ) : (
          <span key={index}>{segment}</span>
        ),
      )}
    </>
  );
}

function EatStatus({ lastMeal, now }: { lastMeal: LastMeal; now: Date }) {
  const windows = getMealWindows(
    new Date(lastMeal.selectedAt),
    lastMeal.mealSize,
  );
  const statusRows = getMealStatusRows(windows, now);

  return (
    <div className="flex w-full flex-col">
      <p className={`${statusClassName} mb-10`}>
        last had a {lastMeal.mealSize} at{" "}
        {formatFriendlyTime(windows.digestionStart)}
      </p>
      <div className="flex flex-col gap-3 pb-2">
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
    <div className="relative flex min-h-[calc(100dvh-6rem)] flex-1 flex-col">
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-5">
        <p className={editSectionTitleClassName}>what did you have?</p>
        <div className="flex flex-wrap justify-center gap-3">
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
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-5">
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
      </div>

      <div className="absolute inset-x-0 bottom-[max(2.5rem,env(safe-area-inset-bottom))] flex justify-center px-5">
        <button type="button" className={choiceClassName} onClick={onSubmit}>
          OK
        </button>
      </div>
    </div>
  );
}

export function EatScreen() {
  const [step, setStep] = useState<EatStep>("ask");
  const [lastMeal, setLastMeal] = useState<LastMeal | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [editMealSize, setEditMealSize] = useState<MealSize>("reasonable meal");
  const [editPicker, setEditPicker] = useState<MealTimePickerValues>(() =>
    dateToPickerValues(roundToNearest15Minutes(new Date())),
  );

  useEffect(() => {
    const stored = readLastMeal();
    const currentTime = new Date();

    if (stored && isMealActive(stored, currentTime)) {
      setLastMeal(stored);
      setNow(currentTime);
      return;
    }

    if (stored) {
      clearLastMeal();
    }
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

  useEffect(() => {
    if (step !== "ask" && step !== "edit") {
      return;
    }

    const intervalId = window.setInterval(() => {
      setNow(new Date());
    }, 60_000);

    return () => window.clearInterval(intervalId);
  }, [step]);

  const activeMeal =
    lastMeal && isMealActive(lastMeal, now) ? lastMeal : null;

  useEffect(() => {
    if (lastMeal && !isMealActive(lastMeal, now)) {
      clearLastMeal();
      setLastMeal(null);
    }
  }, [lastMeal, now]);

  function handleReset() {
    clearLastMeal();
    setLastMeal(null);
    setStep("ask");
    setNow(new Date());
  }

  function handleEditOpen() {
    const defaults = getEditDefaults(lastMeal, new Date());
    setEditMealSize(defaults.mealSize);
    setEditPicker({
      hour12: defaults.hour12,
      minute: defaults.minute,
      meridiem: defaults.meridiem,
    });
    setStep("edit");
  }

  function handleEditSubmit() {
    const baseDate = lastMeal ? new Date(lastMeal.selectedAt) : new Date();
    const selectedAt = dateFromPickerValues({
      ...editPicker,
      baseDate,
    });
    const record = saveLastMeal(editMealSize, selectedAt);
    setLastMeal(record);
    setNow(new Date());
    setStep("ask");
  }

  function handleMealSelect(mealSize: MealSize) {
    const result = logMeal(mealSize, new Date(), lastMeal, now);
    setLastMeal(result.meal);
    setNow(new Date());
    setStep("ask");
  }

  const header = (
    <EatHeader
      activeMeal={activeMeal}
      onEdit={handleEditOpen}
      onReset={handleReset}
    />
  );

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
        {activeMeal ? (
          <div className="flex min-h-[calc(100dvh-6rem)] flex-1 flex-col pb-[max(2.5rem,env(safe-area-inset-bottom))]">
            <div className="shrink-0 pt-[5dvh]">
              <EatStatus lastMeal={activeMeal} now={now} />
            </div>
            <div className="mt-auto flex shrink-0 flex-col items-center gap-4 pt-12">
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
          <>
            <p
              className={`${headerClassName} absolute left-0 right-0 top-[33dvh] -translate-y-1/2 px-5`}
            >
              hungry?
            </p>

            <div className="absolute left-0 right-0 top-[33dvh] flex translate-y-[4.5rem] justify-center gap-3 px-5">
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
          </>
        )}
      </div>
    </>
  );
}
