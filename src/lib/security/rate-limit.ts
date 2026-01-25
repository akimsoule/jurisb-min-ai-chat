type Bucket = { count: number; resetAt: number };

const globalKey = Symbol.for("jurisb.rateLimiter");
const store: Map<string, Bucket> = (globalThis as any)[globalKey] || new Map();
(globalThis as any)[globalKey] = store;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  reset: number; // epoch ms
}

export function getClientKey(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for") || "";
  const ip =
    forwarded.split(",")[0].trim() || headers.get("x-real-ip") || "unknown";
  const ua = headers.get("user-agent") || "";
  return `${ip}:${ua.slice(0, 16)}`;
}

export function limit(
  key: string,
  max: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const bucket = store.get(key);
  if (!bucket || now >= bucket.resetAt) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: max - 1, reset: resetAt };
  }

  if (bucket.count < max) {
    bucket.count += 1;
    return {
      allowed: true,
      remaining: max - bucket.count,
      reset: bucket.resetAt,
    };
  }

  return { allowed: false, remaining: 0, reset: bucket.resetAt };
}

export function rateLimitHeaders(res: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Remaining": String(res.remaining),
    "X-RateLimit-Reset": String(res.reset),
  };
}
