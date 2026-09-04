/**
 * Skill icons are referenced by devicon path rather than uploaded, which is how
 * the frontend already sources them (see `../portfolio/src/content/skills.ts`).
 * Keep this base URL in sync with the `devicon()` helper over there.
 */
export const DEVICON_BASE = 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons'

/**
 * Builds a CDN URL from a devicon path such as `java/java-original.svg`.
 * Tolerates a leading slash and passes a full URL straight through, so pasting
 * either form into the Studio works.
 */
export function deviconUrl(path?: string): string | undefined {
  const trimmed = path?.trim().replace(/^\/+/, '')
  if (!trimmed) return undefined
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `${DEVICON_BASE}/${trimmed}`
}
