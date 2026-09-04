"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { SkillCard } from "@/components/sections/SkillCard";
import { EngineeringRadar } from "@/components/ui/EngineeringRadar";
import { PaginationDots } from "@/components/ui/PaginationDots";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { sectionCopy } from "@/content/fallbacks";
import { prefersReducedMotion, registerGsapPlugins } from "@/lib/animations";
import type { Skills as SkillsContent } from "@/types/sanity";

const CARDS_PER_PAGE = 12;

function chunk<T>(items: T[], size: number): T[][] {
  const pages: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    pages.push(items.slice(i, i + size));
  }
  return pages;
}

type SkillsProps = {
  skills: SkillsContent;
};

export function Skills({ skills }: SkillsProps) {
  // Paginated, not a marquee; chunk adapts to any number of skills.
  const items = skills.skillItems ?? [];
  const pages = chunk(items, CARDS_PER_PAGE);
  const [page, setPage] = useState(0);

  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) {
      return;
    }

    registerGsapPlugins();

    const items = track.querySelectorAll("li");
    const reducedMotion = prefersReducedMotion();

    if (reducedMotion) {
      gsap.set(items, { opacity: 1, y: 0, scale: 1 });
      return;
    }

    gsap.set(items, { opacity: 0, y: 32, scale: 0.94 });

    const tween = gsap.to(items, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.5,
      ease: "power3.out",
      stagger: 0.06,
      scrollTrigger: {
        trigger: track,
        start: "top 85%",
      },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
    // Re-runs if the CMS returns a different number of skills.
  }, [items.length]);

  return (
    <section id="skills" className="section-shell">
      <div className="mx-auto max-w-2xl text-center">
        <SectionHeading
          eyebrow={sectionCopy.skills.eyebrow}
          title={sectionCopy.skills.title}
          description={sectionCopy.skills.description}
        />
      </div>

      <div className="mt-14 grid gap-16 lg:grid-cols-[1.05fr_1fr] lg:items-start lg:gap-10">
        <div className="flex flex-col items-center text-center">
          <p className="section-eyebrow">{sectionCopy.skills.radarLabel}</p>
          <EngineeringRadar className="mt-8 w-full max-w-md sm:max-w-lg" />
        </div>

        <div>
          <p className="section-eyebrow text-center lg:text-left">
            {sectionCopy.skills.toolsLabel}
          </p>

          <div className="mt-6 min-h-[380px] overflow-hidden sm:min-h-[440px]">
            <div
              ref={trackRef}
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${page * 100}%)` }}
            >
              {pages.map((pageSkills, pageIndex) => (
                <ul
                  key={pageIndex}
                  aria-hidden={pageIndex !== page}
                  className="grid w-full shrink-0 auto-rows-min grid-cols-3 content-start gap-2 sm:gap-3"
                >
                  {pageSkills.map((skill) => (
                    <SkillCard key={skill._key} skill={skill} />
                  ))}
                </ul>
              ))}
            </div>
          </div>

          {pages.length > 1 && (
            <PaginationDots
              count={pages.length}
              active={page}
              onSelect={setPage}
              variant="tab"
              label="Tools and technologies pages"
              itemLabel={(i) => `Show tools page ${i + 1} of ${pages.length}`}
              className="mt-6 flex items-center justify-center gap-1 lg:justify-start"
              buttonClassName="group"
              inactiveClassName="w-1.5 bg-slate-300 group-hover:bg-slate-400 dark:bg-slate-700"
            />
          )}
        </div>
      </div>
    </section>
  );
}
