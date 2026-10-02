"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info, Sparkles } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { AdForm } from "./AdForm";
import { Header } from "./Header";
import { HistoryDrawer } from "./HistoryDrawer";
import { LoginCard } from "./LoginCard";
import { OutputCard } from "./OutputCard";
import { trackEvent } from "@/lib/firebase";
import { useAuth } from "@/lib/useAuth";
import type {
  CreditsResponse,
  GenerateInput,
  GenerateResponse,
  HistoryResponse,
  SavedAd,
} from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  التنبيهات (Toasts)                                                  */
/* ------------------------------------------------------------------ */

type ToastKind = "success" | "error" | "info";
interface Toast {
  id: number;
  msg: string;
  kind: ToastKind;
}

const TOAST_STYLE: Record<ToastKind, { icon: typeof CheckCircle2; cls: string }> = {
  success: { icon: CheckCircle2, cls: "text-emerald-600" },
  error: { icon: AlertTriangle, cls: "text-red-500" },
  info: { icon: Info, cls: "text-blue-500" },
};

/* ------------------------------------------------------------------ */
/*  التطبيق — المنسّق الرئيسي                                          */
/* ------------------------------------------------------------------ */

export function AdCraftApp() {
  const {
    user,
    loading: authLoading,
    signInGoogle,
    signInEmail,
    signUpEmail,
    resetPassword,
    signOut,
    getToken,
  } = useAuth();
  const [credits, setCredits] = useState<number | null>(null);
  const [dailyLimit, setDailyLimit] = useState(5);
  const [currentAd, setCurrentAd] = useState<SavedAd | null>(null);
  const [lastInput, setLastInput] = useState<GenerateInput | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyItems, setHistoryItems] = useState<SavedAd[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const outputRef = useRef<HTMLDivElement>(null);
  const toastSeq = useRef(0);

  /* ------------------------------ تنبيهات ------------------------------ */
  const pushToast = useCallback((msg: string, kind: ToastKind = "success") => {
    const id = ++toastSeq.current;
    setToasts((t) => [...t.slice(-2), { id, msg, kind }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 3400);
  }, []);

  /* ------------------------------ التهيئة ------------------------------ */
  useEffect(() => {
    // تسجيل عامل الخدمة (PWA)
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
  }, []);

  /* ------------------------------ الرصيد ------------------------------ */
  const uid = user?.uid ?? null;
  useEffect(() => {
    if (!uid) {
      setCredits(null);
      setCurrentAd(null);
      setHistoryItems([]);
      return;
    }
    (async () => {
      try {
        const token = await getToken();
        const r = await fetch("/api/credits", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const d = (await r.json()) as CreditsResponse;
        if (d.ok && typeof d.credits === "number") {
          setCredits(d.credits);
          if (d.dailyLimit) setDailyLimit(d.dailyLimit);
        } else if (d.error) {
          pushToast(d.error, "error");
        }
      } catch {
        pushToast("تعذّر الاتصال بالخادم", "error");
      }
    })();
  }, [uid, getToken, pushToast]);

  /* ------------------------------ السجل ------------------------------ */
  const loadHistory = useCallback(async () => {
    if (!uid) return;
    setHistoryLoading(true);
    try {
      const token = await getToken();
      const r = await fetch("/api/history", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const d = (await r.json()) as HistoryResponse;
      if (d.ok && d.ads) setHistoryItems(d.ads);
    } catch {
      pushToast("تعذّر جلب السجل", "error");
    } finally {
      setHistoryLoading(false);
    }
  }, [uid, getToken, pushToast]);

  useEffect(() => {
    if (historyOpen) void loadHistory();
  }, [historyOpen, loadHistory]);

  /* ------------------------------ التوليد ------------------------------ */
  const handleGenerate = useCallback(
    async (input: GenerateInput) => {
      if (!uid || isGenerating) return;
      setIsGenerating(true);
      setLastInput(input);
      try {
        const token = await getToken();
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(input),
        });
        const data = (await res.json()) as GenerateResponse;

        if (!res.ok || !data.ok || !data.ad) {
          const kind: ToastKind = res.status === 402 ? "info" : "error";
          pushToast(data.error ?? "حدث خطأ غير متوقع", kind);
          return;
        }

        setCurrentAd(data.ad);
        if (typeof data.credits === "number") setCredits(data.credits);
        setHistoryItems((prev) => [data.ad as SavedAd, ...prev]);
        void trackEvent("generate_ad", {
          platform: input.platform,
          tone: input.tone,
          goal: input.goal,
        });
        pushToast(
          data.source === "gemini"
            ? "حزمتك جاهزة — ولّدها Gemini خصيصًا لمنتجك"
            : "حزمتك الإعلانية جاهزة للنشر"
        );
        // على الشاشات الصغيرة: انزل إلى النتيجة
        if (window.innerWidth < 1024) {
          setTimeout(() => {
            outputRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }, 250);
        }
      } catch {
        pushToast("انقطع الاتصال — تحقق من الشبكة وحاول مجددًا", "error");
      } finally {
        setIsGenerating(false);
      }
    },
    [uid, getToken, isGenerating, pushToast]
  );

  const handleSelectFromHistory = useCallback(
    (ad: SavedAd) => {
      setCurrentAd(ad);
      setHistoryOpen(false);
      setTimeout(() => {
        outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 200);
    },
    []
  );

  return (
    <div className="relative min-h-screen">
      {/* ------------------------------ الخلفية الحية ------------------------------ */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="blob blob--a" />
        <div className="blob blob--b" />
        <div className="blob blob--c" />
        <div className="grid-overlay absolute inset-0" />
        <div className="grain absolute inset-0" />
      </div>

      <Header
        credits={credits}
        lowCredits={credits !== null && credits <= 1}
        onOpenHistory={() => setHistoryOpen(true)}
        historyCount={historyItems.length}
        dailyLimit={dailyLimit}
        user={
          user
            ? {
                name: user.displayName,
                email: user.email,
                photoURL: user.photoURL,
              }
            : null
        }
        onSignOut={() => void signOut()}
      />

      <main className="relative z-10 mx-auto max-w-6xl px-3 pb-24 pt-24 sm:px-5 lg:pt-28">
        {/* ترويسة خفيفة */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mx-auto mb-8 max-w-2xl text-center"
        >
          <span className="chip chip--hero mb-4 inline-flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-coral" />
            استوديو إبداعي كامل — في ثلاث خطوات
          </span>
          <h1 className="text-balance text-3xl font-black leading-[1.25] tracking-tight text-ink sm:text-4xl lg:text-[2.75rem]">
            حوّل فكرة منتجك إلى{" "}
            <span className="gradient-text">حملة جاهزة للنشر</span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-balance text-[13px] leading-relaxed text-ink-soft sm:text-sm">
            خطافات مجرّبة، نص إعلاني يبيع، سكريبت فيديو سينمائي، وبرومبتات صور
            — حزمة واحدة مصممة بعناية مخرجٍ إبداعي لا ينام.
          </p>
        </motion.div>

        {authLoading ? (
          <div className="mx-auto h-64 max-w-md animate-pulse rounded-3xl bg-white/50" />
        ) : !user ? (
          <LoginCard
            dailyLimit={dailyLimit}
            onGoogle={signInGoogle}
            onSignIn={signInEmail}
            onSignUp={signUpEmail}
            onReset={resetPassword}
          />
        ) : (
        <div className="grid items-start gap-5 lg:grid-cols-[430px_minmax(0,1fr)]">
            {/* المعالج */}
            <motion.div
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, type: "spring", stiffness: 140, damping: 22 }}
              className="lg:sticky lg:top-24"
            >
              <AdForm
                isGenerating={isGenerating}
                credits={credits}
                onSubmit={handleGenerate}
              />
            </motion.div>
  
            {/* المخرجات */}
            <motion.div
              ref={outputRef}
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.26, type: "spring", stiffness: 140, damping: 22 }}
              className="scroll-mt-28"
            >
              <OutputCard
                ad={currentAd}
                isGenerating={isGenerating}
                canRegenerate={!!lastInput && !isGenerating}
                onRegenerate={() => lastInput && handleGenerate(lastInput)}
                onToast={pushToast}
              />
            </motion.div>
          </div>
        )}
      </main>

      {/* درج السجل */}
      <HistoryDrawer
        open={historyOpen}
        loading={historyLoading}
        items={historyItems}
        onClose={() => setHistoryOpen(false)}
        onSelect={handleSelectFromHistory}
        onToast={pushToast}
      />

      {/* التنبيهات */}
      <div className="pointer-events-none fixed inset-x-0 bottom-5 z-[60] flex flex-col items-center gap-2 px-4">
        <AnimatePresence>
          {toasts.map((t) => {
            const style = TOAST_STYLE[t.kind];
            const Icon = style.icon;
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 24, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
                className="glass-strong pointer-events-auto flex max-w-sm items-center gap-2.5 rounded-2xl px-4 py-3 shadow-2xl"
              >
                <Icon className={`h-4.5 w-4.5 shrink-0 ${style.cls}`} />
                <p className="text-[12.5px] font-bold leading-snug text-ink">
                  {t.msg}
                </p>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
