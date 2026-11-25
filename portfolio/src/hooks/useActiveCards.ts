"use client";

import { useEffect, type RefObject } from "react";

// The middle of the screen, where a card is the one being looked at.
const MIDDLE = "-35% 0px -35% 0px";
const NO_HOVER = "(hover: none)";

// One for every card on the page, whichever section it is in.
let observer: IntersectionObserver | null = null;

function cardObserver() {
  if (!observer) {
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          entry.target.classList.toggle("is-active", entry.isIntersecting);
        }
      },
      { rootMargin: MIDDLE },
    );
    // iOS has no :active on what isn't a link or a button unless something listens.
    document.addEventListener("touchstart", () => {}, { passive: true });
  }
  return observer;
}

/**
 * Where nothing can hover, marks the cards under `scope` `is-active` while they are in the middle
 * of the screen, for their accent segments. `count` is how many there are.
 */
export function useActiveCards(scope: RefObject<HTMLElement | null>, count: number) {
  useEffect(() => {
    const root = scope.current;
    if (!root || count === 0) {
      return;
    }

    const cards = Array.from(
      root.querySelectorAll(".hud-md > .hud-accent"),
      (accent) => accent.parentElement as HTMLElement,
    );
    const media = window.matchMedia(NO_HOVER);

    const stop = () => {
      for (const card of cards) {
        observer?.unobserve(card);
        card.classList.remove("is-active");
      }
    };

    const sync = () => {
      stop();
      if (media.matches) {
        for (const card of cards) {
          cardObserver().observe(card);
        }
      }
    };

    sync();
    media.addEventListener("change", sync);

    return () => {
      media.removeEventListener("change", sync);
      stop();
    };
  }, [scope, count]);
}
