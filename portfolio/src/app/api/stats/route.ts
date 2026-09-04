import { getStats } from "@/lib/redis";

// Never cache this: it would freeze the counters.
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(await getStats());
}
