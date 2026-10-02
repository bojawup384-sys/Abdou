import { sql } from "drizzle-orm";
import { db } from "./index";

/**
 * يُنشئ الجداول والأعمدة الناقصة تلقائيًا (آمن للتكرار).
 * بهذا لا تحتاج تشغيل `drizzle-kit push` يدويًا على Neon.
 */
let ready: Promise<void> | null = null;

export function ensureSchema(): Promise<void> {
  if (!ready) {
    ready = run().catch((e) => {
      ready = null; // أعد المحاولة في الطلب القادم
      throw e;
    });
  }
  return ready;
}

async function run() {
  await db.execute(sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      uid text UNIQUE,
      email text,
      display_name text,
      device_id text UNIQUE,
      credits integer NOT NULL DEFAULT 5,
      credits_day text NOT NULL DEFAULT '1970-01-01',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`);
  // ترقية الجداول القديمة (قبل Firebase)
  await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS uid text`);
  await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS email text`);
  await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name text`);
  await db.execute(
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS credits_day text NOT NULL DEFAULT '1970-01-01'`
  );
  await db.execute(sql`ALTER TABLE users ALTER COLUMN device_id DROP NOT NULL`);
  await db.execute(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS users_uid_unique ON users (uid)`
  );
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS ads (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      platform text NOT NULL,
      tone text NOT NULL,
      goal text NOT NULL,
      product text NOT NULL,
      audience text,
      pack jsonb NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS ads_user_id_idx ON ads (user_id)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS ads_created_at_idx ON ads (created_at)`);
}
