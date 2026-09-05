import type { Metadata } from "next";
import { siteSettings } from "@/content/fallbacks";
import { projectPath, toParagraphs } from "@/lib/format";
import { absoluteUrl } from "@/lib/site";
import type { Project } from "@/types/sanity";

// Metadata derived from CMS content. Everything a future CMS-driven route
// needs lives here, so adding one means calling a function rather than
// rebuilding the metadata shape.

// Served from public/ and named explicitly rather than through the
// opengraph-image file convention: that convention bakes an absolute URL from
// the build-time origin and ignores metadataBase, which produced a
// localhost URL. Declared here, metadataBase resolves it correctly everywhere.
export const shareImage = {
  url: "/opengraph-image.png",
  width: 1200,
  height: 630,
  alt: "Mario Spasovski — Aspiring Software Engineer. Curious about technology. Passionate about building things that make sense.",
} as const;

// Search results truncate around 160 characters; longer copy is wasted.
const MAX_DESCRIPTION = 160;

// Cuts on a word boundary so a long overview never ends mid-word.
function clamp(text: string): string {
  const collapsed = text.replace(/\s+/g, " ").trim();
  if (collapsed.length <= MAX_DESCRIPTION) {
    return collapsed;
  }
  const cut = collapsed.slice(0, MAX_DESCRIPTION - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 40 ? cut.slice(0, lastSpace) : cut).replace(/[,;:.\s]+$/, "")}…`;
}

/** The name shown on the card, the modal and the detail page. */
export function projectTitle(project: Project): string {
  return project.thumbnailTitle?.trim() || project.title?.trim() || "Project";
}

// seoDescription is the editor's override; otherwise the card copy, which is
// already a one-line summary; otherwise the opening of the overview. Each
// source is text that is rendered somewhere on the page.
export function projectDescription(project: Project): string {
  const explicit = project.seoDescription?.trim() || project.thumbnailDescription?.trim();
  if (explicit) {
    return clamp(explicit);
  }

  const [firstParagraph] = toParagraphs(project.projectOverview);
  if (firstParagraph) {
    return clamp(firstParagraph);
  }

  return clamp(`${projectTitle(project)}, a project by ${siteSettings.name}.`);
}

export function projectMetadata(project: Project, slug: string): Metadata {
  const title = projectTitle(project);
  const description = projectDescription(project);
  const path = projectPath(slug);
  const thumbnail = project.thumbnail?.url;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "article",
      url: path,
      siteName: siteSettings.name,
      title: `${title} | ${siteSettings.name}`,
      description,
      locale: "en_US",
      // Child metadata replaces the parent's openGraph wholesale, so a project
      // without a thumbnail needs the site card named again here.
      images: thumbnail
        ? [{ url: absoluteUrl(thumbnail), alt: `${title} — project thumbnail` }]
        : [shareImage],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${siteSettings.name}`,
      description,
      images: thumbnail ? [absoluteUrl(thumbnail)] : [shareImage.url],
    },
  };
}
