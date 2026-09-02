import { incrementLikes } from "@/lib/redis";

export async function POST() {
  const likes = await incrementLikes();
  return Response.json({ likes });
}
