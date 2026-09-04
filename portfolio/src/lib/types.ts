/**
 * Frontend-only types. Content shapes that come from the CMS live in
 * `@/types/sanity` — `Project`, `ExperienceItem`, `SkillItem`, `SocialLinkItem`
 * and friends are defined there, since Sanity is their single source of truth.
 */

/** Site-level values with no CMS equivalent. See `@/content/fallbacks`. */
export type SiteSettings = {
  name: string;
  role: string;
  tagline: string;
  email: string;
};

export type SiteStats = {
  visits: number;
  likes: number;
};
