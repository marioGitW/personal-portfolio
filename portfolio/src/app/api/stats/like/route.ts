import { recordLike } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function POST() {
  return Response.json({ likes: await recordLike() });
}
