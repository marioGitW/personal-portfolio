import { experience } from "@/content/experience";
import { projects } from "@/content/projects";
import { siteSettings } from "@/content/site";
import { skills } from "@/content/skills";
import { socialLinks } from "@/content/social";
import type {
  ExperienceItem,
  Project,
  SiteSettings,
  Skill,
  SocialLink,
} from "@/lib/types";

export function getProjects(): Project[] {
  return projects;
}

export function getExperience(): ExperienceItem[] {
  return experience;
}

export function getSkills(): Skill[] {
  return skills;
}

export function getSocialLinks(): SocialLink[] {
  return socialLinks;
}

export function getSiteSettings(): SiteSettings {
  return siteSettings;
}
