import { getActivitiesForCategory, type Activity } from "@/lib/activities";
import { isActivityCompleted } from "@/lib/activity-completion";
import { categories } from "@/lib/categories";
import { getAllCompletedSlugsByCategory } from "@/lib/completions";
import { getAllCustomActivitiesForDevice } from "@/lib/custom-activities";

export type CategoryProgress = {
  total: number;
  completed: number;
};

export function computeCategoryProgress(
  categorySlug: string,
  builtInActivities: Activity[],
  customActivities: Activity[],
  completedByCategory: Map<string, Set<string>>,
): CategoryProgress {
  const activities = [...builtInActivities, ...customActivities];
  const completed = activities.filter((activity) =>
    isActivityCompleted(activity.slug, categorySlug, completedByCategory),
  ).length;

  return { total: activities.length, completed };
}

export async function getCategoryProgressForDevice({
  deviceId,
  timeZone,
}: {
  deviceId: string;
  timeZone: string;
}): Promise<Record<string, CategoryProgress>> {
  const [completedByCategory, customByCategory] = await Promise.all([
    getAllCompletedSlugsByCategory({ deviceId, timeZone }),
    getAllCustomActivitiesForDevice({ deviceId, timeZone }),
  ]);

  const progress: Record<string, CategoryProgress> = {};

  for (const category of categories) {
    progress[category.slug] = computeCategoryProgress(
      category.slug,
      getActivitiesForCategory(category.slug),
      customByCategory.get(category.slug) ?? [],
      completedByCategory,
    );
  }

  return progress;
}
