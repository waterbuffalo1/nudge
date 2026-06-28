"use client";

import { useEffect, useState } from "react";
import {
  LIVER_FLOOR_GRAMS,
  simulateMetabolicState,
} from "@/lib/eat-metabolic";
import { readLoggedMeals } from "@/lib/eat-meal";

function formatGrams(grams: number): string {
  const rounded = Math.round(grams * 10) / 10;
  return rounded % 1 === 0 ? `${rounded}` : rounded.toFixed(1);
}

function getLiverStorageLabel(): string {
  const state = simulateMetabolicState(readLoggedMeals(), new Date());
  const grams = state?.liverGrams ?? LIVER_FLOOR_GRAMS;
  return `liver storage: ${formatGrams(grams)}g`;
}

export function LiverStorageDisplay() {
  const [label, setLabel] = useState(getLiverStorageLabel);

  useEffect(() => {
    function refresh() {
      setLabel(getLiverStorageLabel());
    }

    refresh();
    const intervalId = window.setInterval(refresh, 60_000);
    window.addEventListener("focus", refresh);
    window.addEventListener("nudge-eat-updated", refresh);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("nudge-eat-updated", refresh);
    };
  }, []);

  return (
    <p className="pointer-events-none fixed inset-x-0 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-50 px-5 text-center text-xs text-muted">
      {label}
    </p>
  );
}
