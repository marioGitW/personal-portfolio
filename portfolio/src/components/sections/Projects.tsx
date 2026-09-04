"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ProjectModal } from "@/components/projects/ProjectModal";
import { ProjectsScroller } from "@/components/projects/ProjectsScroller";
import { sectionCopy } from "@/content/fallbacks";
import { registerGsapPlugins } from "@/lib/animations";
import type { Project } from "@/types/sanity";

type ProjectsProps = {
  projects: Project[];
};

export function Projects({ projects }: ProjectsProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const clipRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);

  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [closing, setClosing] = useState(false);

  // Animates an inner wrapper, not the section: the section is also the pin
  // target, and tweening its transform fought with the pin's own.
  useEffect(() => {
    const section = sectionRef.current;
    const intro = introRef.current;
    if (!section || !intro) {
      return;
    }

    registerGsapPlugins();

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reducedMotion) {
      gsap.set(intro, { opacity: 1, y: 0 });
      return;
    }

    gsap.set(intro, { opacity: 0, y: 32 });

    const tween = gsap.to(intro, {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: "power3.out",
      scrollTrigger: {
        trigger: section,
        start: "top 85%",
      },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, []);

  // Desktop: vertical scroll pins the section and drives the track sideways.
  useEffect(() => {
    const section = sectionRef.current;
    const clip = clipRef.current;
    const track = trackRef.current;
    if (!section || !clip || !track) {
      return;
    }

    registerGsapPlugins();

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      return;
    }

    const mm = gsap.matchMedia();

    mm.add("(min-width: 1024px)", () => {
      const getDistance = () => Math.max(0, track.scrollWidth - clip.clientWidth);

      const st = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: () => `+=${getDistance()}`,
        pin: true,
        // anticipatePin assumes native scroll input; against Lenis's
        // programmatic scrollTo it mistimed the pin swap and flashed ~3000px.
        anticipatePin: 0,
        scrub: 0.6,
        invalidateOnRefresh: true,
        animation: gsap.to(track, {
          x: () => -getDistance(),
          ease: "none",
        }),
      });

      return () => st.kill();
    });

    return () => mm.revert();
    // Card widths are CSS-driven, so only the card count changes the distance;
    // getDistance() re-measures the DOM on every refresh.
  }, [projects.length]);

  const handleOpen = (project: Project) => {
    setActiveProject(project);
    setClosing(false);
  };

  const handleRequestClose = () => {
    setClosing(true);
  };

  const handleExited = () => {
    setActiveProject(null);
    setClosing(false);
  };

  return (
    <section id="projects" ref={sectionRef} className="relative w-full py-28">
      <div ref={introRef}>
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <p className="font-heading text-xs tracking-[0.2em] text-slate-500 uppercase">
            {sectionCopy.projects.eyebrow}
          </p>
          <h2 className="mt-3">
            {sectionCopy.projects.titleLead}{" "}
            <span className="text-accent-gradient">{sectionCopy.projects.titleAccent}</span>
          </h2>
          <p className="mt-4 text-slate-600 dark:text-slate-400">
            {sectionCopy.projects.description}
          </p>
        </div>

        <div ref={clipRef} className="relative mt-14 lg:overflow-hidden">
          <ProjectsScroller ref={trackRef} projects={projects} onOpen={handleOpen} />
        </div>
      </div>

      <ProjectModal
        project={activeProject}
        closing={closing}
        onRequestClose={handleRequestClose}
        onExited={handleExited}
      />
    </section>
  );
}
