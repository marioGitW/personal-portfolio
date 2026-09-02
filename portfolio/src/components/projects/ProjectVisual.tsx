import Image from "next/image";
import type { Project } from "@/lib/types";

type ProjectVisualProps = {
  project: Pick<Project, "title" | "coverImage">;
  className?: string;
};

function getInitials(title: string): string {
  return title
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

export function ProjectVisual({ project, className = "" }: ProjectVisualProps) {
  if (project.coverImage) {
    return (
      <div className={`relative overflow-hidden bg-slate-100 dark:bg-slate-900 ${className}`}>
        <Image src={project.coverImage} alt="" fill className="object-cover" />
      </div>
    );
  }

  return (
    <div
      className={`relative isolate overflow-hidden bg-slate-100 dark:bg-slate-900 ${className}`}
    >
      <span aria-hidden="true" className="project-visual-grid absolute inset-0" />
      <span
        aria-hidden="true"
        className="absolute -top-10 -right-10 size-40 rounded-full bg-accent-gradient opacity-20 blur-3xl"
      />
      <span
        aria-hidden="true"
        className="absolute -bottom-10 -left-10 size-40 rounded-full bg-accent-gradient opacity-10 blur-3xl"
      />
      <span className="relative flex h-full items-center justify-center font-heading text-5xl font-bold text-accent-gradient opacity-70 sm:text-6xl">
        {getInitials(project.title)}
      </span>
    </div>
  );
}
