import { forwardRef } from "react";
import { ProjectCard } from "@/components/projects/ProjectCard";
import type { Project } from "@/types/sanity";

type ProjectsScrollerProps = {
  projects: Project[];
  onOpen: (project: Project) => void;
};

// Desktop: a w-max flex row that GSAP translates while the wrapper clips it —
// no native horizontal scroll. Below lg it stacks vertically so touch scrolling
// never fights a nested scroll area.
//
// Left padding uses --page-gutter so the first card lines up with every other
// section's centred container; the right padding is just scroll runway.
export const ProjectsScroller = forwardRef<HTMLUListElement, ProjectsScrollerProps>(
  function ProjectsScroller({ projects, onOpen }, ref) {
    return (
      <ul
        ref={ref}
        className="flex flex-col gap-6 px-4 sm:px-6 lg:w-max lg:flex-row lg:items-stretch lg:gap-6 lg:pr-[12vw] lg:pl-[var(--page-gutter)]"
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
