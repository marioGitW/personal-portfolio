"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion, registerGsapPlugins } from "@/lib/animations";
import { SCROLL_LOCK_OFF, SCROLL_LOCK_ON } from "@/lib/scrollLock";

// Caps the blur during a link-triggered scroll so it reads as a motion cue
// rather than a smear.
const MAX_SCROLL_BLUR_PX = 3.5;
const BLUR_VELOCITY_FACTOR = 0.12;
const BLUR_SMOOTHING = 0.18;
const BLUR_IDLE_THRESHOLD = 0.02;

// Longer and eased so nav jumps glide instead of snapping.
const NAV_SCROLL_DURATION = 1.4;
const navScrollEasing = (t: number) => 1 - Math.pow(1 - t, 4);

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    registerGsapPlugins();

    const wrapper = wrapperRef.current;
    const reduced = prefersReducedMotion();
    if (!wrapper || reduced) {
      return;
    }

    // No `anchors` option on purpose: Lenis's handler skips preventDefault and
    // races the browser's own hash jump, which snaps back. Anchor clicks are
    // handled explicitly below instead.
    const lenis = new Lenis({ autoRaf: false });

    lenis.on("scroll", ScrollTrigger.update);

    let currentBlur = 0;
    let blurActive = false;
    let navScrolling = false;
    let navTimeout = 0;

    // Lenis drops onComplete when its scrollTo animation is interrupted, so that
    // callback alone would strand navScrolling at true and blur every subsequent
    // scroll for the rest of the session. Whichever of the three signals lands
    // first clears it.
    const endNavScroll = () => {
      navScrolling = false;
      window.clearTimeout(navTimeout);
      navTimeout = 0;
    };

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

      const targetBlur = Math.min(
        Math.abs(lenis.velocity) * BLUR_VELOCITY_FACTOR,
        MAX_SCROLL_BLUR_PX,
      );
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

      // The skip link must move keyboard focus into <main>, and only the
      // browser's own hash navigation does that.
      if (anchor.hasAttribute("data-skip-link")) {
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
      window.clearTimeout(navTimeout);
      navScrolling = true;
      navTimeout = window.setTimeout(endNavScroll, NAV_SCROLL_DURATION * 1000 + 200);

      lenis.scrollTo(target, {
        duration: NAV_SCROLL_DURATION,
        easing: navScrollEasing,
        onComplete: endNavScroll,
      });
    };

    document.addEventListener("click", handleClick);
    // Any real input means the user took the scroll back off the nav animation.
    window.addEventListener("wheel", endNavScroll, { passive: true });
    window.addEventListener("touchstart", endNavScroll, { passive: true });
    window.addEventListener("keydown", endNavScroll);

    const handleScrollLock = () => lenis.stop();
    const handleScrollUnlock = () => lenis.start();

    window.addEventListener(SCROLL_LOCK_ON, handleScrollLock);
    window.addEventListener(SCROLL_LOCK_OFF, handleScrollUnlock);

    return () => {
      document.removeEventListener("click", handleClick);
      window.removeEventListener("wheel", endNavScroll);
      window.removeEventListener("touchstart", endNavScroll);
      window.removeEventListener("keydown", endNavScroll);
      window.removeEventListener(SCROLL_LOCK_ON, handleScrollLock);
      window.removeEventListener(SCROLL_LOCK_OFF, handleScrollUnlock);
      window.clearTimeout(navTimeout);
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
