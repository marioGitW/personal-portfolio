"use client";

import { useEffect, useRef, useState } from "react";
import { SkillCard } from "@/components/sections/SkillCard";
import { EngineeringRadar } from "@/components/ui/EngineeringRadar";
import { PaginationDots } from "@/components/ui/PaginationDots";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { sectionCopy } from "@/content/fallbacks";
import { useHudReveal } from "@/hooks/useHudReveal";
import { useSwipe } from "@/hooks/useSwipe";
import type { Skills as SkillsContent } from "@/types/sanity";

// Whole rows of however many columns the grid below has: 2x4, then 3x3, and then 4x3 on a tablet
// and 3x4 beside the radar. The server renders most phones' 3x3, which are the slowest to have
// to render it again.
const CARDS_PER_PAGE = 9;
const OTHERWISE = [
  { query: "(min-width: 48rem)", cards: 12 },
  { query: "(max-width: 389.98px)", cards: 8 },
];

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
  const [cardsPerPage, setCardsPerPage] = useState(CARDS_PER_PAGE);
  const pages = chunk(items, cardsPerPage);
  const [rawPage, setPage] = useState(0);
  // Clamped during render rather than reset in an effect, so a breakpoint
  // change that shrinks the page count never points past the new last page.
  const page = Math.min(rawPage, Math.max(pages.length - 1, 0));
  const swipe = useSwipe({ count: pages.length, index: page, onSelect: setPage });

  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const queries = OTHERWISE.map(({ query, cards }) => ({
      media: window.matchMedia(query),
      cards,
    }));
    const update = () =>
      setCardsPerPage(queries.find(({ media }) => media.matches)?.cards ?? CARDS_PER_PAGE);
    update();
    for (const { media } of queries) {
      media.addEventListener("change", update);
    }
    return () => {
      for (const { media } of queries) {
        media.removeEventListener("change", update);
      }
    };
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
          {/* Its drawing has room above and below that a phone hasn't. */}
          <EngineeringRadar className="mt-8 w-full max-w-md max-sm:-mt-2 max-sm:-mb-10 sm:max-w-lg" />
        </div>

        <div>
          <p className="section-eyebrow text-center lg:text-left">
            {sectionCopy.skills.toolsLabel}
          </p>

          {/* Clipped sideways only, so the first row can lift. At least a full page tall at each
              width, so nothing below it moves where the server's is shorter. */}
          <div
            className="mt-6 min-h-[368px] touch-pan-y touch-pinch-zoom overflow-x-clip min-[390px]:min-h-[274px] sm:min-h-[324px] lg:min-h-[436px]"
            {...swipe}
          >
            <div
              className="flex transition-transform duration-500 ease-out in-data-dragging:transition-none"
              style={{ transform: `translateX(calc(${page * -100}% + var(--drag, 0px)))` }}
            >
              {pages.map((pageSkills, pageIndex) => (
                <ul
                  key={pageIndex}
                  aria-hidden={pageIndex !== page}
                  className="grid w-full shrink-0 auto-rows-min grid-cols-2 content-start gap-2 min-[390px]:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-3"
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
