"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let registered = false;
let refreshing = false;

export function registerGsapPlugins(): void {
  if (registered || typeof window === "undefined") {
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  registered = true;
}

// Fonts and images move what is below them, and the triggers were measured before either was
// in. Once per page load, whoever asks.
export function refreshWhenLoaded(): void {
  if (refreshing) {
    return;
  }
  refreshing = true;

  const loaded = new Promise<void>((resolve) => {
    if (document.readyState === "complete") {
      resolve();
    } else {
      window.addEventListener("load", () => resolve(), { once: true });
    }
  });
  void Promise.all([document.fonts.ready, loaded]).then(() => ScrollTrigger.refresh());
}

// The longest anything waits for the page to be idle.
const IDLE_TIMEOUT_MS = 1500;

// Hydration is busy enough, and what is below the fold isn't needed before the page has been
// scrolled. Returns what cancels it.
export function whenIdle(callback: () => void): () => void {
  if (typeof window.requestIdleCallback === "function") {
    const handle = window.requestIdleCallback(callback, { timeout: IDLE_TIMEOUT_MS });
    return () => window.cancelIdleCallback(handle);
  }
  const handle = window.setTimeout(callback, 200);
  return () => window.clearTimeout(handle);
}

// Read at call time rather than as a hook: most call sites check it inside an
// effect body, not during render.
export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
