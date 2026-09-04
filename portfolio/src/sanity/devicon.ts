import type { SkillItem } from "@/types/sanity";

/**
 * Pure icon-URL helpers with no imports beyond types.
 *
 * Kept separate from `./image` and `./client` on purpose: `Skills` is a client
 * component, and importing anything that transitively pulls in `@sanity/client`
 * ships the whole Sanity client (~576KB) to the browser for no benefit.
 */

const DEVICON_BASE = "https://cdn.jsdelivr.net/gh/devicons/devicon/icons";

/**
 * Builds a devicon CDN URL from a path such as `java/java-original.svg`.
 * A full URL is passed straight through, so either form works in the CMS.
 */
function deviconUrl(path: string | null | undefined): string | null {
  const trimmed = path?.trim().replace(/^\/+/, "");
  if (!trimmed) {
    return null;
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `${DEVICON_BASE}/${trimmed}`;
}

/**
 * Skill icon resolution order: an uploaded file overrides the devicon path,
 * matching how the field is described in the Studio. Null when neither is set,
 * so the card renders without an icon rather than a broken image.
 */
export function skillIconUrl(skill: Pick<SkillItem, "iconUrl" | "deviconPath">): string | null {
  return skill.iconUrl ?? deviconUrl(skill.deviconPath);
}
