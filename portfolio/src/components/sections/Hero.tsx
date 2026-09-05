"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { Button } from "@/components/ui/Button";
import { ResumeModal } from "@/components/ui/ResumeModal";
import { prefersReducedMotion, registerGsapPlugins } from "@/lib/animations";
import { splitTitleLines } from "@/lib/format";
import type { Hero as HeroContent } from "@/types/sanity";

type HeroProps = {
  hero: HeroContent;
};

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
  const eyebrowRef = useRef<HTMLParagraphElement>(null);
  const lineOneRef = useRef<HTMLSpanElement>(null);
  const lineTwoRef = useRef<HTMLSpanElement>(null);
  const taglineRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const portraitRef = useRef<HTMLDivElement>(null);
  const portraitInnerRef = useRef<HTMLDivElement>(null);

  // Outer wrappers carry the scroll tween, their children the entrance tween,
  // so the two never write to the same transform.
  useEffect(() => {
    const section = sectionRef.current;
    const copy = copyRef.current;
    const eyebrow = eyebrowRef.current;
    const lineOne = lineOneRef.current;
    const lineTwo = lineTwoRef.current;
    const tagline = taglineRef.current;
    const cta = ctaRef.current;
    const portrait = portraitRef.current;
    const portraitInner = portraitInnerRef.current;

    if (
      !section ||
      !copy ||
      !eyebrow ||
      !lineOne ||
      !lineTwo ||
      !tagline ||
      !cta ||
      !portrait ||
      !portraitInner
    ) {
      return;
    }

    const reducedMotion = prefersReducedMotion();

    if (reducedMotion) {
      gsap.set([eyebrow, tagline, cta], { opacity: 1, y: 0 });
      gsap.set([lineOne, lineTwo], { yPercent: 0 });
      gsap.set(portraitInner, { opacity: 1, y: 0, scale: 1 });
      return;
    }

    registerGsapPlugins();

    gsap.set([lineOne, lineTwo], { yPercent: 130 });
    gsap.set([eyebrow, tagline, cta], { opacity: 0, y: 18 });
    // Starts tighter than its resting tracking so the reveal reads as intentional.
    gsap.set(eyebrow, { letterSpacing: "0.08em" });
    gsap.set(portraitInner, { opacity: 0, y: 48, scale: 0.965 });

    const timeline = gsap.timeline({ defaults: { ease: "power3.out" }, paused: true });

    timeline
      .to(eyebrow, { opacity: 1, y: 0, letterSpacing: "0.3em", duration: 0.7 })
      .to(lineOne, { yPercent: 0, duration: 1.05, ease: "power4.out" }, "-=0.2")
      .to(lineTwo, { yPercent: 0, duration: 1.05, ease: "power4.out" }, "-=0.88")
      .to(
        portraitInner,
        { opacity: 1, y: 0, scale: 1, duration: 1.25, ease: "power2.out" },
        "-=0.85",
      )
      .to(tagline, { opacity: 1, y: 0, duration: 0.6 }, "-=0.8")
      .to(cta, { opacity: 1, y: 0, duration: 0.6 }, "-=0.45");

    // Wait for the preloader so the sequence is actually seen; the timeout
    // keeps the hero from sticking if that event never fires.
    const start = () => timeline.play();
    window.addEventListener("preloader:done", start, { once: true });
    const fallback = window.setTimeout(start, 3200);

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
      window.removeEventListener("preloader:done", start);
      window.clearTimeout(fallback);
      timeline.kill();
      parallax.scrollTrigger?.kill();
      parallax.kill();
    };
  }, []);

  // Writes CSS custom properties rather than state, so it never re-renders.
  useEffect(() => {
    const lockup = lockupRef.current;
    if (!lockup) {
      return;
    }

    if (!window.matchMedia("(pointer: fine)").matches || prefersReducedMotion()) {
      return;
    }

    const handleMove = (event: PointerEvent) => {
      const rect = lockup.getBoundingClientRect();
      lockup.style.setProperty("--mx", `${((event.clientX - rect.left) / rect.width) * 100}%`);
      lockup.style.setProperty("--my", `${((event.clientY - rect.top) / rect.height) * 100}%`);
    };

    lockup.addEventListener("pointermove", handleMove);

    return () => {
      lockup.removeEventListener("pointermove", handleMove);
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
      className="relative w-full overflow-hidden pb-10 sm:pb-14 lg:h-[calc(100svh-65px)] lg:min-h-[600px] lg:pb-0"
    >
      {/* Stacks above the portrait on mobile; centred from lg up with the
          portrait bleeding over it. Left padding clears the SocialSidebar. */}
      <div
        ref={copyRef}
        className="relative z-10 mx-auto flex w-full max-w-[1400px] flex-col justify-start px-4 pt-10 sm:px-6 sm:pt-14 md:pr-24 md:pl-24 lg:h-full lg:justify-center lg:pt-0 lg:pr-6 lg:pl-28"
      >
        <p
          ref={eyebrowRef}
          className="flex items-center justify-center gap-2 font-heading text-[0.6875rem] font-semibold tracking-[0.3em] text-slate-600 uppercase sm:gap-2.5 lg:ml-3 lg:justify-start lg:text-[0.8125rem] dark:text-slate-300"
        >
          <span className="hero-eyebrow-dot" aria-hidden="true" />
          {hero.roleTag}
        </p>

        <h1
          id="hero-title"
          ref={lockupRef}
          aria-label={title}
          className="hero-name mt-5 text-center font-heading leading-[0.86] font-bold tracking-[-0.055em] whitespace-nowrap uppercase lg:text-left"
        >
          <span aria-hidden="true" className="block">
            <span className="hero-line-mask block">
              <span
                ref={lineOneRef}
                className="block text-[clamp(3.5rem,15vw,13rem)] lg:text-[clamp(3.5rem,12.5vw,13rem)] text-foreground"
              >
                {lineOne}
              </span>
            </span>
            <span className="hero-line-mask block">
              <span
                ref={lineTwoRef}
                className="relative block text-[clamp(3.5rem,15vw,13rem)] lg:text-[clamp(3.5rem,12.5vw,13rem)]"
              >
                <span className="hero-name-outline">{lineTwo}</span>
                <span className="hero-name-glow" aria-hidden="true">
                  {lineTwo}
                </span>
              </span>
            </span>
          </span>
        </h1>

        <p
          ref={taglineRef}
          className="mx-auto mt-6 max-w-[26rem] text-center text-base text-slate-600 sm:mt-8 sm:max-w-[32rem] sm:text-lg md:mt-10 md:max-w-[32rem] lg:mx-0 lg:mt-7 lg:text-left dark:text-slate-400"
        >
          {hero.subtitle}
        </p>

        <div ref={ctaRef} className="mt-7 flex flex-wrap justify-center gap-3 lg:justify-start">
          <Button href="#contact">Let&apos;s Connect</Button>
          {resumeUrl && (
            <Button ref={resumeButtonRef} variant="secondary" onClick={() => setResumeOpen(true)}>
              View Resume
            </Button>
          )}
        </div>
      </div>

      {/* Under the copy on mobile. From lg up it bleeds to the right edge and
          overlaps the name — the head should sit into the heading. */}
      <div
        ref={portraitRef}
        className="relative z-10 mt-4 flex justify-center pointer-events-none select-none sm:mt-6 lg:absolute lg:inset-y-0 lg:right-[3vw] lg:z-20 lg:mt-0 lg:items-end lg:justify-end 3xl:right-[6vw] 3xl:pb-[3%]"
      >
        <div ref={portraitInnerRef} className="relative flex lg:h-full lg:items-end">
          {/* Wraps the image's own box, not the taller column, so the glow is
              sized to the character. It carries the height too: a percentage
              height on the image needs a parent with a definite one.
              49vw is the old 40vw width cap restated as height, so the width
              still lands on ~40vw without the image letterboxing inside it. */}
          <div className="relative lg:h-[min(94%,860px,49vw)]">
            <div
              className="hero-portrait-glow pointer-events-none absolute -inset-x-[6%] -inset-y-[4%]"
              aria-hidden="true"
            />
            <Image
              src="/hero-img-white.png"
              alt={title ? `${title} portrait` : "Portrait"}
              width={882}
              height={1087}
              priority
              sizes="(min-width: 1024px) 46vw, (min-width: 640px) 52vw, 68vw"
              className="hero-portrait-img relative h-auto w-[68vw] max-w-[300px] object-contain object-bottom opacity-90 sm:w-[52vw] sm:max-w-[380px] sm:opacity-95 lg:h-full lg:w-auto lg:max-w-none lg:opacity-100"
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
