/**
 * محرك الصياغة (Prompt Engine)
 * ------------------------------------------------------------------
 * - buildSystemPrompt / buildUserPrompt : تعليمات "المخرج الإبداعي"
 * - parseAdPack : تحويل نص النموذج إلى AdPack مُتحقَّق منه
 * - generateWithGemini : توليد حقيقي عبر Google Gemini API (REST)
 *
 * المتغيرات: GEMINI_API_KEY (مطلوب) و GEMINI_MODEL (اختياري).
 */

import {
  GOAL_META,
  PLATFORM_META,
  TONE_META,
  type AdPack,
  type GenerateInput,
  type ImagePrompt,
  type VideoScene,
} from "./types";

/* ---------------------------- شكل JSON المطلوب ---------------------------- */

const JSON_SHAPE = `{
  "hooks": ["عنوان 1", "عنوان 2", "عنوان 3"],
  "primaryText": "النص الإعلاني الرئيسي متعدد الأسطر",
  "cta": "نص الدعوة لاتخاذ إجراء",
  "ctaPsychology": "لماذا يعمل هذا الـ CTA نفسيًا (سطر إلى سطرين)",
  "videoScript": {
    "title": "عنوان السكريبت",
    "duration": "15–20 ثانية",
    "aspect": "9:16",
    "scenes": [
      {
        "time": "0–2s",
        "title": "اسم المشهد",
        "visual": "الإرشاد البصري",
        "audio": "الموسيقى/المؤثرات/التعليق الصوتي",
        "onScreen": "النص على الشاشة"
      }
    ]
  },
  "imagePrompts": [
    { "label": "اللقطة الرئيسية", "useCase": "أين يُستخدم", "prompt": "English prompt for Midjourney / Flux / DALL-E" }
  ]
}`;

/* ------------------------------ برومبت النظام ------------------------------ */

export function buildSystemPrompt(): string {
  return [
    "أنت مخرج إبداعي (Creative Director) عربي مخضرم، صنعت حملات حققت ملايين المشاهدات على تيك توك وريلز وجوجل.",
    "مهمتك: بناء «حزمة إعلانية متكاملة» (Ad Pack) بجودة وكالة عالمية، وبنص عربي طبيعي يلمس الناس — بلا ترجمة آلية وبلا حشو.",
    "",
    "القواعد الصارمة:",
    "1. أعد JSON صالحًا فقط بلا أي نص قبله أو بعده، ومطابقًا تمامًا للشكل الموضح للمستخدم.",
    "2. hooks: ثلاثة عناوين خطّافة مختلفة الزاوية (فضول / ألم / جرأة)، كل عنوان ≤ 60 حرفًا، مصممة لاختبارات A/B.",
    "3. primaryText: نص إعلاني يتدرج من الألم إلى الحل ثم البرهان، مع أسطر قصيرة ونقاط (•) للمزايا، ويخاطب وجع الجمهور قبل مدح المنتج.",
    "4. cta: عبارة واحدة قصيرة قابلة للزر، مبنية على مبدأ نفسي صريح (ندرة، إثبات اجتماعي، معاملة بالمثل…).",
    "5. videoScript: مشهد بمشهد بثوانٍ دقيقة (4 إلى 6 مشاهد)، ولكل مشهد: ماذا نرى (visual)، ماذا نسمع (audio)، وما النص على الشاشة (onScreen) — بإيقاع سينمائي مناسب للريلز/تيك توك.",
    "6. imagePrompts: ثلاثة برومبتات بالإنجليزية فقط، جاهزة للصق في Midjourney / Flux / DALL·E، بتفاصيل إضاءة وعدسة وزاوية وأبعاد (--ar).",
    "7. التزم بالنبرة المطلوبة حرفيًا: فاخر = مقتضب ورصين، فكاهي = تورية وخفة، FOMO = ندرة وعدّاد، دارجة = لهجة خليجية/عربية بيضاء ودودة، حماسي = طاقة وإيقاع.",
    "8. لا تستخدم وسوم HTML ولا Markdown ولا رموز تعبيرية إلا إذا كانت الدارجة تستدعي حرارة خفيفة.",
    "9. اجعل كل سطر قابلًا للتنفيذ مباشرة: المسوّق ينسخ ويلصق دون تحرير.",
  ].join("\n");
}

/* ------------------------------ برومبت المستخدم ------------------------------ */

export function buildUserPrompt(input: GenerateInput): string {
  const platform = PLATFORM_META[input.platform];
  const tone = TONE_META[input.tone];
  const goal = GOAL_META[input.goal];

  return [
    "أنشئ الحزمة الإعلانية وفق البيانات التالية:",
    `- المنصة: ${platform.label} (${platform.tagline})`,
    `- نبرة الصوت: ${tone.label} — ${tone.tagline}`,
    `- هدف الحملة: ${goal.label} — ${goal.tagline}`,
    `- المنتج/الخدمة (قد يكون وصفًا أو رابطًا): ${input.product}`,
    `- الجمهور المستهدف: ${input.audience?.trim() ? input.audience : "غير محدد — حدّده ذكيًا من سياق المنتج"}`,
    "",
    "أعد JSON بهذا الشكل حرفيًا (نفس المفاتيح، وبلا أي نص إضافي):",
    JSON_SHAPE,
  ].join("\n");
}

/* ------------------------------ التحليل والتحقق ------------------------------ */

function extractJson(raw: string): unknown {
  let text = raw.trim();
  // إزالة أسوار الأكواد إن وُجدت
  text = text.replace(/```(?:json)?/gi, "").trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No JSON object found in model output");
  }
  return JSON.parse(text.slice(start, end + 1));
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter((v) => v.length > 0);
}

/**
 * يحوّل نص النموذج إلى AdPack نظيف، مع ترميم الحقول الناقصة
 * بدل رفض الاستجابة كاملة. يرمي خطأ فقط إذا استحال الاستخراج.
 */
export function parseAdPack(raw: string): AdPack {
  const data = extractJson(raw) as Record<string, unknown>;

  let hooks = asStringArray(data.hooks).slice(0, 3);
  const primaryText = asString(data.primaryText);
  if (hooks.length === 0 && !primaryText) {
    throw new Error("Model output missing hooks and primary text");
  }
  while (hooks.length < 3) hooks.push(hooks[hooks.length - 1] ?? primaryText.slice(0, 60));

  const vs = (data.videoScript ?? {}) as Record<string, unknown>;
  const rawScenes = Array.isArray(vs.scenes) ? vs.scenes : [];
  const scenes: VideoScene[] = rawScenes
    .map((s) => {
      const scene = (s ?? {}) as Record<string, unknown>;
      return {
        time: asString(scene.time, "0–3s"),
        title: asString(scene.title, "مشهد"),
        visual: asString(scene.visual),
        audio: asString(scene.audio),
        onScreen: asString(scene.onScreen),
      };
    })
    .filter((s) => s.visual || s.audio || s.onScreen);

  if (scenes.length === 0) {
    throw new Error("Model output missing video scenes");
  }

  const rawPrompts = Array.isArray(data.imagePrompts) ? data.imagePrompts : [];
  const imagePrompts: ImagePrompt[] = rawPrompts
    .map((p) => {
      const item = (p ?? {}) as Record<string, unknown>;
      return {
        label: asString(item.label, "تصميم إعلاني"),
        useCase: asString(item.useCase, "استخدام عام"),
        prompt: asString(item.prompt),
      };
    })
    .filter((p) => p.prompt.length > 0)
    .slice(0, 3);

  if (imagePrompts.length === 0) {
    throw new Error("Model output missing image prompts");
  }

  return {
    hooks,
    primaryText,
    cta: asString(data.cta, "اكتشف المزيد الآن"),
    ctaPsychology: asString(
      data.ctaPsychology,
      "دعوة واضحة منخفضة الاحتكاك تقلل كلفة اتخاذ القرار."
    ),
    videoScript: {
      title: asString(vs.title, "سكريبت الفيديو القصير"),
      duration: asString(vs.duration, "15–20 ثانية"),
      aspect: asString(vs.aspect, "9:16"),
      scenes,
    },
    imagePrompts,
  };
}

/* ------------------------------ Google Gemini ------------------------------ */

export class GeminiError extends Error {
  constructor(
    message: string,
    /** رسالة آمنة تُعرض للمستخدم */
    public userMessage: string,
    public status = 502
  ) {
    super(message);
  }
}

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
  promptFeedback?: { blockReason?: string };
  error?: { message?: string };
}

/**
 * توليد حقيقي عبر Gemini.
 *   GEMINI_API_KEY (مطلوب)
 *   GEMINI_MODEL   (اختياري) — الافتراضي gemini-2.5-flash
 * يرمي GeminiError عند أي فشل، فلا يُخصم رصيد ولا يُعرض محتوى مزيف.
 */
export async function generateWithGemini(input: GenerateInput): Promise<AdPack> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new GeminiError(
      "GEMINI_API_KEY missing",
      "خدمة الذكاء الاصطناعي غير مفعّلة بعد (مفتاح Gemini غير مضبوط).",
      503
    );
  }
  const model = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent`;

  const generationConfig: Record<string, unknown> = {
    temperature: 0.9,
    maxOutputTokens: 6000,
    responseMimeType: "application/json",
  };
  // نماذج flash تسمح بإيقاف "التفكير" لسرعة أعلى وتكلفة أقل
  if (/flash/i.test(model) && !/lite/i.test(model)) {
    generationConfig.thinkingConfig = { thinkingBudget: 0 };
  }

  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: buildSystemPrompt() }] },
    contents: [{ role: "user", parts: [{ text: buildUserPrompt(input) }] }],
    generationConfig,
  });

  let lastErr: GeminiError | null = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25_000);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body,
        signal: controller.signal,
        cache: "no-store",
      });
      const data = (await res.json().catch(() => ({}))) as GeminiResponse;

      if (!res.ok) {
        const msg = data.error?.message ?? `HTTP ${res.status}`;
        if (res.status === 429) {
          lastErr = new GeminiError(msg, "ضغط كبير على خدمة الذكاء الاصطناعي — حاول بعد قليل.", 429);
        } else if (res.status === 400 || res.status === 403) {
          lastErr = new GeminiError(msg, "مفتاح Gemini غير صالح أو النموذج غير متاح.", 503);
          break; // لا فائدة من إعادة المحاولة
        } else {
          lastErr = new GeminiError(msg, "تعذّر الوصول لخدمة الذكاء الاصطناعي — حاول مجددًا.", 502);
        }
        if (res.status === 429 || res.status >= 500) continue;
        break;
      }

      if (data.promptFeedback?.blockReason) {
        throw new GeminiError(
          `blocked: ${data.promptFeedback.blockReason}`,
          "تعذّر توليد إعلان لهذا الوصف — جرّب صياغة مختلفة.",
          422
        );
      }

      const text = (data.candidates?.[0]?.content?.parts ?? [])
        .map((p) => p.text ?? "")
        .join("");
      if (!text.trim()) {
        lastErr = new GeminiError("empty response", "لم يُرجع النموذج نتيجة — حاول مجددًا.", 502);
        continue;
      }

      try {
        return parseAdPack(text);
      } catch (e) {
        lastErr = new GeminiError(
          `parse failed: ${(e as Error).message}`,
          "جاءت النتيجة بصيغة غير مكتملة — حاول مجددًا.",
          502
        );
        continue;
      }
    } catch (e) {
      if (e instanceof GeminiError) throw e;
      const aborted = (e as Error).name === "AbortError";
      lastErr = new GeminiError(
        aborted ? "timeout" : (e as Error).message,
        aborted ? "استغرق التوليد وقتًا طويلًا — حاول مجددًا." : "تعذّر الاتصال بخدمة الذكاء الاصطناعي.",
        aborted ? 504 : 502
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastErr ?? new GeminiError("unknown", "تعذّر التوليد — حاول مجددًا.", 502);
}
