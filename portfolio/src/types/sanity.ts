// Mirrors the Sanity content model. Every CMS field is optional by design, so
// everything here is nullable and the frontend owns the fallbacks.

// An image asset dereferenced by GROQ. url is null when no image is set.
export type SanityImage = {
  url: string | null;
  lqip: string | null;
  aspectRatio: number | null;
};

// An image plus the array _key React needs for a stable key.
export type SanityScreenshot = SanityImage & {
  _key: string;
};

export type Hero = {
  roleTag: string | null;
  mainTitle: string | null;
  subtitle: string | null;
};

export type AboutTag = {
  _key: string;
  highlightedText: string | null;
  description: string | null;
};

export type About = {
  description: string | null;
  tags: AboutTag[] | null;
};

export type ExperienceItem = {
  _key: string;
  order: number | null;
  name: string | null;
  place: string | null;
  position: string | null;
  type: string | null;
  keyFeatures: string[] | null;
  durationMonths: number | null;
  /** Free-text override, e.g. "2022 — Present". Wins over `durationMonths`. */
  durationLabel: string | null;
  /** Resolved file-asset URL. May be an SVG. */
  iconUrl: string | null;
  iconMimeType: string | null;
};

export type Experience = {
  experienceDescription: string | null;
  experienceItems: ExperienceItem[] | null;
};

export type SkillItem = {
  _key: string;
  title: string | null;
  /** Devicon path or full URL. Used when no icon file is uploaded. */
  deviconPath: string | null;
  /** Resolved file-asset URL for an uploaded override icon. */
  iconUrl: string | null;
  iconMimeType: string | null;
};

export type Skills = {
  skillItems: SkillItem[] | null;
};

/** Platforms with a built-in icon. See `@/components/ui/SocialIcons`. */
export type SocialPlatform = "github" | "linkedin" | "instagram" | "whatsapp" | "email" | "other";

/** How `value` is turned into an href. See `socialHref` in `@/lib/format`. */
export type SocialLinkType = "url" | "whatsapp" | "email" | "phone";

export type SocialLinkItem = {
  _key: string;
  platform: SocialPlatform | null;
  linkType: SocialLinkType | null;
  /** URL, phone number or email address, depending on `linkType`. */
  value: string | null;
  /** Accessible name. Falls back to the platform name. */
  label: string | null;
  /** Resolved file-asset URL for an uploaded override icon. */
  iconUrl: string | null;
  iconMimeType: string | null;
};

export type Social = {
  socialLinks: SocialLinkItem[] | null;
};

export type Portfolio = {
  hero: Hero | null;
  about: About | null;
  experience: Experience | null;
  skills: Skills | null;
  social: Social | null;
};

export type Project = {
  _id: string;
  order: number | null;
  title: string | null;
  slug: string | null;
  /** Fetched and typed for future use; no UI depends on it yet. */
  featured: boolean | null;
  thumbnailTag: string | null;
  thumbnailTitle: string | null;
  thumbnailDescription: string | null;
  thumbnail: SanityImage | null;
  screenshots: SanityScreenshot[] | null;
  demoVideoUrl: string | null;
  techStack: string[] | null;
  projectOverview: string | null;
  keyFeatures: string[] | null;
  liveProjectUrl: string | null;
  sourceCodeUrl: string | null;
};
