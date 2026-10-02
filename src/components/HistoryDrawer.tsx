"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Archive,
  Check,
  Copy,
  Eye,
  PackageOpen,
  X,
} from "lucide-react";
import { useState } from "react";

import {
  GOAL_META,
  PLATFORM_META,
  TONE_META,
  type SavedAd,
} from "@/lib/types";

interface HistoryDrawerProps {
  open: boolean;
  loading: boolean;
  items: SavedAd[];
  onClose: () => void;
  onSelect: (ad: SavedAd) => void;
  onToast: (msg: string) => void;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "الآن";
  if (mins < 60) return `قبل ${mins} د`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `قبل ${hours} س`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `قبل ${days} يوم`;
  return new Date(iso).toLocaleDateString("ar", {
    day: "numeric",
    month: "short",
  });
}

/**
 * درج سجل الإعلانات
 * ------------------------------------------------------------------
 * ينزلق من الجانب ويعرض كل الحزم المحفوظة لهذا الجهاز،
 * مع استعادة كاملة بنقرة واحدة أو نسخ سريع للخطافات + الـ CTA.
 */
export function HistoryDrawer({
  open,
  loading,
  items,
  onClose,
  onSelect,
  onToast,
}: HistoryDrawerProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const quickCopy = async (ad: SavedAd) => {
    const text = [
      "الخطافات:",
      ...ad.pack.hooks.map((h, i) => `${i + 1}) ${h}`),
      ``,
      `الـ CTA: ${ad.pack.cta}`,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(ad.id);
      onToast("نُسخت الخطافات والـ CTA");
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      onToast("تعذّر النسخ");
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: "-104%" }}
            animate={{ x: 0 }}
            exit={{ x: "-104%" }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            className="glass-strong fixed inset-y-0 left-0 z-50 flex w-[min(430px,94vw)] flex-col border-e border-white/60 shadow-2xl"
          >
            {/* الرأس */}
            <div className="flex items-center justify-between gap-3 border-b border-ink/8 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-2xl bg-ink text-cream">
                  <Archive className="h-4.5 w-4.5" />
                </span>
                <div className="leading-tight">
                  <h2 className="text-base font-extrabold text-ink">سجلّ الإعلانات</h2>
                  <p className="text-[11px] font-semibold text-ink-soft">
                    {items.length > 0
                      ? `${items.length} حزمة محفوظة على هذا الجهاز`
                      : "كل ما تولّده يُحفظ هنا تلقائيًا"}
                  </p>
                </div>
              </div>
              <motion.button
                type="button"
                whileHover={{ rotate: 90, scale: 1.06 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="grid h-9 w-9 place-items-center rounded-xl bg-ink/6 text-ink transition-colors hover:bg-ink/10"
                aria-label="إغلاق السجل"
              >
                <X className="h-4.5 w-4.5" />
              </motion.button>
            </div>

            {/* المحتوى */}
            <div className="drawer-scroll flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {loading ? (
                [0, 1, 2].map((i) => (
                  <div key={i} className="shimmer h-28 rounded-3xl bg-ink/6" />
                ))
              ) : items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                  <span className="mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-ink/5 text-ink/35">
                    <PackageOpen className="h-8 w-8" />
                  </span>
                  <p className="text-sm font-extrabold text-ink">لا حزم محفوظة بعد</p>
                  <p className="mt-1.5 max-w-[240px] text-[12px] leading-relaxed text-ink-soft">
                    ولّد حزمتك الأولى من المعالج، وستجدها هنا جاهزة للنسخ
                    والاسترجاع متى شئت.
                  </p>
                  <motion.button
                    type="button"
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    className="btn-primary mt-5 rounded-2xl px-5 py-2.5 text-xs font-extrabold text-white"
                  >
                    ابدأ التوليد الآن
                  </motion.button>
                </div>
              ) : (
                items.map((ad, i) => {
                  const meta = PLATFORM_META[ad.platform];
                  return (
                    <motion.article
                      key={ad.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.04, 0.3) }}
                      className="group rounded-3xl border border-ink/8 bg-white/75 p-4 transition-all duration-300 hover:border-ink/15 hover:shadow-xl"
                    >
                      <div className="mb-2 flex items-center gap-1.5">
                        <span
                          className="rounded-lg px-2 py-0.5 text-[10px] font-extrabold text-white"
                          style={{ backgroundColor: meta.color }}
                        >
                          {meta.short}
                        </span>
                        <span className="rounded-md bg-ink/6 px-2 py-0.5 text-[10px] font-bold text-ink-soft">
                          {TONE_META[ad.tone].short}
                        </span>
                        <span className="rounded-md bg-ink/6 px-2 py-0.5 text-[10px] font-bold text-ink-soft">
                          {GOAL_META[ad.goal].short}
                        </span>
                        <span className="ms-auto text-[10px] font-bold text-ink/35">
                          {relativeTime(ad.createdAt)}
                        </span>
                      </div>
                      <p className="mb-1 line-clamp-2 text-[13px] font-bold leading-relaxed text-ink">
                        {ad.product}
                      </p>
                      <p className="mb-3 line-clamp-1 text-[11.5px] text-ink-soft">
                        {ad.pack.hooks[0]}
                      </p>
                      <div className="flex items-center gap-2">
                        <motion.button
                          type="button"
                          whileHover={{ y: -1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => onSelect(ad)}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-ink py-2 text-[11px] font-extrabold text-cream transition-colors hover:bg-ink/85"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          استعراض الحزمة
                        </motion.button>
                        <motion.button
                          type="button"
                          whileHover={{ y: -1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => quickCopy(ad)}
                          className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-extrabold transition-colors ${
                            copiedId === ad.id
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-ink/6 text-ink hover:bg-ink/10"
                          }`}
                        >
                          {copiedId === ad.id ? (
                            <Check className="h-3.5 w-3.5" strokeWidth={3} />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                          نسخ سريع
                        </motion.button>
                      </div>
                    </motion.article>
                  );
                })
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
