/**
 * AdCraft AI — Domain Types
 * ------------------------------------------------------------------
 * كل التعريفات المشتركة بين الواجهة، طبقة الـ API، وقاعدة البيانات
 * موجودة هنا حتى تبقى الأشكال (Shapes) متزامنة من الطرف إلى الطرف.
 */

/* ---------------------------------- الثوابت ---------------------------------- */

export const PLATFORMS = [
  "tiktok",
  "meta_reels",
  "snapchat",
  "google",
  "youtube_shorts",
] as const;
export type PlatformId = (typeof PLATFORMS)[number];

export const TONES = ["energetic", "luxury", "playful", "fomo", "local"] as const;
export type ToneId = (typeof TONES)[number];

export const GOALS = ["conversion", "awareness", "engagement", "leads"] as const;
export type GoalId = (typeof GOALS)[number];

/** عدد التوليدات المجانية يوميًا لكل حساب (يتجدد كل يوم 00:00 UTC) */
export const DAILY_CREDITS = 5;

/** حدود حماية الـ API */
export const RATE_LIMIT = {
  /** الحد الأقصى لعمليات التوليد */
  limit: 8,
  /** خلال نافذة زمنية بالمللي ثانية */
  windowMs: 60_000,
} as const;

/* ------------------------------- البيانات الوصفية ------------------------------- */

export interface OptionMeta {
  id: string;
  /** الاسم الظاهر في الواجهة */
  label: string;
  /** اسم مختصر يُستخدم في الشارات الصغيرة */
  short: string;
  /** سطر وصفي صغير تحت الاسم */
  tagline: string;
  /** لون الهوية البصرية للخيار (HEX) */
  color: string;
}

export const PLATFORM_META: Record<PlatformId, OptionMeta> = {
  tiktok: {
    id: "tiktok",
    label: "تيك توك",
    short: "TikTok",
    tagline: "فيديوهات قصيرة سريعة الانتشار",
    color: "#FE2C55",
  },
  meta_reels: {
    id: "meta_reels",
    label: "ريلز إنستغرام / فيسبوك",
    short: "Reels",
    tagline: "وصول واسع وجمهور متنوع",
    color: "#E1306C",
  },
  snapchat: {
    id: "snapchat",
    label: "سناب شات",
    short: "Snap",
    tagline: "قصص لحظية بقرب حميم من الجمهور",
    color: "#C9A400",
  },
  google: {
    id: "google",
    label: "جوجل — بحث وشبكة إعلانية",
    short: "Google",
    tagline: "إعلانات نية الشراء العالية",
    color: "#4285F4",
  },
  youtube_shorts: {
    id: "youtube_shorts",
    label: "يوتيوب شورتس",
    short: "Shorts",
    tagline: "فيديو قصير بعمر مشاهدة أطول",
    color: "#FF0033",
  },
};

export const TONE_META: Record<ToneId, OptionMeta> = {
  energetic: {
    id: "energetic",
    label: "حماسي ومحفّز للبيع",
    short: "حماسي",
    tagline: "طاقة عالية وإيقاع سريع يدفع للشراء",
    color: "#FF4D2E",
  },
  luxury: {
    id: "luxury",
    label: "احترافي فاخر",
    short: "فاخر",
    tagline: "لغة راقية مقتضبة تليق بالعلامات الكبرى",
    color: "#8A6D3B",
  },
  playful: {
    id: "playful",
    label: "فكاهي ومرح",
    short: "فكاهي",
    tagline: "خفة ظل تكسر الثلج وتصنع الترند",
    color: "#0E9F8A",
  },
  fomo: {
    id: "fomo",
    label: "FOMO — خوف من ضياع الفرصة",
    short: "FOMO",
    tagline: "ندرة وعدّاد تنازلي يحرّكان القرار الآن",
    color: "#C0392B",
  },
  local: {
    id: "local",
    label: "دارجة محلية ودّية",
    short: "دارجة",
    tagline: "كلام الناس كما يُحكى في المجالس",
    color: "#B4690E",
  },
};

export const GOAL_META: Record<GoalId, OptionMeta> = {
  conversion: {
    id: "conversion",
    label: "مبيعات مباشرة",
    short: "مبيعات",
    tagline: "تحويل المشاهد إلى مشترٍ فورًا",
    color: "#0E7C7B",
  },
  awareness: {
    id: "awareness",
    label: "وعي بالعلامة",
    short: "وعي",
    tagline: "قصة تُحفر في ذاكرة الجمهور",
    color: "#7C5CBF",
  },
  engagement: {
    id: "engagement",
    label: "تفاعل ومجتمع",
    short: "تفاعل",
    tagline: "تعليقات ومشاركات تشعل الخوارزمية",
    color: "#E1306C",
  },
  leads: {
    id: "leads",
    label: "جمع عملاء محتملين",
    short: "عملاء",
    tagline: "بيانات مهتمين جاهزة لفريق المبيعات",
    color: "#1E6FD9",
  },
};

/* --------------------------------- المدخلات --------------------------------- */

export interface GenerateInput {
  platform: PlatformId;
  tone: ToneId;
  goal: GoalId;
  /** وصف المنتج/الخدمة أو رابط مباشر */
  product: string;
  /** الجمهور المستهدف (اختياري) */
  audience?: string;
}

/* --------------------------------- مخرجات الحزمة --------------------------------- */

export interface VideoScene {
  /** الشريط الزمني مثل "0–2s" */
  time: string;
  /** اسم المشهد */
  title: string;
  /** الإرشاد البصري — ما يراه المشاهد */
  visual: string;
  /** الإرشاد الصوتي — موسيقى/مؤثرات/تعليق */
  audio: string;
  /** النص الظاهر على الشاشة */
  onScreen: string;
}

export interface VideoScript {
  title: string;
  duration: string;
  /** أبعاد اللقطة الموصى بها */
  aspect: string;
  scenes: VideoScene[];
}

export interface ImagePrompt {
  /** عنوان عربي للاستخدام */
  label: string;
  /** أين يُستخدم هذا التصميم */
  useCase: string;
  /** البرومبت الجاهز بالإنجليزية لـ Midjourney / Flux / DALL·E */
  prompt: string;
}

/** الحزمة الإعلانية المتكاملة الناتجة عن التوليد */
export interface AdPack {
  /** 3 عناوين خطّافة لاختبارات A/B */
  hooks: string[];
  /** النص الإعلاني الرئيسي */
  primaryText: string;
  /** الدعوة لاتخاذ إجراء */
  cta: string;
  /** شرح التأثير النفسي خلف الـ CTA */
  ctaPsychology: string;
  /** سكريبت الفيديو القصير مشهدًا بمشهد */
  videoScript: VideoScript;
  /** أوامر توليد الصور */
  imagePrompts: ImagePrompt[];
}

/* --------------------------------- سجل محفوظ --------------------------------- */

export interface SavedAd {
  id: string;
  platform: PlatformId;
  tone: ToneId;
  goal: GoalId;
  product: string;
  audience: string | null;
  pack: AdPack;
  createdAt: string; // ISO string
}

/* --------------------------------- استجابات الـ API --------------------------------- */

export interface GenerateResponse {
  ok: boolean;
  credits?: number;
  ad?: SavedAd;
  source?: "gemini" | "local";
  error?: string;
}

export interface CreditsResponse {
  ok: boolean;
  credits?: number;
  dailyLimit?: number;
  error?: string;
}

export interface HistoryResponse {
  ok: boolean;
  ads?: SavedAd[];
  error?: string;
}
