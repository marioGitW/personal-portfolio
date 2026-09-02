import { forwardRef } from "react";
import type { Project } from "@/lib/types";
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
export const ProjectsScroller = forwardRef<HTMLUListElement, ProjectsScrollerProps>(
  function ProjectsScroller({ projects, onOpen }, ref) {
    return (
      <ul
        ref={ref}
        className="flex flex-col gap-6 pl-4 sm:pl-6 lg:w-max lg:flex-row lg:items-stretch lg:gap-6 lg:pr-[12vw] lg:pl-[6vw]"
      >
        {projects.map((project) => (
          <li
            key={project.id}
            className="aspect-[8/7] w-full sm:aspect-[12/7] lg:w-[42vw] lg:shrink-0"
          >
            <ProjectCard project={project} onOpen={onOpen} />
          </li>
        ))}
      </ul>
    );
  },
);
