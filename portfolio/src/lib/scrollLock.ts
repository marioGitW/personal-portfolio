"use client";

// Lenis preventDefaults wheel/touch and scrolls the window itself, so
// `overflow-hidden` on the body does not stop it — an open dialog would still
// have the page moving behind it. SmoothScroll listens for these events and
// stops/starts Lenis; the body class stays as the fallback for the
// reduced-motion path, where Lenis is never constructed.
export const SCROLL_LOCK_ON = "scroll-lock:on";
export const SCROLL_LOCK_OFF = "scroll-lock:off";

export function lockScroll(): void {
  document.body.classList.add("overflow-hidden");
  window.dispatchEvent(new Event(SCROLL_LOCK_ON));
}

export function unlockScroll(): void {
  document.body.classList.remove("overflow-hidden");
  window.dispatchEvent(new Event(SCROLL_LOCK_OFF));
}
