"use client";

import type { RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { prefersReducedMotion, registerGsapPlugins } from "@/lib/animations";

// Times are seconds from when a frame's turn comes, and everything in it is readable by 0.8.
const REVEAL = {
  start: "top 85%",
  fill: { y: 12, duration: 0.5, ease: "power2.out" },
  corners: { at: 0.12, duration: 0.3, ease: "power2.out" },
  strokes: { duration: 0.8, ease: "power2.inOut" },
  details: { at: 0.4, duration: 0.4, ease: "power2.out" },
  items: { at: 0.2, y: 8, duration: 0.32, ease: "power2.out", each: 0.06, total: 0.24 },
  frames: { each: 0.05, total: 0.4 },
  reducedFade: 0.15,
} as const;

// One level off nothing, so a frame's gradients are painted, and their shaders compiled, before
// it is revealed rather than as it is.
const UNSEEN = "0.004";

// The longest a section's frames wait for the page to be idle before they are hidden.
const IDLE_TIMEOUT_MS = 1500;

type Parts = {
  frame: HTMLElement;
  /** What fades in: an lg frame draws its outline, so only its fill does. */
  fill: HTMLElement;
  strokes: SVGElement[];
  details: SVGElement[];
  corners: HTMLElement[];
  items: HTMLElement[];
};

const find = <T extends Element>(frame: HTMLElement, name: string) =>
  Array.from(frame.querySelectorAll<T>(`[data-hud-${name}]`));

const partsOf = (frame: HTMLElement): Parts => ({
  frame,
  fill: find<HTMLElement>(frame, "shape")[0] ?? frame,
  strokes: find<SVGElement>(frame, "stroke"),
  details: find<SVGElement>(frame, "detail"),
  corners: find<HTMLElement>(frame, "corner"),
  items: find<HTMLElement>(frame, "item"),
});

/** `each` apart, or closer where that many would take longer than `total`. */
const spread = (count: number, { each, total }: { each: number; total: number }) =>
  count > 1 ? Math.min(each, total / (count - 1)) : 0;

// Plain styles rather than gsap.set, which reads an element's computed style before it writes
// to it. Doing that for every part of every frame is a style recalculation each.
function hide({ frame, fill, strokes, details, corners, items }: Parts) {
  frame.style.transform = `translateY(${REVEAL.fill.y}px)`;
  fill.style.opacity = UNSEEN;
  for (const stroke of strokes) {
    stroke.style.strokeDasharray = "1 2";
    stroke.style.strokeDashoffset = "1";
  }
  for (const detail of details) {
    detail.style.opacity = "0";
  }
  for (const corner of corners) {
    corner.style.transform = "scale(0)";
  }
  for (const item of items) {
    item.style.opacity = "0";
    item.style.transform = `translateY(${REVEAL.items.y}px)`;
  }
}

// So the stylesheet has the last word on all of it again.
function clear({ frame, fill, strokes, details, corners, items }: Parts) {
  gsap.set([frame, ...corners, ...items], { clearProps: "transform,opacity" });
  gsap.set([fill, ...details], { clearProps: "opacity" });
  gsap.set(strokes, { clearProps: "strokeDasharray,strokeDashoffset" });
}

function show(parts: Parts, delay: number) {
  const { frame, fill, strokes, details, corners, items } = parts;
  const timeline = gsap.timeline({ delay, onComplete: () => clear(parts) });

  timeline
    .to(frame, { y: 0, duration: REVEAL.fill.duration, ease: REVEAL.fill.ease }, 0)
    .to(fill, { opacity: 1, duration: REVEAL.fill.duration, ease: REVEAL.fill.ease }, 0);

  if (strokes.length > 0) {
    const { duration, ease } = REVEAL.strokes;
    // Rounded to whole pixels otherwise, and there is only one to go through.
    timeline.to(strokes, { strokeDashoffset: 0, duration, ease, autoRound: false }, 0);
  }
  if (details.length > 0) {
    const { at, duration, ease } = REVEAL.details;
    timeline.to(details, { opacity: 1, duration, ease }, at);
  }
  if (corners.length > 0) {
    const { at, duration, ease } = REVEAL.corners;
    timeline.fromTo(corners, { scale: 0 }, { scale: 1, duration, ease }, at);
  }
  if (items.length > 0) {
    const { at, duration, ease } = REVEAL.items;
    const stagger = spread(items.length, REVEAL.items);
    timeline.to(items, { opacity: 1, y: 0, duration, ease, stagger }, at);
  }
}

// Hydration is busy enough, and none of this is needed before the page has been scrolled.
function whenIdle(callback: () => void): () => void {
  if (typeof window.requestIdleCallback === "function") {
    const handle = window.requestIdleCallback(callback, { timeout: IDLE_TIMEOUT_MS });
    return () => window.cancelIdleCallback(handle);
  }
  const handle = window.setTimeout(callback, 200);
  return () => window.clearTimeout(handle);
}

/**
 * Brings in the frames marked `reveal` under `scope` as they scroll into view, once.
 * Hidden here rather than in the stylesheet, so without this script they are simply there.
 */
export function useHudReveal(
  scope: RefObject<HTMLElement | null>,
  { dependencies = [] }: { dependencies?: unknown[] } = {},
) {
  useGSAP(
    (context) => {
      const root = scope.current;
      if (!root) {
        return;
      }

      registerGsapPlugins();

      const waiting = new Map<Element, Parts>();

      const prepare = () => {
        // Only what is still below the viewport. After a reload part way down the page, hiding
        // what is already on it would be the flash this is meant to avoid.
        const frames = gsap.utils
          .toArray<HTMLElement>("[data-hud-frame]", root)
          .filter((frame) => frame.getBoundingClientRect().top >= window.innerHeight);
        if (frames.length === 0) {
          return;
        }

        const reduced = prefersReducedMotion();
        for (const frame of frames) {
          waiting.set(frame, partsOf(frame));
        }
        for (const parts of waiting.values()) {
          if (reduced) {
            parts.frame.style.opacity = "0";
          } else {
            hide(parts);
          }
        }

        ScrollTrigger.batch(frames, {
          start: REVEAL.start,
          once: true,
          onEnter: (batch) => {
            context.add(() => {
              if (reduced) {
                gsap.to(batch, {
                  opacity: 1,
                  duration: REVEAL.reducedFade,
                  ease: "none",
                  clearProps: "opacity",
                });
                return;
              }
              const step = spread(batch.length, REVEAL.frames);
              batch.forEach((frame, index) => {
                const parts = waiting.get(frame);
                if (parts) {
                  show(parts, index * step);
                }
              });
            });
          },
        });
      };

      const cancel = whenIdle(() => context.add(prepare));

      return () => {
        cancel();
        waiting.forEach(clear);
      };
    },
    { scope, dependencies, revertOnUpdate: true },
  );
}
