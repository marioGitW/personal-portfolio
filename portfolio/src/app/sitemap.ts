import type { MetadataRoute } from "next";
import { getProjectSlugs } from "@/lib/cms";
import { projectPath, projectSlug } from "@/lib/format";
import { absoluteUrl } from "@/lib/site";
import { sanityClient } from "@/sanity/client";

// Matches the page, so a project published in the Studio appears in the
// sitemap on the same schedule it appears on the site.
export const revalidate = 60;

// The same documents the homepage and /projects/[slug] read, plus _updatedAt,
// which the shared queries don't select. The ordering copies projectsQuery so
// a duplicated slug takes its date from the project the page actually renders.
const sitemapQuery = /* groq */ `{
  "homeUpdatedAt": *[_type in ["portfolio", "project"] && !(_id in path("drafts.**"))]
    | order(_updatedAt desc)[0]._updatedAt,
  "projects": *[_type == "project" && !(_id in path("drafts.**")) && defined(slug.current)]
    | order(coalesce(order, 9999) asc, _createdAt asc){
      "slug": slug.current,
      _updatedAt
    }
}`;

type SitemapData = {
  homeUpdatedAt: string | null;
  projects: { slug: string | null; _updatedAt: string }[];
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // No CMS configured (a fresh clone): every page renders the hardcoded
  // fallbacks, which have no edit date, so lastmod is left out, not invented.
  if (!sanityClient) {
    const slugs = await getProjectSlugs();
    return [
      { url: absoluteUrl("/"), changeFrequency: "monthly", priority: 1 },
      ...slugs.map((slug) => ({
        url: absoluteUrl(projectPath(slug)),
        changeFrequency: "monthly" as const,
        priority: 0.8,
      })),
    ];
  }

  // Deliberately not caught, unlike @/sanity/fetch. A failed revalidation
  // keeps serving the last sitemap Next generated, where a caught error would
  // replace it with fallback URLs or nothing; at build time it fails the build,
  // which leaves the previous deployment live.
  const { homeUpdatedAt, projects } = await sanityClient.fetch<SitemapData>(sitemapQuery);

  if (projects.length === 0) {
    throw new Error("[sitemap] Sanity returned no projects; keeping the previous sitemap.");
  }

  // Trimmed and de-duplicated the way getProjectSlugs does it, so every URL
  // here is one the /projects/[slug] route renders.
  const updatedAtBySlug = new Map<string, string>();
  for (const project of projects) {
    const slug = projectSlug(project);
    if (slug && !updatedAtBySlug.has(slug)) {
      updatedAtBySlug.set(slug, project._updatedAt);
    }
  }

  return [
    {
      url: absoluteUrl("/"),
      lastModified: homeUpdatedAt ?? undefined,
      changeFrequency: "monthly",
      priority: 1,
    },
    ...Array.from(updatedAtBySlug, ([slug, lastModified]) => ({
      url: absoluteUrl(projectPath(slug)),
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
