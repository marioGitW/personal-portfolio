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

// Shared by the real copy column and its ghost mirror, so both lay out
// identically. From lg up the left padding lines the text up with the navbar
// logo, but never closer to the viewport edge than 7rem, which clears the
// SocialSidebar. The % resolves against the section, so the scrollbar is
// excluded the same way the header's mx-auto container excludes it.
const COPY_CLASSES =
  "relative z-10 mx-auto flex w-full max-w-[1400px] flex-col justify-start px-4 pt-10 sm:px-6 sm:pt-14 md:pr-24 md:pl-24 lg:h-full lg:justify-center lg:pt-0 lg:pr-6 lg:pl-[max(1.5rem,calc(7rem_-_max(0px,50%_-_700px)))]";

const NAME_SIZE = "text-[clamp(3.5rem,15vw,13rem)] lg:text-[clamp(3.5rem,12.5vw,13rem)]";

// The em tracking resolves against the h1's own font-size (the base h1 size in
// globals.css) and is inherited as that length. That size is stated here so
// the ghost, a div, resolves exactly the same tracking.
// The negative margin cancels the big caps' left side-bearing, so the letters
// line up optically with the eyebrow, tagline and buttons. It restates the lg
// name size for the same reason: an em here would use the h1's size.
const NAME_CLASSES =
  "mt-5 text-center font-heading text-[clamp(2.75rem,2rem_+_3vw,4.5rem)] leading-[0.86] font-bold tracking-[-0.055em] whitespace-nowrap uppercase lg:-ml-[calc(clamp(3.5rem,12.5vw,13rem)*0.055)] lg:text-left";

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
  const portraitImgRef = useRef<HTMLImageElement>(null);
  const ghostCopyRef = useRef<HTMLDivElement>(null);
  const ghostLockupRef = useRef<HTMLDivElement>(null);
  const ghostLineRef = useRef<HTMLSpanElement>(null);
  const ghostNameRef = useRef<HTMLSpanElement>(null);

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
    const ghostCopy = ghostCopyRef.current;
    const ghostLine = ghostLineRef.current;

    if (
      !section ||
      !copy ||
      !eyebrow ||
      !lineOne ||
      !lineTwo ||
      !tagline ||
      !cta ||
      !portrait ||
      !portraitInner ||
      !ghostCopy ||
      !ghostLine
    ) {
      return;
    }

    // The ghost mirror takes every transform its real counterpart does, so the
    // outline stays glued to the letters through the reveal and the parallax.
    const lineTwos = [lineTwo, ghostLine];
    const copies = [copy, ghostCopy];

    const reducedMotion = prefersReducedMotion();

    if (reducedMotion) {
      gsap.set([eyebrow, tagline, cta], { opacity: 1, y: 0 });
      gsap.set([lineOne, ...lineTwos], { yPercent: 0 });
      gsap.set(portraitInner, { opacity: 1, y: 0, scale: 1 });
      return;
    }

    registerGsapPlugins();

    gsap.set([lineOne, ...lineTwos], { yPercent: 130 });
    gsap.set([eyebrow, tagline, cta], { opacity: 0, y: 18 });
    // Starts tighter than its resting tracking so the reveal reads as intentional.
    gsap.set(eyebrow, { letterSpacing: "0.08em" });
    gsap.set(portraitInner, { opacity: 0, y: 48, scale: 0.965 });

    const timeline = gsap.timeline({ defaults: { ease: "power3.out" }, paused: true });

    timeline
      .to(eyebrow, { opacity: 1, y: 0, letterSpacing: "0.3em", duration: 0.7 })
      .to(lineOne, { yPercent: 0, duration: 1.05, ease: "power4.out" }, "-=0.2")
      .to(lineTwos, { yPercent: 0, duration: 1.05, ease: "power4.out" }, "-=0.88")
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
      .to(copies, { y: -20, opacity: 0.85, ease: "none" }, 0);

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
    const ghostLockup = ghostLockupRef.current;
    if (!section || !portraitInner || !lockup || !ghostLockup) {
      return;
    }

    if (!window.matchMedia("(pointer: fine)").matches || prefersReducedMotion()) {
      return;
    }

    const lockups = [lockup, ghostLockup];
    const portraitX = gsap.quickTo(portraitInner, "x", { duration: 0.7, ease: "power3.out" });
    const portraitY = gsap.quickTo(portraitInner, "y", { duration: 0.7, ease: "power3.out" });
    const textX = gsap.quickTo(lockups, "x", { duration: 0.8, ease: "power3.out" });
    const textY = gsap.quickTo(lockups, "y", { duration: 0.8, ease: "power3.out" });

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

  // Line two is only an outline at rest, so an unmasked ghost would recolour
  // the whole word. Masking it with the portrait's own alpha keeps it to the
  // part the photo covers. Portrait and name move independently (drift,
  // parallax, reveal), so the mask is re-placed every frame while the hero
  // is on screen and the ghost layer is shown (lg up).
  useEffect(() => {
    const section = sectionRef.current;
    const ghostName = ghostNameRef.current;
    const portraitImg = portraitImgRef.current;
    if (!section || !ghostName || !portraitImg) {
      return;
    }

    const desktop = window.matchMedia("(min-width: 64rem)");
    let onScreen = false;

    // object-cover + object-top on a box wider than the source's aspect:
    // the source spans the box width, top-aligned, so width + auto height
    // reproduces exactly what is drawn.
    const sync = () => {
      if (!onScreen || !desktop.matches) {
        return;
      }
      const name = ghostName.getBoundingClientRect();
      const img = portraitImg.getBoundingClientRect();
      ghostName.style.setProperty("--ghost-mask-x", `${img.left - name.left}px`);
      ghostName.style.setProperty("--ghost-mask-y", `${img.top - name.top}px`);
      ghostName.style.setProperty("--ghost-mask-w", `${img.width}px`);
    };

    const observer = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
    });
    observer.observe(section);
    gsap.ticker.add(sync);

    return () => {
      observer.disconnect();
      gsap.ticker.remove(sync);
    };
  }, []);

  const renderNameLines = (ghost: boolean) => (
    <span aria-hidden="true" className="block">
      <span className="hero-line-mask block">
        <span ref={ghost ? undefined : lineOneRef} className={`block ${NAME_SIZE} text-foreground`}>
          {lineOne}
        </span>
      </span>
      <span className="hero-line-mask block">
        <span ref={ghost ? ghostLineRef : lineTwoRef} className={`relative block ${NAME_SIZE}`}>
          {ghost ? (
            <span ref={ghostNameRef} className="hero-name-ghost visible">
              {lineTwo}
            </span>
          ) : (
            <>
              <span className="hero-name-outline">{lineTwo}</span>
              <span className="hero-name-glow" aria-hidden="true">
                {lineTwo}
              </span>
            </>
          )}
        </span>
      </span>
    </span>
  );

  // Rendered twice: once for real, once as the ghost layer above the portrait.
  // The ghost copy is identical markup kept invisible apart from the outline,
  // so it lays out on exactly the same lines at every breakpoint.
  const renderCopy = (ghost: boolean) => (
    <div
      ref={ghost ? ghostCopyRef : copyRef}
      className={ghost ? `${COPY_CLASSES} invisible` : COPY_CLASSES}
    >
      <p
        ref={ghost ? undefined : eyebrowRef}
        className="flex items-center justify-center gap-2 font-heading text-[0.6875rem] font-semibold tracking-[0.3em] text-slate-600 uppercase sm:gap-2.5 lg:justify-start lg:text-[0.8125rem] dark:text-slate-300"
      >
        <span className="hero-eyebrow-dot" aria-hidden="true" />
        {hero.roleTag}
      </p>

      {ghost ? (
        <div ref={ghostLockupRef} className={NAME_CLASSES}>
          {renderNameLines(true)}
        </div>
      ) : (
        <h1
          id="hero-title"
          ref={lockupRef}
          aria-label={title}
          className={`hero-name ${NAME_CLASSES}`}
        >
          {renderNameLines(false)}
        </h1>
      )}

      <p
        ref={ghost ? undefined : taglineRef}
        className="mx-auto mt-6 max-w-[26rem] text-center text-base text-slate-600 sm:mt-8 sm:max-w-[32rem] sm:text-lg md:mt-10 md:max-w-[32rem] lg:mx-0 lg:mt-7 lg:text-left dark:text-slate-400"
      >
        {hero.subtitle}
      </p>

      <div
        ref={ghost ? undefined : ctaRef}
        className="mt-7 flex flex-wrap justify-center gap-3 lg:justify-start"
      >
        <Button href="#contact">Let&apos;s Connect</Button>
        {resumeUrl && (
          <Button
            ref={ghost ? undefined : resumeButtonRef}
            variant="secondary"
            onClick={ghost ? undefined : () => setResumeOpen(true)}
          >
            View Resume
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <section
      id="home"
      aria-labelledby="hero-title"
      ref={sectionRef}
      className="hero relative w-full overflow-clip pb-10 sm:pb-14 lg:h-[calc(100svh-65px)] lg:min-h-[600px] lg:pb-0"
    >
      {/* Stacks above the portrait on mobile; centred from lg up with the
          portrait bleeding over it. */}
      {renderCopy(false)}

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
          {/* Wraps the image's own box, not the taller column, so the glow is
              sized to the character. It carries the height too: a percentage
              height on the image needs a parent with a definite one.
              49vw is the old 40vw width cap restated as height, so the width
              still lands on ~40vw without the image letterboxing inside it. */}
          <div className="relative lg:h-[min(94%,860px,49vw)]">
            <div
              className="hero-portrait-glow hero-glow-fade pointer-events-none absolute z-0 -inset-x-[6%] -inset-y-[4%] lg:-inset-x-[30%] lg:-top-[12%] lg:bottom-[26%]"
              aria-hidden="true"
            />
            {/* Head-and-shoulders glow, centred on the head and shoulders
                (~32% down). Full strength in dark, half in light. */}
            <div
              className="hero-glow-fade pointer-events-none absolute z-0 inset-x-[12%] top-[2%] h-[60%] bg-[radial-gradient(closest-side,var(--color-accent-from),transparent)] opacity-[0.11] blur-[60px] dark:opacity-[0.22]"
              aria-hidden="true"
            />
            {/* The source runs to the knees. The box keeps the old head-to-waist
                frame and cover + top crops into it, so the head stays the same
                size. z-10 keeps both blurred glows underneath. Unoptimized: the
                file is already a small WebP, and re-encoding it visibly softened
                the face. The wrapper carries the cyan halo (lg up) and the
                bottom fade (.hero-portrait-fade in globals.css, which also
                sets its lg height). */}
            <div className="hero-portrait-fade relative z-10 lg:[filter:drop-shadow(0_0_40px_rgba(34,211,238,0.18))]">
              <Image
                ref={portraitImgRef}
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
          </div>
        </div>
      </div>

      {/* Ghost layer: an outline of line two drawn above the portrait, so the
          name reads through the shirt. It has to be a separate layer: the
          real name sits inside transformed wrappers (parallax, drift, reveal),
          each its own stacking context, so nothing in there can rise above
          the portrait. Same markup and classes, same GSAP targets, so it
          tracks the real letters exactly. Only lg up, where they overlap. */}
      <div
        aria-hidden="true"
        inert
        className="pointer-events-none absolute inset-0 z-30 hidden select-none lg:block"
      >
        {renderCopy(true)}
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
