import type { SkillItem } from "@/types/sanity";

// Type-only imports, kept apart from ./client: Skills is a client component and
// pulling in @sanity/client would ship ~576KB to the browser for nothing.

const DEVICON_BASE = "https://cdn.jsdelivr.net/gh/devicons/devicon/icons";

// Builds a devicon URL from a path like `java/java-original.svg`. A full URL
// passes straight through, so either form works in the CMS.
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

// An uploaded file beats the devicon path. Null when neither is set, so the
// card renders iconless rather than broken.
export function skillIconUrl(skill: Pick<SkillItem, "iconUrl" | "deviconPath">): string | null {
  return skill.iconUrl ?? deviconUrl(skill.deviconPath);
}
