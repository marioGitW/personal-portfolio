"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProjectVisual } from "@/components/projects/ProjectVisual";
import { HudFrame, HudTag } from "@/components/ui/hud-frame";
import { projectPath, projectSlug } from "@/lib/format";
import type { Project } from "@/types/sanity";

type ProjectCardProps = {
  project: Project;
  onOpen: (project: Project) => void;
};

// One class string, shared by both branches below so they cannot drift apart.
// The fill is the outline's own colour: the picture covers it, and any other
// colour would show as a fringe along the picture's antialiased diagonals.
const cardClasses =
  "hud-picture flex h-full w-full flex-col justify-end text-left [--hud-fill:var(--border)]";

export function ProjectCard({ project, onOpen }: ProjectCardProps) {
  // Card and modal read the same fields; no per-view duplicate copy.
  const title = project.thumbnailTitle ?? project.title;
  const slug = projectSlug(project);

  // The fade and the light text on it look the same in both themes: `dark`
  // re-scopes the tokens for this subtree, so --background is the dark navy and
  // --foreground the light text either way. The frame and the focus ring stay
  // outside it, on the page's own tokens, because they draw against the page
  // rather than the card.
  const body = (
    <div className="dark contents">
      <div className="hud-media">
        <ProjectVisual
          title={title}
          imageUrl={project.thumbnail?.url ?? null}
          lqip={project.thumbnail?.lqip}
          className="h-full w-full"
        />

        {/* Near-opaque at the bottom so the text sits on solid ground, fading
            out before the top so the image still reads. The cards are at their
            smallest just past lg, where the text fills them, and so does this.
            In sRGB, which looks the same for one colour and has a far cheaper
            shader than oklab. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-linear-to-t/srgb from-background/95 via-background/80 via-45% to-background/10 lg:max-xl:via-70% lg:max-xl:to-background/60"
        />
      </div>

      <div data-hud-item className="relative p-6 sm:p-8 lg:max-xl:p-6">
        {project.thumbnailTag && (
          <p className="text-xs font-medium tracking-[0.2em] text-foreground uppercase">
            {project.thumbnailTag}
          </p>
        )}
        {title && (
          <h3 className="mt-1.5 text-2xl font-bold text-foreground sm:text-3xl">{title}</h3>
        )}
        {project.thumbnailDescription && (
          <p className="mt-2 hidden text-sm text-muted sm:text-base lg:block">
            {project.thumbnailDescription}
          </p>
        )}
      </div>

      {/* In the corner rather than under the text, so it can be there at rest:
          a card at 1024px has no room for one more line. Last, so it is also
          the last thing in the link's name. */}
      <HudTag
        data-hud-item
        className="absolute top-3 right-3 text-[11px] font-semibold tracking-[0.06em] sm:top-4 sm:right-4"
      >
        View Details
        <ArrowRight aria-hidden="true" className="size-3.5" />
      </HudTag>
    </div>
  );

  // A real href, so the project page is crawlable and middle-click or
  // Cmd-click opens it — but preventDefault on a plain left click keeps the
  // modal exactly as it was, URL and all. prefetch is off because a left click
  // never navigates, so prefetching every card would be pure waste.
  if (slug) {
    return (
      <HudFrame
        as={Link}
        size="md"
        interactive="segment"
        reveal
        href={projectPath(slug)}
        prefetch={false}
        draggable={false}
        onClick={(event) => {
          event.preventDefault();
          onOpen(project);
        }}
        className={cardClasses}
      >
        {body}
      </HudFrame>
    );
  }

  // No slug means no project page exists, so there is nothing to link to.
  return (
    <HudFrame
      as="button"
      type="button"
      size="md"
      interactive="segment"
      reveal
      onClick={() => onOpen(project)}
      className={cardClasses}
    >
      {body}
    </HudFrame>
  );
}
