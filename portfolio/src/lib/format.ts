import type { ExperienceItem, SocialLinkItem } from "@/types/sanity";

/**
 * Small pure formatters shared by client components. Type-only imports, so
 * this is safe to pull into the browser bundle.
 */

/**
 * Splits a title into the two lines the hero lockup renders. The first word
 * goes on line one, everything else on line two, so a one-word or
 * three-word title still fills both lines the GSAP timeline animates.
 */
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

/**
 * The CMS stores a bare month count so the frontend owns the wording.
 * Returns null for missing/zero/negative values so no pill is rendered at all
 * rather than something like "0 months".
 */
function formatDurationMonths(months: number | null | undefined): string | null {
  if (typeof months !== "number" || !Number.isFinite(months) || months <= 0) {
    return null;
  }
  return `${months} ${months === 1 ? "month" : "months"}`;
}

/**
 * The duration shown on an experience card.
 *
 * `durationLabel` is a free-text override for periods a month count can't
 * express ("2022 — Present"). When it's empty we fall back to the numeric
 * month count. Returns null when neither is set, so the caller drops the whole
 * pill rather than rendering an empty one.
 */
export function resolveDuration(
  item: Pick<ExperienceItem, "durationMonths" | "durationLabel">,
): string | null {
  const label = item.durationLabel?.trim();
  return label ? label : formatDurationMonths(item.durationMonths);
}

/**
 * Turns a social entry into an href.
 *
 * WhatsApp is the reason `linkType` exists: wa.me only accepts bare digits, so
 * a number typed as "+389 70 123 456" has to be stripped. Returns null for a
 * blank value so half-filled CMS rows are skipped instead of rendering a dead
 * icon.
 */
export function socialHref(
  link: Pick<SocialLinkItem, "linkType" | "value">,
): string | null {
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

/**
 * Only http(s) links should open in a new tab — `mailto:` and `tel:` hand off
 * to a native app, where a blank target leaves an empty window behind.
 */
export function isExternalHref(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

/** Splits a textarea value into paragraphs on blank lines. */
export function toParagraphs(text: string | null | undefined): string[] {
  return (text ?? "")
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

/**
 * Non-mutating ascending sort on an optional `order` field. Items without an
 * order sink to the end instead of disappearing or landing arbitrarily.
 */
export function sortByOrder<T extends { order?: number | null }>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => {
    const left = typeof a.order === "number" ? a.order : Number.POSITIVE_INFINITY;
    const right = typeof b.order === "number" ? b.order : Number.POSITIVE_INFINITY;
    return left - right;
  });
}
