"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Crown,
  HeartHandshake,
  Hourglass,
  Laugh,
  Link2,
  Megaphone,
  MessagesSquare,
  MousePointerClick,
  Target,
  UserPlus,
  WandSparkles,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState, type ComponentType } from "react";

import {
  GoogleIcon,
  InstagramIcon,
  SnapchatIcon,
  TikTokIcon,
  YouTubeIcon,
} from "./BrandIcons";
import {
  GOAL_META,
  PLATFORM_META,
  TONE_META,
  type GenerateInput,
  type GoalId,
  type PlatformId,
  type ToneId,
} from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  الإعدادات الثابتة                                                  */
/* ------------------------------------------------------------------ */

const PLATFORM_ICONS: Record<PlatformId, ComponentType<{ className?: string }>> = {
  tiktok: TikTokIcon,
  meta_reels: InstagramIcon,
  snapchat: SnapchatIcon,
  google: GoogleIcon,
  youtube_shorts: YouTubeIcon,
};

const TONE_ICONS: Record<ToneId, LucideIcon> = {
  energetic: Zap,
  luxury: Crown,
  playful: Laugh,
  fomo: Hourglass,
  local: MessagesSquare,
};

const GOAL_ICONS: Record<GoalId, LucideIcon> = {
  conversion: Target,
  awareness: Megaphone,
  engagement: HeartHandshake,
  leads: UserPlus,
};

const STEPS = [
  { title: "أين سيظهر إعلانك؟", subtitle: "اختر المنصة — تتغير الصياغة والسكريبت تلقائيًا" },
  { title: "كيف تريد أن يتحدّث؟", subtitle: "النبرة تصنع الشعور، والهدف يوجّه البوصلة" },
  { title: "ما الذي نروّج له؟", subtitle: "جملة واحدة صادقة تكفي لصنع السحر" },
];

const AUDIENCE_CHIPS = [
  "روّاد الأعمال",
  "أمهات جدد",
  "طلاب الجامعات",
  "عشّاق القهوة",
  "الباحثون عن الفخامة",
  "مالكو المتاجر",
];

const SAMPLE_PRODUCTS = [
  "محمصة قهوة مختصة تقدم اشتراكًا شهريًا لأجود محاصيل الإثيوبي",
  "سيروم فيتامين سي طبيعي لتفتيح البشرة وتوحيد لونها",
  "تطبيق سعودي لإدارة المهام والمشاريع بالذكاء الاصطناعي",
  "متجر عبايات فاخرة بتصاميم عصرية محدودة الإصدار",
  "دورة عملية لتعلّم الإعلانات الممولة من الصفر للمبتدئين",
];

const GEN_STATUS = [
  "نقرأ تفاصيل منتجك بعناية…",
  "نصوغ الخطافات الثلاثة ونقيس حدّتها…",
  "نبني سكريبت الفيديو مشهدًا بمشهد…",
  "نجهّز برومبتات الصور للميدجورني…",
  "اللمسات الأخيرة قبل التسليم…",
];

/* ------------------------------------------------------------------ */
/*  بطاقة خيار قابلة للاختيار                                          */
/* ------------------------------------------------------------------ */

interface OptionCardProps {
  selected: boolean;
  onClick: () => void;
  icon: ComponentType<{ className?: string }>;
  label: string;
  tagline: string;
  color: string;
  compact?: boolean;
}

function OptionCard({
  selected,
  onClick,
  icon: Icon,
  label,
  tagline,
  color,
  compact,
}: OptionCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 24 }}
      className={`option-card group relative w-full overflow-hidden rounded-2xl border p-3.5 text-start transition-all duration-300 ${
        compact ? "sm:p-3" : "sm:p-4"
      } ${
        selected
          ? "option-card--selected border-transparent bg-white shadow-xl"
          : "border-ink/8 bg-white/55 hover:bg-white/85 hover:shadow-lg"
      }`}
    >
      {/* وميض لوني خلفي */}
      <span
        className="pointer-events-none absolute -left-6 -top-6 h-16 w-16 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-25"
        style={{ backgroundColor: color }}
      />
      <span className="relative flex items-center gap-3">
        <span
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-110"
          style={{ backgroundColor: `${color}18`, color }}
        >
          <Icon className="h-5 w-5" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[13px] font-bold text-ink">
            {label}
          </span>
          <span className="mt-0.5 block text-[11px] leading-snug text-ink-soft">
            {tagline}
          </span>
        </span>
      </span>
      <AnimatePresence>
        {selected && (
          <motion.span
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 90 }}
            transition={{ type: "spring", stiffness: 500, damping: 22 }}
            className="absolute left-2.5 top-2.5 grid h-5 w-5 place-items-center rounded-full text-white"
            style={{ backgroundColor: color }}
          >
            <Check className="h-3 w-3" strokeWidth={3.5} />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="mb-2.5 flex items-center gap-2 text-xs font-bold tracking-wide text-ink-soft">
      <span className="h-px w-5 bg-coral/60" />
      {children}
    </p>
  );
}

/* ------------------------------------------------------------------ */
/*  المعالج الرئيسي                                                    */
/* ------------------------------------------------------------------ */

interface AdFormProps {
  isGenerating: boolean;
  credits: number | null;
  onSubmit: (input: GenerateInput) => void;
}

export function AdForm({ isGenerating, credits, onSubmit }: AdFormProps) {
  const [step, setStep] = useState(0);
  const [platform, setPlatform] = useState<PlatformId>("tiktok");
  const [tone, setTone] = useState<ToneId>("energetic");
  const [goal, setGoal] = useState<GoalId>("conversion");
  const [product, setProduct] = useState("");
  const [audience, setAudience] = useState("");
  const [statusIdx, setStatusIdx] = useState(0);

  /* رسائل حالة متحركة أثناء التوليد */
  useEffect(() => {
    if (!isGenerating) return;
    setStatusIdx(0);
    const t = setInterval(
      () => setStatusIdx((i) => (i + 1) % GEN_STATUS.length),
      1400
    );
    return () => clearInterval(t);
  }, [isGenerating]);

  const isLink = useMemo(
    () => /^(https?:\/\/|www\.)/i.test(product.trim()),
    [product]
  );
  const productOk = product.trim().length >= 4;
  const noCredits = credits !== null && credits <= 0;

  const handleGenerate = () => {
    if (!productOk || isGenerating || noCredits) return;
    onSubmit({
      platform,
      tone,
      goal,
      product: product.trim(),
      audience: audience.trim() || undefined,
    });
  };

  return (
    <div className="glass-strong relative overflow-hidden rounded-[28px] p-5 shadow-2xl sm:p-7">
      {/* شريط التقدم */}
      <div className="absolute inset-x-0 top-0 h-1 bg-ink/5">
        <motion.div
          className="progress-gradient h-full rounded-l-full"
          initial={false}
          animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 22 }}
        />
      </div>

      {/* رأس الخطوة */}
      <div className="mb-6 mt-2">
        <div className="mb-2 flex items-center justify-between">
          <span className="chip">الخطوة {step + 1} من {STEPS.length}</span>
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setStep(i)}
                aria-label={`الخطوة ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step ? "w-7 bg-coral" : i < step ? "w-3 bg-coral/40" : "w-3 bg-ink/12 hover:bg-ink/25"
                }`}
              />
            ))}
          </div>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <h2 className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
              {STEPS[step].title}
            </h2>
            <p className="mt-1 text-xs text-ink-soft sm:text-[13px]">
              {STEPS[step].subtitle}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* محتوى الخطوات */}
      <div className="relative">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 26, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -26, filter: "blur(6px)" }}
            transition={{ type: "spring", stiffness: 210, damping: 26 }}
          >
            {step === 0 && (
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {(Object.keys(PLATFORM_META) as PlatformId[]).map((id) => (
                  <OptionCard
                    key={id}
                    selected={platform === id}
                    onClick={() => setPlatform(id)}
                    icon={PLATFORM_ICONS[id]}
                    label={PLATFORM_META[id].label}
                    tagline={PLATFORM_META[id].tagline}
                    color={PLATFORM_META[id].color}
                  />
                ))}
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <SectionLabel>نبرة الصوت</SectionLabel>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {(Object.keys(TONE_META) as ToneId[]).map((id) => (
                      <OptionCard
                        key={id}
                        compact
                        selected={tone === id}
                        onClick={() => setTone(id)}
                        icon={TONE_ICONS[id]}
                        label={TONE_META[id].label}
                        tagline={TONE_META[id].tagline}
                        color={TONE_META[id].color}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <SectionLabel>هدف الحملة</SectionLabel>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {(Object.keys(GOAL_META) as GoalId[]).map((id) => (
                      <OptionCard
                        key={id}
                        compact
                        selected={goal === id}
                        onClick={() => setGoal(id)}
                        icon={GOAL_ICONS[id]}
                        label={GOAL_META[id].label}
                        tagline={GOAL_META[id].tagline}
                        color={GOAL_META[id].color}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <SectionLabel>وصف المنتج / الخدمة أو رابط مباشر</SectionLabel>
                  <div className="relative">
                    <textarea
                      value={product}
                      onChange={(e) => setProduct(e.target.value.slice(0, 400))}
                      dir="rtl"
                      rows={4}
                      placeholder="مثال: محمصة قهوة مختصة توصل حبوبًا محمصة طازجة باب البيت… أو الصق رابط منتجك https://"
                      className="field-input w-full resize-none rounded-2xl p-4 pb-8 text-sm leading-relaxed text-ink placeholder:text-ink/30"
                    />
                    <span className="font-display pointer-events-none absolute bottom-3 left-4 text-[11px] font-semibold text-ink/35">
                      {product.length}/400
                    </span>
                  </div>
                  <AnimatePresence>
                    {isLink && (
                      <motion.div
                        initial={{ opacity: 0, y: -6, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -6, height: 0 }}
                        className="overflow-hidden"
                      >
                        <p className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-teal-deep">
                          <Link2 className="h-3.5 w-3.5" />
                          وضع الرابط مفعّل — سنلتقط روح المنتج من عنوان الصفحة
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {/* اقتراحات سريعة */}
                  <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
                    {SAMPLE_PRODUCTS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setProduct(s)}
                        className="shrink-0 rounded-full border border-ink/10 bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-ink-soft transition-all hover:border-coral/40 hover:text-coral"
                      >
                        {s.length > 32 ? `${s.slice(0, 32)}…` : s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <SectionLabel>الجمهور المستهدف — اختياري</SectionLabel>
                  <input
                    value={audience}
                    onChange={(e) => setAudience(e.target.value.slice(0, 140))}
                    dir="rtl"
                    placeholder="مثال: موظفون 25–40 يبحثون عن قهوة مكتبية أسرع"
                    className="field-input w-full rounded-2xl px-4 py-3.5 text-sm text-ink placeholder:text-ink/30"
                  />
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {AUDIENCE_CHIPS.map((chip) => {
                      const active = audience === chip;
                      return (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => setAudience(active ? "" : chip)}
                          className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition-all ${
                            active
                              ? "bg-ink text-cream"
                              : "bg-ink/5 text-ink-soft hover:bg-ink/10"
                          }`}
                        >
                          {chip}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* التنقل */}
      <div className="mt-7 flex items-center gap-2.5">
        {step > 0 && (
          <motion.button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            whileHover={{ x: 3 }}
            whileTap={{ scale: 0.94 }}
            className="btn-ghost-glass flex items-center gap-1.5 rounded-2xl px-4 py-3 text-xs font-bold text-ink"
          >
            <ChevronRight className="h-4 w-4" />
            السابق
          </motion.button>
        )}

        {step < STEPS.length - 1 ? (
          <motion.button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.96 }}
            className="btn-primary flex flex-1 items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-extrabold text-white"
          >
            متابعة
            <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
          </motion.button>
        ) : (
          <motion.button
            type="button"
            onClick={handleGenerate}
            disabled={!productOk || isGenerating || noCredits}
            whileHover={productOk && !isGenerating ? { y: -2, scale: 1.01 } : {}}
            whileTap={productOk && !isGenerating ? { scale: 0.97 } : {}}
            className="btn-primary flex flex-[2] items-center justify-center gap-2.5 rounded-2xl py-4 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-45 disabled:saturate-50"
          >
            <WandSparkles className="h-5 w-5" />
            {isGenerating
              ? "جاري صياغة الحزمة…"
              : noCredits
                ? "نفد الرصيد"
                : "ولّد الحزمة الإعلانية"}
            {!isGenerating && !noCredits && (
              <span className="font-display rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">
                −1
              </span>
            )}
          </motion.button>
        )}
      </div>

      {!productOk && step === 2 && !isGenerating && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-3 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-ink/45"
        >
          <MousePointerClick className="h-3.5 w-3.5" />
          اكتب ٤ أحرف على الأقل عن منتجك لتفعيل التوليد
        </motion.p>
      )}

      {/* غلاف التوليد */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="gen-overlay absolute inset-0 z-10 grid place-items-center rounded-[28px]"
          >
            <div className="px-8 text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3.2, repeat: Infinity, ease: "linear" }}
                className="logo-tile mx-auto mb-5 grid h-16 w-16 place-items-center rounded-3xl text-white shadow-2xl"
              >
                <WandSparkles className="h-7 w-7" />
              </motion.div>
              <AnimatePresence mode="wait">
                <motion.p
                  key={statusIdx}
                  initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
                  className="text-sm font-bold text-ink"
                >
                  {GEN_STATUS[statusIdx]}
                </motion.p>
              </AnimatePresence>
              <div className="shimmer mx-auto mt-4 h-1.5 w-44 overflow-hidden rounded-full bg-ink/10" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
