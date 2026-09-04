import { cache } from "react";
import { sanityClient } from "@/sanity/client";
import { portfolioQuery, projectsQuery } from "@/sanity/queries";
import type { Portfolio, Project } from "@/types/sanity";

// Server Components only — the read token is deliberately not NEXT_PUBLIC_.
// Errors are swallowed so a CMS outage degrades to the fallbacks, never a
// broken site.

// cache() so the layout and the page share one round trip, not two.
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
