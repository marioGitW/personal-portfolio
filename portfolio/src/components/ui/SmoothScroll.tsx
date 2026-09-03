"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { registerGsapPlugins } from "@/lib/animations";

// Caps how blurred the page can get while a link-triggered scroll is in
// flight, and how fast that blur reacts to scroll speed, so the effect
// stays a subtle motion cue rather than a visible smear.
const MAX_SCROLL_BLUR_PX = 3.5;
const BLUR_VELOCITY_FACTOR = 0.12;
const BLUR_SMOOTHING = 0.18;
const BLUR_IDLE_THRESHOLD = 0.02;

// Slightly longer, eased-out duration so nav/footer link jumps read as a
// deliberate glide instead of an instant snap.
const NAV_SCROLL_DURATION = 1.4;
const navScrollEasing = (t: number) => 1 - Math.pow(1 - t, 4);

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    registerGsapPlugins();

    const wrapper = wrapperRef.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!wrapper || reduced) {
      return;
    }

    // No `anchors` option here on purpose: Lenis's built-in anchor handler
    // never calls preventDefault, so it ends up racing the browser's own
    // instant hash jump — the two fight over scrollTop and produce a
    // visible snap-back (most obvious scrolling into the pinned Projects
    // section). Anchor clicks are handled explicitly below instead, as the
    // only source of the eased glide + blur; regular wheel/touch scrolling
    // keeps Lenis's normal (unblurred) momentum feel.
    const lenis = new Lenis({ autoRaf: false });

    lenis.on("scroll", ScrollTrigger.update);

    let currentBlur = 0;
    let blurActive = false;
    let navScrolling = false;

    const resetBlur = () => {
      currentBlur = 0;
      blurActive = false;
      wrapper.style.filter = "";
      wrapper.style.willChange = "";
    };

    const tick = (time: number) => {
      lenis.raf(time * 1000);

      if (!navScrolling) {
        if (blurActive) {
          resetBlur();
        }
        return;
      }

      const targetBlur = Math.min(Math.abs(lenis.velocity) * BLUR_VELOCITY_FACTOR, MAX_SCROLL_BLUR_PX);
      currentBlur += (targetBlur - currentBlur) * BLUR_SMOOTHING;

      if (currentBlur > BLUR_IDLE_THRESHOLD) {
        if (!blurActive) {
          blurActive = true;
          wrapper.style.willChange = "filter";
        }
        wrapper.style.filter = `blur(${currentBlur.toFixed(2)}px)`;
      } else if (blurActive) {
        resetBlur();
      }
    };

    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) {
        return;
      }

      const anchor = (event.target as HTMLElement | null)?.closest("a[href^='#']");
      if (!(anchor instanceof HTMLAnchorElement)) {
        return;
      }

      const hash = anchor.getAttribute("href");
      if (!hash || hash.length < 2) {
        return;
      }

      const target = document.getElementById(hash.slice(1));
      if (!target) {
        return;
      }

      event.preventDefault();
      navScrolling = true;
      lenis.scrollTo(target, {
        duration: NAV_SCROLL_DURATION,
        easing: navScrollEasing,
        onComplete: () => {
          navScrolling = false;
        },
      });
    };

    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("click", handleClick);
      gsap.ticker.remove(tick);
      lenis.destroy();
      resetBlur();
    };
  }, []);

  return (
    <div ref={wrapperRef} className="relative z-10 flex-1">
      {children}
    </div>
  );
}
