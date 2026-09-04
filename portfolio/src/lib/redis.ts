import { Redis } from "@upstash/redis";
import type { SiteStats } from "@/lib/types";

// Keys are namespaced per environment so preview and local work never move the
// live numbers. VERCEL_ENV, not NODE_ENV, which is "production" on previews too.
function resolveStatsEnv(): "production" | "preview" | "development" {
  const env = process.env.STATS_ENV ?? process.env.VERCEL_ENV;
  return env === "production" || env === "preview" ? env : "development";
}

export const KEY_PREFIX = { production: "", preview: "preview:", development: "dev:" }[
  resolveStatsEnv()
];

const VISITS_KEY = `${KEY_PREFIX}portfolio:visits`;
const LIKES_KEY = `${KEY_PREFIX}portfolio:likes`;

let client: Redis | null = null;

export function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  client ??= new Redis({ url, token });
  return client;
}

// A missing key reads as 0 rather than failing the whole response.
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

// INCR is atomic and returns the new value, so concurrent visits can't race.
export async function recordVisit(): Promise<SiteStats> {
  const redis = getRedis();
  if (!redis) {
    return { visits: 0, likes: 0 };
  }

  const [visits, likes] = await Promise.all([redis.incr(VISITS_KEY), readCount(redis, LIKES_KEY)]);

  return { visits, likes };
}

export async function recordLike(): Promise<number> {
  const redis = getRedis();
  if (!redis) {
    return 0;
  }

  return redis.incr(LIKES_KEY);
}
