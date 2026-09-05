import {
  aboutFallback,
  experienceFallback,
  heroFallback,
  projectsFallback,
  skillsFallback,
} from "@/content/fallbacks";
import { getPortfolio, getProjects } from "@/sanity/fetch";
import { projectSlug, socialHref } from "@/lib/format";
import type { About, Experience, Hero, Project, Skills, SocialLinkItem } from "@/types/sanity";

// CMS content first, hardcoded fallback second, applied per field so a
// half-filled CMS still renders a complete page. Kept apart from @/lib/content
// because this pulls in @sanity/client, which must stay out of the browser.

// Uses the CMS string when it has content, otherwise the fallback.
function text(value: string | null | undefined, fallback: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

// Uses the CMS array only when it has items, otherwise the fallback.
function list<T>(value: readonly T[] | null | undefined, fallback: T[]): T[] {
  return value && value.length > 0 ? [...value] : fallback;
}

export type PortfolioContent = {
  hero: Hero;
  about: About;
  experience: Experience;
  skills: Skills;
};

export async function getPortfolioContent(): Promise<PortfolioContent> {
  const cms = await getPortfolio();

  return {
    hero: {
      roleTag: text(cms?.hero?.roleTag, heroFallback.roleTag),
      mainTitle: text(cms?.hero?.mainTitle, heroFallback.mainTitle),
      subtitle: text(cms?.hero?.subtitle, heroFallback.subtitle),
    },
    about: {
      description: text(cms?.about?.description, aboutFallback.description),
      tags: list(cms?.about?.tags, aboutFallback.tags ?? []),
    },
    experience: {
      experienceDescription: text(
        cms?.experience?.experienceDescription,
        experienceFallback.experienceDescription,
      ),
      experienceItems: list(
        cms?.experience?.experienceItems,
        experienceFallback.experienceItems ?? [],
      ),
    },
    skills: {
      skillItems: list(cms?.skills?.skillItems, skillsFallback.skillItems ?? []),
    },
  };
}

// No fallback here on purpose: the old hardcoded list was placeholders, so
// falling back to it would render dead links. Empty means no icon list.
export async function getSocialLinks(): Promise<SocialLinkItem[]> {
  const cms = await getPortfolio();
  const links = cms?.social?.socialLinks ?? [];
  return links.filter((link) => socialHref(link) !== null);
}

// All-or-nothing, so a project deleted in the CMS actually disappears instead
// of the demo content reappearing next to it.
export async function getProjectList(): Promise<Project[]> {
  const projects = await getProjects();
  return projects.length > 0 ? projects : projectsFallback;
}

// De-duplicated so the route, generateStaticParams and the sitemap can never
// disagree about which project pages exist.
export async function getProjectSlugs(): Promise<string[]> {
  const slugs = (await getProjectList())
    .map(projectSlug)
    .filter((slug): slug is string => slug !== null);
  return [...new Set(slugs)];
}

// Reads the same cached list the page renders, so metadata and content can
// never describe different projects.
export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const projects = await getProjectList();
  return projects.find((project) => projectSlug(project) === slug) ?? null;
}
