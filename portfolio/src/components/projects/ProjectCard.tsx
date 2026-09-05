"use client";

import { ArrowRight } from "lucide-react";
import { ProjectVisual } from "@/components/projects/ProjectVisual";
import type { Project } from "@/types/sanity";

type ProjectCardProps = {
  project: Project;
  onOpen: (project: Project) => void;
};

export function ProjectCard({ project, onOpen }: ProjectCardProps) {
  // Card and modal read the same fields; no per-view duplicate copy.
  const title = project.thumbnailTitle ?? project.title;

  // The card box itself never moves: only its contents react to hover. Lifting
  // the whole card pushed it under the track's clip and gave the transformed
  // box its own composited layer, which is where the edge fringe came from.
  //
  // No border either: `inset-0` resolves to the padding box, so a border ring
  // sits outside the image and both overlays and nothing can darken it. Any
  // light colour there reads as a hairline around the card.
  return (
    <button
      type="button"
      onClick={() => onOpen(project)}
      className="group relative isolate flex h-full w-full flex-col justify-end overflow-hidden rounded-3xl text-left shadow-xl shadow-slate-900/10 focus-visible:outline-none"
    >
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
    </button>
  );
}
