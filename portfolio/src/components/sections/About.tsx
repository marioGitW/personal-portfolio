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

// He comes up a moment after the middle of his stage is this far down the viewport. On a page
// that loads with it past that already, it is the page he waits for.
const TRIGGER = { line: 0.7, delay: 0.3, lateDelay: 0.4 };

// Where the panel is above him, and comes in on its own.
const STACKED = "(max-width: 63.99rem)";
const PANEL_START = "top 85%";

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
    const media = gsap.matchMedia();

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
      let opening: gsap.core.Timeline | null = null;

      // Left alone where it is on screen already. Hiding it then would be a flash.
      if (panel.getBoundingClientRect().top >= window.innerHeight) {
        const strokes = panel.querySelectorAll("[data-hud-stroke]");
        const details = panel.querySelectorAll("[data-hud-detail]");
        const items = panel.querySelectorAll("[data-about-item]");
        const shape = panel.querySelector("[data-hud-shape]");

        context.add(() => {
          // Every stroke's pathLength is 1. The gap is longer, so none of them shows a dot of its
          // dash at rest.
          gsap.set(strokes, { strokeDasharray: "1 2", strokeDashoffset: 1 });
          gsap.set(details, { opacity: 0 });
          // One level off nothing, so that its gradients are painted, and their shaders compiled,
          // before the reveal rather than in it.
          gsap.set(shape, { opacity: 0.004 });
          gsap.set(items, { opacity: 0, y: 12 });

          opening = gsap
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
        });

        media.add(STACKED, () => {
          ScrollTrigger.create({
            trigger: panel,
            start: PANEL_START,
            once: true,
            onEnter: () => opening?.play(),
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
          .call(() => opening?.play(), undefined, REVEAL.panelAt)
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
      media.revert();
      context.revert();
    };
  }, []);

  return (
    <section id="about" aria-labelledby="about-title" className="section-shell">
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
