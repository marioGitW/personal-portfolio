export type Project = {
  title: string;
  description: string;
  date: string;
  category: string;
  liveUrl: string;
  githubUrl: string;
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
  platform: string;
  url: string;
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
