"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Button } from "@/components/ui/Button";
import { ResumeModal } from "@/components/ui/ResumeModal";
import { registerGsapPlugins } from "@/lib/animations";
import { splitTitleLines } from "@/lib/format";
import type { Hero as HeroContent } from "@/types/sanity";

type HeroProps = {
  hero: HeroContent;
};

export function Hero({ hero }: HeroProps) {
  const title = hero.mainTitle ?? "";
  // The lockup animates two masked lines, so the title is always split into
  // exactly two — both spans must exist for the GSAP timeline to run.
  const [lineOne, lineTwo] = splitTitleLines(title);
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

  // Entrance timeline + scroll parallax. The outer wrappers (copy, portrait)
  // carry the scroll tween while their children carry the entrance tween, so
  // the two never write to the same element's transform.
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

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reducedMotion) {
      gsap.set([eyebrow, tagline, cta], { opacity: 1, y: 0 });
      gsap.set([lineOne, lineTwo], { yPercent: 0 });
      gsap.set(portraitInner, { opacity: 1, y: 0, scale: 1 });
      return;
    }

    registerGsapPlugins();

    gsap.set([lineOne, lineTwo], { yPercent: 130 });
    gsap.set([eyebrow, tagline, cta], { opacity: 0, y: 18 });
    // Eyebrow tracks in slightly tighter than its resting letter-spacing, so
    // it reads as an intentional reveal rather than a plain fade.
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

    // The preloader covers the viewport for ~2s on first load; wait for it so
    // the sequence is actually seen. Fallback keeps the hero from ever sticking
    // at its initial state if that event never arrives.
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

  // Cursor-tracked highlight on the name (fine pointers only). Writes CSS
  // custom properties instead of React state so it never re-renders.
  useEffect(() => {
    const lockup = lockupRef.current;
    if (!lockup) {
      return;
    }

    if (
      !window.matchMedia("(pointer: fine)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
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

  // Hover parallax: the portrait drifts opposite the cursor (deeper layer),
  // the name lockup drifts slightly with it (foreground layer). Uses
  // gsap.quickTo so repeated pointermove updates never spin up new tweens.
  useEffect(() => {
    const section = sectionRef.current;
    const portraitInner = portraitInnerRef.current;
    const lockup = lockupRef.current;
    if (!section || !portraitInner || !lockup) {
      return;
    }

    if (
      !window.matchMedia("(pointer: fine)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
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
      ref={sectionRef}
      className="relative w-full overflow-hidden pb-10 sm:pb-14 lg:h-[calc(100svh-65px)] lg:min-h-[600px] lg:pb-0"
    >
      {/* Copy: constrained to the page container. On mobile/tablet it sits in
          normal flow above the portrait; from lg up it's vertically centred
          and the portrait bleeds over it. The left padding from md up clears
          the fixed SocialSidebar. */}
      <div
        ref={copyRef}
        className="relative z-10 mx-auto flex w-full max-w-[1400px] flex-col justify-start px-4 pt-10 sm:px-6 sm:pt-14 md:pl-24 lg:h-full lg:justify-center lg:pt-0 lg:pl-28"
      >
        <p
          ref={eyebrowRef}
          className="flex items-center gap-2.5 font-heading text-[0.8125rem] font-semibold tracking-[0.3em] text-slate-600 uppercase md:ml-3 dark:text-slate-300"
        >
          <span className="hero-eyebrow-dot" aria-hidden="true" />
          {hero.roleTag}
        </p>

        <h1
          ref={lockupRef}
          aria-label={title}
          className="hero-name mt-5 font-heading leading-[0.86] font-bold tracking-[-0.055em] whitespace-nowrap uppercase"
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
          className="mt-16 max-w-[26rem] text-base text-slate-600 sm:max-w-[32rem] sm:text-lg lg:mt-7 dark:text-slate-400"
        >
          {hero.subtitle}
        </p>

        <div ref={ctaRef} className="mt-7 flex flex-wrap gap-3">
          <Button href="#contact">Let&apos;s Connect</Button>
          <Button
            ref={resumeButtonRef}
            variant="secondary"
            onClick={() => setResumeOpen(true)}
          >
            View Resume
          </Button>
        </div>
      </div>

      {/* Portrait: sits in normal flow just under the copy on mobile/tablet,
          scaled by viewport width. From lg up it bleeds to the right edge of
          the viewport, anchored to the bottom of the hero and overlapping the
          name - the head is meant to sit into the heading, not float beside
          it. */}
      <div
        ref={portraitRef}
        className="relative z-10 mt-4 flex justify-center pointer-events-none select-none sm:mt-6 lg:absolute lg:inset-y-0 lg:right-[3vw] lg:z-20 lg:mt-0 lg:items-end lg:justify-end min-[1700px]:right-[6vw] min-[1700px]:pb-[3%]"
      >
        <div ref={portraitInnerRef} className="relative flex lg:h-full lg:items-end">
          {/* Tightly wraps the image's own rendered box (not the taller
              flex column around it) so the glow behind it is centred and
              sized relative to the character, not the section. */}
          <div className="relative">
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
              className="hero-portrait-img relative h-auto w-[68vw] max-w-[300px] object-contain object-bottom opacity-90 sm:w-[52vw] sm:max-w-[380px] sm:opacity-95 lg:h-[94%] lg:max-h-[720px] lg:w-auto lg:max-w-[40vw] lg:opacity-100 min-[1700px]:h-[100%] min-[1700px]:max-h-[860px]"
            />
            <div
              className="hero-portrait-fade pointer-events-none absolute inset-x-0 bottom-0 h-[16%]"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>

      <ResumeModal
        open={resumeOpen}
        onClose={() => setResumeOpen(false)}
        triggerRef={resumeButtonRef}
      />
    </section>
  );
}
