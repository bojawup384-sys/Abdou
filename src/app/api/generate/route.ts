import { NextResponse } from "next/server";

import { db } from "@/db";
import { ads } from "@/db/schema";
import { getAccount, spendCredit } from "@/lib/account";
import { verifyRequest } from "@/lib/auth";
import { generateLocalPack } from "@/lib/engine";
import { GeminiError, generateWithGemini } from "@/lib/prompt";
import { rateLimit } from "@/lib/rateLimit";
import {
  GOALS,
  PLATFORMS,
  RATE_LIMIT,
  TONES,
  type GenerateInput,
  type GenerateResponse,
  type GoalId,
  type PlatformId,
  type ToneId,
} from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

function fail(
  error: string,
  status: number,
  headers?: HeadersInit
): NextResponse<GenerateResponse> {
  return NextResponse.json({ ok: false, error }, { status, headers });
}

/**
 * POST /api/generate  (Authorization: Bearer <Firebase ID token>)
 * ------------------------------------------------------------------
 * 1) يتحقق من هوية المستخدم (Firebase) والمدخلات
 * 2) Rate Limiting (8 عمليات/دقيقة لكل مستخدم)
 * 3) يجلب الحساب من Neon ويجدّد الرصيد اليومي
 * 4) يولّد الحزمة عبر Gemini (لا خصم إن فشل)
 * 5) يخصم نقطة ذرّيًا ثم يحفظ الإعلان في السجل
 */
export async function POST(req: Request) {
  /* ------------------------------ القراءة الآمنة ------------------------------ */
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("صيغة الطلب غير صالحة.", 400);
  }
  const raw = (body ?? {}) as Record<string, unknown>;

  /* ------------------------------ الهوية ------------------------------ */
  const auth = await verifyRequest(req);
  if (!auth) return fail("سجّل الدخول أولًا للتوليد.", 401);

  /* ------------------------------ Rate Limiting ------------------------------ */
  const rl = rateLimit(`gen:${auth.uid}`, RATE_LIMIT.limit, RATE_LIMIT.windowMs);
  if (!rl.ok) {
    const retryAfterSec = Math.ceil(rl.retryAfterMs / 1000);
    return fail(
      `مهلًا قليلًا — يمكنك المحاولة بعد ${retryAfterSec} ثانية.`,
      429,
      { "Retry-After": String(retryAfterSec) }
    );
  }

  /* ------------------------------ التحقق من المدخلات ------------------------------ */
  const platformValue = String(raw.platform ?? "");
  const toneValue = String(raw.tone ?? "");
  const goalValue = String(raw.goal ?? "");

  if (!(PLATFORMS as readonly string[]).includes(platformValue))
    return fail("اختر المنصة الإعلانية أولاً.", 400);
  if (!(TONES as readonly string[]).includes(toneValue))
    return fail("اختر نبرة الصوت.", 400);
  if (!(GOALS as readonly string[]).includes(goalValue))
    return fail("حدّد هدف الحملة.", 400);

  const product = String(raw.product ?? "").replace(/\s+/g, " ").trim();
  if (product.length < 4)
    return fail("صف منتجك أو خدمتك بجملة واحدة على الأقل.", 400);
  if (product.length > 400)
    return fail("الوصف طويل جدًا — اختصره في ٤٠٠ حرف.", 400);

  const audienceRaw = String(raw.audience ?? "").replace(/\s+/g, " ").trim();
  const audience = audienceRaw ? audienceRaw.slice(0, 140) : undefined;

  const input: GenerateInput = {
    platform: platformValue as PlatformId,
    tone: toneValue as ToneId,
    goal: goalValue as GoalId,
    product,
    audience,
  };

  try {
    /* ------------------------------ المستخدم والرصيد ------------------------------ */
    const user = await getAccount(auth);
    if (user.credits <= 0) {
      return fail(
        "انتهت تجربتك اليومية المجانية — تتجدد تلقائيًا غدًا. باقات الترقية قادمة قريبًا.",
        402
      );
    }

    /* ------------------------------ التوليد ------------------------------ */
    let pack;
    let source: "gemini" | "local" = "gemini";
    try {
      pack = await generateWithGemini(input);
    } catch (e) {
      const allowLocal = process.env.ALLOW_LOCAL_FALLBACK === "true";
      if (!allowLocal) {
        const g = e instanceof GeminiError ? e : null;
        console.error("[generate] gemini failed:", e);
        return fail(
          `${g?.userMessage ?? "تعذّر التوليد — حاول مجددًا."} (لم يُخصم أي رصيد)`,
          g?.status ?? 502
        );
      }
      pack = generateLocalPack(input);
      source = "local";
    }

    /* ---------------- خصم ذرّي — لا يذهب إلى السالب مع التزامن ---------------- */
    const remaining = await spendCredit(user.id);
    if (remaining === null) {
      return fail("انتهت تجربتك اليومية المجانية.", 402);
    }

    /* ------------------------------ الحفظ في السجل ------------------------------ */
    const [row] = await db
      .insert(ads)
      .values({
        userId: user.id,
        platform: input.platform,
        tone: input.tone,
        goal: input.goal,
        product: input.product,
        audience: input.audience ?? null,
        pack,
      })
      .returning();

    return NextResponse.json<GenerateResponse>({
      ok: true,
      credits: remaining,
      source,
      ad: {
        id: row.id,
        platform: input.platform,
        tone: input.tone,
        goal: input.goal,
        product: input.product,
        audience: row.audience,
        pack: row.pack,
        createdAt: row.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("[generate] failed:", error);
    return fail("حدث خطأ غير متوقع أثناء التوليد — لم يُخصم أي رصيد.", 500);
  }
}
