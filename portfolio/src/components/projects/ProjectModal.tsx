"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import gsap from "gsap";
import { prefersReducedMotion } from "@/lib/animations";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { lockScroll, unlockScroll } from "@/lib/scrollLock";
import { toParagraphs } from "@/lib/format";
import { ProjectVisual } from "@/components/projects/ProjectVisual";
import {
  ProjectScreenshots,
  type ResolvedScreenshot,
} from "@/components/projects/ProjectScreenshots";
import { ProjectVideo } from "@/components/projects/ProjectVideo";
import { TechStack } from "@/components/projects/TechStack";
import { ProjectLinks } from "@/components/projects/ProjectLinks";
import type { Project } from "@/types/sanity";

type ProjectModalProps = {
  project: Project | null;
  closing: boolean;
  onRequestClose: () => void;
  onExited: () => void;
};

export function ProjectModal({ project, closing, onRequestClose, onExited }: ProjectModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  // Runs on a fresh open, not the tail end of a close.
  useEffect(() => {
    if (!project || closing) {
      return;
    }

    const backdrop = backdropRef.current;
    const dialog = dialogRef.current;
    if (!backdrop || !dialog) {
      return;
    }

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    lockScroll();

    const items = contentRef.current?.querySelectorAll<HTMLElement>("[data-modal-item]") ?? [];
    const reducedMotion = prefersReducedMotion();

    window.requestAnimationFrame(() => closeButtonRef.current?.focus());

    if (reducedMotion) {
      gsap.set(backdrop, { opacity: 1 });
      gsap.set(dialog, { opacity: 1, scale: 1, y: 0 });
      gsap.set(items, { opacity: 1, y: 0 });
      return;
    }

    gsap.set(backdrop, { opacity: 0 });
    gsap.set(dialog, { opacity: 0, scale: 0.96, y: 16 });
    gsap.set(items, { opacity: 0, y: 12 });

    const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });
    timeline.to(backdrop, { opacity: 1, duration: 0.25 });
    timeline.to(dialog, { opacity: 1, scale: 1, y: 0, duration: 0.4 }, "-=0.15");
    if (items.length) {
      timeline.to(items, { opacity: 1, y: 0, duration: 0.35, stagger: 0.05 }, "-=0.2");
    }

    return () => {
      timeline.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs on open only
  }, [project]);

  // Plays first, then onExited unmounts, so the modal is gone only once it is
  // fully invisible.
  useEffect(() => {
    if (!closing) {
      return;
    }

    unlockScroll();

    const backdrop = backdropRef.current;
    const dialog = dialogRef.current;
    const reducedMotion = prefersReducedMotion();

    if (!backdrop || !dialog || reducedMotion) {
      onExited();
      previouslyFocusedRef.current?.focus();
      return;
    }

    const timeline = gsap.timeline({
      defaults: { ease: "power2.in" },
      onComplete: () => {
        onExited();
        previouslyFocusedRef.current?.focus();
      },
    });
    timeline.to(dialog, { opacity: 0, scale: 0.97, y: 10, duration: 0.2 });
    timeline.to(backdrop, { opacity: 0, duration: 0.2 }, "-=0.12");

    return () => {
      timeline.kill();
    };
  }, [closing, onExited]);

  useFocusTrap(Boolean(project), dialogRef, onRequestClose);

  useEffect(() => {
    return () => {
      unlockScroll();
    };
  }, []);

  if (!project) {
    return null;
  }

  // Drops screenshots whose asset did not resolve, rather than showing a
  // broken slide.
  const screenshots = (project.screenshots ?? []).filter(
    (screenshot): screenshot is ResolvedScreenshot => Boolean(screenshot?.url),
  );
  const technologies = project.techStack ?? [];
  const keyFeatures = project.keyFeatures ?? [];
  const overviewParagraphs = toParagraphs(project.projectOverview);
  const title = project.thumbnailTitle ?? project.title;

  return createPortal(
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:p-6"
      onClick={onRequestClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-modal-title"
        onClick={(event) => event.stopPropagation()}
        className="relative flex h-full w-full max-w-4xl flex-col overflow-hidden surface-card shadow-2xl shadow-indigo-500/20 sm:h-auto sm:max-h-[90vh] sm:rounded-2xl"
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onRequestClose}
          aria-label="Close project details"
          className="absolute top-4 right-4 z-10 icon-button bg-background/80 backdrop-blur-sm transition hover:border-indigo-500"
        >
          <X className="size-4" />
        </button>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain" data-lenis-prevent>
          <div ref={contentRef} className="p-6 sm:p-10">
            <div data-modal-item>
              {project.thumbnailTag && <p className="section-eyebrow">{project.thumbnailTag}</p>}
              <h2
                id="project-modal-title"
                className="mt-2 text-2xl font-bold tracking-tight sm:text-4xl"
              >
                {title}
              </h2>
              {project.thumbnailDescription && (
                <p className="mt-3 text-base text-slate-600 sm:text-lg dark:text-slate-400">
                  {project.thumbnailDescription}
                </p>
              )}
            </div>

            <div data-modal-item>
              {screenshots.length > 0 ? (
                <div className="mt-8">
                  <h3 className="text-sm font-semibold tracking-wide uppercase">Screenshots</h3>
                  <ProjectScreenshots
                    screenshots={screenshots}
                    projectTitle={title}
                    className="mt-4"
                  />
                </div>
              ) : (
                <ProjectVisual
                  title={title}
                  imageUrl={project.thumbnail?.url ?? null}
                  lqip={project.thumbnail?.lqip}
                  className="mt-8 aspect-video w-full rounded-xl"
                />
              )}
            </div>

            {project.demoVideoUrl && (
              <div data-modal-item className="mt-8">
                <h3 className="text-sm font-semibold tracking-wide uppercase">Demo Video</h3>
                <ProjectVideo
                  demoVideoUrl={project.demoVideoUrl}
                  projectTitle={title}
                  className="mt-4"
                />
              </div>
            )}

            {technologies.length > 0 && (
              <div data-modal-item className="mt-8">
                <h3 className="text-sm font-semibold tracking-wide uppercase">Tech Stack</h3>
                <TechStack technologies={technologies} className="mt-4" />
              </div>
            )}

            {overviewParagraphs.length > 0 && (
              <div data-modal-item className="mt-8">
                <h3 className="text-sm font-semibold tracking-wide uppercase">Project Overview</h3>
                <div className="mt-3 space-y-3 text-sm text-slate-600 sm:text-base dark:text-slate-400">
                  {overviewParagraphs.map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              </div>
            )}

            {keyFeatures.length > 0 && (
              <div data-modal-item className="mt-8">
                <h3 className="text-sm font-semibold tracking-wide uppercase">Key Features</h3>
                <ul className="mt-3 space-y-2">
                  {keyFeatures.map((feature, index) => (
                    // Index-keyed: feature text is free-form and may repeat.
                    <li
                      key={index}
                      className="flex items-start gap-2.5 text-sm text-slate-600 sm:text-base dark:text-slate-400"
                    >
                      <span
                        aria-hidden="true"
                        className="mt-2 size-1.5 shrink-0 rounded-full bg-accent-gradient"
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div data-modal-item>
              <ProjectLinks project={project} className="mt-10" />
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
