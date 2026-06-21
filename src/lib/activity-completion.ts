import {
  DAYTIME_EXERCISE_CATEGORY,
  DAYTIME_EXERCISE_SLUG,
  EXERCISE_CATEGORY,
  isDaytimeExerciseDone,
} from "@/lib/daytime-exercise";

export function isActivityCompleted(
  activitySlug: string,
  categorySlug: string,
  completedByCategory: Map<string, Set<string>>,
): boolean {
  if (activitySlug === DAYTIME_EXERCISE_SLUG) {
    return isDaytimeExerciseDone({
      betterSleepCompleted:
        completedByCategory.get(DAYTIME_EXERCISE_CATEGORY) ?? new Set(),
      exerciseCompleted: completedByCategory.get(EXERCISE_CATEGORY) ?? new Set(),
    });
  }

  return (completedByCategory.get(categorySlug) ?? new Set()).has(activitySlug);
}
