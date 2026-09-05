import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

// Replaces the former public/robots.txt so the Sitemap line stays in step with
// the sitemap route and both name the same origin.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // The stats endpoints mutate counters and return no indexable content.
        disallow: "/api/",
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
