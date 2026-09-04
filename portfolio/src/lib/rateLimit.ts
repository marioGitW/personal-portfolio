import { KEY_PREFIX, getRedis } from "@/lib/redis";

export type RateLimitResult = { ok: true } | { ok: false; retryAfter: number };

// Vercel puts the real client IP first. Anything without one shares a single
// bucket rather than bypassing the limit.
function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  return first || request.headers.get("x-real-ip")?.trim() || "unknown";
}

// Fixed window, keyed by IP. INCR is atomic so concurrent requests can't race
// past it, and any Redis error fails open rather than blocking the form.
export async function rateLimit(
  request: Request,
  name: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const redis = getRedis();
  if (!redis) {
    return { ok: true };
  }

  const key = `${KEY_PREFIX}portfolio:ratelimit:${name}:${clientIp(request)}`;

  try {
    const count = await redis.incr(key);

    // Only the first request sets the expiry, so the window doesn't slide.
    if (count === 1) {
      await redis.expire(key, windowSeconds);
    }

    if (count > limit) {
      const ttl = await redis.ttl(key);
      return { ok: false, retryAfter: ttl > 0 ? ttl : windowSeconds };
    }

    return { ok: true };
  } catch (error) {
    console.error("[rate-limit] check failed, allowing request:", error);
    return { ok: true };
  }
}

// The 429 every limited route returns, with a Retry-After header.
export function tooManyRequests(retryAfter: number): Response {
  return Response.json(
    { error: "Too many requests" },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
}
