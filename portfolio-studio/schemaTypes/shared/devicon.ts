// Skill icons are devicon paths rather than uploads. Keep this in sync with
// deviconUrl in ../portfolio/src/sanity/devicon.ts.
export const DEVICON_BASE = 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons'

// Builds a CDN URL from a path like `java/java-original.svg`. A full URL passes
// straight through, so either form works in the Studio.
export function deviconUrl(path?: string): string | undefined {
  const trimmed = path?.trim().replace(/^\/+/, '')
  if (!trimmed) return undefined
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `${DEVICON_BASE}/${trimmed}`
}
