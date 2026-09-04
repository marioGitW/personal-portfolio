import { rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { recordLike } from "@/lib/redis";

const LIMIT = 30;
const WINDOW_SECONDS = 60;

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const limit = await rateLimit(request, "like", LIMIT, WINDOW_SECONDS);
  if (!limit.ok) {
    return tooManyRequests(limit.retryAfter);
  }

  return Response.json({ likes: await recordLike() });
}
