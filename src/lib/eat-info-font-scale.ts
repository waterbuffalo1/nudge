"use client";

import { useEffect, useState } from "react";

export const FONT_SCALE_STEPS = [0.85, 0.925, 1, 1.1, 1.2, 1.35] as const;
const DEFAULT_FONT_SCALE_INDEX = 2;
const EAT_INFO_FONT_SCALE_KEY = "eat-info-font-scale";

function readStoredFontScaleIndex(): number {
  if (typeof window === "undefined") {
    return DEFAULT_FONT_SCALE_INDEX;
  }

  const raw = window.localStorage.getItem(EAT_INFO_FONT_SCALE_KEY);
  if (!raw) {
    return DEFAULT_FONT_SCALE_INDEX;
  }

  const parsed = Number.parseInt(raw, 10);
  if (
    Number.isNaN(parsed) ||
    parsed < 0 ||
    parsed >= FONT_SCALE_STEPS.length
  ) {
    return DEFAULT_FONT_SCALE_INDEX;
  }

  return parsed;
}

export function useEatInfoFontScale() {
  const [fontScaleIndex, setFontScaleIndex] = useState(DEFAULT_FONT_SCALE_INDEX);

  useEffect(() => {
    setFontScaleIndex(readStoredFontScaleIndex());
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      EAT_INFO_FONT_SCALE_KEY,
      String(fontScaleIndex),
    );
  }, [fontScaleIndex]);

  const canDecrease = fontScaleIndex > 0;
  const canIncrease = fontScaleIndex < FONT_SCALE_STEPS.length - 1;

  return {
    fontScale: FONT_SCALE_STEPS[fontScaleIndex],
    canDecrease,
    canIncrease,
    decrease: () => {
      setFontScaleIndex((current) => Math.max(0, current - 1));
    },
    increase: () => {
      setFontScaleIndex((current) =>
        Math.min(FONT_SCALE_STEPS.length - 1, current + 1),
      );
    },
  };
}
