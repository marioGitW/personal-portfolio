import { recordVisit } from "@/lib/redis";

/**
 * The single endpoint that records a visit. It is a POST so that nothing which
 * speculatively issues GETs — a crawler, a link unfurler, a browser prerender —
 * can move the counter. The client calls it at most once per document load; see
 * `@/lib/visit`.
 */
export const dynamic = "force-dynamic";

export async function POST() {
  return Response.json(await recordVisit());
}
