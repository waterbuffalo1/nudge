import { randomUUID } from "crypto";
import type { Activity } from "@/lib/activities";
import { ensureSchema, getDb } from "@/lib/db";
import { getNudgeDate } from "@/lib/nudge-date";

export const ACTIVITY_NAME_MAX = 20;
export const DONE_MESSAGE_MAX = 40;
export const EMOJI_MAX = 8;

export type CustomActivityInput = {
  name: string;
  emoji?: string;
  doneMessage?: string;
  sendToMakers?: boolean;
};

export type ValidatedCustomActivity = {
  name: string;
  emoji: string;
  doneMessage?: string;
};

export function validateCustomActivityInput(
  input: CustomActivityInput,
): { ok: true; data: ValidatedCustomActivity } | { ok: false; error: string } {
  const name = input.name.trim();
  if (!name) {
    return { ok: false, error: "activity title is required" };
  }
  if (name.length > ACTIVITY_NAME_MAX) {
    return {
      ok: false,
      error: `activity title must be ${ACTIVITY_NAME_MAX} characters or less`,
    };
  }

  const emoji = (input.emoji ?? "").trim();
  if (emoji.length > EMOJI_MAX) {
    return { ok: false, error: "emoji is too long" };
  }

  const doneMessage = (input.doneMessage ?? "").trim();
  if (doneMessage.length > DONE_MESSAGE_MAX) {
    return {
      ok: false,
      error: `done text must be ${DONE_MESSAGE_MAX} characters or less`,
    };
  }

  return {
    ok: true,
    data: {
      name,
      emoji,
      doneMessage: doneMessage || undefined,
    },
  };
}

function rowToActivity(row: Record<string, unknown>): Activity {
  const emoji = String(row.emoji ?? "");
  return {
    slug: String(row.slug),
    name: String(row.name),
    ...(emoji ? { emoji } : {}),
    ...(row.done_message ? { doneMessage: String(row.done_message) } : {}),
  };
}

export async function purgeExpiredCustomActivities({
  deviceId,
  timeZone,
}: {
  deviceId: string;
  timeZone: string;
}): Promise<void> {
  await ensureSchema();

  const nudgeDate = getNudgeDate(new Date(), timeZone);
  await getDb().execute({
    sql: `
      DELETE FROM custom_activities
      WHERE device_id = ? AND nudge_date < ?
    `,
    args: [deviceId, nudgeDate],
  });
}

export async function getCustomActivities({
  deviceId,
  categorySlug,
  timeZone,
}: {
  deviceId: string;
  categorySlug: string;
  timeZone: string;
}): Promise<Activity[]> {
  await ensureSchema();

  await purgeExpiredCustomActivities({ deviceId, timeZone });

  const nudgeDate = getNudgeDate(new Date(), timeZone);
  const result = await getDb().execute({
    sql: `
      SELECT slug, name, emoji, done_message
      FROM custom_activities
      WHERE device_id = ? AND category_slug = ? AND nudge_date = ?
      ORDER BY created_at ASC
    `,
    args: [deviceId, categorySlug, nudgeDate],
  });

  return result.rows.map((row) => rowToActivity(row as Record<string, unknown>));
}

export async function getAllCustomActivitiesForDevice({
  deviceId,
  timeZone,
}: {
  deviceId: string;
  timeZone: string;
}): Promise<Map<string, Activity[]>> {
  await ensureSchema();

  await purgeExpiredCustomActivities({ deviceId, timeZone });

  const nudgeDate = getNudgeDate(new Date(), timeZone);
  const result = await getDb().execute({
    sql: `
      SELECT category_slug, slug, name, emoji, done_message
      FROM custom_activities
      WHERE device_id = ? AND nudge_date = ?
      ORDER BY created_at ASC
    `,
    args: [deviceId, nudgeDate],
  });

  const customByCategory = new Map<string, Activity[]>();

  for (const row of result.rows) {
    const categorySlug = String(row.category_slug);
    const activities = customByCategory.get(categorySlug) ?? [];
    activities.push(rowToActivity(row as Record<string, unknown>));
    customByCategory.set(categorySlug, activities);
  }

  return customByCategory;
}

export async function createCustomActivity({
  deviceId,
  categorySlug,
  input,
  timeZone,
}: {
  deviceId: string;
  categorySlug: string;
  input: ValidatedCustomActivity;
  timeZone: string;
}): Promise<Activity> {
  await ensureSchema();

  const nudgeDate = getNudgeDate(new Date(), timeZone);
  const slug = `custom-${randomUUID()}`;
  await getDb().execute({
    sql: `
      INSERT INTO custom_activities (device_id, category_slug, slug, name, emoji, done_message, nudge_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      deviceId,
      categorySlug,
      slug,
      input.name,
      input.emoji,
      input.doneMessage ?? null,
      nudgeDate,
    ],
  });

  return {
    slug,
    name: input.name,
    ...(input.emoji ? { emoji: input.emoji } : {}),
    ...(input.doneMessage ? { doneMessage: input.doneMessage } : {}),
  };
}
