"use client";

import { motion } from "framer-motion";
import { KeyRound, Loader2, Mail, User } from "lucide-react";
import { useState } from "react";

import { authErrorMessage } from "@/lib/useAuth";

interface LoginCardProps {
  onGoogle: () => Promise<void>;
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string, name?: string) => Promise<void>;
  onReset: (email: string) => Promise<void>;
  dailyLimit: number;
}

export function LoginCard({ onGoogle, onSignIn, onSignUp, onReset, dailyLimit }: LoginCardProps) {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError("");
    setInfo("");
    try {
      await fn();
    } catch (e) {
      const msg = authErrorMessage(e);
      if (msg) setError(msg);
    } finally {
      setBusy(false);
    }
  };

  const submit = () =>
    run(() => (mode === "in" ? onSignIn(email.trim(), password) : onSignUp(email.trim(), password, name)));

  const forgot = () => {
    if (!email.trim()) {
      setError("اكتب بريدك الإلكتروني أولًا.");
      return;
    }
    void run(async () => {
      await onReset(email.trim());
      setInfo("أرسلنا رابط إعادة تعيين كلمة المرور إلى بريدك.");
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-strong mx-auto w-full max-w-md rounded-3xl p-6 shadow-2xl"
    >
      <h2 className="text-center text-xl font-black text-ink">
        {mode === "in" ? "سجّل الدخول لتبدأ" : "أنشئ حسابك المجاني"}
      </h2>
      <p className="mt-1 text-center text-xs text-ink-soft">
        {dailyLimit} تجارب مجانية كل يوم — تتجدد تلقائيًا، وحفظ كامل لسجل إعلاناتك.
      </p>

      <button
        type="button"
        disabled={busy}
        onClick={() => run(onGoogle)}
        className="btn-ghost-glass mt-5 flex w-full items-center justify-center gap-2.5 rounded-2xl py-3.5 text-sm font-extrabold text-ink disabled:opacity-50"
      >
        <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden>
          <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.5 17.7 9.5 24 9.5z" />
          <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.4c-.5 2.9-2.1 5.3-4.5 6.9l7.3 5.7c4.3-4 6.9-9.9 6.9-16.6z" />
          <path fill="#FBBC05" d="M10.5 28.7c-.5-1.4-.8-2.9-.8-4.7s.3-3.3.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.600 10.8l7.900-6.1z" />
          <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.900-5.8l-7.300-5.700c-2 1.400-4.700 2.200-8.600 2.200-6.300 0-11.600-4-13.500-9.800l-7.900 6.100C6.500 42.600 14.600 48 24 48z" />
        </svg>
        المتابعة بحساب Google
      </button>

      <div className="my-4 flex items-center gap-3 text-[11px] text-ink-soft">
        <span className="h-px flex-1 bg-ink/10" /> أو بالبريد <span className="h-px flex-1 bg-ink/10" />
      </div>

      <div className="space-y-3">
        {mode === "up" && (
          <label className="relative block">
            <User className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="الاسم (اختياري)"
              autoComplete="name"
              className="field-input w-full rounded-2xl py-3.5 pe-4 ps-10 text-sm text-ink placeholder:text-ink/30"
            />
          </label>
        )}
        <label className="relative block">
          <Mail className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
          <input
            type="email"
            dir="ltr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            autoComplete="email"
            className="field-input w-full rounded-2xl py-3.5 pe-10 ps-4 text-sm text-ink placeholder:text-ink/30"
          />
        </label>
        <label className="relative block">
          <KeyRound className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
          <input
            type="password"
            dir="ltr"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void submit()}
            placeholder="كلمة المرور"
            autoComplete={mode === "in" ? "current-password" : "new-password"}
            className="field-input w-full rounded-2xl py-3.5 pe-10 ps-4 text-sm text-ink placeholder:text-ink/30"
          />
        </label>
      </div>

      {error && <p className="mt-3 text-center text-xs font-bold text-red-500">{error}</p>}
      {info && <p className="mt-3 text-center text-xs font-bold text-emerald-600">{info}</p>}

      <button
        type="button"
        disabled={busy || !email || password.length < 6}
        onClick={() => void submit()}
        className="btn-primary mt-4 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-45"
      >
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        {mode === "in" ? "دخول" : "إنشاء الحساب"}
      </button>

      <div className="mt-4 flex items-center justify-between text-xs font-bold text-ink-soft">
        <button type="button" onClick={() => { setMode(mode === "in" ? "up" : "in"); setError(""); }} className="hover:text-ink">
          {mode === "in" ? "ليس لديك حساب؟ سجّل" : "لديك حساب؟ ادخل"}
        </button>
        {mode === "in" && (
          <button type="button" onClick={forgot} className="hover:text-ink">
            نسيت كلمة المرور؟
          </button>
        )}
      </div>
    </motion.div>
  );
}
