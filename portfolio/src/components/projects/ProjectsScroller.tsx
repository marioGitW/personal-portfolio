import { forwardRef } from "react";
import type { Project } from "@/types/sanity";
import { ProjectCard } from "./ProjectCard";

type ProjectsScrollerProps = {
  projects: Project[];
  onOpen: (project: Project) => void;
};

// The horizontal gallery track. On desktop it's a single-row `w-max` flex
// list that GSAP translates on the x-axis (see Projects.tsx) while its
// wrapper clips overflow — there is no native horizontal scroll here. Below
// the `lg` breakpoint it falls back to a plain vertical stack so touch
// scrolling never fights a nested scroll area.
//
// The left padding is `--page-gutter` (globals.css), not a viewport fraction,
// so the first card's edge lines up with every other section's centred
// `max-w-[1400px]` container instead of drifting left on wide screens. The
// right padding stays a viewport fraction — it's just trailing scroll runway.
export const ProjectsScroller = forwardRef<HTMLUListElement, ProjectsScrollerProps>(
  function ProjectsScroller({ projects, onOpen }, ref) {
    return (
      <ul
        ref={ref}
        className="flex flex-col gap-6 pl-4 sm:pl-6 lg:w-max lg:flex-row lg:items-stretch lg:gap-6 lg:pr-[12vw] lg:pl-[var(--page-gutter)]"
      >
        {projects.map((project) => (
          <li
            key={project._id}
            className="aspect-[8/7] w-full sm:aspect-[12/7] lg:w-[42vw] lg:shrink-0"
          >
            <ProjectCard project={project} onOpen={onOpen} />
          </li>
        ))}
      </ul>
    );
  },
);
