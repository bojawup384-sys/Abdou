import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";

/**
 * اتصال Neon — كسول (Lazy)
 * ------------------------------------------------------------------
 * لا نرمي خطأ عند استيراد الملف، لأن `next build` يستورد مسارات الـ API
 * أثناء "Collecting page data" ولا تكون متغيرات البيئة جاهزة دائمًا.
 * الاتصال يُنشأ فقط عند أول استعلام فعلي.
 */
let _db: NeonHttpDatabase | null = null;

function getDb(): NeonHttpDatabase {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL غير مضبوط — أضفه في Vercel > Settings > Environment Variables"
    );
  }
  _db = drizzle(neon(url));
  return _db;
}

export const db = new Proxy({} as NeonHttpDatabase, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
});
