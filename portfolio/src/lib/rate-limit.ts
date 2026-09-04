import { KEY_PREFIX, getRedis } from "@/lib/redis";

export type RateLimitResult = { ok: true } | { ok: false; retryAfter: number };

/**
 * Vercel puts the real client IP first in `x-forwarded-for`. Anything that
 * gets here without one shares a single bucket rather than bypassing the limit.
 */
function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  return first || request.headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Fixed-window limit of `limit` requests per `windowSeconds`, keyed by IP.
 *
 * INCR is atomic and returns the new count, so concurrent requests can't slip
 * past by racing. Any Redis problem fails open — a counter outage must never
 * take the contact form down.
 */
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

    // Only the request that created the key sets the expiry, so the window
    // starts at the first hit instead of sliding forward on every one.
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

/** The 429 every limited route returns, with the standard Retry-After header. */
export function tooManyRequests(retryAfter: number): Response {
  return Response.json(
    { error: "Too many requests" },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
}
