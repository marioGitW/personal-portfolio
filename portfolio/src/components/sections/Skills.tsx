"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { AssetIcon } from "@/components/ui/AssetIcon";
import { EngineeringRadar } from "@/components/ui/EngineeringRadar";
import { sectionCopy } from "@/content/fallbacks";
import { registerGsapPlugins } from "@/lib/animations";
import { skillIconUrl } from "@/sanity/devicon";
import type { Skills as SkillsContent, SkillItem } from "@/types/sanity";

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
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
    <section id="skills" className="mx-auto w-full max-w-[1400px] px-4 py-28 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <p className="font-heading text-xs tracking-[0.2em] text-slate-500 uppercase">
          {sectionCopy.skills.eyebrow}
        </p>
        <h2 className="mt-3">{sectionCopy.skills.title}</h2>
        <p className="mt-4 text-slate-600 dark:text-slate-400">
          {sectionCopy.skills.description}
        </p>
      </div>

      <div className="mt-14 grid gap-16 lg:grid-cols-[1.05fr_1fr] lg:items-start lg:gap-10">
        <div className="flex flex-col items-center text-center">
          <p className="font-heading text-xs tracking-[0.2em] text-slate-500 uppercase">
            {sectionCopy.skills.radarLabel}
          </p>
          <EngineeringRadar className="mt-8 w-full max-w-md sm:max-w-lg" />
        </div>

        <div>
          <p className="font-heading text-center text-xs tracking-[0.2em] text-slate-500 uppercase lg:text-left">
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
            <div
              className="mt-6 flex items-center justify-center gap-1 lg:justify-start"
              role="tablist"
              aria-label="Tools and technologies pages"
            >
              {pages.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={i === page}
                  aria-label={`Show tools page ${i + 1} of ${pages.length}`}
                  onClick={() => setPage(i)}
                  className="group grid cursor-pointer place-items-center p-2.5"
                >
                  <span
                    aria-hidden="true"
                    className={`block h-1.5 rounded-full transition-all duration-300 ${
                      i === page
                        ? "w-6 bg-accent-gradient"
                        : "w-1.5 bg-slate-300 group-hover:bg-slate-400 dark:bg-slate-700"
                    }`}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function SkillCard({ skill }: { skill: SkillItem }) {
  const iconUrl = skillIconUrl(skill);

  return (
    <li className="group relative">
      <span
        aria-hidden="true"
        className="absolute -inset-1.5 -z-10 rounded-xl bg-accent-gradient opacity-0 blur-lg transition-opacity duration-500 group-hover:opacity-25"
      />
      <div className="relative flex min-h-[86px] flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border border-slate-200 bg-background p-2.5 text-center shadow-sm transition-transform duration-300 group-hover:-translate-y-1 sm:min-h-[100px] sm:p-3 dark:border-slate-800">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -translate-x-full skew-x-12 bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full dark:via-white/10"
        />

        <span className="relative grid size-7 place-items-center sm:size-9">
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-full bg-accent-gradient opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-50"
          />
          <AssetIcon
            src={iconUrl}
            alt={skill.title ?? ""}
            className="relative size-full object-contain p-0.5 transition-transform duration-300 group-hover:scale-110"
          />
        </span>

        <div className="relative">
          <p className="text-[11px] leading-tight font-semibold text-foreground transition-colors duration-300 group-hover:text-indigo-500 sm:text-xs dark:group-hover:text-cyan-300">
            {skill.title}
          </p>
          <span
            aria-hidden="true"
            className="absolute -bottom-1 left-1/2 h-0.5 w-5 origin-center -translate-x-1/2 scale-x-0 bg-accent-gradient transition-transform duration-300 group-hover:scale-x-100"
          />
        </div>
      </div>
    </li>
  );
}
