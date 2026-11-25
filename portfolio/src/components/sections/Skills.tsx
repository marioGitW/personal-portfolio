"use client";

import { useEffect, useRef, useState } from "react";
import { SkillCard } from "@/components/sections/SkillCard";
import { EngineeringRadar } from "@/components/ui/EngineeringRadar";
import { PaginationDots } from "@/components/ui/PaginationDots";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { sectionCopy } from "@/content/fallbacks";
import { useHudReveal } from "@/hooks/useHudReveal";
import type { Skills as SkillsContent } from "@/types/sanity";

const CARDS_PER_PAGE_DESKTOP = 12;
const CARDS_PER_PAGE_COMPACT = 9;

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
  // Below lg (tablet and mobile) pages cap at 9 cards so a 3-col grid stays 3x3.
  const [cardsPerPage, setCardsPerPage] = useState(CARDS_PER_PAGE_COMPACT);
  const pages = chunk(items, cardsPerPage);
  const [rawPage, setPage] = useState(0);
  // Clamped during render rather than reset in an effect, so a breakpoint
  // change that shrinks the page count never points past the new last page.
  const page = Math.min(rawPage, Math.max(pages.length - 1, 0));

  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () =>
      setCardsPerPage(mq.matches ? CARDS_PER_PAGE_DESKTOP : CARDS_PER_PAGE_COMPACT);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Again when the pages are cut differently, which puts other tiles on the first one.
  useHudReveal(sectionRef, { dependencies: [items.length, cardsPerPage] });

  return (
    <section id="skills" aria-labelledby="skills-title" ref={sectionRef} className="section-shell">
      <div className="mx-auto max-w-2xl text-center">
        <SectionHeading
          titleId="skills-title"
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

          {/* Clipped sideways only, so the first row can lift. */}
          <div className="mt-6 min-h-[380px] overflow-x-clip sm:min-h-[440px]">
            <div
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
                    <SkillCard key={skill._key} skill={skill} reveal={pageIndex === 0} />
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
            />
          )}
        </div>
      </div>
    </section>
  );
}
