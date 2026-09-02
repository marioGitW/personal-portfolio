import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import { incrementVisits } from "@/lib/redis";

export function middleware(request: NextRequest, event: NextFetchEvent) {
  if (!request.headers.get("next-router-prefetch")) {
    event.waitUntil(incrementVisits().catch(() => {}));
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/",
};
