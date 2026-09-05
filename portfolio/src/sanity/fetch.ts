import { cache } from "react";
import { sanityClient } from "@/sanity/client";
import { portfolioQuery, projectsQuery } from "@/sanity/queries";
import type { Portfolio, Project } from "@/types/sanity";

// Server Components only — @/sanity/client imports "server-only" to enforce it.
// Errors are swallowed so a CMS outage degrades to the fallbacks, never a
// broken site.

// cache() so every caller in a request shares one round trip, not several:
// the layout, the page, generateMetadata, generateStaticParams and the sitemap
// all read through these.
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

export const getProjects = cache(async (): Promise<Project[]> => {
  if (!sanityClient) {
    return [];
  }

  try {
    return (await sanityClient.fetch<Project[] | null>(projectsQuery)) ?? [];
  } catch (error) {
    console.error("[sanity] Failed to fetch projects:", error);
    return [];
  }
});
