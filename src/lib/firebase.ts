import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

/**
 * إعداد Firebase (عميل المتصفح فقط).
 * قيم الـ Web Config عامة بطبيعتها وليست أسرارًا، ويمكن تجاوزها
 * بمتغيرات NEXT_PUBLIC_FIREBASE_* في Vercel.
 */
const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ??
    "AIzaSyDeja2hzGtRXafKzACUFFw-g3joWmlzGTU",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "mohtal-9b1d3.firebaseapp.com",
  databaseURL:
    process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ??
    "https://mohtal-9b1d3-default-rtdb.firebaseio.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "mohtal-9b1d3",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ??
    "mohtal-9b1d3.firebasestorage.app",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "282432971728",
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ??
    "1:282432971728:web:70f11fd64bbb2ad34ecfd5",
  measurementId:
    process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? "G-DX3XPKQ1WE",
};

export function getFirebaseApp(): FirebaseApp {
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

export function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseApp());
}

/** تسجيل حدث في Google Analytics — يتجاهل بصمت إن لم يكن مدعومًا */
export async function trackEvent(
  name: string,
  params?: Record<string, string | number | boolean>
): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const { getAnalytics, isSupported, logEvent } = await import(
      "firebase/analytics"
    );
    if (!(await isSupported())) return;
    logEvent(getAnalytics(getFirebaseApp()), name, params);
  } catch {
    /* التحليلات اختيارية */
  }
}
