import { and, eq, gt, ne, sql } from "drizzle-orm";

import { db } from "@/db";
import { ensureSchema } from "@/db/ensure";
import { users, type UserRow } from "@/db/schema";
import type { AuthUser } from "./auth";
import { DAILY_CREDITS } from "./types";

/** تاريخ اليوم بصيغة YYYY-MM-DD (UTC) */
export function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * يعيد مستخدم Firebase من قاعدة Neon (وينشئه عند أول دخول)،
 * ويجدّد رصيده اليومي إن بدأ يوم جديد.
 */
export async function getAccount(auth: AuthUser): Promise<UserRow> {
  await ensureSchema();
  const day = todayUTC();

  await db
    .insert(users)
    .values({
      uid: auth.uid,
      email: auth.email,
      displayName: auth.name,
      credits: DAILY_CREDITS,
      creditsDay: day,
    })
    .onConflictDoNothing({ target: users.uid });

  // تجديد يومي ذرّي
  await db
    .update(users)
    .set({ credits: DAILY_CREDITS, creditsDay: day, updatedAt: new Date() })
    .where(and(eq(users.uid, auth.uid), ne(users.creditsDay, day)));

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.uid, auth.uid))
    .limit(1);
  if (!user) throw new Error("account not found after upsert");
  return user;
}

/** خصم نقطة واحدة بشكل ذرّي — يعيد الرصيد الجديد أو null إن نفد */
export async function spendCredit(userId: string): Promise<number | null> {
  const [row] = await db
    .update(users)
    .set({ credits: sql`${users.credits} - 1`, updatedAt: new Date() })
    .where(and(eq(users.id, userId), gt(users.credits, 0)))
    .returning({ credits: users.credits });
  return row ? row.credits : null;
}
