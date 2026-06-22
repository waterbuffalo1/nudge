"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CategoryCard } from "@/components/CategoryCard";
import { getActivitiesForCategory } from "@/lib/activities";
import { categories } from "@/lib/categories";
import type { CategoryProgress } from "@/lib/category-progress";
import { getActiveMealCardStatus, type MealCardStatus } from "@/lib/eat-meal";

const EAT_CATEGORY_SLUG = "eat";

function getClientTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function getBuiltInProgress(): Record<string, CategoryProgress> {
  return Object.fromEntries(
    categories.map((category) => [
      category.slug,
      {
        total: getActivitiesForCategory(category.slug).length,
        completed: 0,
      },
    ]),
  );
}

export function CategoryGrid() {
  const [progressByCategory, setProgressByCategory] = useState<
    Record<string, CategoryProgress>
  >(getBuiltInProgress);
  const [eatStatus, setEatStatus] = useState<MealCardStatus | null>(null);

  const refreshEatStatus = useCallback(() => {
    setEatStatus(getActiveMealCardStatus(new Date()));
  }, []);

  const loadProgress = useCallback(async () => {
    const timeZone = getClientTimeZone();
    const params = new URLSearchParams({ timezone: timeZone });

    try {
      const response = await fetch(`/api/category-progress?${params.toString()}`);
      const data = (await response.json()) as {
        progress?: Record<string, CategoryProgress>;
      };
      setProgressByCategory(data.progress ?? {});
    } catch (error) {
      console.error("Failed to load category progress", error);
    }
  }, []);

  useEffect(() => {
    refreshEatStatus();
    void loadProgress();

    const intervalId = window.setInterval(refreshEatStatus, 60_000);

    const handleFocus = () => {
      refreshEatStatus();
      void loadProgress();
    };

    window.addEventListener("focus", handleFocus);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
    };
  }, [loadProgress, refreshEatStatus]);

  const displayProgress = useMemo(() => {
    const builtIn = getBuiltInProgress();

    return Object.fromEntries(
      categories.map((category) => [
        category.slug,
        progressByCategory[category.slug] ?? builtIn[category.slug],
      ]),
    );
  }, [progressByCategory]);

  return (
    <div className="grid grid-cols-2 gap-3">
      {categories.map((category) => (
        <CategoryCard
          key={category.slug}
          category={category}
          progress={displayProgress[category.slug]}
          eatStatus={
            category.slug === EAT_CATEGORY_SLUG ? eatStatus ?? undefined : undefined
          }
        />
      ))}
    </div>
  );
}
