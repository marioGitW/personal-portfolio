import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProjectLinks } from "@/components/projects/ProjectLinks";
import {
  ProjectScreenshots,
  type ResolvedScreenshot,
} from "@/components/projects/ProjectScreenshots";
import { ProjectVideo } from "@/components/projects/ProjectVideo";
import { ProjectVisual } from "@/components/projects/ProjectVisual";
import { TechStack } from "@/components/projects/TechStack";
import { toParagraphs } from "@/lib/format";
import { projectTitle } from "@/lib/seo";
import type { Project } from "@/types/sanity";

// The page counterpart of ProjectModal: the same blocks in the same order,
// rendered on the server so the overview, features and tech stack are real
// HTML rather than markup that only exists once a dialog has been opened.
//
// ProjectModal is deliberately left as it is rather than refactored into a
// shared body: its blocks are wrapped in [data-modal-item] for a GSAP stagger,
// and threading that through would mean editing a working animation timeline.

const SECTION_HEADING = "text-sm font-semibold tracking-wide uppercase";
const PROSE = "text-sm text-slate-600 sm:text-base dark:text-slate-400";

export function ProjectDetail({ project }: { project: Project }) {
  const title = projectTitle(project);

  // Drops screenshots whose asset did not resolve, matching the modal.
  const screenshots = (project.screenshots ?? []).filter(
    (screenshot): screenshot is ResolvedScreenshot => Boolean(screenshot?.url),
  );
  const technologies = project.techStack ?? [];
  const keyFeatures = project.keyFeatures ?? [];
  const overviewParagraphs = toParagraphs(project.projectOverview);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <li>
            <Link href="/" className="transition hover:text-foreground">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/#projects" className="transition hover:text-foreground">
              Projects
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-foreground">
            {title}
          </li>
        </ol>
      </nav>

      <header className="mt-8">
        {project.thumbnailTag && <p className="section-eyebrow">{project.thumbnailTag}</p>}
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-5xl">{title}</h1>
        {project.thumbnailDescription && (
          <p className="mt-4 text-base text-slate-600 sm:text-lg dark:text-slate-400">
            {project.thumbnailDescription}
          </p>
        )}
      </header>

      {screenshots.length > 0 ? (
        <section aria-labelledby="project-screenshots" className="mt-10">
          <h2 id="project-screenshots" className={SECTION_HEADING}>
            Screenshots
          </h2>
          <ProjectScreenshots screenshots={screenshots} projectTitle={title} className="mt-4" />
        </section>
      ) : (
        <ProjectVisual
          title={title}
          imageUrl={project.thumbnail?.url ?? null}
          lqip={project.thumbnail?.lqip}
          sizes="(min-width: 896px) 896px, 100vw"
          className="mt-10 aspect-video w-full rounded-xl"
        />
      )}

      {project.demoVideoUrl && (
        <section aria-labelledby="project-demo" className="mt-10">
          <h2 id="project-demo" className={SECTION_HEADING}>
            Demo Video
          </h2>
          <ProjectVideo demoVideoUrl={project.demoVideoUrl} projectTitle={title} className="mt-4" />
        </section>
      )}

      {technologies.length > 0 && (
        <section aria-labelledby="project-tech" className="mt-10">
          <h2 id="project-tech" className={SECTION_HEADING}>
            Tech Stack
          </h2>
          <TechStack technologies={technologies} className="mt-4" />
        </section>
      )}

      {overviewParagraphs.length > 0 && (
        <section aria-labelledby="project-overview" className="mt-10">
          <h2 id="project-overview" className={SECTION_HEADING}>
            Project Overview
          </h2>
          <div className={`mt-3 space-y-3 ${PROSE}`}>
            {overviewParagraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </section>
      )}

      {keyFeatures.length > 0 && (
        <section aria-labelledby="project-features" className="mt-10">
          <h2 id="project-features" className={SECTION_HEADING}>
            Key Features
          </h2>
          <ul className="mt-3 space-y-2">
            {keyFeatures.map((feature, index) => (
              // Index-keyed: feature text is free-form and may repeat.
              <li key={index} className={`flex items-start gap-2.5 ${PROSE}`}>
                <span
                  aria-hidden="true"
                  className="mt-2 size-1.5 shrink-0 rounded-full bg-accent-gradient"
                />
                {feature}
              </li>
            ))}
          </ul>
        </section>
      )}

      <ProjectLinks project={project} className="mt-12" />

      <Link
        href="/#projects"
        className="mt-12 inline-flex items-center gap-2 rounded-full text-sm font-semibold text-slate-500 transition hover:text-foreground focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none dark:text-slate-400"
      >
        <ArrowLeft className="size-4" />
        Back to all projects
      </Link>
    </div>
  );
}
