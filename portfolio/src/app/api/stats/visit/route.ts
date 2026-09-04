import { rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { recordVisit } from "@/lib/redis";

const LIMIT = 30;
const WINDOW_SECONDS = 60;

/**
 * A POST, not a GET, so nothing that speculatively fetches — a crawler, a link
 * unfurler, a browser prerender — can move the counter. The client calls it at
 * most once per document load; see `@/lib/visit`.
 */
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const limit = await rateLimit(request, "visit", LIMIT, WINDOW_SECONDS);
  if (!limit.ok) {
    return tooManyRequests(limit.retryAfter);
  }

  return Response.json(await recordVisit());
}
