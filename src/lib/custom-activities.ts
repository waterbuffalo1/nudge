import { randomUUID } from "crypto";
import type { Activity } from "@/lib/activities";
import { ensureSchema, getDb } from "@/lib/db";

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

export async function getCustomActivities({
  deviceId,
  categorySlug,
}: {
  deviceId: string;
  categorySlug: string;
}): Promise<Activity[]> {
  await ensureSchema();

  const result = await getDb().execute({
    sql: `
      SELECT slug, name, emoji, done_message
      FROM custom_activities
      WHERE device_id = ? AND category_slug = ?
      ORDER BY created_at ASC
    `,
    args: [deviceId, categorySlug],
  });

  return result.rows.map((row) => rowToActivity(row as Record<string, unknown>));
}

export async function createCustomActivity({
  deviceId,
  categorySlug,
  input,
}: {
  deviceId: string;
  categorySlug: string;
  input: ValidatedCustomActivity;
}): Promise<Activity> {
  await ensureSchema();

  const slug = `custom-${randomUUID()}`;
  await getDb().execute({
    sql: `
      INSERT INTO custom_activities (device_id, category_slug, slug, name, emoji, done_message)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    args: [
      deviceId,
      categorySlug,
      slug,
      input.name,
      input.emoji,
      input.doneMessage ?? null,
    ],
  });

  return {
    slug,
    name: input.name,
    ...(input.emoji ? { emoji: input.emoji } : {}),
    ...(input.doneMessage ? { doneMessage: input.doneMessage } : {}),
  };
}
