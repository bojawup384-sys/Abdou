import { NextResponse } from "next/server";

import { getAccount } from "@/lib/account";
import { verifyRequest } from "@/lib/auth";
import { DAILY_CREDITS, type CreditsResponse } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/credits — الرصيد المتبقي لليوم (يتطلب تسجيل الدخول) */
export async function GET(req: Request) {
  const auth = await verifyRequest(req);
  if (!auth) {
    return NextResponse.json<CreditsResponse>(
      { ok: false, error: "سجّل الدخول أولًا." },
      { status: 401 }
    );
  }
  try {
    const user = await getAccount(auth);
    return NextResponse.json<CreditsResponse>({
      ok: true,
      credits: user.credits,
      dailyLimit: DAILY_CREDITS,
    });
  } catch (error) {
    console.error("[credits] failed:", error);
    return NextResponse.json<CreditsResponse>(
      { ok: false, error: "تعذّر جلب الرصيد." },
      { status: 500 }
    );
  }
}
