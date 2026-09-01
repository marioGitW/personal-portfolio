"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import gsap from "gsap";

const INTERACTIVE = "a, button, [data-cursor], [role='button']";

function subscribeFinePointer(onStoreChange: () => void) {
  const media = window.matchMedia("(pointer: fine)");
  media.addEventListener("change", onStoreChange);
  return () => media.removeEventListener("change", onStoreChange);
}

export function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
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
    const label = labelRef.current;
    if (!dot || !ring || !label) {
      return;
    }

    document.documentElement.classList.add("has-custom-cursor");
    gsap.set([dot, ring], { xPercent: -50, yPercent: -50 });

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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

    const hoverIn = (target: HTMLElement) => {
      const text = target.dataset.cursor ?? "";
      label.textContent = text;
      gsap.to(ring, {
        scale: text ? 2.4 : 1.8,
        backgroundColor: "rgba(99,102,241,0.18)",
        borderColor: "#22D3EE",
        duration: 0.2,
      });
      gsap.to(dot, { scale: 0.4, duration: 0.2 });
      gsap.to(label, { opacity: text ? 1 : 0, duration: 0.15 });
    };

    const hoverOut = () => {
      gsap.to(ring, {
        scale: 1,
        backgroundColor: "transparent",
        borderColor: "#6366F1",
        duration: 0.2,
      });
      gsap.to(dot, { scale: 1, duration: 0.2 });
      gsap.to(label, { opacity: 0, duration: 0.15 });
    };

    const onOver = (event: MouseEvent) => {
      const target = (event.target as HTMLElement | null)?.closest<HTMLElement>(INTERACTIVE);
      if (target) {
        hoverIn(target);
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
        className="custom-cursor pointer-events-none fixed top-0 left-0 z-[90] flex size-8 items-center justify-center rounded-full border border-indigo-500"
      >
        <span
          ref={labelRef}
          className="font-body text-[9px] font-medium tracking-wide text-cyan-300 uppercase opacity-0"
        />
      </div>
    </>
  );
}
