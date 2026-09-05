import type { MetadataRoute } from "next";
import { getProjectSlugs } from "@/lib/cms";
import { projectPath } from "@/lib/format";
import { absoluteUrl } from "@/lib/site";

// Matches the page, so a project published in the Studio appears in the
// sitemap on the same schedule it appears on the site.
export const revalidate = 60;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();

  // Already trimmed and de-duplicated, and the same source generateStaticParams
  // reads — so the sitemap cannot list a URL that 404s.
  const projects = await getProjectSlugs();

  return [
    {
      url: absoluteUrl("/"),
      lastModified,
      changeFrequency: "monthly",
      priority: 1,
    },
    ...projects.map((slug) => ({
      url: absoluteUrl(projectPath(slug)),
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
