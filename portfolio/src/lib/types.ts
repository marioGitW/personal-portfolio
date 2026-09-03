import type { ComponentType, SVGProps } from "react";

export type Project = {
  id: string;
  slug: string;
  title: string;
  category: string;
  shortDescription: string;
  /** Project Overview body. Omit to skip that modal section entirely. */
  description?: string;
  technologies?: string[];
  date?: string;
  liveUrl?: string;
  githubUrl?: string;
  featured?: boolean;
  /** null/undefined renders the built-in placeholder visual. */
  coverImage?: string | null;
  screenshots?: string[];
  /**
   * Direct video file (mp4/webm/ogg) or an embeddable player URL.
   * Any other truthy value (e.g. "placeholder") renders a polished
   * "coming soon" placeholder instead of a broken player.
   */
  demoVideoUrl?: string;
  keyFeatures?: string[];
};

export type ExperienceItem = {
  company: string;
  role: string;
  employmentType: string;
  mode: string;
  dateRange: string;
  logo?: string;
  bullets: string[];
};

export type Skill = {
  name: string;
  category: string;
  icon: string;
};

export type SocialLink = {
  name: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

export type SiteSettings = {
  name: string;
  nameWords: string[];
  highlightedWordIndex: number;
  role: string;
  tagline: string;
  bio: string;
  email: string;
};

export type SiteStats = {
  visits: number;
  likes: number;
};
