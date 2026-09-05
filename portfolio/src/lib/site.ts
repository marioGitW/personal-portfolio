// The single source of truth for absolute URLs. Canonical tags, Open Graph
// URLs, the sitemap and the JSON-LD all resolve through here, which is what
// keeps them on one domain instead of drifting apart.

const PRODUCTION_URL = "https://mario-spasovski.vercel.app";

// SITE_URL overrides for local work or a future custom domain. Vercel's
// per-deployment origin is deliberately not consulted: a preview build must
// still emit production canonicals, or every preview becomes a duplicate of
// the real site in the index.
export const siteUrl = (process.env.SITE_URL ?? PRODUCTION_URL).replace(/\/+$/, "");

/** Absolute URL for a root-relative path. */
export function absoluteUrl(path: string): string {
  return new URL(path, `${siteUrl}/`).toString();
}
