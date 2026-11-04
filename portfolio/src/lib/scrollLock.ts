"use client";

// Locks the page without touching overflow. Hiding the scrollbar narrows or widens the
// viewport by its width, and everything centred or right-anchored moves with it, so the
// lock takes the inputs away instead. The stylesheet undoes what lenis.css does on stop for
// the same reason. SmoothScroll listens for these events and stops/starts Lenis, whose own
// handlers would otherwise keep animating the scroll.
export const SCROLL_LOCK_ON = "scroll-lock:on";
export const SCROLL_LOCK_OFF = "scroll-lock:off";

const SCROLL_KEYS = new Set(["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "]);
// A dialog's own scroller keeps scrolling.
const SCROLLS_ITSELF = "[data-lenis-prevent]";
// Space activates a button and the arrows move a caret, neither of which is a scroll.
const USES_ITS_KEYS = `a, button, input, select, textarea, summary, [contenteditable], ${SCROLLS_ITSELF}`;

const NO_PASSIVE = { capture: true, passive: false };

let locked = false;
let lockedX = 0;
let lockedY = 0;

const matches = (target: EventTarget | null, selector: string) =>
  target instanceof Element && target.closest(selector) !== null;

const blockScrollGesture = (event: Event) => {
  if (event.cancelable && !matches(event.target, SCROLLS_ITSELF)) {
    event.preventDefault();
  }
};

const blockScrollKey = (event: KeyboardEvent) => {
  if (SCROLL_KEYS.has(event.key) && !matches(event.target, USES_ITS_KEYS)) {
    event.preventDefault();
  }
};

// What no event can stop: dragging the scrollbar, and a focused scroller chaining out.
const holdPosition = () => {
  window.scrollTo(lockedX, lockedY);
};

export function lockScroll(): void {
  if (locked) {
    return;
  }
  locked = true;
  lockedX = window.scrollX;
  lockedY = window.scrollY;
  window.addEventListener("wheel", blockScrollGesture, NO_PASSIVE);
  window.addEventListener("touchmove", blockScrollGesture, NO_PASSIVE);
  window.addEventListener("keydown", blockScrollKey, true);
  window.addEventListener("scroll", holdPosition, { passive: true });
  window.dispatchEvent(new Event(SCROLL_LOCK_ON));
}

export function unlockScroll(): void {
  if (!locked) {
    return;
  }
  locked = false;
  window.removeEventListener("wheel", blockScrollGesture, NO_PASSIVE);
  window.removeEventListener("touchmove", blockScrollGesture, NO_PASSIVE);
  window.removeEventListener("keydown", blockScrollKey, true);
  window.removeEventListener("scroll", holdPosition);
  window.dispatchEvent(new Event(SCROLL_LOCK_OFF));
}

// For a lock taken before SmoothScroll had subscribed to the events above.
export function isScrollLocked(): boolean {
  return locked;
}
