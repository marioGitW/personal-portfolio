"use client";

import { useRef, type PointerEvent } from "react";

// How far a finger has to go, how much further across than down, and how much of it a carousel
// gives way by at either end.
const SWIPE = { distance: 40, slope: 1.2, give: 0.3 };

type SwipeOptions = {
  count: number;
  index: number;
  onSelect: (index: number) => void;
};

/**
 * Swipes through the pages of a carousel. Goes on what clips it, which needs touch-pan-y: across
 * is then the carousel's, and down stays the page's. --drag is how far a finger has pulled it,
 * and data-dragging is there while one has hold of it.
 */
export function useSwipe({ count, index, onSelect }: SwipeOptions) {
  const start = useRef<{ id: number; x: number; y: number } | null>(null);

  const release = (element: HTMLElement) => {
    start.current = null;
    element.style.removeProperty("--drag");
    element.removeAttribute("data-dragging");
  };

  return {
    onPointerDown(event: PointerEvent<HTMLElement>) {
      if (event.pointerType !== "mouse" && event.isPrimary) {
        start.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
      }
    },

    onPointerMove(event: PointerEvent<HTMLElement>) {
      if (start.current?.id !== event.pointerId) {
        return;
      }
      const across = event.clientX - start.current.x;
      const atEnd = across > 0 ? index === 0 : index === count - 1;
      event.currentTarget.toggleAttribute("data-dragging", true);
      event.currentTarget.style.setProperty("--drag", `${atEnd ? across * SWIPE.give : across}px`);
    },

    onPointerUp(event: PointerEvent<HTMLElement>) {
      if (start.current?.id !== event.pointerId) {
        return;
      }
      const across = event.clientX - start.current.x;
      const down = event.clientY - start.current.y;
      release(event.currentTarget);
      const next = index + (across < 0 ? 1 : -1);
      if (
        Math.abs(across) > SWIPE.distance &&
        Math.abs(across) > Math.abs(down) * SWIPE.slope &&
        next >= 0 &&
        next < count
      ) {
        onSelect(next);
      }
    },

    // The browser took it, to scroll the page.
    onPointerCancel(event: PointerEvent<HTMLElement>) {
      release(event.currentTarget);
    },
  };
}
