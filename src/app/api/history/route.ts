import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { ads } from "@/db/schema";
import { getAccount } from "@/lib/account";
import { verifyRequest } from "@/lib/auth";
import type {
  GoalId,
  HistoryResponse,
  PlatformId,
  SavedAd,
  ToneId,
} from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/history?limit=30 — آخر إعلانات المستخدم (الأحدث أولًا) */
export async function GET(req: Request) {
  const auth = await verifyRequest(req);
  if (!auth) {
    return NextResponse.json<HistoryResponse>(
      { ok: false, error: "سجّل الدخول أولًا." },
      { status: 401 }
    );
  }
  const limit = Math.min(
    Math.max(Number(new URL(req.url).searchParams.get("limit") ?? 30) || 30, 1),
    100
  );

  try {
    const user = await getAccount(auth);
    const rows = await db
      .select()
      .from(ads)
      .where(eq(ads.userId, user.id))
      .orderBy(desc(ads.createdAt))
      .limit(limit);

    const items: SavedAd[] = rows.map((r) => ({
      id: r.id,
      platform: r.platform as PlatformId,
      tone: r.tone as ToneId,
      goal: r.goal as GoalId,
      product: r.product,
      audience: r.audience,
      pack: r.pack,
      createdAt: r.createdAt.toISOString(),
    }));
    return NextResponse.json<HistoryResponse>({ ok: true, ads: items });
  } catch (error) {
    console.error("[history] failed:", error);
    return NextResponse.json<HistoryResponse>(
      { ok: false, error: "تعذّر جلب السجل." },
      { status: 500 }
    );
  }
}
