"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { GB, MK, RS } from "country-flag-icons/react/3x2";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { prefersReducedMotion, registerGsapPlugins } from "@/lib/animations";
import { getSiteSettings } from "@/lib/content";
import { toParagraphs } from "@/lib/format";
import { aboutLanguages, sectionCopy } from "@/content/fallbacks";
import type { About as AboutContent } from "@/types/sanity";

const FLAGS = { MK, GB, RS } as const;

const languages = aboutLanguages.map((language) => ({
  flag: FLAGS[language.code],
  label: language.label,
}));

type AboutProps = {
  about: AboutContent;
};

export function About({ about }: AboutProps) {
  const site = getSiteSettings();
  const bioParagraphs = toParagraphs(about.description);
  const tags = about.tags ?? [];

  const sectionRef = useRef<HTMLElement>(null);
  const imageWrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const beamRef = useRef<HTMLSpanElement>(null);
  const eyebrowRef = useRef<HTMLParagraphElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const linesRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const imageWrap = imageWrapRef.current;
    const panel = panelRef.current;
    const beam = beamRef.current;
    const eyebrow = eyebrowRef.current;
    const heading = headingRef.current;
    const lines = linesRef.current?.querySelectorAll<HTMLElement>("[data-line]");
    const statsRow = statsRef.current;
    const langRow = langRef.current;

    if (
      !section ||
      !imageWrap ||
      !panel ||
      !beam ||
      !eyebrow ||
      !heading ||
      !lines ||
      !statsRow ||
      !langRow
    ) {
      return;
    }

    const reducedMotion = prefersReducedMotion();
    const revealTargets = [
      imageWrap,
      panel,
      eyebrow,
      heading,
      ...Array.from(lines),
      statsRow,
      langRow,
    ];

    if (reducedMotion) {
      gsap.set(revealTargets, { opacity: 1, y: 0, filter: "blur(0px)" });
      return;
    }

    registerGsapPlugins();

    gsap.set(revealTargets, { opacity: 0, y: 26, filter: "blur(10px)" });

    const timeline = gsap.timeline({
      defaults: { ease: "power3.out" },
      scrollTrigger: {
        trigger: section,
        start: "top 75%",
        toggleActions: "play none none none",
      },
    });

    timeline
      .to(imageWrap, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.8 })
      .to(panel, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.8 }, "<")
      .to(eyebrow, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.5 }, "-=0.5")
      .to(heading, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.7 }, "-=0.3")
      .to(
        Array.from(lines),
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.6, stagger: 0.16 },
        "-=0.35",
      )
      .to(statsRow, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.5 }, "-=0.2")
      .to(langRow, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.5 }, "-=0.3");

    const beamTween = gsap.to(beam, {
      "--border-angle": "360deg",
      duration: 7,
      ease: "none",
      repeat: -1,
    });

    return () => {
      timeline.scrollTrigger?.kill();
      timeline.kill();
      beamTween.kill();
    };
  }, []);

  return (
    <section id="about" ref={sectionRef} className="section-shell">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-center lg:gap-3">
        {/* Scales with the viewport rather than sitting at a fixed cap, with a
            floor so it stops shrinking once the row runs out of room at lg. */}
        <div
          ref={imageWrapRef}
          className="hidden shrink-0 lg:flex lg:w-[clamp(285px,24vw,360px)] lg:-mr-4"
        >
          <Image
            src="/about-me-character.png"
            alt={`3D illustration of ${site.name} holding a laptop, with an arm extended toward the About Me content`}
            width={768}
            height={1365}
            priority
            // Mirrors the width above: browsers also fall back to sizes for
            // layout when the element's own width is auto.
            sizes="(min-width: 1500px) 360px, (max-width: 1187px) 285px, 24vw"
            className="h-auto w-full object-contain select-none"
          />
        </div>

        <div
          ref={panelRef}
          className="about-panel relative w-full rounded-2xl surface-card px-6 py-8 text-center sm:px-10 sm:py-10 lg:max-w-2xl lg:px-10 lg:py-12 lg:text-left"
        >
          <span ref={beamRef} aria-hidden="true" className="about-panel-beam" />

          <SectionHeading
            eyebrow={sectionCopy.about.eyebrow}
            title={sectionCopy.about.titleLead}
            accent={sectionCopy.about.titleAccent}
            eyebrowRef={eyebrowRef}
            headingRef={headingRef}
          />

          <div
            ref={linesRef}
            className="mx-auto mt-6 max-w-md space-y-4 text-base text-slate-600 sm:text-lg md:max-w-xl lg:mx-0 lg:max-w-none dark:text-slate-400"
          >
            {bioParagraphs.map((paragraph, index) => (
              <p key={index} data-line>
                {paragraph}
              </p>
            ))}
          </div>

          {/* Always rendered so the GSAP ref resolves; with no tags it
              collapses rather than leaving a stray divider. */}
          <div
            ref={statsRef}
            className={
              tags.length > 0
                ? "mx-auto mt-10 grid max-w-sm grid-cols-2 gap-x-6 gap-y-8 border-t border-slate-200 pt-8 sm:max-w-lg sm:grid-cols-4 lg:mx-0 lg:max-w-none lg:gap-x-4 lg:gap-y-6 dark:border-slate-800"
                : undefined
            }
          >
            {tags.map((tag) => (
              <div key={tag._key}>
                <p className="font-heading text-2xl font-bold text-accent-gradient sm:text-3xl">
                  {tag.highlightedText}
                </p>
                <p className="mt-1 text-xs tracking-[0.12em] text-slate-500 uppercase">
                  {tag.description}
                </p>
              </div>
            ))}
          </div>

          <div ref={langRef} className="mt-6 flex flex-wrap justify-center gap-2 lg:justify-start">
            {languages.map((language) => (
              <span
                key={language.label}
                className="inline-flex items-center gap-2 rounded-full surface-card px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400"
              >
                <language.flag title={language.label} className="h-3 w-4.5 rounded-[2px]" />
                {language.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
