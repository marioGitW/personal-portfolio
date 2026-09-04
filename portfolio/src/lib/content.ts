import { siteSettings } from "@/content/fallbacks";
import type { SiteSettings } from "@/lib/types";

/**
 * Sync accessor for content that is *not* CMS-driven, safe to call from client
 * components. CMS-backed content — including social links — is resolved in
 * `@/lib/cms`, which is async and server-only.
 */
export function getSiteSettings(): SiteSettings {
  return siteSettings;
}
