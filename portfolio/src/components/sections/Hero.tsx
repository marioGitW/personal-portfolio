"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { HeroIntro } from "@/components/sections/HeroIntro";
import { MosaicPortrait, type MosaicPortraitHandle } from "@/components/sections/MosaicPortrait";
import { Button } from "@/components/ui/Button";
import { ResumeModal } from "@/components/ui/ResumeModal";
import { prefersReducedMotion, registerGsapPlugins } from "@/lib/animations";
import { splitTitleLines } from "@/lib/format";
import { HERO_NAME_CLASSES } from "@/lib/intro";
import type { Hero as HeroContent } from "@/types/sanity";

type HeroProps = {
  hero: HeroContent;
};

// From lg up the left padding lines the text up with the navbar logo, but never
// closer to the viewport edge than 7rem, which clears the SocialSidebar. The %
// resolves against the section, so the scrollbar is excluded the same way the
// header's mx-auto container excludes it. No z-index of its own: its parts sit on either
// side of the portrait, the name behind it and the rest in front.
const COPY_CLASSES =
  "relative mx-auto flex w-full max-w-[1400px] flex-col justify-start px-4 pt-10 sm:px-6 sm:pt-14 md:pr-24 md:pl-24 lg:h-full lg:justify-center lg:pt-0 lg:pr-6 lg:pl-[max(1.5rem,calc(7rem_-_max(0px,50%_-_700px)))]";

// In front of the portrait. Near lg the tagline runs across its box, where the figure would
// otherwise paint it out.
const COPY_FRONT_CLASSES = "relative z-30";

// The negative margin cancels the big caps' left side-bearing, so the letters
// line up optically with the eyebrow, tagline and buttons. It restates the lg
// name size because an em here would use the h1's own size, not the lines'. Behind the
// portrait, which covers the end of the name.
const NAME_CLASSES =
  "relative z-10 mt-5 text-center lg:-ml-[calc(clamp(3.5rem,12.5vw,13rem)*0.055)] lg:text-left";

export function Hero({ hero }: HeroProps) {
  const title = hero.mainTitle ?? "";
  // Always two lines: both spans must exist for the GSAP timeline to run.
  const [lineOne, lineTwo] = splitTitleLines(title);
  // Set only when a CV is uploaded in the CMS; without one the button and its
  // modal are left out entirely rather than opening onto a dead iframe.
  const resumeUrl = hero.resumeUrl;
  const resumeButtonRef = useRef<HTMLButtonElement>(null);
  const [resumeOpen, setResumeOpen] = useState(false);

  const sectionRef = useRef<HTMLElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const portraitRef = useRef<HTMLDivElement>(null);
  const portraitBoxRef = useRef<HTMLDivElement>(null);
  const portraitImageRef = useRef<HTMLImageElement>(null);
  const mosaicRef = useRef<MosaicPortraitHandle>(null);

  // Outer wrappers carry the scroll tween, and the copy's three parts carry it separately so
  // none of them traps the others on its side of the portrait. Their entrance is CSS further
  // in (.hero-enter-* in globals.css), so the two never write to the same transform.
  useEffect(() => {
    const section = sectionRef.current;
    const copy = copyRef.current;
    const portrait = portraitRef.current;

    if (!section || !copy || !portrait || prefersReducedMotion()) {
      return;
    }

    registerGsapPlugins();

    const parallax = gsap
      .timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom top",
          scrub: 0.6,
        },
      })
      .to(portrait, { y: -40, ease: "none" }, 0)
      .to(copy.children, { y: -20, opacity: 0.85, ease: "none" }, 0);

    return () => {
      parallax.scrollTrigger?.kill();
      parallax.kill();
    };
  }, []);

  return (
    <section
      id="home"
      aria-labelledby="hero-title"
      ref={sectionRef}
      className="relative w-full overflow-clip pb-10 sm:pb-14 lg:h-[calc(100svh-var(--header-height))] lg:min-h-[600px] lg:pb-0"
    >
      {/* First in the DOM so its opaque backdrop is parsed ahead of the portrait. */}
      <HeroIntro mosaicRef={mosaicRef} />

      {/* Stacks above the portrait on mobile; centred from lg up with the
          portrait bleeding behind it. */}
      <div ref={copyRef} className={COPY_CLASSES}>
        <div className={COPY_FRONT_CLASSES}>
          <p className="hero-enter-eyebrow flex items-center justify-center gap-2 font-heading text-[0.6875rem] font-semibold tracking-[0.3em] text-copy uppercase max-[431px]:text-[clamp(0.625rem,2.85vw,0.6875rem)] max-[431px]:tracking-[0.18em] sm:gap-2.5 lg:justify-start lg:text-[0.8125rem]">
            <span data-intro-hide="eyebrow-dot" className="hero-eyebrow-dot" aria-hidden="true" />
            <span data-intro-hide="eyebrow-text">{hero.roleTag}</span>
          </p>
        </div>

        <h1 id="hero-title" aria-label={title} className={NAME_CLASSES}>
          <span aria-hidden="true" className="block">
            <span className="hero-line-mask block">
              <span
                data-intro-hide="line-one"
                className={`hero-enter-line-one block ${HERO_NAME_CLASSES} text-foreground`}
              >
                {lineOne}
              </span>
            </span>
            <span className="hero-line-mask block">
              <span
                data-intro-hide="line-two"
                className={`hero-enter-line-two block ${HERO_NAME_CLASSES} text-muted`}
              >
                {lineTwo}
              </span>
            </span>
          </span>
        </h1>

        <div className={COPY_FRONT_CLASSES}>
          <p
            data-intro-hide="tagline"
            className="hero-enter-tagline mx-auto mt-6 max-w-[26rem] text-center text-base text-copy sm:mt-8 sm:max-w-[32rem] sm:text-lg md:mt-10 md:max-w-[32rem] lg:mx-0 lg:mt-7 lg:text-left"
          >
            {hero.subtitle}
          </p>

          <div
            data-intro-hide="cta"
            className="hero-enter-cta mt-7 flex flex-wrap justify-center gap-3 lg:justify-start"
          >
            <Button as="a" href="#contact">
              Let&apos;s Connect
            </Button>
            {resumeUrl && (
              <Button ref={resumeButtonRef} variant="secondary" onClick={() => setResumeOpen(true)}>
                View Resume
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Under the copy on mobile. From lg up it is anchored to the content
          container's right edge and overhangs it by a controlled amount,
          running behind the end of the name. A right offset rather than a transform,
          because GSAP owns this element's transform. Where the container
          reaches the viewport (below ~1600px) any overhang would only push
          the photo off-screen and off the name, so it holds the old 3vw
          inset there instead. */}
      <div
        ref={portraitRef}
        className="relative z-20 mt-4 flex justify-center pointer-events-none select-none sm:mt-6 lg:absolute lg:inset-y-0 lg:right-[max(3vw,calc(50%_-_700px_-_clamp(0px,3vw,140px)))] lg:mt-0 lg:items-end lg:justify-end"
      >
        <div className="relative flex lg:h-full lg:items-end">
          {/* Wraps the image's own box, not the taller column. It carries the
              height: a percentage height on the image needs a parent with a
              definite one. 49vw is the old 40vw width cap restated as height,
              so the width still lands on ~40vw without the image letterboxing
              inside it. */}
          <div className="relative lg:h-[min(94%,860px,49vw)]">
            {/* The source runs to the knees. The box keeps the old head-to-waist
                frame and cover + top crops into it, so the head stays the same
                size. The image itself is never seen: it sets the box, carries the
                alt text and is what the mosaic samples. opacity-0 rather than
                hidden, so it still loads. Unoptimized: the file is already a small
                WebP, and re-encoding it visibly softened the face.

                The box is what a finger lands on, and the only part that takes one: a
                swipe up or down scrolls, and a quick pair of taps doesn't zoom. */}
            <div
              ref={portraitBoxRef}
              className="relative touch-pan-y touch-pinch-zoom pointer-coarse:pointer-events-auto lg:h-full"
            >
              <Image
                ref={portraitImageRef}
                data-intro-portrait
                src="/mario-portrait-navy.webp"
                alt={title ? `${title} portrait` : "Portrait"}
                width={1013}
                height={1800}
                unoptimized
                priority
                sizes="(min-width: 1024px) 46vw, (min-width: 640px) 52vw, 68vw"
                className="pointer-events-none aspect-[633/732] h-auto w-[68vw] max-w-[300px] object-cover object-top opacity-0 sm:w-[52vw] sm:max-w-[380px] lg:h-full lg:w-auto lg:max-w-none"
              />
              <MosaicPortrait
                ref={mosaicRef}
                imageRef={portraitImageRef}
                boxRef={portraitBoxRef}
                sectionRef={sectionRef}
              />
            </div>
          </div>
        </div>
      </div>

      {resumeUrl && (
        <ResumeModal
          open={resumeOpen}
          onClose={() => setResumeOpen(false)}
          triggerRef={resumeButtonRef}
          url={resumeUrl}
          filename={hero.resumeFilename}
        />
      )}
    </section>
  );
}
