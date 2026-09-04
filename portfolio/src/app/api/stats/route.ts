import { getStats } from "@/lib/redis";

// Read-only. Never let this response be cached — it would freeze the counters.
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(await getStats());
}
