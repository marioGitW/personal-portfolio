"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Button } from "@/components/ui/Button";
import { ResumeModal } from "@/components/ui/ResumeModal";
import { registerGsapPlugins } from "@/lib/animations";
import { getSiteSettings } from "@/lib/content";

export function Hero() {
  const site = getSiteSettings();
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
    gsap.set(portraitInner, { opacity: 0, y: 48, scale: 0.965 });

    const timeline = gsap.timeline({ defaults: { ease: "power3.out" }, paused: true });

    timeline
      .to(eyebrow, { opacity: 1, y: 0, duration: 0.5 })
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
      className="relative h-[calc(100svh-65px)] min-h-[600px] w-full overflow-hidden"
    >
      {/* Portrait: bleeds to the right edge of the viewport, anchored to the
          bottom of the hero. Large and overlapping the name on every
          breakpoint - the head is meant to sit into the heading, not float
          beside it. */}
      <div
        ref={portraitRef}
        className="pointer-events-none absolute right-0 bottom-0 z-20 flex justify-end select-none"
      >
        <div ref={portraitInnerRef} className="relative flex">
          <div
            className="hero-portrait-glow absolute right-[8%] bottom-[18%] h-[50%] w-[85%]"
            aria-hidden="true"
          />
          <Image
            src="/hero-img-white.png"
            alt={`${site.name} portrait`}
            width={882}
            height={1087}
            priority
            sizes="(min-width: 1024px) 46vw, (min-width: 640px) 62vw, 84vw"
            className="hero-portrait-img relative h-[82vh] w-auto max-w-none object-contain object-bottom opacity-90 sm:h-[84vh] sm:opacity-95 lg:h-[86%] lg:max-w-[48vw] lg:opacity-100"
          />
          <div
            className="hero-portrait-fade pointer-events-none absolute inset-x-0 bottom-0 h-[16%]"
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Copy: constrained to the page container, top-aligned on small screens
          (portrait sits below it), vertically centred from lg up. The left
          padding from md up clears the fixed SocialSidebar. */}
      <div
        ref={copyRef}
        className="relative z-10 mx-auto flex h-full w-full max-w-[1400px] flex-col justify-start px-4 pt-10 sm:px-6 sm:pt-14 md:pl-24 lg:justify-center lg:pt-0 lg:pl-28"
      >
        <p
          ref={eyebrowRef}
          className="flex items-center gap-3 font-heading text-xs tracking-[0.2em] text-slate-500 uppercase md:ml-3">
          {site.role}
        </p>

        <h1
          ref={lockupRef}
          aria-label={site.name}
          className="hero-name mt-5 font-heading leading-[0.86] font-bold tracking-[-0.055em] whitespace-nowrap uppercase"
        >
          <span aria-hidden="true" className="block">
            <span className="hero-line-mask block">
              <span
                ref={lineOneRef}
                className="block text-[clamp(3.5rem,15vw,13rem)] lg:text-[clamp(3.5rem,12.5vw,13rem)] text-foreground"
              >
                {site.nameWords[0]}
              </span>
            </span>
            <span className="hero-line-mask block">
              <span
                ref={lineTwoRef}
                className="relative block text-[clamp(3.5rem,15vw,13rem)] lg:text-[clamp(3.5rem,12.5vw,13rem)]"
              >
                <span className="hero-name-outline">{site.nameWords[1]}</span>
                <span className="hero-name-glow" aria-hidden="true">
                  {site.nameWords[1]}
                </span>
              </span>
            </span>
          </span>
        </h1>

        <p
          ref={taglineRef}
          className="mt-16 max-w-[22rem] text-base text-slate-600 sm:max-w-[26rem] sm:text-lg lg:mt-7 dark:text-slate-400"
        >
          {site.tagline}
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

      <ResumeModal
        open={resumeOpen}
        onClose={() => setResumeOpen(false)}
        triggerRef={resumeButtonRef}
      />
    </section>
  );
}
