"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ProjectModal } from "@/components/projects/ProjectModal";
import { ProjectsScroller } from "@/components/projects/ProjectsScroller";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { sectionCopy } from "@/content/fallbacks";
import { useHudReveal } from "@/hooks/useHudReveal";
import { prefersReducedMotion, registerGsapPlugins } from "@/lib/animations";
import type { Project } from "@/types/sanity";

type ProjectsProps = {
  projects: Project[];
};

// How far down the viewport the section's top is when its heading comes in.
const INTRO_LINE = 0.85;

export function Projects({ projects }: ProjectsProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const clipRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);

  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [closing, setClosing] = useState(false);

  // Animates the heading, not the section: the section is also the pin target,
  // and tweening its transform fought with the pin's own. The cards come in on
  // their own, below.
  useGSAP(
    () => {
      const section = sectionRef.current;
      // Already on the page, as after a reload here, it would flash if it were hidden now.
      const seen =
        !section || section.getBoundingClientRect().top < window.innerHeight * INTRO_LINE;
      if (seen || prefersReducedMotion()) {
        return;
      }

      registerGsapPlugins();

      gsap.from(introRef.current, {
        opacity: 0,
        y: 32,
        duration: 0.6,
        ease: "power3.out",
        scrollTrigger: {
          trigger: section,
          start: `top ${INTRO_LINE * 100}%`,
          once: true,
        },
      });
    },
    { scope: sectionRef },
  );

  useHudReveal(sectionRef, { dependencies: [projects.length] });

  // Desktop: vertical scroll pins the section and drives the track sideways.
  // Card widths are CSS-driven, so only the card count changes the distance;
  // getDistance() re-measures the DOM on every refresh.
  useGSAP(
    () => {
      const section = sectionRef.current;
      const clip = clipRef.current;
      const track = trackRef.current;
      if (!section || !clip || !track) {
        return;
      }

      registerGsapPlugins();

      const getDistance = () => Math.max(0, track.scrollWidth - clip.clientWidth);
      let pin: ScrollTrigger | null = null;

      // For a keyboard. A pinned track is moved by the page's scroll and by nothing
      // else, so the browser can't bring a card that is out to the side into view.
      // Where the page has to be for it is known, so it goes there instead.
      const showFocused = (event: FocusEvent) => {
        const target = event.target as HTMLElement;
        const card = target.closest("li");
        if (!card || !target.matches(":focus-visible")) {
          return;
        }
        window.requestAnimationFrame(() => {
          const box = card.getBoundingClientRect();
          const view = clip.getBoundingClientRect();
          if (box.left >= view.left && box.right <= view.right) {
            return;
          }
          if (!pin) {
            target.scrollIntoView({ block: "nearest", inline: "nearest" });
            return;
          }
          const first = track.firstElementChild as HTMLElement;
          const along = (card.offsetLeft - first.offsetLeft) / Math.max(getDistance(), 1);
          pin.scroll(pin.start + Math.min(along, 1) * (pin.end - pin.start));
        });
      };
      track.addEventListener("focusin", showFocused);
      const stopListening = () => track.removeEventListener("focusin", showFocused);

      if (prefersReducedMotion()) {
        return stopListening;
      }

      const mm = gsap.matchMedia();

      mm.add("(min-width: 1024px)", () => {
        const st = ScrollTrigger.create({
          trigger: section,
          start: "top top",
          end: () => `+=${getDistance()}`,
          pin: true,
          // anticipatePin assumes native scroll input; against Lenis's
          // programmatic scrollTo it mistimed the pin swap and flashed ~3000px.
          anticipatePin: 0,
          // The nav-scroll blur puts a filter on an ancestor, which would make a
          // position:fixed pin resolve against that wrapper instead of the
          // viewport. Transform pinning is immune.
          pinType: "transform",
          scrub: 0.6,
          invalidateOnRefresh: true,
          animation: gsap.to(track, {
            x: () => -getDistance(),
            ease: "none",
          }),
        });
        pin = st;

        let lastWidth = document.documentElement.clientWidth;
        let refreshTimeout = 0;
        const scheduleRefresh = () => {
          window.clearTimeout(refreshTimeout);
          refreshTimeout = window.setTimeout(() => ScrollTrigger.refresh(), 150);
        };

        const resizeObserver = new ResizeObserver(() => {
          const width = document.documentElement.clientWidth;
          if (width !== lastWidth) {
            lastWidth = width;
            scheduleRefresh();
          }
        });
        resizeObserver.observe(document.documentElement);

        let disposed = false;
        document.fonts.ready.then(() => {
          if (!disposed) {
            ScrollTrigger.refresh();
          }
        });

        const handleLoad = () => ScrollTrigger.refresh();
        if (document.readyState !== "complete") {
          window.addEventListener("load", handleLoad, { once: true });
        }

        return () => {
          disposed = true;
          pin = null;
          resizeObserver.disconnect();
          window.clearTimeout(refreshTimeout);
          window.removeEventListener("load", handleLoad);
          st.kill();
        };
      });

      return () => {
        stopListening();
        mm.revert();
      };
    },
    { dependencies: [projects.length], revertOnUpdate: true },
  );

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
    <section
      id="projects"
      aria-labelledby="projects-title"
      ref={sectionRef}
      className="relative w-full py-28 max-[431px]:py-10"
    >
      <div ref={introRef} className="mx-auto max-w-2xl px-4 text-center sm:px-6">
        <SectionHeading
          titleId="projects-title"
          eyebrow={sectionCopy.projects.eyebrow}
          title={sectionCopy.projects.titleLead}
          accent={sectionCopy.projects.titleAccent}
          description={sectionCopy.projects.description}
        />
      </div>

      {/* Clipped sideways only, so a card can lift and show its focus ring. With
          no pin to move the track, it scrolls by itself instead, in a box with
          room for both. */}
      <div
        ref={clipRef}
        className="relative mt-14 lg:overflow-x-clip lg:motion-reduce:mt-12 lg:motion-reduce:overflow-x-auto lg:motion-reduce:py-2 lg:noscript:mt-12 lg:noscript:overflow-x-auto lg:noscript:py-2"
      >
        <ProjectsScroller ref={trackRef} projects={projects} onOpen={handleOpen} />
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
