"use client";

import { useCallback, useEffect, useState } from "react";
import type { Activity } from "@/lib/activities";
import { ActivityCard } from "@/components/ActivityCard";

type ActivityListProps = {
  categorySlug: string;
  activities: Activity[];
};

function getClientTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function ActivityList({ categorySlug, activities }: ActivityListProps) {
  const [completedSlugs, setCompletedSlugs] = useState<Set<string>>(
    () => new Set(),
  );
  const [loaded, setLoaded] = useState(false);

  const timeZone = getClientTimeZone();

  useEffect(() => {
    const params = new URLSearchParams({
      category: categorySlug,
      timezone: timeZone,
    });

    fetch(`/api/completions?${params.toString()}`)
      .then((response) => response.json())
      .then((data: { completed?: string[] }) => {
        setCompletedSlugs(new Set(data.completed ?? []));
      })
      .catch((error) => {
        console.error("Failed to load completions", error);
      })
      .finally(() => {
        setLoaded(true);
      });
  }, [categorySlug, timeZone]);

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
    <div className="flex flex-col gap-3">
      {activities.map((activity) => (
        <ActivityCard
          key={activity.slug}
          activity={activity}
          isDone={loaded && completedSlugs.has(activity.slug)}
          onComplete={() => handleComplete(activity.slug)}
          onUndo={() => handleUndo(activity.slug)}
        />
      ))}
    </div>
  );
}
