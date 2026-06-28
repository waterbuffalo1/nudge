"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Activity } from "@/lib/activities";
import type { CustomActivityInput } from "@/lib/custom-activities";
import { ActivityList } from "@/components/ActivityList";
import { AddActivitySheet } from "@/components/AddActivitySheet";

type CategoryActivitiesProps = {
  categorySlug: string;
  builtInActivities: Activity[];
};

export function CategoryActivities({
  categorySlug,
  builtInActivities,
}: CategoryActivitiesProps) {
  const [customActivities, setCustomActivities] = useState<Activity[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const params = new URLSearchParams({
      category: categorySlug,
      timezone: timeZone,
    });

    fetch(`/api/activities?${params.toString()}`)
      .then((response) => response.json())
      .then((data: { activities?: Activity[] }) => {
        if (cancelled) {
          return;
        }

        setCustomActivities(data.activities ?? []);
      })
      .catch((error) => {
        console.error("Failed to load custom activities", error);
      });

    return () => {
      cancelled = true;
    };
  }, [categorySlug]);

  const activities = useMemo(
    () => [...builtInActivities, ...customActivities],
    [builtInActivities, customActivities],
  );

  const handleAddActivity = useCallback(
    async (input: CustomActivityInput) => {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const response = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categorySlug,
          name: input.name,
          emoji: input.emoji,
          doneMessage: input.doneMessage,
          sendToMakers: input.sendToMakers,
          timezone: timeZone,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create activity");
      }

      const data = (await response.json()) as { activity: Activity };
      setCustomActivities((current) => [...current, data.activity]);
    },
    [categorySlug],
  );

  return (
    <>
      <ActivityList categorySlug={categorySlug} activities={activities} />

      <div className="add-bar pointer-events-none fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md px-5 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="pointer-events-auto flex w-full touch-manipulation items-center justify-center rounded-[2.75rem] border-2 border-border bg-elevated px-6 py-4 font-category text-xl font-medium text-foreground active:scale-[0.98] transition-transform"
        >
          + add
        </button>
      </div>

      <AddActivitySheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSubmit={handleAddActivity}
      />
    </>
  );
}
