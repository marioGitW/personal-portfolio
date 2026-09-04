import { siteSettings } from "@/content/fallbacks";
import type { SiteSettings } from "@/lib/types";

// Sync accessor for non-CMS content, safe in client components. CMS-backed
// content is resolved in @/lib/cms, which is async and server-only.
export function getSiteSettings(): SiteSettings {
  return siteSettings;
}
