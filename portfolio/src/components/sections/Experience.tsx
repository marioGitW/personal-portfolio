"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { Calendar, MapPin, Wrench } from "lucide-react";
import { registerGsapPlugins } from "@/lib/animations";
import { getExperience } from "@/lib/content";

export function Experience() {
  const items = getExperience();
  const listRef = useRef<HTMLOListElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const list = listRef.current;
    const progress = progressRef.current;

    if (!list || !progress) {
      return;
    }

    registerGsapPlugins();

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reducedMotion) {
      gsap.set(progress, { scaleY: 1 });
      return;
    }

    gsap.set(progress, { scaleY: 0, transformOrigin: "top" });

    const tween = gsap.to(progress, {
      scaleY: 1,
      ease: "none",
      scrollTrigger: {
        trigger: list,
        start: "top 75%",
        end: "bottom 65%",
        scrub: 0.3,
      },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, []);

  return (
    <section id="experience" className="mx-auto w-full max-w-[1400px] px-4 py-28 sm:px-6">
      <p className="font-heading text-xs tracking-[0.2em] text-slate-500 uppercase">Journey</p>
      <h2 className="mt-3">Where I&apos;ve built real experience</h2>
      <p className="mt-4 max-w-2xl text-slate-600 dark:text-slate-400">
        My path so far — from software engineering internships at Endava and Motion Source to
        freelance computer repair work, picking up modern tools and Agile practices along the
        way.
      </p>

      <ol ref={listRef} className="relative mt-14 space-y-10">
        <span
          aria-hidden="true"
          className="absolute top-2 bottom-2 left-6 w-px bg-slate-200 dark:bg-slate-800"
        />
        <span
          ref={progressRef}
          aria-hidden="true"
          className="absolute top-2 bottom-2 left-6 w-px bg-gradient-to-b from-indigo-500 via-indigo-400 to-cyan-400 shadow-[0_0_10px_1px] shadow-indigo-500/50"
        />

        {items.map((item) => (
          <li key={`${item.company}-${item.dateRange}`} className="relative pl-18">
            <span className="absolute top-1 left-0 grid size-13 place-items-center rounded-full bg-background ring-4 ring-background">
              <span className="grid size-12 place-items-center overflow-hidden rounded-full border border-indigo-400/30 bg-white shadow-md shadow-indigo-500/20">
                {item.logo ? (
                  <Image
                    src={item.logo}
                    alt={`${item.company} logo`}
                    width={30}
                    height={30}
                    className="size-8 object-contain"
                  />
                ) : (
                  <Wrench className="size-5 text-indigo-500" />
                )}
              </span>
            </span>

            <div className="group rounded-2xl border border-slate-200 bg-background p-6 shadow-lg shadow-indigo-500/10 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-500/20 sm:p-8 dark:border-slate-800 dark:hover:border-indigo-500">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h3 className="text-xl font-semibold text-accent-gradient">{item.company}</h3>
                  <p className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                    <MapPin className="size-3.5 text-indigo-400" />
                    {item.mode}
                  </p>
                </div>

                <div className="w-fit shrink-0 rounded-xl border border-indigo-400/25 bg-indigo-500/[0.06] px-3 py-2 sm:text-right">
                  <span className="flex items-center gap-1.5 text-sm text-slate-600 sm:justify-end dark:text-slate-300">
                    <Calendar className="size-3.5 text-cyan-400" />
                    {item.dateRange}
                  </span>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2.5">
                <h4>{item.role}</h4>
                <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-0.5 text-[0.7rem] font-medium tracking-wide text-cyan-600 uppercase dark:text-cyan-300">
                  {item.employmentType}
                </span>
              </div>

              <ul className="mt-4 list-disc space-y-1.5 border-t border-slate-200 pt-4 pl-5 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">
                {item.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
