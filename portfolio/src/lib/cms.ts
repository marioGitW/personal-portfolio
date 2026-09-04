import {
  aboutFallback,
  experienceFallback,
  heroFallback,
  projectsFallback,
  skillsFallback,
} from "@/content/fallbacks";
import { getPortfolio, getProjects } from "@/sanity/fetch";
import { socialHref } from "@/lib/format";
import type { About, Experience, Hero, Project, Skills, SocialLinkItem } from "@/types/sanity";

/**
 * Server-side resolver: CMS content first, hardcoded fallback second.
 *
 * Kept separate from `@/lib/content` because this module pulls in
 * `@sanity/client`; client components import the sync accessors from there
 * instead, so the Sanity client never lands in the browser bundle.
 *
 * Fallback is applied **per field**, not per section, so a partially filled
 * CMS (one empty field, the rest populated) still renders a complete page.
 */

/** Uses the CMS string when it has actual content, otherwise the fallback. */
function text(value: string | null | undefined, fallback: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

/** Uses the CMS array only when it has items, otherwise the fallback. */
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

/**
 * Social links, filtered to entries that actually resolve to an href.
 *
 * There is no hardcoded fallback here on purpose: the previous hardcoded list
 * held `YOUR_USERNAME`/`YOUR_PHONE_NUMBER` placeholders, so falling back to it
 * would render dead links. An empty result means both the sidebar and footer
 * render no icon list at all.
 */
export async function getSocialLinks(): Promise<SocialLinkItem[]> {
  const cms = await getPortfolio();
  const links = cms?.social?.socialLinks ?? [];
  return links.filter((link) => socialHref(link) !== null);
}

/**
 * Projects are all-or-nothing: if the CMS has any project we show exactly
 * those, so a deleted project actually disappears instead of the demo content
 * reappearing alongside it. The fallback list is only for an empty/unreachable
 * CMS.
 */
export async function getProjectList(): Promise<Project[]> {
  const projects = await getProjects();
  return projects.length > 0 ? projects : projectsFallback;
}
