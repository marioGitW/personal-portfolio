import { cache } from "react";
import { sanityClient } from "./client";
import { portfolioQuery, projectsQuery } from "./queries";
import type { Portfolio, Project } from "@/types/sanity";

/**
 * Call these from Server Components only — the dataset is private and the read
 * token is server-side (`SANITY_API_READ_TOKEN`, no `NEXT_PUBLIC_` prefix, so
 * Next never inlines it into client JS).
 *
 * Both fetchers swallow errors on purpose: a CMS outage, a bad token or an
 * unconfigured environment should degrade to the hardcoded fallbacks in
 * `@/content/fallbacks`, never take the site down. The error is logged so the
 * failure is still visible in server logs.
 */

/**
 * Wrapped in `cache()` so the layout (social sidebar) and the page (everything
 * else) share one round trip per request instead of querying twice.
 */
export const getPortfolio = cache(async (): Promise<Portfolio | null> => {
  if (!sanityClient) {
    return null;
  }

  try {
    return await sanityClient.fetch<Portfolio | null>(portfolioQuery);
  } catch (error) {
    console.error("[sanity] Failed to fetch portfolio:", error);
    return null;
  }
});

export async function getProjects(): Promise<Project[]> {
  if (!sanityClient) {
    return [];
  }

  try {
    return (await sanityClient.fetch<Project[] | null>(projectsQuery)) ?? [];
  } catch (error) {
    console.error("[sanity] Failed to fetch projects:", error);
    return [];
  }
}
