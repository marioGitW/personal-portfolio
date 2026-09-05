import type { ExperienceItem, Project, SocialLinkItem } from "@/types/sanity";

// Pure formatters shared by client components. Type-only imports, so this is
// safe in the browser bundle.

// Splits a title into the hero's two animated lines: first word, then the rest.
export function splitTitleLines(title: string | null | undefined): [string, string] {
  const words = title?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (words.length === 0) {
    return ["", ""];
  }
  if (words.length === 1) {
    return [words[0], ""];
  }
  return [words[0], words.slice(1).join(" ")];
}

// Null for missing/zero values, so no pill renders rather than "0 months".
function formatDurationMonths(months: number | null | undefined): string | null {
  if (typeof months !== "number" || !Number.isFinite(months) || months <= 0) {
    return null;
  }
  return `${months} ${months === 1 ? "month" : "months"}`;
}

// durationLabel is a free-text override for spans a month count can't express
// ("2022 — Present"). Null when neither is set, so the caller drops the pill.
export function resolveDuration(
  item: Pick<ExperienceItem, "durationMonths" | "durationLabel">,
): string | null {
  const label = item.durationLabel?.trim();
  return label ? label : formatDurationMonths(item.durationMonths);
}

// linkType exists because wa.me only accepts bare digits, so a formatted number
// has to be stripped. Null for a blank value, so half-filled rows are skipped.
export function socialHref(link: Pick<SocialLinkItem, "linkType" | "value">): string | null {
  const value = link.value?.trim();
  if (!value) {
    return null;
  }

  switch (link.linkType) {
    case "whatsapp": {
      const digits = value.replace(/\D/g, "");
      return digits ? `https://wa.me/${digits}` : null;
    }
    case "email":
      return value.startsWith("mailto:") ? value : `mailto:${value}`;
    case "phone": {
      const dialable = value.replace(/[^\d+]/g, "");
      return dialable ? `tel:${dialable}` : null;
    }
    case "url":
    default:
      // Tolerates "github.com/me" as well as a full URL.
      return /^https?:\/\//i.test(value) ? value : `https://${value}`;
  }
}

// Only http(s) opens in a new tab; mailto:/tel: would leave an empty window.
export function isExternalHref(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

// Splits a textarea value into paragraphs on blank lines.
export function toParagraphs(text: string | null | undefined): string[] {
  return (text ?? "")
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

// Trimmed, or null when blank. A project without a slug has no /projects page,
// so its card stays a button and it is left out of the sitemap.
export function projectSlug(project: Pick<Project, "slug">): string | null {
  const slug = project.slug?.trim();
  return slug ? slug : null;
}

/** Route for a project detail page. The one place the URL shape is defined. */
export function projectPath(slug: string): string {
  return `/projects/${slug}`;
}

// Non-mutating sort; items without an order sink to the end.
export function sortByOrder<T extends { order?: number | null }>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => {
    const left = typeof a.order === "number" ? a.order : Number.POSITIVE_INFINITY;
    const right = typeof b.order === "number" ? b.order : Number.POSITIVE_INFINITY;
    return left - right;
  });
}
