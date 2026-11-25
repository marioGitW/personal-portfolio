"use client";

import { useCallback, useEffect, useRef, type MouseEvent, type PointerEvent } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { HologramCharacter, type HologramHandle } from "@/components/about/HologramCharacter";
import { HudConnector } from "@/components/about/HudConnector";
import { REVEAL } from "@/components/about/hologram";
import { HudFrame, HudLabel, HudTag, HudTagRule } from "@/components/ui/hud-frame";
import { prefersReducedMotion, registerGsapPlugins } from "@/lib/animations";
import { toParagraphs } from "@/lib/format";
import { aboutLanguages, sectionCopy } from "@/content/fallbacks";
import type { About as AboutContent } from "@/types/sanity";

type AboutProps = {
  about: AboutContent;
};

// Where the top of the section is when he starts to come up.
const REVEAL_START = { desktop: "top 65%", stacked: "top 75%" };
const DESKTOP = "(min-width: 64rem)";

// The line from the portal, shut at the portal's end. Percentages on the right, since a clip
// only tweens between like units, and enough of one to clear the node past the line's end.
const CONNECTOR_CLIP = {
  closed: "inset(-20px 100% -20px -10px)",
  open: "inset(-20px -15% -20px -10px)",
};

export function About({ about }: AboutProps) {
  const bioParagraphs = toParagraphs(about.description);
  const tags = about.tags ?? [];
  const { eyebrow, titleLead, titleAccent } = sectionCopy.about;

  const sectionRef = useRef<HTMLElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const hologramRef = useRef<HologramHandle>(null);
  const lastPointer = useRef<string>("mouse");

  // The hologram owns the hover state, since a sweep outlasts the pointer. The panel and the
  // connector follow it in CSS, from this attribute.
  const handleActiveChange = useCallback((active: boolean) => {
    rowRef.current?.toggleAttribute("data-active", active);
  }, []);

  // On the row rather than its two halves, so crossing from one to the other, over the
  // connector, doesn't leave and start over.
  const handlePointerEnter = (event: PointerEvent) => {
    if (event.pointerType !== "touch") {
      hologramRef.current?.enter();
    }
  };

  const handlePointerLeave = (event: PointerEvent) => {
    if (event.pointerType !== "touch") {
      hologramRef.current?.leave();
    }
  };

  const handlePointerDown = (event: PointerEvent) => {
    lastPointer.current = event.pointerType;
  };

  // A click rather than pointerup, which a scroll that starts here would also end in.
  const handleClick = (event: MouseEvent) => {
    if (lastPointer.current === "touch" && !event.defaultPrevented) {
      hologramRef.current?.scan();
    }
  };

  useEffect(() => {
    const section = sectionRef.current;
    const row = rowRef.current;
    const panel = panelRef.current;
    const stage = stageRef.current;
    const hologram = hologramRef.current;
    if (!section || !row || !panel || !stage || !hologram) {
      return;
    }

    registerGsapPlugins();

    let cancelled = false;
    const context = gsap.context(() => undefined);
    // Asked again on every refresh, as the layout it goes by changes at the same width.
    const start = () =>
      window.matchMedia(DESKTOP).matches ? REVEAL_START.desktop : REVEAL_START.stacked;

    if (prefersReducedMotion()) {
      void hologram.ready().then(() => {
        if (!cancelled) {
          context.add(() => {
            ScrollTrigger.create({ trigger: section, start, once: true, onEnter: hologram.appear });
          });
        }
      });
    } else {
      const strokes = row.querySelectorAll("[data-hud-stroke]");
      const details = row.querySelectorAll("[data-hud-detail]");
      const items = panel.querySelectorAll("[data-about-item]");
      const shape = panel.querySelector("[data-hud-shape]");
      const connector = row.querySelector("[data-hud-connector]");

      context.add(() => {
        // Every stroke's pathLength is 1. The gap is longer, so none of them shows a dot of its
        // dash at rest.
        gsap.set(strokes, { strokeDasharray: "1 2", strokeDashoffset: 1 });
        gsap.set(details, { opacity: 0 });
        // One level off nothing, so that its gradients are painted, and their shaders compiled,
        // before the reveal rather than in it.
        gsap.set(shape, { opacity: 0.004 });
        gsap.set(items, { opacity: 0, y: 12 });
        gsap.set(connector, { clipPath: CONNECTOR_CLIP.closed, "--hud-pulse": 0 });
      });

      void hologram.ready().then(() => {
        if (cancelled) {
          return;
        }

        context.add(() => {
          let standing = false;
          let scanOwed = false;

          // On its own timeline rather than the reveal's, so that going back, its longer tail
          // doesn't have to run out before he starts to sink.
          const opening = gsap
            .timeline({ paused: true })
            .to(
              strokes,
              // Rounded to whole pixels otherwise, and there is only one to go through.
              { strokeDashoffset: 0, duration: 0.8, ease: "power2.inOut", autoRound: false },
              0,
            )
            .to(shape, { opacity: 1, duration: 0.8, ease: "power2.out" }, 0)
            .to(details, { opacity: 1, duration: 0.4, ease: "power2.out" }, 0.6)
            .to(items, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out", stagger: 0.06 }, 0.8);

          const reveal = gsap.timeline({
            scrollTrigger: {
              trigger: section,
              start,
              toggleActions: "play none none reverse",
              onEnter: () => {
                reveal.timeScale(1);
                hologram.setPhase("building");
                if (reveal.time() >= REVEAL.panelAt) {
                  opening.timeScale(1).play();
                }
              },
              onLeaveBack: () => {
                standing = false;
                // Negative, as a timeline that runs backwards has its sign turned.
                reveal.timeScale(-REVEAL.reverse);
                opening.timeScale(-REVEAL.reverse).paused(false);
                hologram.setPhase("sinking");
              },
            },
            onComplete: () => {
              standing = true;
              hologram.setPhase("standing");
              if (scanOwed) {
                scanOwed = false;
                hologram.scan();
              }
            },
            onReverseComplete: () => hologram.setPhase("waiting"),
          });

          hologram.reveal(reveal);

          const locking = REVEAL.duration - REVEAL.lockAt;
          reveal
            .call(
              () => {
                if (!reveal.reversed()) {
                  opening.timeScale(1).play();
                }
              },
              undefined,
              REVEAL.panelAt,
            )
            .to(
              connector,
              { clipPath: CONNECTOR_CLIP.open, duration: locking, ease: "power1.inOut" },
              REVEAL.lockAt,
            )
            .to(
              connector,
              { "--hud-pulse": 1, duration: locking, ease: "power1.inOut" },
              REVEAL.lockAt,
            );

          // Nothing to hover with, so the sweep shows itself once, when there is all of him
          // to sweep.
          if (window.matchMedia("(hover: none)").matches) {
            ScrollTrigger.create({
              trigger: stage,
              start: "top 55%",
              once: true,
              onEnter: () => {
                if (standing) {
                  hologram.scan();
                } else {
                  scanOwed = true;
                }
              },
            });
          }
        });
      });
    }

    return () => {
      cancelled = true;
      context.revert();
    };
  }, []);

  return (
    <section id="about" aria-labelledby="about-title" ref={sectionRef} className="section-shell">
      <div
        ref={rowRef}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onPointerDown={handlePointerDown}
        onClick={handleClick}
        className="about-row relative flex flex-col lg:flex-row lg:items-end lg:justify-center"
      >
        <HologramCharacter
          ref={hologramRef}
          stageRef={stageRef}
          onActiveChange={handleActiveChange}
        />

        <HudFrame
          ref={panelRef}
          size="lg"
          wideFrom="lg"
          className="about-panel z-10 w-full lg:shrink-0"
        >
          <div className="relative px-6 py-8 text-center sm:px-10 sm:py-10 lg:px-[42px] lg:pt-8 lg:pb-[34px] lg:text-left">
            <div data-about-item className="flex items-center justify-between">
              <HudLabel>{eyebrow}</HudLabel>
            </div>

            <h2
              id="about-title"
              data-about-item
              className="mt-3.5 text-foreground lg:text-[clamp(2.25rem,3vw,3rem)]"
            >
              {titleLead} {titleAccent}
            </h2>

            <div className="mx-auto mt-6 max-w-md space-y-4 text-base text-foreground sm:max-w-xl sm:text-lg md:max-w-none lg:mx-0 lg:mt-[1.1em] lg:space-y-[0.8em] lg:text-[clamp(0.9375rem,1.172vw,1.125rem)] lg:leading-[1.6]">
              {bioParagraphs.map((paragraph, index) => (
                <p key={index} data-about-item>
                  {paragraph}
                </p>
              ))}
            </div>

            {tags.length > 0 && (
              <>
                <div data-about-item aria-hidden="true" className="hud-divider mt-10 lg:mt-5" />
                <div className="mx-auto mt-8 grid max-w-sm grid-cols-2 gap-x-6 gap-y-8 text-left sm:max-w-lg sm:grid-cols-4 sm:gap-x-0 lg:mx-0 lg:mt-5 lg:max-w-none">
                  {tags.map((tag) => (
                    <div key={tag._key} data-about-item className="hud-stat">
                      <p className="font-heading text-2xl leading-[1.25] font-semibold text-foreground sm:text-[1.75rem]">
                        {tag.highlightedText}
                      </p>
                      <p className="font-heading text-[10px] leading-[1.5] tracking-[0.18em] text-muted uppercase">
                        {tag.description}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}

            <ul className="mt-6 flex flex-wrap justify-center gap-2.5 lg:mt-5 lg:justify-start">
              {aboutLanguages.map((language) => (
                <HudTag as="li" key={language.code} data-about-item>
                  <span className="font-heading text-[11px] font-semibold tracking-[0.06em]">
                    {language.code}
                  </span>
                  <HudTagRule />
                  <span className="text-[13px]">{language.label}</span>
                </HudTag>
              ))}
            </ul>
          </div>
        </HudFrame>

        <HudConnector rowRef={rowRef} stageRef={stageRef} panelRef={panelRef} />
      </div>
    </section>
  );
}
