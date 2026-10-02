"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Coins,
  Download,
  History,
  LogOut,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";

/* ------------------------------------------------------------------ */
/*  حدث تثبيت PWA الخام (غير موجود في أنواع TS الافتراضية)              */
/* ------------------------------------------------------------------ */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface HeaderProps {
  credits: number | null;
  lowCredits: boolean;
  onOpenHistory: () => void;
  historyCount: number;
  dailyLimit: number;
  user: { name: string | null; email: string | null; photoURL: string | null } | null;
  onSignOut: () => void;
}

/**
 * الشريط العلوي الذكي
 * ------------------------------------------------------------------
 * - هوية المنصة + عداد رصيد متحرك
 * - زر تثبيت الـ PWA يظهر فقط عندما يدعم المتصفح الحدث
 * - زر سجل الإعلانات مع عدّاد محفوظات
 */
export function Header({
  credits,
  lowCredits,
  onOpenHistory,
  historyCount,
  dailyLimit,
  user,
  onSignOut,
}: HeaderProps) {
  const [installEvt, setInstallEvt] = useState<BeforeInstallPromptEvent | null>(
    null
  );
  const [installed, setInstalled] = useState(false);

  /* التقاط حدث التثبيت + التحقق من وضع standalone */
  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone ===
        true;
    if (standalone) setInstalled(true);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallEvt(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!installEvt) return;
    await installEvt.prompt();
    const { outcome } = await installEvt.userChoice;
    if (outcome === "accepted") setInstallEvt(null);
  };

  return (
    <motion.header
      initial={{ y: -70, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 120, damping: 18 }}
      className="glass fixed inset-x-3 top-3 z-40 mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-3xl px-4 py-3 sm:px-5"
    >
      {/* ------------------------------ الهوية ------------------------------ */}
      <div className="flex min-w-0 items-center gap-3">
        <div className="logo-tile relative grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-white shadow-lg">
          <Sparkles className="h-5 w-5" strokeWidth={2.2} />
          <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-[color:var(--color-cream)] bg-[color:var(--color-mint-deep)]" />
        </div>
        <div className="min-w-0 leading-tight">
          <p className="font-display truncate text-lg font-bold tracking-tight text-ink">
            AdCraft<span className="text-coral"> AI</span>
          </p>
          <p className="hidden text-[11px] font-medium text-ink-soft sm:block">
            استوديو الإعلانات — من فكرة إلى حزمة جاهزة للنشر
          </p>
        </div>
      </div>

      {/* ------------------------------ الإجراءات ------------------------------ */}
      <div className="flex items-center gap-2">
        {/* عداد الرصيد */}
        <motion.div
          layout
          whileTap={{ scale: 0.94 }}
          title={`تجربتك اليومية المجانية: ${dailyLimit} حزم يوميًا، تتجدد تلقائيًا`}
          className={`credit-badge relative flex items-center gap-2 rounded-2xl px-3.5 py-2 ${
            lowCredits ? "credit-badge--low" : ""
          }`}
        >
          {lowCredits && (
            <span className="pulse-ring absolute inset-0 rounded-2xl" />
          )}
          <Coins
            className={`h-4 w-4 ${
              lowCredits ? "text-amber-600" : "text-coral"
            }`}
          />
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={credits ?? "loading"}
              initial={{ y: 10, opacity: 0, filter: "blur(4px)" }}
              animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
              exit={{ y: -10, opacity: 0, filter: "blur(4px)" }}
              transition={{ type: "spring", stiffness: 380, damping: 26 }}
              className="font-display text-sm font-bold tabular-nums text-ink"
            >
              {credits ?? "…"}
            </motion.span>
          </AnimatePresence>
          <span className="text-[11px] font-semibold text-ink-soft">
            متبقٍ اليوم
          </span>
        </motion.div>

        {/* زر تثبيت التطبيق */}
        <AnimatePresence>
          {!installed && installEvt && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.93 }}
              onClick={handleInstall}
              className="btn-ghost-glass flex items-center gap-2 rounded-2xl px-3.5 py-2 text-xs font-bold text-ink"
            >
              <Download className="h-4 w-4 text-teal-deep" />
              <span className="hidden sm:inline">ثبّت التطبيق</span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* سجل الإعلانات */}
        <motion.button
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.93 }}
          onClick={onOpenHistory}
          className="btn-ghost-glass relative flex items-center gap-2 rounded-2xl px-3.5 py-2 text-xs font-bold text-ink"
        >
          <History className="h-4 w-4 text-coral" />
          <span className="hidden sm:inline">سجلّ الإعلانات</span>
          {historyCount > 0 && (
            <span className="font-display grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1 text-[10px] font-bold text-cream">
              {historyCount}
            </span>
          )}
        </motion.button>

        {/* الحساب */}
        {user && (
          <div className="flex items-center gap-2">
            {user.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.photoURL}
                alt=""
                referrerPolicy="no-referrer"
                className="h-9 w-9 rounded-full border border-white/60 object-cover"
              />
            ) : (
              <span className="font-display grid h-9 w-9 place-items-center rounded-full bg-ink text-sm font-bold text-cream">
                {(user.name ?? user.email ?? "?").trim().charAt(0).toUpperCase()}
              </span>
            )}
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={onSignOut}
              title="تسجيل الخروج"
              aria-label="تسجيل الخروج"
              className="btn-ghost-glass grid h-9 w-9 place-items-center rounded-2xl text-ink"
            >
              <LogOut className="h-4 w-4" />
            </motion.button>
          </div>
        )}
      </div>
    </motion.header>
  );
}
