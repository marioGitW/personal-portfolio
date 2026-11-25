"use client";

import { useCallback, useEffect, useRef, type PointerEvent } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { HologramCharacter, type HologramHandle } from "@/components/about/HologramCharacter";
import { HudConnector } from "@/components/about/HudConnector";
import { REVEAL } from "@/components/about/hologram";
import { HudBrackets, HudFrame, HudLabel, HudTag, HudTagRule } from "@/components/ui/hud-frame";
import {
  prefersReducedMotion,
  refreshWhenLoaded,
  registerGsapPlugins,
  whenIdle,
} from "@/lib/animations";
import { toParagraphs } from "@/lib/format";
import { aboutLanguages, sectionCopy } from "@/content/fallbacks";
import type { About as AboutContent } from "@/types/sanity";

type AboutProps = {
  about: AboutContent;
};

// He comes up a moment after the middle of his stage is this far down the viewport, which is
// about when the portal he comes out of is on screen. On a page that loads with it past that
// already, it is the page he waits for.
const TRIGGER = { line: 0.8, delay: 0.1, lateDelay: 0.4 };

// The panel doesn't wait for him. Its frame draws as its top is reached, and what is in it comes
// in a piece at a time as each is, so that none of it has played before it is on screen.
const PANEL = { start: "top 85%", items: "top 90%", itemsDelay: 0.3 };

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

  const rowRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const hologramRef = useRef<HologramHandle>(null);

  // The panel and the connector follow the hologram's hover state in CSS, from this attribute.
  const handleActiveChange = useCallback((active: boolean) => {
    rowRef.current?.toggleAttribute("data-active", active);
  }, []);

  const handlePanelHover = (event: PointerEvent, over: boolean) => {
    if (event.pointerType !== "touch") {
      hologramRef.current?.hoverPanel(over);
    }
  };

  useEffect(() => {
    const row = rowRef.current;
    const panel = panelRef.current;
    const stage = stageRef.current;
    const hologram = hologramRef.current;
    if (!row || !panel || !stage || !hologram) {
      return;
    }

    registerGsapPlugins();
    refreshWhenLoaded();

    let cancelled = false;
    const context = gsap.context(() => undefined);

    const stageBox = stage.getBoundingClientRect();
    const late = stageBox.top + stageBox.height / 2 <= window.innerHeight * TRIGGER.line;

    // Once, and never backwards: the trigger is killed as it fires.
    const whenDue = (play: () => void) => {
      const playAfter = (delay: number) => {
        const figure = hologram.ready();
        gsap.delayedCall(delay, () => {
          void figure.then(() => {
            if (!cancelled) {
              play();
            }
          });
        });
      };

      if (late) {
        playAfter(TRIGGER.lateDelay);
        return;
      }
      context.add(() => {
        ScrollTrigger.create({
          trigger: stage,
          start: `center ${TRIGGER.line * 100}%`,
          once: true,
          onEnter: () => playAfter(TRIGGER.delay),
        });
      });
    };

    const setUp = () => {
      if (prefersReducedMotion()) {
        whenDue(hologram.appear);
        return;
      }

      const connector = row.querySelector("[data-hud-connector]");

      // What is on screen already is left alone, as hiding it then would be a flash. On a phone
      // that is often the top of the frame and nothing that is in it.
      const unseen = (element: Element) =>
        element.getBoundingClientRect().top >= window.innerHeight;
      const frameUnseen = unseen(panel);
      const items = gsap.utils.toArray<HTMLElement>("[data-about-item]", panel).filter(unseen);

      if (frameUnseen) {
        const strokes = panel.querySelectorAll("[data-hud-stroke]");
        const details = panel.querySelectorAll("[data-hud-detail]");
        const shape = panel.querySelector("[data-hud-shape]");

        context.add(() => {
          // Every stroke's pathLength is 1. The gap is longer, so none of them shows a dot of its
          // dash at rest.
          gsap.set(strokes, { strokeDasharray: "1 2", strokeDashoffset: 1 });
          gsap.set(details, { opacity: 0 });
          // One level off nothing, so that its gradients are painted, and their shaders compiled,
          // before the reveal rather than in it.
          gsap.set(shape, { opacity: 0.004 });

          gsap
            .timeline({ scrollTrigger: { trigger: panel, start: PANEL.start, once: true } })
            .to(
              strokes,
              // Rounded to whole pixels otherwise, and there is only one to go through.
              { strokeDashoffset: 0, duration: 0.8, ease: "power2.inOut", autoRound: false },
              0,
            )
            .to(shape, { opacity: 1, duration: 0.8, ease: "power2.out" }, 0)
            .to(details, { opacity: 1, duration: 0.4, ease: "power2.out" }, 0.6);
        });
      }

      if (items.length > 0) {
        context.add(() => {
          gsap.set(items, { opacity: 0, y: 12 });

          // The first of them have a frame to wait for.
          let delay = frameUnseen ? PANEL.itemsDelay : 0;
          ScrollTrigger.batch(items, {
            start: PANEL.items,
            once: true,
            onEnter: (batch) => {
              context.add(() => {
                gsap.to(batch, {
                  opacity: 1,
                  y: 0,
                  duration: 0.5,
                  ease: "power2.out",
                  stagger: 0.06,
                  delay,
                });
              });
              delay = 0;
            },
          });
        });
      }

      context.add(() => {
        gsap.set(connector, { clipPath: CONNECTOR_CLIP.closed, "--hud-pulse": 0 });

        const reveal = gsap.timeline({
          paused: true,
          onComplete: () => {
            hologram.setPhase("standing");
            // Nothing to hover with, so the sweep shows itself once.
            if (window.matchMedia("(hover: none)").matches) {
              hologram.scan();
            }
          },
        });

        hologram.reveal(reveal);

        const locking = REVEAL.duration - REVEAL.lockAt;
        reveal
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

        whenDue(() => {
          hologram.setPhase("building");
          reveal.play();
        });
      });
    };

    let cancelIdle: (() => void) | null = null;
    if (late) {
      setUp();
    } else {
      cancelIdle = whenIdle(setUp);
    }

    return () => {
      cancelled = true;
      cancelIdle?.();
      context.revert();
    };
  }, []);

  return (
    <section id="about" aria-labelledby="about-title" className="section-shell about-section">
      <div
        ref={rowRef}
        className="about-row relative flex flex-col lg:flex-row lg:items-end lg:justify-center"
      >
        <HudFrame
          ref={panelRef}
          size="lg"
          wideFrom="lg"
          onPointerEnter={(event: PointerEvent) => handlePanelHover(event, true)}
          onPointerLeave={(event: PointerEvent) => handlePanelHover(event, false)}
          className="about-panel z-10 w-full lg:shrink-0"
        >
          <div className="relative px-6 py-10 text-center sm:px-10 sm:py-12 lg:px-[42px] lg:py-11 lg:text-left">
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

          <HudBrackets hot />
          <svg aria-hidden="true" width={90} height={1} className="hud-segment-hot">
            <line className="hud-segment" x2={90} />
          </svg>
        </HudFrame>

        <HologramCharacter
          ref={hologramRef}
          stageRef={stageRef}
          onActiveChange={handleActiveChange}
          className="lg:order-first"
        />

        <HudConnector rowRef={rowRef} stageRef={stageRef} panelRef={panelRef} />
      </div>
    </section>
  );
}
