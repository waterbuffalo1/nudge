import { ensureSchema, getDb } from "@/lib/db";
import { getNudgeDate } from "@/lib/nudge-date";

export async function getCompletedActivitySlugs({
  deviceId,
  categorySlug,
  timeZone,
}: {
  deviceId: string;
  categorySlug: string;
  timeZone: string;
}): Promise<string[]> {
  await ensureSchema();

  const nudgeDate = getNudgeDate(new Date(), timeZone);
  const result = await getDb().execute({
    sql: `
      SELECT activity_slug
      FROM completions
      WHERE device_id = ? AND category_slug = ? AND nudge_date = ?
    `,
    args: [deviceId, categorySlug, nudgeDate],
  });

  return result.rows.map((row) => String(row.activity_slug));
}

export async function getAllCompletedSlugsByCategory({
  deviceId,
  timeZone,
}: {
  deviceId: string;
  timeZone: string;
}): Promise<Map<string, Set<string>>> {
  await ensureSchema();

  const nudgeDate = getNudgeDate(new Date(), timeZone);
  const result = await getDb().execute({
    sql: `
      SELECT category_slug, activity_slug
      FROM completions
      WHERE device_id = ? AND nudge_date = ?
    `,
    args: [deviceId, nudgeDate],
  });

  const completedByCategory = new Map<string, Set<string>>();

  for (const row of result.rows) {
    const categorySlug = String(row.category_slug);
    const slugs = completedByCategory.get(categorySlug) ?? new Set<string>();
    slugs.add(String(row.activity_slug));
    completedByCategory.set(categorySlug, slugs);
  }

  return completedByCategory;
}

export async function markActivityComplete({
  deviceId,
  categorySlug,
  activitySlug,
  timeZone,
}: {
  deviceId: string;
  categorySlug: string;
  activitySlug: string;
  timeZone: string;
}): Promise<void> {
  await ensureSchema();

  const nudgeDate = getNudgeDate(new Date(), timeZone);
  await getDb().execute({
    sql: `
      INSERT INTO completions (device_id, category_slug, activity_slug, nudge_date, completed_at)
      VALUES (?, ?, ?, ?, datetime('now'))
      ON CONFLICT(device_id, category_slug, activity_slug, nudge_date) DO NOTHING
    `,
    args: [deviceId, categorySlug, activitySlug, nudgeDate],
  });
}

export async function unmarkActivityComplete({
  deviceId,
  categorySlug,
  activitySlug,
  timeZone,
}: {
  deviceId: string;
  categorySlug: string;
  activitySlug: string;
  timeZone: string;
}): Promise<void> {
  await ensureSchema();

  const nudgeDate = getNudgeDate(new Date(), timeZone);
  await getDb().execute({
    sql: `
      DELETE FROM completions
      WHERE device_id = ? AND category_slug = ? AND activity_slug = ? AND nudge_date = ?
    `,
    args: [deviceId, categorySlug, activitySlug, nudgeDate],
  });
}
