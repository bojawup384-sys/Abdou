/**
 * Rate Limiter خفيف بنافذة زمنية منزلقة (Sliding Window)
 * ------------------------------------------------------------------
 * يعمل في ذاكرة العملية — مناسب لنشر نسخة واحدة (Vercel Hobby / VPS).
 * عند التوسع بعدة نسخ، استبدله بمزود خارجي مثل Upstash Redis مع
 * نفس الواجهة (ok / remaining / retryAfterMs).
 */

interface RateResult {
  ok: boolean;
  remaining: number;
  retryAfterMs: number;
}

const buckets = new Map<string, number[]>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateResult {
  const now = Date.now();
  const cutoff = now - windowMs;

  let hits = buckets.get(key) ?? [];
  hits = hits.filter((t) => t > cutoff);

  if (hits.length >= limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterMs: Math.max(0, hits[0] + windowMs - now),
    };
  }

  hits.push(now);
  buckets.set(key, hits);

  // تنظيف دوري حتى لا تنتفخ الذاكرة مع الوقت
  if (buckets.size > 5_000) {
    for (const [k, v] of buckets) {
      const fresh = v.filter((t) => t > cutoff);
      if (fresh.length === 0) buckets.delete(k);
      else buckets.set(k, fresh);
    }
  }

  return { ok: true, remaining: limit - hits.length, retryAfterMs: 0 };
}
