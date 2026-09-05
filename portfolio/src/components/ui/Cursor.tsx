"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import gsap from "gsap";
import { prefersReducedMotion } from "@/lib/animations";

// Anything clickable, plus [data-cursor] as an escape hatch for custom widgets.
const INTERACTIVE =
  "a, button, [role='button'], input[type='checkbox'], input[type='radio'], input[type='range'], input[type='submit'], input[type='button'], input[type='file'], select, summary, label, [data-cursor], [tabindex]:not([tabindex='-1'])";

// Regions we cannot draw over: their controls live in shadow DOM or another
// document, and neither delivers mousemove to us.
const NATIVE_CURSOR = "[data-cursor-native]";

// How close to a scrollbar gutter counts as being in it, how close to a player
// counts as over it, and how long the pointer must go quiet before we conclude
// it left the content area.
const EDGE_SLOP_PX = 2;
const NATIVE_SLOP_PX = 12;
const STALL_MS = 120;

function subscribeFinePointer(onStoreChange: () => void) {
  const media = window.matchMedia("(pointer: fine)");
  media.addEventListener("change", onStoreChange);
  return () => media.removeEventListener("change", onStoreChange);
}

export function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const enabled = useSyncExternalStore(
    subscribeFinePointer,
    () => window.matchMedia("(pointer: fine)").matches,
    () => false,
  );

  useEffect(() => {
    if (!enabled) {
      document.documentElement.classList.remove("has-custom-cursor", "cursor-native");
      return;
    }

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) {
      return;
    }

    const root = document.documentElement;
    root.classList.add("has-custom-cursor");
    // Hidden until the first mousemove places it, so it never flashes at 0,0.
    root.classList.add("cursor-native");
    gsap.set([dot, ring], { xPercent: -50, yPercent: -50 });

    const reduced = prefersReducedMotion();
    const duration = reduced ? 0 : 0.18;
    const ringDuration = reduced ? 0 : 0.35;

    const xDot = gsap.quickTo(dot, "x", { duration, ease: "power3.out" });
    const yDot = gsap.quickTo(dot, "y", { duration, ease: "power3.out" });
    const xRing = gsap.quickTo(ring, "x", { duration: ringDuration, ease: "power3.out" });
    const yRing = gsap.quickTo(ring, "y", { duration: ringDuration, ease: "power3.out" });

    let lastX = -1;
    let lastY = -1;
    let lastMoveAt = 0;

    const yieldToNative = () => root.classList.add("cursor-native");

    // The page's own scrollbars sit outside the content box. Only treat an edge
    // as a gutter when a classic scrollbar is actually reserving space there, or
    // the very bottom row of the viewport would count as "off the page".
    const inPageGutter = (x: number, y: number) => {
      const hasVertical = window.innerWidth > root.clientWidth;
      const hasHorizontal = window.innerHeight > root.clientHeight;
      return (
        (hasVertical && x >= root.clientWidth - EDGE_SLOP_PX) ||
        (hasHorizontal && y >= root.clientHeight - EDGE_SLOP_PX)
      );
    };

    // A scrolling element (the project modal, say) has its own gutter that is
    // nowhere near the viewport edge. Unlike the page scrollbar this one still
    // delivers mousemove, reporting the scroller itself as the target, so the
    // pointer only has to be tested against that one element's gutter. The
    // cheap size comparison comes first so the rect read stays off the hot path
    // for the vast majority of moves, which are not over any scroller.
    const inElementGutter = (el: EventTarget | null, x: number, y: number) => {
      if (!(el instanceof HTMLElement)) {
        return false;
      }

      const verticalBar = el.offsetWidth - el.clientWidth - el.clientLeft * 2;
      const horizontalBar = el.offsetHeight - el.clientHeight - el.clientTop * 2;
      if (verticalBar <= 0 && horizontalBar <= 0) {
        return false;
      }

      const rect = el.getBoundingClientRect();
      return (
        (verticalBar > 0 && x >= rect.left + el.clientLeft + el.clientWidth && x <= rect.right) ||
        (horizontalBar > 0 && y >= rect.top + el.clientTop + el.clientHeight && y <= rect.bottom)
      );
    };

    // Positions the cursor, and doubles as the recovery signal: driving both off
    // the same event means a missed leave can never strand it. `event.target` is
    // already resolved by the browser, so the opt-out test costs no layout.
    const move = (event: MouseEvent) => {
      lastX = event.clientX;
      lastY = event.clientY;
      lastMoveAt = performance.now();

      const target = event.target as HTMLElement | null;
      if (
        target?.closest(NATIVE_CURSOR) ||
        inPageGutter(lastX, lastY) ||
        inElementGutter(target, lastX, lastY)
      ) {
        yieldToNative();
        return;
      }

      root.classList.remove("cursor-native");
      xDot(event.clientX);
      yDot(event.clientY);
      xRing(event.clientX);
      yRing(event.clientY);
    };

    // Ring expands while the dot shrinks inside it.
    const hoverIn = () => {
      gsap.to(ring, {
        scale: 1.3,
        backgroundColor: "rgba(99,102,241,0.18)",
        borderColor: "#22D3EE",
        duration: 0.2,
      });
      gsap.to(dot, { scale: 0.4, duration: 0.2 });
    };

    const hoverOut = () => {
      gsap.to(ring, {
        scale: 1,
        backgroundColor: "transparent",
        borderColor: "#6366F1",
        duration: 0.2,
      });
      gsap.to(dot, { scale: 1, duration: 0.2 });
    };

    const onOver = (event: MouseEvent) => {
      const element = event.target as HTMLElement | null;

      // Checked before INTERACTIVE so an opted-out control never also expands
      // the ring over a player we cannot draw on.
      if (element?.closest(NATIVE_CURSOR)) {
        yieldToNative();
        return;
      }

      if (element?.closest<HTMLElement>(INTERACTIVE)) {
        hoverIn();
      }
    };

    const onOut = (event: MouseEvent) => {
      const related = event.relatedTarget as HTMLElement | null;

      // No relatedTarget means the pointer left the document entirely — the
      // window edge or a scrollbar. `mouseleave` on <html> does not fire for
      // that; `mouseout` is the event that actually does.
      if (!related) {
        yieldToNative();
      }

      if (related?.closest(INTERACTIVE)) {
        return;
      }
      hoverOut();
    };

    // An out-of-process iframe covers its own wrapper, so the only part of a
    // player this document can hit-test is the wrapper's 1px border. A slow
    // pointer lands on it and `move` catches it; a fast one steps straight over
    // it. Hence the slop: near enough to a player counts as inside it.
    const nearNativeRegion = (x: number, y: number) =>
      Array.from(document.querySelectorAll(NATIVE_CURSOR)).some((el) => {
        const r = el.getBoundingClientRect();
        return (
          x >= r.left - NATIVE_SLOP_PX &&
          x <= r.right + NATIVE_SLOP_PX &&
          y >= r.top - NATIVE_SLOP_PX &&
          y <= r.bottom + NATIVE_SLOP_PX
        );
      });

    // Over a scrollbar, an iframe, or native media controls the browser simply
    // stops delivering mousemove — there is no event left to hang a handler on.
    // So when the pointer goes quiet, ask where it was last seen. This only
    // runs while stalled, so the layout reads stay off the hot path.
    const watchdog = window.setInterval(() => {
      if (root.classList.contains("cursor-native")) {
        return;
      }
      if (performance.now() - lastMoveAt < STALL_MS || lastX < 0) {
        return;
      }
      if (inPageGutter(lastX, lastY)) {
        yieldToNative();
        return;
      }

      // No extrapolation along the last direction: "moved fast into the player"
      // and "moved fast and stopped just short of it" look identical from here,
      // so guessing turns a stuck cursor into a cursor that vanishes while you
      // hover beside the video. The rim on the player wrapper makes the entry
      // observable instead of inferred.
      if (nearNativeRegion(lastX, lastY)) {
        yieldToNative();
      }
    }, STALL_MS);

    window.addEventListener("mousemove", move);
    document.addEventListener("mouseover", onOver);
    document.addEventListener("mouseout", onOut);
    window.addEventListener("blur", yieldToNative);

    return () => {
      root.classList.remove("has-custom-cursor");
      root.classList.remove("cursor-native");
      window.removeEventListener("mousemove", move);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
      window.removeEventListener("blur", yieldToNative);
      window.clearInterval(watchdog);
    };
  }, [enabled]);

  if (!enabled) {
    return null;
  }

  return (
    <>
      <div
        ref={dotRef}
        className="custom-cursor pointer-events-none fixed top-0 left-0 z-[90] size-2 rounded-full bg-accent-gradient"
      />
      <div
        ref={ringRef}
        className="custom-cursor pointer-events-none fixed top-0 left-0 z-[90] size-8 rounded-full border border-indigo-500"
      />
    </>
  );
}
