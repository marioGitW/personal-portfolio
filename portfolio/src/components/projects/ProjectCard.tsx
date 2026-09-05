"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProjectVisual } from "@/components/projects/ProjectVisual";
import { projectPath, projectSlug } from "@/lib/format";
import type { Project } from "@/types/sanity";

type ProjectCardProps = {
  project: Project;
  onOpen: (project: Project) => void;
};

// One class string, shared by both branches below so they cannot drift apart.
// The focus ring replaces a bare focus-visible:outline-none, which left the
// card keyboard-focusable with no visible indicator.
const cardClasses =
  "group relative isolate flex h-full w-full flex-col justify-end overflow-hidden rounded-3xl text-left shadow-xl shadow-slate-900/10 focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none";

export function ProjectCard({ project, onOpen }: ProjectCardProps) {
  // Card and modal read the same fields; no per-view duplicate copy.
  const title = project.thumbnailTitle ?? project.title;
  const slug = projectSlug(project);

  // The card box itself never moves: only its contents react to hover. Lifting
  // the whole card pushed it under the track's clip and gave the transformed
  // box its own composited layer, which is where the edge fringe came from.
  //
  // No border either: `inset-0` resolves to the padding box, so a border ring
  // sits outside the image and both overlays and nothing can darken it. Any
  // light colour there reads as a hairline around the card.
  const body = (
    <>
      {/* Every clip in this stack carries the card's radius. Without it the
          image is clipped square here and only rounded by the button, two
          layers up — and because the hover zoom pushes the image past the card
          bounds on its own composited layer, that distant rounded clip leaves a
          bright fringe along the edge. */}
      <div className="absolute inset-0 h-full w-full overflow-hidden rounded-3xl">
        <ProjectVisual
          title={title}
          imageUrl={project.thumbnail?.url ?? null}
          lqip={project.thumbnail?.lqip}
          className="h-full w-full rounded-3xl transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />
      </div>

      {/* Near-opaque at the bottom so the text sits on solid ground, fading
          out before the top so the image still reads. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-t from-black/95 via-black/80 via-45% to-black/10"
      />

      {/* Flat dark layer on hover, distinct from the default bright state. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-3xl bg-black/0 transition-colors duration-300 group-hover:bg-black/60"
      />

      <div className="relative flex flex-col gap-4 p-6 sm:p-8">
        <div>
          {project.thumbnailTag && (
            <p className="text-xs font-medium tracking-[0.2em] text-cyan-300 uppercase">
              {project.thumbnailTag}
            </p>
          )}
          {title && <h3 className="mt-1.5 text-2xl font-bold text-white sm:text-3xl">{title}</h3>}
          {project.thumbnailDescription && (
            <p className="mt-2 hidden text-sm text-white/70 sm:text-base lg:block">
              {project.thumbnailDescription}
            </p>
          )}
        </div>

        {/* Hidden until hover. */}
        <div className="grid grid-rows-[0fr] opacity-0 transition-[grid-template-rows,opacity] duration-300 group-hover:grid-rows-[1fr] group-hover:opacity-100">
          <div className="overflow-hidden">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30">
              View Details
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </div>
    </>
  );

  // A real href, so the project page is crawlable and middle-click or
  // Cmd-click opens it — but preventDefault on a plain left click keeps the
  // modal exactly as it was, URL and all. prefetch is off because a left click
  // never navigates, so prefetching every card would be pure waste.
  if (slug) {
    return (
      <Link
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
      </Link>
    );
  }

  // No slug means no project page exists, so there is nothing to link to.
  return (
    <button type="button" onClick={() => onOpen(project)} className={cardClasses}>
      {body}
    </button>
  );
}
