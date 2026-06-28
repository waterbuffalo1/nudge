"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Activity } from "@/lib/activities";
import { ActivityCard } from "@/components/ActivityCard";
import { DelayedLoadingOverlay } from "@/components/PageLoading";
import { isActivityCompleted } from "@/lib/activity-completion";
import { getClientTimeZone } from "@/lib/client-timezone";
import {
  DAYTIME_EXERCISE_CATEGORY,
  EXERCISE_CATEGORY,
} from "@/lib/daytime-exercise";

type ActivityListProps = {
  categorySlug: string;
  activities: Activity[];
};

export function ActivityList({ categorySlug, activities }: ActivityListProps) {
  const [completedSlugs, setCompletedSlugs] = useState<Set<string>>(
    () => new Set(),
  );
  const [exerciseCompletedSlugs, setExerciseCompletedSlugs] = useState<
    Set<string>
  >(() => new Set());
  const [loaded, setLoaded] = useState(false);

  const timeZone = getClientTimeZone();
  const needsExerciseCompletions = categorySlug === DAYTIME_EXERCISE_CATEGORY;

  const completedByCategory = useMemo(() => {
    const map = new Map<string, Set<string>>();
    map.set(categorySlug, completedSlugs);
    if (needsExerciseCompletions) {
      map.set(EXERCISE_CATEGORY, exerciseCompletedSlugs);
    }
    return map;
  }, [categorySlug, completedSlugs, exerciseCompletedSlugs, needsExerciseCompletions]);

  useEffect(() => {
    let cancelled = false;

    const loadCompletions = async () => {
      const params = new URLSearchParams({
        category: categorySlug,
        timezone: timeZone,
      });

      try {
        const requests = [
          fetch(`/api/completions?${params.toString()}`).then((response) =>
            response.json(),
          ),
        ];

        if (needsExerciseCompletions) {
          const exerciseParams = new URLSearchParams({
            category: EXERCISE_CATEGORY,
            timezone: timeZone,
          });
          requests.push(
            fetch(`/api/completions?${exerciseParams.toString()}`).then(
              (response) => response.json(),
            ),
          );
        }

        const [categoryData, exerciseData] = await Promise.all(requests);

        if (cancelled) return;

        setCompletedSlugs(new Set(categoryData.completed ?? []));
        setExerciseCompletedSlugs(
          needsExerciseCompletions
            ? new Set(exerciseData?.completed ?? [])
            : new Set(categoryData.completed ?? []),
        );
      } catch (error) {
        console.error("Failed to load completions", error);
      } finally {
        if (!cancelled) {
          setLoaded(true);
        }
      }
    };

    setLoaded(false);
    void loadCompletions();

    return () => {
      cancelled = true;
    };
  }, [categorySlug, needsExerciseCompletions, timeZone]);

  const handleComplete = useCallback(
    async (activitySlug: string) => {
      setCompletedSlugs((current) => new Set(current).add(activitySlug));

      try {
        await fetch("/api/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            categorySlug,
            activitySlug,
            timezone: timeZone,
          }),
        });
      } catch (error) {
        console.error("Failed to save completion", error);
      }
    },
    [categorySlug, timeZone],
  );

  const handleUndo = useCallback(
    async (activitySlug: string) => {
      setCompletedSlugs((current) => {
        const next = new Set(current);
        next.delete(activitySlug);
        return next;
      });

      try {
        await fetch("/api/completions", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            categorySlug,
            activitySlug,
            timezone: timeZone,
          }),
        });
      } catch (error) {
        console.error("Failed to remove completion", error);
      }
    },
    [categorySlug, timeZone],
  );

  return (
    <div className="relative">
      <div className="flex flex-col gap-3">
        {activities.map((activity) => (
          <ActivityCard
            key={activity.slug}
            activity={activity}
            isDone={
              loaded &&
              isActivityCompleted(
                activity.slug,
                categorySlug,
                completedByCategory,
              )
            }
            onComplete={() => handleComplete(activity.slug)}
            onUndo={() => handleUndo(activity.slug)}
          />
        ))}
      </div>
      <DelayedLoadingOverlay isLoading={!loaded} />
    </div>
  );
}
