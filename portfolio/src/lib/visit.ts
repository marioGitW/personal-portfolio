import type { SiteStats } from "@/lib/types";

/**
 * Visits are page loads, not unique visitors — every refresh should count once,
 * and nothing else should count at all.
 *
 * The "already counted" flag lives on `window` rather than in module scope on
 * purpose. React Strict Mode mounts effects twice in development, and a Fast
 * Refresh re-evaluates modules while keeping the page; both share one `window`,
 * so both are covered. A real navigation or refresh gets a fresh `window` and
 * counts again. That is the exact lifetime we want, with no timers and no
 * arbitrary debounce window.
 */
const VISIT_FLAG = "__portfolioVisitRecorded";

type VisitWindow = Window & { [VISIT_FLAG]?: boolean };

/**
 * Records this page load and returns the current counts. Called more than once
 * per load (a Strict Mode remount) it falls through to the read-only endpoint,
 * so the UI still gets its numbers without touching the counter.
 */
export async function recordVisit(): Promise<SiteStats | null> {
  const view = window as VisitWindow;
  const alreadyCounted = view[VISIT_FLAG] === true;

  // Claimed synchronously, before the first `await`, so two effects racing in
  // the same tick cannot both reach the incrementing endpoint.
  view[VISIT_FLAG] = true;

  const response = alreadyCounted
    ? await fetch("/api/stats")
    : await fetch("/api/stats/visit", { method: "POST" });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as SiteStats;
}
