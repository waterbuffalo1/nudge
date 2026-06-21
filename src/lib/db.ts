import { createClient, type Client } from "@libsql/client";

let client: Client | null = null;
let schemaReady: Promise<void> | null = null;

export function getDb(): Client {
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) {
    throw new Error("TURSO_DATABASE_URL is not set");
  }

  if (!client) {
    client = createClient({
      url,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }

  return client;
}

async function migrate() {
  const db = getDb();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS completions (
      device_id TEXT NOT NULL,
      category_slug TEXT NOT NULL,
      activity_slug TEXT NOT NULL,
      nudge_date TEXT NOT NULL,
      completed_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (device_id, category_slug, activity_slug, nudge_date)
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS custom_activities (
      device_id TEXT NOT NULL,
      category_slug TEXT NOT NULL,
      slug TEXT NOT NULL,
      name TEXT NOT NULL,
      emoji TEXT NOT NULL DEFAULT '',
      done_message TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      nudge_date TEXT,
      PRIMARY KEY (device_id, category_slug, slug)
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS activity_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_slug TEXT NOT NULL,
      name TEXT NOT NULL,
      emoji TEXT NOT NULL DEFAULT '',
      done_message TEXT,
      activity_slug TEXT,
      device_id TEXT,
      status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'done')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_activity_submissions_status
    ON activity_submissions(status)
  `);

  try {
    await db.execute(`
      ALTER TABLE custom_activities ADD COLUMN nudge_date TEXT
    `);
  } catch {
    // Column already exists.
  }

  await db.execute(`
    DELETE FROM custom_activities WHERE nudge_date IS NULL
  `);
}

export async function ensureSchema() {
  if (!schemaReady) {
    schemaReady = migrate();
  }
  await schemaReady;
}
