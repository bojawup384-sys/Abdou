"use client";

import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut as fbSignOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { useCallback, useEffect, useState } from "react";

import { getFirebaseAuth, trackEvent } from "./firebase";

const ERRORS: Record<string, string> = {
  "auth/invalid-email": "صيغة البريد الإلكتروني غير صحيحة.",
  "auth/user-not-found": "لا يوجد حساب بهذا البريد.",
  "auth/wrong-password": "كلمة المرور غير صحيحة.",
  "auth/invalid-credential": "البريد أو كلمة المرور غير صحيحة.",
  "auth/email-already-in-use": "هذا البريد مسجّل مسبقًا — سجّل الدخول بدلًا من ذلك.",
  "auth/weak-password": "كلمة المرور ضعيفة — استخدم 6 أحرف على الأقل.",
  "auth/too-many-requests": "محاولات كثيرة — انتظر قليلًا ثم حاول مجددًا.",
  "auth/network-request-failed": "تعذّر الاتصال بالشبكة.",
  "auth/popup-closed-by-user": "أُغلقت نافذة تسجيل الدخول.",
  "auth/cancelled-popup-request": "",
  "auth/operation-not-allowed":
    "طريقة تسجيل الدخول غير مفعّلة في Firebase Console (Authentication ← Sign-in method).",
  "auth/unauthorized-domain":
    "النطاق غير مصرّح به — أضف نطاق موقعك في Firebase ← Authentication ← Settings ← Authorized domains.",
};

export function authErrorMessage(e: unknown): string {
  const code = (e as { code?: string })?.code ?? "";
  return code in ERRORS ? ERRORS[code] : "حدث خطأ أثناء تسجيل الدخول — حاول مجددًا.";
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(getFirebaseAuth(), (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  const signInGoogle = useCallback(async () => {
    const auth = getFirebaseAuth();
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      if ((e as { code?: string }).code === "auth/popup-blocked") {
        await signInWithRedirect(auth, provider);
        return;
      }
      throw e;
    }
    void trackEvent("login", { method: "google" });
  }, []);

  const signInEmail = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
    void trackEvent("login", { method: "password" });
  }, []);

  const signUpEmail = useCallback(
    async (email: string, password: string, name?: string) => {
      const cred = await createUserWithEmailAndPassword(
        getFirebaseAuth(),
        email,
        password
      );
      if (name?.trim()) await updateProfile(cred.user, { displayName: name.trim() });
      void trackEvent("sign_up", { method: "password" });
    },
    []
  );

  const resetPassword = useCallback(async (email: string) => {
    await sendPasswordResetEmail(getFirebaseAuth(), email);
  }, []);

  const signOut = useCallback(async () => {
    await fbSignOut(getFirebaseAuth());
  }, []);

  /** توكن حديث يُرسل للخادم (يُجدَّد تلقائيًا عند انتهائه) */
  const getToken = useCallback(async (): Promise<string | null> => {
    const u = getFirebaseAuth().currentUser;
    return u ? u.getIdToken() : null;
  }, []);

  return { user, loading, signInGoogle, signInEmail, signUpEmail, resetPassword, signOut, getToken };
}
