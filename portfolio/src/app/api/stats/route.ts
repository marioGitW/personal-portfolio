import { getStats } from "@/lib/redis";

export async function GET() {
  const stats = await getStats();
  return Response.json(stats);
}
