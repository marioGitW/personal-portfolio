"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { HeroIntro } from "@/components/sections/HeroIntro";
import {
  ParticlePortrait,
  type ParticlePortraitHandle,
} from "@/components/sections/ParticlePortrait";
import { Button } from "@/components/ui/Button";
import { ResumeModal } from "@/components/ui/ResumeModal";
import { prefersReducedMotion, registerGsapPlugins } from "@/lib/animations";
import { splitTitleLines } from "@/lib/format";
import type { Hero as HeroContent } from "@/types/sanity";

type HeroProps = {
  hero: HeroContent;
};

// From lg up the left padding lines the text up with the navbar logo, but never
// closer to the viewport edge than 7rem, which clears the SocialSidebar. The %
// resolves against the section, so the scrollbar is excluded the same way the
// header's mx-auto container excludes it.
const COPY_CLASSES =
  "relative z-10 mx-auto flex w-full max-w-[1400px] flex-col justify-start px-4 pt-10 sm:px-6 sm:pt-14 md:pr-24 md:pl-24 lg:h-full lg:justify-center lg:pt-0 lg:pr-6 lg:pl-[max(1.5rem,calc(7rem_-_max(0px,50%_-_700px)))]";

const NAME_SIZE = "text-[clamp(3.5rem,15vw,13rem)] lg:text-[clamp(3.5rem,12.5vw,13rem)]";

// The em tracking resolves against the h1's own font-size (the base h1 size in
// globals.css) and is inherited as that length.
// The negative margin cancels the big caps' left side-bearing, so the letters
// line up optically with the eyebrow, tagline and buttons. It restates the lg
// name size for the same reason: an em here would use the h1's size.
const NAME_CLASSES =
  "mt-5 text-center font-heading leading-[0.86] font-bold tracking-[-0.055em] whitespace-nowrap uppercase lg:-ml-[calc(clamp(3.5rem,12.5vw,13rem)*0.055)] lg:text-left";

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
  const lockupRef = useRef<HTMLHeadingElement>(null);
  const portraitRef = useRef<HTMLDivElement>(null);
  const portraitInnerRef = useRef<HTMLDivElement>(null);
  const portraitBoxRef = useRef<HTMLDivElement>(null);
  const portraitImageRef = useRef<HTMLImageElement>(null);
  const particlesRef = useRef<ParticlePortraitHandle>(null);

  // Outer wrappers carry the scroll tween. The entrance is CSS on their children
  // (.hero-enter-* in globals.css), so the two never write to the same transform.
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
      .to(copy, { y: -20, opacity: 0.85, ease: "none" }, 0);

    return () => {
      parallax.scrollTrigger?.kill();
      parallax.kill();
    };
  }, []);

  // Portrait drifts against the cursor, the name with it. quickTo so repeated
  // pointermove updates do not spin up new tweens.
  useEffect(() => {
    const section = sectionRef.current;
    const portraitInner = portraitInnerRef.current;
    const lockup = lockupRef.current;
    if (!section || !portraitInner || !lockup) {
      return;
    }

    if (!window.matchMedia("(pointer: fine)").matches || prefersReducedMotion()) {
      return;
    }

    const portraitX = gsap.quickTo(portraitInner, "x", { duration: 0.7, ease: "power3.out" });
    const portraitY = gsap.quickTo(portraitInner, "y", { duration: 0.7, ease: "power3.out" });
    const textX = gsap.quickTo(lockup, "x", { duration: 0.8, ease: "power3.out" });
    const textY = gsap.quickTo(lockup, "y", { duration: 0.8, ease: "power3.out" });

    const handleMove = (event: PointerEvent) => {
      const rect = section.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;

      portraitX(px * -26);
      portraitY(py * -18);
      textX(px * 10);
      textY(py * 6);
    };

    const handleLeave = () => {
      portraitX(0);
      portraitY(0);
      textX(0);
      textY(0);
    };

    section.addEventListener("pointermove", handleMove);
    section.addEventListener("pointerleave", handleLeave);

    return () => {
      section.removeEventListener("pointermove", handleMove);
      section.removeEventListener("pointerleave", handleLeave);
    };
  }, []);

  return (
    <section
      id="home"
      aria-labelledby="hero-title"
      ref={sectionRef}
      className="relative w-full overflow-clip pb-10 sm:pb-14 lg:h-[calc(100svh-65px)] lg:min-h-[600px] lg:pb-0"
    >
      {/* First in the DOM so its opaque backdrop is parsed ahead of the portrait. */}
      <HeroIntro particlesRef={particlesRef} />

      {/* Stacks above the portrait on mobile; centred from lg up with the
          portrait bleeding over it. */}
      <div ref={copyRef} className={COPY_CLASSES}>
        <p
          className="hero-enter-eyebrow flex items-center justify-center gap-2 font-heading text-[0.6875rem] font-semibold tracking-[0.3em] text-muted uppercase sm:gap-2.5 lg:justify-start lg:text-[0.8125rem]"
        >
          <span data-intro-hide="eyebrow-dot" className="hero-eyebrow-dot" aria-hidden="true" />
          <span data-intro-hide="eyebrow-text">{hero.roleTag}</span>
        </p>

        <h1 id="hero-title" ref={lockupRef} aria-label={title} className={NAME_CLASSES}>
          <span aria-hidden="true" className="block">
            <span className="hero-line-mask block">
              <span
                data-intro-hide="line-one"
                className={`hero-enter-line-one block ${NAME_SIZE} text-foreground`}
              >
                {lineOne}
              </span>
            </span>
            <span className="hero-line-mask block">
              <span
                data-intro-hide="line-two"
                className={`hero-enter-line-two block ${NAME_SIZE} text-muted`}
              >
                {lineTwo}
              </span>
            </span>
          </span>
        </h1>

        <p
          data-intro-hide="tagline"
          className="hero-enter-tagline mx-auto mt-6 max-w-[26rem] text-center text-base text-muted sm:mt-8 sm:max-w-[32rem] sm:text-lg md:mt-10 md:max-w-[32rem] lg:mx-0 lg:mt-7 lg:text-left"
        >
          {hero.subtitle}
        </p>

        <div
          data-intro-hide="cta"
          className="hero-enter-cta mt-7 flex flex-wrap justify-center gap-3 lg:justify-start"
        >
          <Button href="#contact">Let&apos;s Connect</Button>
          {resumeUrl && (
            <Button ref={resumeButtonRef} variant="secondary" onClick={() => setResumeOpen(true)}>
              View Resume
            </Button>
          )}
        </div>
      </div>

      {/* Under the copy on mobile. From lg up it is anchored to the content
          container's right edge and overhangs it by a controlled amount,
          overlapping the name. A right offset rather than a transform,
          because GSAP owns this element's transform. Where the container
          reaches the viewport (below ~1600px) any overhang would only push
          the photo off-screen and off the name, so it holds the old 3vw
          inset there instead. */}
      <div
        ref={portraitRef}
        className="relative z-10 mt-4 flex justify-center pointer-events-none select-none sm:mt-6 lg:absolute lg:inset-y-0 lg:right-[max(3vw,calc(50%_-_700px_-_clamp(0px,3vw,140px)))] lg:z-20 lg:mt-0 lg:items-end lg:justify-end"
      >
        <div ref={portraitInnerRef} className="relative flex lg:h-full lg:items-end">
          {/* Wraps the image's own box, not the taller column. It carries the
              height: a percentage height on the image needs a parent with a
              definite one. 49vw is the old 40vw width cap restated as height,
              so the width still lands on ~40vw without the image letterboxing
              inside it. */}
          <div className="hero-enter-portrait relative lg:h-[min(94%,860px,49vw)]">
            {/* The source runs to the knees. The box keeps the old head-to-waist
                frame and cover + top crops into it, so the head stays the same
                size. Unoptimized: the file is already a small WebP, and
                re-encoding it visibly softened the face. The wrapper carries
                the bottom fade (.hero-portrait-fade in globals.css, which also
                sets its lg height). */}
            <div ref={portraitBoxRef} className="hero-portrait-fade relative z-10">
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
                className="relative z-10 aspect-[633/732] h-auto w-[68vw] max-w-[300px] object-cover object-top sm:w-[52vw] sm:max-w-[380px] lg:h-full lg:w-auto lg:max-w-none dark:[filter:brightness(0.92)_contrast(1.05)]"
              />
            </div>
            <ParticlePortrait
              ref={particlesRef}
              imageRef={portraitImageRef}
              boxRef={portraitBoxRef}
              sectionRef={sectionRef}
            />
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
