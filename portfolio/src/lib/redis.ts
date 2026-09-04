import { Redis } from "@upstash/redis";
import type { SiteStats } from "@/lib/types";

/**
 * Counters are namespaced per environment so preview deploys and local work
 * never move the numbers shown on the live site:
 *
 *   production  → portfolio:visits      / portfolio:likes
 *   preview     → preview:portfolio:*
 *   development → dev:portfolio:*
 *
 * `VERCEL_ENV` is the only reliable signal here. `NODE_ENV` is `"production"`
 * for Preview builds too, so keying off it is exactly what would let a preview
 * deployment write into the live counters. Where `VERCEL_ENV` is absent — local
 * `next dev`, and also a local `next build && next start` — we deliberately fall
 * back to the dev namespace, so a production build on your own machine can never
 * touch the real numbers. Set `STATS_ENV` explicitly if the site is ever hosted
 * somewhere other than Vercel.
 */
function resolveStatsEnv(): "production" | "preview" | "development" {
  const env = process.env.STATS_ENV ?? process.env.VERCEL_ENV;
  return env === "production" || env === "preview" ? env : "development";
}

const KEY_PREFIX = { production: "", preview: "preview:", development: "dev:" }[
  resolveStatsEnv()
];

const VISITS_KEY = `${KEY_PREFIX}portfolio:visits`;
const LIKES_KEY = `${KEY_PREFIX}portfolio:likes`;

let client: Redis | null = null;

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  client ??= new Redis({ url, token });
  return client;
}

/** A missing key reads as 0 rather than failing the whole response. */
async function readCount(redis: Redis, key: string): Promise<number> {
  const value = await redis.get<number | string | null>(key);
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function getStats(): Promise<SiteStats> {
  const redis = getRedis();
  if (!redis) {
    return { visits: 0, likes: 0 };
  }

  const [visits, likes] = await Promise.all([
    readCount(redis, VISITS_KEY),
    readCount(redis, LIKES_KEY),
  ]);

  return { visits, likes };
}

/**
 * The one and only place a visit is recorded. `INCR` is atomic and returns the
 * new value, so there is no read-modify-write to race and no retry that could
 * count twice.
 */
export async function recordVisit(): Promise<SiteStats> {
  const redis = getRedis();
  if (!redis) {
    return { visits: 0, likes: 0 };
  }

  const [visits, likes] = await Promise.all([
    redis.incr(VISITS_KEY),
    readCount(redis, LIKES_KEY),
  ]);

  return { visits, likes };
}

export async function recordLike(): Promise<number> {
  const redis = getRedis();
  if (!redis) {
    return 0;
  }

  return redis.incr(LIKES_KEY);
}
