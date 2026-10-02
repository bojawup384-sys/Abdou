import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import type { AdPack } from "../lib/types";
import { DAILY_CREDITS } from "../lib/types";

/**
 * جدول المستخدمين
 * ------------------------------------------------------------------
 * كل مستخدم مرتبط بحساب Firebase عبر `uid`.
 * الرصيد يتجدد يوميًا: `credits` = المتبقي اليوم، و `creditsDay` = يوم آخر تجديد (UTC).
 */
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  /** معرّف Firebase الفريد */
  uid: text("uid").unique(),
  email: text("email"),
  displayName: text("display_name"),
  /** قديم: معرّف الجهاز (قبل تسجيل الدخول) */
  deviceId: text("device_id").unique(),
  /** الرصيد المتبقي لليوم الحالي */
  credits: integer("credits").notNull().default(DAILY_CREDITS),
  /** تاريخ آخر تجديد للرصيد بصيغة YYYY-MM-DD (UTC) */
  creditsDay: text("credits_day").notNull().default("1970-01-01"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});

export const ads = pgTable(
  "ads",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    platform: text("platform").notNull(),
    tone: text("tone").notNull(),
    goal: text("goal").notNull(),
    product: text("product").notNull(),
    audience: text("audience"),
    pack: jsonb("pack").$type<AdPack>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("ads_user_id_idx").on(table.userId),
    index("ads_created_at_idx").on(table.createdAt),
  ]
);

export type UserRow = typeof users.$inferSelect;
export type AdRow = typeof ads.$inferSelect;
export type NewAdRow = typeof ads.$inferInsert;
