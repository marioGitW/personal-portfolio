import type { SiteStats } from "@/lib/types";

// sessionStorage key: one like per browser session, surviving refreshes.
export const LIKED_STORAGE_KEY = "portfolio:liked";

// Visits are page loads, not unique visitors. The flag lives on window rather
// than module scope so a Strict Mode remount or Fast Refresh still counts once.
const VISIT_FLAG = "__portfolioVisitRecorded";

type VisitWindow = Window & { [VISIT_FLAG]?: boolean };

// Records this load and returns the counts. A second call in the same load
// falls through to the read-only endpoint instead of counting again.
export async function recordVisit(): Promise<SiteStats | null> {
  const view = window as VisitWindow;
  const alreadyCounted = view[VISIT_FLAG] === true;

  // Claimed before the first await, so two effects in one tick can't both increment.
  view[VISIT_FLAG] = true;

  const response = alreadyCounted
    ? await fetch("/api/stats")
    : await fetch("/api/stats/visit", { method: "POST" });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as SiteStats;
}
