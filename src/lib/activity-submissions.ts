import { ensureSchema, getDb } from "@/lib/db";

export type ActivitySubmissionStatus = "open" | "done";

export type ActivitySubmission = {
  id: number;
  categorySlug: string;
  name: string;
  emoji: string;
  doneMessage?: string;
  activitySlug?: string;
  deviceId?: string;
  status: ActivitySubmissionStatus;
  createdAt: string;
};

export type ActivitySubmissionInput = {
  categorySlug: string;
  name: string;
  emoji?: string;
  doneMessage?: string;
  activitySlug?: string;
  deviceId?: string;
};

function rowToSubmission(row: Record<string, unknown>): ActivitySubmission {
  const doneMessage = row.done_message ? String(row.done_message) : undefined;
  const activitySlug = row.activity_slug ? String(row.activity_slug) : undefined;
  const deviceId = row.device_id ? String(row.device_id) : undefined;

  return {
    id: Number(row.id),
    categorySlug: String(row.category_slug),
    name: String(row.name),
    emoji: String(row.emoji ?? ""),
    ...(doneMessage ? { doneMessage } : {}),
    ...(activitySlug ? { activitySlug } : {}),
    ...(deviceId ? { deviceId } : {}),
    status: row.status as ActivitySubmissionStatus,
    createdAt: String(row.created_at),
  };
}

export async function submitActivitySubmission(
  input: ActivitySubmissionInput,
): Promise<ActivitySubmission> {
  await ensureSchema();

  const db = getDb();
  await db.execute({
    sql: `
      INSERT INTO activity_submissions (
        category_slug, name, emoji, done_message, activity_slug, device_id
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    args: [
      input.categorySlug,
      input.name,
      input.emoji ?? "",
      input.doneMessage ?? null,
      input.activitySlug ?? null,
      input.deviceId ?? null,
    ],
  });

  const result = await db.execute({
    sql: "SELECT * FROM activity_submissions WHERE id = last_insert_rowid()",
  });

  return rowToSubmission(result.rows[0] as Record<string, unknown>);
}

export async function listActivitySubmissions(
  status?: ActivitySubmissionStatus,
): Promise<ActivitySubmission[]> {
  await ensureSchema();

  const result = status
    ? await getDb().execute({
        sql: `
          SELECT *
          FROM activity_submissions
          WHERE status = ?
          ORDER BY created_at DESC, id DESC
        `,
        args: [status],
      })
    : await getDb().execute(`
        SELECT *
        FROM activity_submissions
        ORDER BY created_at DESC, id DESC
      `);

  return result.rows.map((row) =>
    rowToSubmission(row as Record<string, unknown>),
  );
}

export async function updateActivitySubmissionStatus(
  id: number,
  status: ActivitySubmissionStatus,
): Promise<ActivitySubmission> {
  await ensureSchema();

  const db = getDb();
  await db.execute({
    sql: "UPDATE activity_submissions SET status = ? WHERE id = ?",
    args: [status, id],
  });

  const result = await db.execute({
    sql: "SELECT * FROM activity_submissions WHERE id = ?",
    args: [id],
  });

  const row = result.rows[0];
  if (!row) {
    throw new Error("Activity submission not found");
  }

  return rowToSubmission(row as Record<string, unknown>);
}
