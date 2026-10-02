import type { Metadata, Viewport } from "next";
import { Alexandria, Space_Grotesk } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const alexandria = Alexandria({
  subsets: ["arabic", "latin"],
  variable: "--font-alexandria",
  display: "swap",
});

const grotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://adcraft-ai.vercel.app"
  ),
  title: "AdCraft AI — استوديو الإعلانات بالذكاء الاصطناعي",
  description:
    "حوّل وصف منتجك إلى حزمة إعلانية متكاملة: 3 خطافات لاختبارات A/B، نص إعلاني يبيع، سكريبت فيديو سينمائي مشهدًا بمشهد، وبرومبتات صور جاهزة لـ Midjourney وFlux.",
  applicationName: "AdCraft AI",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AdCraft AI",
  },
  icons: {
    icon: "/icons/icon-512.png",
    apple: "/icons/icon-512.png",
  },
  openGraph: {
    title: "AdCraft AI — استوديو الإعلانات بالذكاء الاصطناعي",
    description:
      "خطافات، نصوص، سكريبتات فيديو، وبرومبتات صور — حملة كاملة في ثلاث خطوات.",
    locale: "ar_SA",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#FF4D2E",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body
        className={`${alexandria.variable} ${grotesk.variable} font-sans bg-cream text-ink antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
