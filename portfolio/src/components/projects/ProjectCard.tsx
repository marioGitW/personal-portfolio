"use client";

import { ArrowRight } from "lucide-react";
import type { Project } from "@/lib/types";
import { ProjectVisual } from "./ProjectVisual";

type ProjectCardProps = {
  project: Project;
  onOpen: (project: Project) => void;
};

export function ProjectCard({ project, onOpen }: ProjectCardProps) {
  return (
    <button
      type="button"
      data-cursor="View"
      onClick={() => onOpen(project)}
      className="group relative flex h-full w-full flex-col justify-end overflow-hidden rounded-3xl border border-slate-200 text-left shadow-xl shadow-slate-900/10 transition-transform duration-500 ease-out hover:-translate-y-1.5 focus-visible:outline-none dark:border-slate-800"
    >
      <div className="absolute inset-0 h-full w-full overflow-hidden">
        <ProjectVisual
          project={project}
          className="h-full w-full transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />
      </div>

      {/* Baseline legibility gradient — near-opaque at the bottom so the
          text sits on solid dark ground, fading out well before the top so
          the picture still reads clearly up there. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/95 via-black/80 via-45% to-black/10"
      />

      {/* Hover overlay — a flat dark layer across the whole card, distinct
          from the default (near-)bright state. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/60"
      />

      <div className="relative flex flex-col gap-4 p-6 sm:p-8">
        <div>
          <p className="text-xs font-medium tracking-[0.2em] text-cyan-300 uppercase">
            {project.category}
          </p>
          <h3 className="mt-1.5 text-2xl font-bold text-white sm:text-3xl">{project.title}</h3>
          <p className="mt-2 text-sm text-white/70 sm:text-base">{project.shortDescription}</p>
        </div>

        {/* View Details — hidden until hover */}
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
