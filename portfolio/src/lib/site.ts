// The single source of truth for absolute URLs. Canonical tags, Open Graph
// URLs, the sitemap and the JSON-LD all resolve through here, which is what
// keeps them on one domain instead of drifting apart.

// www, not the apex: that is the primary domain on Vercel and the apex
// redirects to it, so canonicals have to name the redirect target.
const PRODUCTION_URL = "https://www.mariospasovski.com";

// SITE_URL overrides for local or staging builds. Vercel's per-deployment
// origin is deliberately not consulted: a preview build must still emit
// production canonicals, or every preview becomes a duplicate of the real
// site in the index.
export const siteUrl = (process.env.SITE_URL ?? PRODUCTION_URL).replace(/\/+$/, "");

/** Absolute URL for a root-relative path. */
export function absoluteUrl(path: string): string {
  return new URL(path, `${siteUrl}/`).toString();
}
