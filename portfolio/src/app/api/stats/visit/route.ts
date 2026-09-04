import { rateLimit, tooManyRequests } from "@/lib/rateLimit";
import { recordVisit } from "@/lib/redis";

const LIMIT = 30;
const WINDOW_SECONDS = 60;

// A POST so no crawler or prerender can move the counter. The client calls it
// at most once per page load; see @/lib/visit.
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const limit = await rateLimit(request, "visit", LIMIT, WINDOW_SECONDS);
  if (!limit.ok) {
    return tooManyRequests(limit.retryAfter);
  }

  return Response.json(await recordVisit());
}
