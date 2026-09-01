"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { registerGsapPlugins } from "@/lib/animations";
import { getSkills } from "@/lib/content";

export function Skills() {
  const skills = getSkills();
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const list = listRef.current;
    if (!list) {
      return;
    }

    registerGsapPlugins();

    const items = list.querySelectorAll("li");
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
        trigger: list,
        start: "top 85%",
      },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, []);

  return (
    <section id="skills" className="mx-auto w-full max-w-[1400px] px-4 py-28 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <p className="font-heading text-xs tracking-[0.2em] text-slate-500 uppercase">
          What I work with
        </p>
        <h2 className="mt-3">
         Skills
        </h2>
        
        <p className="mt-4 text-slate-600 dark:text-slate-400">
          A snapshot of the languages, frameworks, and tools I reach for when building and
          shipping software.
        </p>
      </div>

      <ul
        ref={listRef}
        className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:gap-6"
      >
        {skills.map((skill) => (
          <li key={skill.name} className="group relative">
            <span
              aria-hidden="true"
              className="absolute -inset-2 -z-10 rounded-2xl bg-accent-gradient opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-25"
            />
            <div className="relative flex min-h-[150px] flex-col items-center justify-center gap-4 overflow-hidden rounded-2xl border border-slate-200 bg-background p-6 text-center shadow-md transition-transform duration-300 group-hover:-translate-y-1 sm:min-h-[170px] md:min-h-[190px] dark:border-slate-800">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -translate-x-full skew-x-12 bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full dark:via-white/10"
              />

              <span className="relative grid size-14 place-items-center sm:size-16 md:size-20">
                <span
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full bg-accent-gradient opacity-0 blur-lg transition-opacity duration-300 group-hover:opacity-50"
                />
                <Image
                  src={skill.icon}
                  alt={skill.name}
                  width={80}
                  height={80}
                  loading="lazy"
                  className="relative size-full object-contain p-2 transition-transform duration-300 group-hover:scale-110"
                />
              </span>

              <div className="relative">
                <p className="text-sm font-semibold text-foreground transition-colors duration-300 group-hover:text-indigo-500 sm:text-base dark:group-hover:text-cyan-300">
                  {skill.name}
                </p>
                <span
                  aria-hidden="true"
                  className="absolute -bottom-1.5 left-1/2 h-0.5 w-8 origin-center -translate-x-1/2 scale-x-0 bg-accent-gradient transition-transform duration-300 group-hover:scale-x-100"
                />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
