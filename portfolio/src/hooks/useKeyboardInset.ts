"use client";

import { useEffect, type RefObject } from "react";

// Less than this much gone is the browser's own bars, and less than this much left has no room
// for anything but the field.
const KEYBOARD_PX = 120;
const ROOM_PX = 200;

/**
 * While a field in the element has an on-screen keyboard up, data-keyboard is on it and
 * --keyboard is how much of the bottom of the screen is covered. Browsers shrink only the visual
 * viewport for a keyboard, so what is sticky to the bottom is otherwise behind it.
 */
export function useKeyboardInset(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const element = ref.current;
    const viewport = window.visualViewport;
    if (!element || !viewport) {
      return;
    }

    const update = () => {
      // Pinch zoom shrinks it too, by as much as it scales it.
      const covered = window.innerHeight - viewport.height * viewport.scale;
      const typing =
        element.contains(document.activeElement) &&
        document.activeElement?.matches("input, textarea");
      const up = Boolean(typing) && covered > KEYBOARD_PX && viewport.height > ROOM_PX;
      const bottom = window.innerHeight - viewport.offsetTop - viewport.height;
      element.toggleAttribute("data-keyboard", up);
      element.style.setProperty("--keyboard", `${Math.max(bottom, 0)}px`);
    };

    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    element.addEventListener("focusin", update);
    element.addEventListener("focusout", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
      element.removeEventListener("focusin", update);
      element.removeEventListener("focusout", update);
    };
  }, [ref]);
}
