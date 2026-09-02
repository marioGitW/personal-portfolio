import { Redis } from "@upstash/redis";

const KEY_PREFIX = process.env.NODE_ENV === "production" ? "prod" : "dev";
const VISITS_KEY = `${KEY_PREFIX}:portfolio:visits`;
const LIKES_KEY = `${KEY_PREFIX}:portfolio:likes`;

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  return new Redis({ url, token });
}

async function readCount(redis: Redis, key: string): Promise<number> {
  const value = await redis.get<number | string | null>(key);
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function getStats(): Promise<{ visits: number; likes: number }> {
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

export async function incrementVisits(): Promise<number> {
  const redis = getRedis();
  if (!redis) {
    return 0;
  }

  return redis.incr(VISITS_KEY);
}

export async function incrementLikes(): Promise<number> {
  const redis = getRedis();
  if (!redis) {
    return 0;
  }

  return redis.incr(LIKES_KEY);
}
