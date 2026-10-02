"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  BadgeCheck,
  Bookmark,
  Camera,
  Check,
  ChevronDown,
  Clapperboard,
  Copy,
  CopyCheck,
  Film,
  Heart,
  Image as ImageIcon,
  Lightbulb,
  MessageCircle,
  Mic2,
  MoreHorizontal,
  MousePointerClick,
  Music2,
  RefreshCw,
  ScrollText,
  Search,
  Send,
  Share2,
  Sparkles,
  Type,
  Volume2,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import {
  GOAL_META,
  PLATFORM_META,
  TONE_META,
  type SavedAd,
} from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  أدوات النسخ                                                        */
/* ------------------------------------------------------------------ */

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // مسار احتياطي للمتصفحات التي تحجب Clipboard API
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      return true;
    } catch {
      return false;
    } finally {
      document.body.removeChild(ta);
    }
  }
}

/** نص الحزمة كاملة بصيغة قابلة للصق في أي مكان */
export function fullPackText(ad: SavedAd): string {
  const meta = {
    platform: PLATFORM_META[ad.platform]?.label ?? ad.platform,
    tone: TONE_META[ad.tone]?.short ?? ad.tone,
    goal: GOAL_META[ad.goal]?.short ?? ad.goal,
  };
  const { pack } = ad;
  const scenes = pack.videoScript.scenes
    .map(
      (s, i) =>
        `[${s.time}] ${s.title}\n   بصريًا: ${s.visual}\n   صوتيًا: ${s.audio}\n   على الشاشة: ${s.onScreen}`
    )
    .join("\n");
  const prompts = pack.imagePrompts
    .map((p) => `— ${p.label} (${p.useCase}):\n${p.prompt}`)
    .join("\n\n");

  return [
    `حزمة AdCraft AI — ${meta.platform} | نبرة: ${meta.tone} | هدف: ${meta.goal}`,
    `المنتج: ${ad.product}${ad.audience ? `\nالجمهور: ${ad.audience}` : ""}`,
    "",
    "◆ الخطافات (A/B):",
    ...pack.hooks.map((h, i) => `${i + 1}) ${h}`),
    "",
    "◆ النص الإعلاني:",
    pack.primaryText,
    "",
    `◆ الدعوة للإجراء: ${pack.cta}`,
    `لماذا يعمل؟ ${pack.ctaPsychology}`,
    "",
    `◆ سكريبت الفيديو — ${pack.videoScript.duration} (${pack.videoScript.aspect}):`,
    scenes,
    "",
    "◆ برومبتات الصور (Midjourney / Flux / DALL·E):",
    prompts,
  ].join("\n");
}

/* ------------------------------------------------------------------ */
/*  عناصر صغيرة                                                        */
/* ------------------------------------------------------------------ */

function CopyBtn({
  text,
  label,
  className = "",
  onToast,
}: {
  text: string;
  label?: string;
  className?: string;
  onToast: (msg: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <motion.button
      type="button"
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.9 }}
      onClick={async () => {
        const ok = await copyText(text);
        if (ok) {
          setCopied(true);
          onToast(label ? `نُسخ: ${label}` : "تم النسخ إلى الحافظة");
          setTimeout(() => setCopied(false), 1600);
        } else {
          onToast("تعذّر النسخ — انسخ يدويًا");
        }
      }}
      className={`copy-btn ${copied ? "copy-btn--done" : ""} ${className}`}
      aria-label="نسخ"
    >
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.span
            key="check"
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0 }}
          >
            <Check className="h-3.5 w-3.5" strokeWidth={3} />
          </motion.span>
        ) : (
          <motion.span key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
            <Copy className="h-3.5 w-3.5" />
          </motion.span>
        )}
      </AnimatePresence>
      {label && <span className="text-[11px] font-bold">{copied ? "تم!" : label}</span>}
    </motion.button>
  );
}

function PackSection({
  icon: Icon,
  title,
  accent,
  copyTextValue,
  copyLabel,
  onToast,
  children,
  delay = 0,
}: {
  icon: LucideIcon;
  title: string;
  accent: string;
  copyTextValue?: string;
  copyLabel?: string;
  onToast: (msg: string) => void;
  children: ReactNode;
  delay?: number;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 160, damping: 22 }}
      className="glass rounded-3xl p-4 sm:p-5"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-extrabold text-ink">
          <span
            className="grid h-7 w-7 place-items-center rounded-lg text-white"
            style={{ backgroundColor: accent }}
          >
            <Icon className="h-4 w-4" />
          </span>
          {title}
        </h3>
        {copyTextValue && (
          <CopyBtn text={copyTextValue} label={copyLabel ?? "نسخ"} onToast={onToast} />
        )}
      </div>
      {children}
    </motion.section>
  );
}

/* ------------------------------------------------------------------ */
/*  موك آب الهاتف (فيديو قصير)                                         */
/* ------------------------------------------------------------------ */

function PhoneMock({ ad, variant }: { ad: SavedAd; variant: "video" | "reels" }) {
  const { pack } = ad;
  const meta = PLATFORM_META[ad.platform];
  const topLabel =
    variant === "reels"
      ? "ريلز"
      : ad.platform === "snapchat"
        ? "القصص"
        : ad.platform === "youtube_shorts"
          ? "شورتس"
          : "متابعة  |  لك";

  return (
    <div className="phone-mock relative mx-auto aspect-[9/19] w-[250px] overflow-hidden rounded-[2.4rem] border-[7px] border-ink/90 shadow-[0_40px_80px_-30px_rgba(25,21,18,0.55)] sm:w-[270px]">
      {/* خلفية المشهد */}
      <div
        className="scene-gradient absolute inset-0"
        style={{ ["--brand" as string]: meta.color }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_60%)]" />

      {/* الشريط العلوي */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-3 text-white/95">
        {variant === "reels" ? (
          <>
            <span className="text-[13px] font-extrabold tracking-wide">{topLabel}</span>
            <Camera className="h-4 w-4" />
          </>
        ) : (
          <>
            <Music2 className="h-4 w-4" />
            <span className="text-[12px] font-bold">{topLabel}</span>
            <Search className="h-4 w-4" />
          </>
        )}
      </div>

      {/* الخطاف في المنتصف */}
      <div className="absolute inset-x-4 top-[26%] text-center">
        <motion.p
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 160, damping: 16 }}
          className="text-balance text-[15px] font-black leading-snug text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]"
        >
          {pack.hooks[0]}
        </motion.p>
      </div>

      {/* نص الشاشة من السكريبت */}
      <div className="absolute inset-x-6 bottom-[31%] text-center">
        <span className="inline-block rounded-lg bg-black/45 px-2.5 py-1 text-[10px] font-bold leading-relaxed text-white backdrop-blur-sm">
          {pack.videoScript.scenes[0]?.onScreen}
        </span>
      </div>

      {/* عمود التفاعلات */}
      <div className="absolute bottom-24 left-2.5 flex flex-col items-center gap-3.5 text-white">
        {[
          { icon: Heart, value: "12.4K" },
          { icon: MessageCircle, value: "1.2K" },
          variant === "reels"
            ? { icon: Send, value: "3.1K" }
            : { icon: Bookmark, value: "2.7K" },
          { icon: Share2, value: "4.8K" },
        ].map(({ icon: Icon, value }, i) => (
          <div key={i} className="flex flex-col items-center gap-0.5">
            <Icon className="h-5 w-5 drop-shadow" strokeWidth={2} />
            <span className="font-display text-[9px] font-bold">{value}</span>
          </div>
        ))}
      </div>

      {/* التسمية والدعوة للإجراء */}
      <div className="absolute inset-x-0 bottom-0 p-3">
        <div className="mb-2 flex items-center gap-1.5 text-white">
          <div className="brand-dot" style={{ backgroundColor: meta.color }} />
          <span className="font-display text-[11px] font-bold">@yourbrand</span>
          <BadgeCheck className="h-3.5 w-3.5 text-sky-300" />
        </div>
        <p className="mb-2.5 line-clamp-2 text-[10px] leading-relaxed text-white/90">
          {pack.primaryText.split("\n").filter(Boolean)[0]}
        </p>
        <div className="flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-1.5 text-[9px] text-white/80">
            <Music2 className="h-3 w-3 shrink-0" />
            <span className="truncate">صوت رائج — {ad.product.slice(0, 18)}</span>
          </span>
          <span
            className="shrink-0 rounded-full px-3 py-1.5 text-[9px] font-extrabold text-white shadow-lg"
            style={{ backgroundColor: meta.color }}
          >
            {pack.cta.length > 22 ? `${pack.cta.slice(0, 22)}…` : pack.cta}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  موك آب بحث جوجل                                                    */
/* ------------------------------------------------------------------ */

function GoogleMock({ ad }: { ad: SavedAd }) {
  const { pack } = ad;
  return (
    <div className="mx-auto w-full max-w-md">
      {/* شريط البحث */}
      <div className="mb-4 flex items-center gap-3 rounded-full border border-ink/10 bg-white px-4 py-3 shadow-sm">
        <Search className="h-4 w-4 text-ink/40" />
        <span className="flex-1 truncate text-[13px] text-ink/70" dir="rtl">
          {ad.product.slice(0, 40)}
        </span>
        <Mic2 className="h-4 w-4 text-blue-500" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-3xl border border-ink/8 bg-white p-5 shadow-[0_20px_50px_-24px_rgba(25,21,18,0.3)]"
        dir="rtl"
      >
        <div className="mb-2 flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-ink text-[9px] font-black text-cream">
            ع
          </span>
          <div className="leading-tight">
            <p className="text-[12px] font-semibold text-ink">علامتك التجارية</p>
            <p className="font-display text-[10px] text-emerald-700" dir="ltr">
              https://yourbrand.sa/offer
            </p>
          </div>
          <span className="font-display ms-auto rounded-sm border border-ink/20 px-1 text-[10px] font-bold text-ink/60">
            Ad
          </span>
        </div>
        <p className="line-clamp-2 text-[16px] font-medium leading-snug text-blue-800 hover:underline">
          {pack.hooks.join(" | ")}
        </p>
        <p className="mt-1.5 line-clamp-3 text-[12.5px] leading-relaxed text-ink/70">
          {pack.primaryText.replace(/\n+/g, " ").slice(0, 170)}…{" "}
          <span className="font-bold text-ink">{pack.cta}</span>
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {["شحن مجاني اليوم", "آراء ٣٤٠٠ عميل", "العروض الحالية", "تواصل واتساب"].map(
            (s) => (
              <span
                key={s}
                className="rounded-full bg-sky-50 px-2.5 py-1 text-[10px] font-bold text-blue-700"
              >
                {s}
              </span>
            )
          )}
        </div>
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  المكوّن الرئيسي                                                    */
/* ------------------------------------------------------------------ */

interface OutputCardProps {
  ad: SavedAd | null;
  isGenerating: boolean;
  canRegenerate: boolean;
  onRegenerate: () => void;
  onToast: (msg: string) => void;
}

type Stage = "video" | "reels" | "search";

export function OutputCard({
  ad,
  isGenerating,
  canRegenerate,
  onRegenerate,
  onToast,
}: OutputCardProps) {
  const [stage, setStage] = useState<Stage>("video");

  /* ---------------------------- حالة: التوليد ---------------------------- */
  if (isGenerating) {
    return (
      <div className="glass rounded-[28px] p-5 sm:p-7">
        <div className="mb-5 flex items-center justify-between">
          <div className="shimmer h-6 w-48 rounded-xl bg-ink/8" />
          <div className="shimmer h-8 w-24 rounded-2xl bg-ink/8" />
        </div>
        <div className="shimmer mx-auto aspect-[9/16] w-[250px] rounded-[2.4rem] bg-ink/8" />
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="shimmer h-24 rounded-3xl bg-ink/8" />
          ))}
        </div>
        <div className="shimmer mt-3 h-36 rounded-3xl bg-ink/8" />
      </div>
    );
  }

  /* ---------------------------- حالة: فارغة ---------------------------- */
  if (!ad) {
    return (
      <div className="glass-strong relative flex min-h-[560px] flex-col items-center justify-center overflow-hidden rounded-[28px] p-8 text-center">
        {/* لوحات عائمة */}
        <div className="relative mb-8 h-52 w-64">
          {[
            { rotate: -12, x: -34, y: 10, d: 0, icon: Film, color: "#FE2C55" },
            { rotate: 0, x: 0, y: -6, d: 0.6, icon: Zap, color: "#FF4D2E" },
            { rotate: 12, x: 34, y: 14, d: 1.2, icon: ScrollText, color: "#0E7C7B" },
          ].map(({ rotate, x, y, d, icon: Icon, color }, i) => (
            <motion.div
              key={i}
              animate={{ y: [y, y - 12, y] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: d }}
              className="glass absolute inset-x-8 top-4 grid h-44 place-items-center rounded-[2rem] shadow-xl"
              style={{ rotate, x }}
            >
              <span
                className="grid h-14 w-14 place-items-center rounded-2xl text-white shadow-lg"
                style={{ backgroundColor: color }}
              >
                <Icon className="h-7 w-7" />
              </span>
            </motion.div>
          ))}
        </div>
        <h2 className="text-balance text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
          حزمتك الإعلانية الجاهزة ستظهر هنا
        </h2>
        <p className="mt-2 max-w-sm text-balance text-[13px] leading-relaxed text-ink-soft">
          خمس ثوانٍ من الإدخال تتحول إلى خطافات، سكريبت فيديو سينمائي،
          وبرومبتات صور جاهزة للنشر.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {["٣ خطافات A/B", "سكريبت مشهد بمشهد", "برومبتات Midjourney", "CTA نفسي مدروس"].map(
            (f) => (
              <span
                key={f}
                className="flex items-center gap-1.5 rounded-full border border-ink/10 bg-white/70 px-3 py-1.5 text-[11px] font-bold text-ink-soft"
              >
                <Sparkles className="h-3 w-3 text-coral" />
                {f}
              </span>
            )
          )}
        </div>
      </div>
    );
  }

  /* ---------------------------- حالة: النتيجة ---------------------------- */
  const meta = PLATFORM_META[ad.platform];
  const stages: { id: Stage; label: string }[] = [
    { id: "video", label: meta.short },
    { id: "reels", label: "ريلز" },
    { id: "search", label: "بحث جوجل" },
  ];

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `حزمة إعلانية — ${ad.product.slice(0, 40)}`,
          text: fullPackText(ad),
        });
        return;
      } catch {
        /* المستخدم أغلق نافذة المشاركة */
        return;
      }
    }
    const ok = await copyText(fullPackText(ad));
    onToast(ok ? "نُسخت الحزمة كاملة — شاركها أين تريد" : "تعذّرت المشاركة");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 140, damping: 22 }}
      className="space-y-4"
    >
      {/* رأس النتيجة */}
      <div className="glass flex flex-wrap items-center gap-2 rounded-3xl p-3 sm:p-4">
        <span
          className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-extrabold text-white"
          style={{ backgroundColor: meta.color }}
        >
          {meta.label}
        </span>
        <span className="chip">{TONE_META[ad.tone].short}</span>
        <span className="chip">{GOAL_META[ad.goal].short}</span>
        <span className="font-display ms-1 text-[11px] font-semibold text-ink/40" dir="ltr">
          {new Date(ad.createdAt).toLocaleTimeString("ar", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
        <div className="ms-auto flex items-center gap-1.5">
          {canRegenerate && (
            <motion.button
              type="button"
              whileHover={{ y: -2, rotate: -6 }}
              whileTap={{ scale: 0.9 }}
              onClick={onRegenerate}
              title="نسخة جديدة بنفس المدخلات (−1 رصيد)"
              className="copy-btn"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span className="hidden text-[11px] font-bold sm:inline">نسخة جديدة</span>
            </motion.button>
          )}
          <CopyBtn
            text={fullPackText(ad)}
            label="نسخ الحزمة كاملة"
            onToast={onToast}
            className="copy-btn--primary"
          />
          <motion.button
            type="button"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleShare}
            className="copy-btn"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span className="hidden text-[11px] font-bold sm:inline">مشاركة</span>
          </motion.button>
        </div>
      </div>

      {/* مسرح المعاينة */}
      <div className="glass rounded-3xl p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex rounded-2xl bg-ink/6 p-1">
            {stages.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStage(s.id)}
                className={`relative rounded-xl px-3.5 py-1.5 text-[11px] font-extrabold transition-colors ${
                  stage === s.id ? "text-ink" : "text-ink/45 hover:text-ink/70"
                }`}
              >
                {stage === s.id && (
                  <motion.span
                    layoutId="stage-pill"
                    className="absolute inset-0 rounded-xl bg-white shadow-md"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative">{s.label}</span>
              </button>
            ))}
          </div>
          <span className="hidden items-center gap-1 text-[10px] font-bold text-ink/40 sm:flex">
            <ChevronDown className="h-3 w-3" />
            معاينة حيّة لهوية المنصة
          </span>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={stage + ad.id}
            initial={{ opacity: 0, scale: 0.96, filter: "blur(6px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.96, filter: "blur(6px)" }}
            transition={{ duration: 0.3 }}
          >
            {stage === "search" ? (
              <GoogleMock ad={ad} />
            ) : (
              <PhoneMock ad={ad} variant={stage === "reels" ? "reels" : "video"} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* الخطافات */}
      <PackSection
        icon={Zap}
        title="الخطافات الثلاثة — اختبارات A/B"
        accent="#FF4D2E"
        copyTextValue={ad.pack.hooks.map((h, i) => `${i + 1}) ${h}`).join("\n")}
        copyLabel="نسخ الخطافات"
        onToast={onToast}
        delay={0.05}
      >
        <div className="grid gap-2.5 sm:grid-cols-3">
          {ad.pack.hooks.map((hook, i) => (
            <motion.div
              key={`${ad.id}-hook-${i}`}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              whileHover={{ y: -4 }}
              className="group relative rounded-2xl border border-ink/8 bg-white/75 p-4 transition-shadow hover:shadow-lg"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="font-display grid h-6 w-6 place-items-center rounded-lg bg-ink text-[11px] font-black text-cream">
                  {["A", "B", "C"][i]}
                </span>
                <CopyBtn text={hook} onToast={onToast} />
              </div>
              <p className="text-[13px] font-bold leading-relaxed text-ink">{hook}</p>
            </motion.div>
          ))}
        </div>
      </PackSection>

      {/* النص الإعلاني */}
      <PackSection
        icon={ScrollText}
        title="النص الإعلاني الرئيسي"
        accent="#0E7C7B"
        copyTextValue={ad.pack.primaryText}
        copyLabel="نسخ النص"
        onToast={onToast}
        delay={0.1}
      >
        <p className="whitespace-pre-line rounded-2xl bg-white/70 p-4 text-[13px] leading-loose text-ink/85">
          {ad.pack.primaryText}
        </p>
      </PackSection>

      {/* CTA */}
      <PackSection
        icon={MousePointerClick}
        title="الدعوة لاتخاذ إجراء + علم النفس خلفها"
        accent="#C0392B"
        copyTextValue={ad.pack.cta}
        copyLabel="نسخ الـ CTA"
        onToast={onToast}
        delay={0.14}
      >
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <span className="btn-primary inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-extrabold text-white shadow-xl">
            {ad.pack.cta}
          </span>
          <p className="flex flex-1 items-start gap-2 rounded-2xl bg-amber-50/90 p-3.5 text-[12px] leading-relaxed text-amber-900/90">
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            {ad.pack.ctaPsychology}
          </p>
        </div>
      </PackSection>

      {/* سكريبت الفيديو */}
      <PackSection
        icon={Clapperboard}
        title={ad.pack.videoScript.title}
        accent="#7C5CBF"
        onToast={onToast}
        delay={0.18}
      >
        <div className="mb-4 flex flex-wrap gap-1.5">
          <span className="chip chip--dark">{ad.pack.videoScript.duration}</span>
          <span className="chip chip--dark">{ad.pack.videoScript.aspect}</span>
          <span className="chip chip--dark">{ad.pack.videoScript.scenes.length} مشاهد</span>
        </div>
        <div className="space-y-3">
          {ad.pack.videoScript.scenes.map((scene, i) => (
            <motion.div
              key={`${ad.id}-scene-${i}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.07 }}
              className="relative rounded-2xl border border-ink/8 bg-white/75 p-4"
            >
              <div className="mb-2.5 flex items-center gap-2.5">
                <span
                  className="font-display shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-black text-white"
                  dir="ltr"
                  style={{ backgroundColor: "#7C5CBF" }}
                >
                  {scene.time}
                </span>
                <p className="text-[13px] font-extrabold text-ink">{scene.title}</p>
              </div>
              <div className="grid gap-1.5 text-[12px] leading-relaxed text-ink/75">
                <p className="flex items-start gap-2">
                  <Clapperboard className="mt-0.5 h-3.5 w-3.5 shrink-0 text-coral" />
                  {scene.visual}
                </p>
                <p className="flex items-start gap-2">
                  <Volume2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-deep" />
                  {scene.audio}
                </p>
                <p className="flex items-start gap-2">
                  <Type className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                  <span className="font-semibold text-ink">{scene.onScreen}</span>
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </PackSection>

      {/* برومبتات الصور */}
      <PackSection
        icon={ImageIcon}
        title="برومبتات توليد الصور — Midjourney / Flux / DALL·E"
        accent="#1E6FD9"
        onToast={onToast}
        delay={0.22}
      >
        <div className="space-y-2.5">
          {ad.pack.imagePrompts.map((img, i) => (
            <motion.div
              key={`${ad.id}-img-${i}`}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24 + i * 0.07 }}
              className="overflow-hidden rounded-2xl border border-ink/8 bg-white/75"
            >
              <div className="flex flex-wrap items-center gap-2 border-b border-ink/6 px-4 py-2.5">
                <span className="text-[12px] font-extrabold text-ink">{img.label}</span>
                <span className="chip">{img.useCase}</span>
                <span className="ms-auto flex items-center gap-2">
                  <span className="font-display hidden gap-1 text-[9px] font-bold text-ink/35 sm:flex" dir="ltr">
                    MJ · FLUX · DALL·E
                  </span>
                  <CopyBtn text={img.prompt} label="نسخ" onToast={onToast} />
                </span>
              </div>
              <p
                dir="ltr"
                className="bg-ink/[0.03] px-4 py-3 font-mono text-[11.5px] leading-relaxed text-ink/70"
              >
                {img.prompt}
              </p>
            </motion.div>
          ))}
        </div>
      </PackSection>

      <div className="flex items-center justify-center gap-2 pb-2 pt-1 text-[11px] font-semibold text-ink/35">
        <CopyCheck className="h-3.5 w-3.5" />
        الحزمة محفوظة في سجلك — استرجعها أو شاركها في أي وقت
        <MoreHorizontal className="h-3.5 w-3.5" />
      </div>
    </motion.div>
  );
}
