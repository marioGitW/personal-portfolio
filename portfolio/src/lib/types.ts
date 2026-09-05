// Frontend-only types. CMS content shapes live in @/types/sanity, where Sanity
// is their single source of truth.

// Site-level values with no CMS equivalent. See @/content/fallbacks.
export type SiteSettings = {
  name: string;
  role: string;
  /** Meta description. Longer and more factual than `tagline`, which is UI copy. */
  description: string;
  tagline: string;
  email: string;
};

export type SiteStats = {
  visits: number;
  likes: number;
};
