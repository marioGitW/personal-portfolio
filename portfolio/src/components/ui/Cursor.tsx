"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import gsap from "gsap";
import { prefersReducedMotion } from "@/lib/animations";

// Anything clickable, plus [data-cursor] as an escape hatch for custom widgets.
const INTERACTIVE =
  "a, button, [role='button'], input[type='checkbox'], input[type='radio'], input[type='range'], input[type='submit'], input[type='button'], input[type='file'], select, summary, label, [data-cursor], [tabindex]:not([tabindex='-1'])";

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
      document.documentElement.classList.remove("has-custom-cursor");
      return;
    }

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) {
      return;
    }

    document.documentElement.classList.add("has-custom-cursor");
    gsap.set([dot, ring], { xPercent: -50, yPercent: -50 });

    const reduced = prefersReducedMotion();
    const duration = reduced ? 0 : 0.18;
    const ringDuration = reduced ? 0 : 0.35;

    const xDot = gsap.quickTo(dot, "x", { duration, ease: "power3.out" });
    const yDot = gsap.quickTo(dot, "y", { duration, ease: "power3.out" });
    const xRing = gsap.quickTo(ring, "x", { duration: ringDuration, ease: "power3.out" });
    const yRing = gsap.quickTo(ring, "y", { duration: ringDuration, ease: "power3.out" });

    const move = (event: MouseEvent) => {
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
      const target = (event.target as HTMLElement | null)?.closest<HTMLElement>(INTERACTIVE);
      if (target) {
        hoverIn();
      }
    };

    const onOut = (event: MouseEvent) => {
      const related = event.relatedTarget as HTMLElement | null;
      if (related?.closest(INTERACTIVE)) {
        return;
      }
      hoverOut();
    };

    window.addEventListener("mousemove", move);
    document.addEventListener("mouseover", onOver);
    document.addEventListener("mouseout", onOut);

    return () => {
      document.documentElement.classList.remove("has-custom-cursor");
      window.removeEventListener("mousemove", move);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
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
