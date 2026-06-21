"use client";

import { useEffect, useState } from "react";
import {
  clearLastMeal,
  formatFriendlyTime,
  getMealWindows,
  getProcessingStatusText,
  getRestStatusText,
  isMealActive,
  readLastMeal,
  saveLastMeal,
  type LastMeal,
  type MealSize,
} from "@/lib/eat-meal";

type EatStep = "ask" | "no" | "yes";

const NO_SCREEN_MS = 2500;

const MEAL_OPTIONS: MealSize[] = [
  "small snack",
  "reasonable meal",
  "feast",
];

const choiceClassName =
  "min-w-[7rem] touch-manipulation rounded-[2.75rem] border-2 border-border bg-elevated px-8 py-4 font-category text-2xl font-medium text-foreground active:scale-[0.98] transition-transform";

const mealChoiceClassName =
  "w-full max-w-xs touch-manipulation rounded-[2.75rem] border-2 border-border bg-elevated px-8 py-4 font-category text-2xl font-medium text-foreground active:scale-[0.98] transition-transform";

const headerClassName =
  "text-center text-2xl font-semibold tracking-tight text-balance text-foreground";

const statusClassName =
  "text-left text-xl font-semibold tracking-tight text-foreground";

const statusDetailRowClassName =
  "text-left text-lg font-medium tracking-tight text-muted -ml-2 flex items-baseline gap-2";

function EatStatus({ lastMeal, now }: { lastMeal: LastMeal; now: Date }) {
  const windows = getMealWindows(
    new Date(lastMeal.selectedAt),
    lastMeal.mealSize,
  );

  return (
    <div className="flex w-full flex-col">
      <p className={`${statusClassName} mb-10`}>
        last had a {lastMeal.mealSize} at{" "}
        {formatFriendlyTime(windows.processingStart)}
      </p>
      <div className="flex flex-col gap-3">
        <p className={statusDetailRowClassName}>
        <span className="shrink-0" aria-hidden>
          ⚙️🛠️
        </span>
        <span>{getProcessingStatusText(windows, now)}</span>
      </p>
      <p className={statusDetailRowClassName}>
        <span className="shrink-0" aria-hidden>
          🫁💤
        </span>
        <span>{getRestStatusText(windows, now)}</span>
      </p>
      </div>
    </div>
  );
}

export function EatScreen() {
  const [step, setStep] = useState<EatStep>("ask");
  const [lastMeal, setLastMeal] = useState<LastMeal | null>(null);
  const [now, setNow] = useState(() => new Date());

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
    if (step !== "ask") {
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

  function handleMealSelect(mealSize: MealSize) {
    const record = saveLastMeal(mealSize, new Date());
    setLastMeal(record);
    setNow(new Date());
    setStep("ask");
  }

  if (step === "no") {
    return (
      <div className="relative flex min-h-[calc(100dvh-6rem)] flex-1 flex-col">
        <p
          className={`${headerClassName} absolute left-0 right-0 top-[33dvh] -translate-y-1/2 px-5`}
        >
          ok, then don&apos;t eat ◡̈
        </p>
      </div>
    );
  }

  if (step === "yes") {
    return (
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
    );
  }

  return (
    <div className="relative flex min-h-[calc(100dvh-6rem)] flex-1 flex-col items-center px-5">
      {activeMeal ? (
        <div className="absolute left-0 right-0 top-[14dvh] px-5">
          <EatStatus lastMeal={activeMeal} now={now} />
        </div>
      ) : null}

      {activeMeal ? (
        <div className="absolute inset-x-0 bottom-[max(2.5rem,env(safe-area-inset-bottom))] flex flex-col items-center gap-4 px-5">
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
  );
}
