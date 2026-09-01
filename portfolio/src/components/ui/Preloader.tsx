"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

const MIN_VISIBLE_MS = 1900;

export function Preloader() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [minimumElapsed, setMinimumElapsed] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [progress, setProgress] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [trackColor, setTrackColor] = useState("#e2e8f0");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setMinimumElapsed(true);
    }, MIN_VISIBLE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    let settled = false;

    const markReady = () => {
      if (!settled) {
        settled = true;
        setReady(true);
      }
    };

    const scheduleReady = () => {
      window.requestAnimationFrame(markReady);
    };

    if (document.readyState === "complete") {
      scheduleReady();
    } else {
      window.addEventListener("load", scheduleReady, { once: true });
    }

    const fonts = document.fonts?.ready;
    if (fonts) {
      void fonts.then(scheduleReady);
    } else {
      scheduleReady();
    }

    return () => {
      window.removeEventListener("load", scheduleReady);
    };
  }, []);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(reduced.matches);

    update();
    reduced.addEventListener("change", update);

    return () => {
      reduced.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const root = window.getComputedStyle(document.documentElement);
      setTrackColor(root.getPropertyValue("--scrollbar-track").trim() || "#e2e8f0");
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (hidden) {
      return;
    }

    if (!ready || !minimumElapsed) {
      return;
    }

    const root = rootRef.current;
    if (!root) {
      return;
    }

    const timeline = gsap.timeline({
      defaults: { ease: "power3.inOut" },
      onComplete: () => setHidden(true),
    });

    timeline.to(root, {
      opacity: 0,
      y: reducedMotion ? 0 : -18,
      scale: reducedMotion ? 1 : 0.97,
      filter: reducedMotion ? "none" : "blur(8px)",
      duration: reducedMotion ? 0.2 : 0.65,
    });

    return () => {
      timeline.kill();
    };
  }, [ready, minimumElapsed, reducedMotion, hidden]);

  useEffect(() => {
    if (hidden) {
      return;
    }

    if (reducedMotion) {
      const frame = window.requestAnimationFrame(() => {
        setProgress(ready && minimumElapsed ? 1 : 0.28);
      });

      return () => {
        window.cancelAnimationFrame(frame);
      };
    }

    const start = performance.now();
    let frame = 0;

    const tick = () => {
      if (ready && minimumElapsed) {
        setProgress(1);
        return;
      }

      const elapsed = performance.now() - start;
      const next = Math.min(0.92, (elapsed / MIN_VISIBLE_MS) * 0.92);
      setProgress((current) => (next > current ? next : current));
      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [ready, minimumElapsed, reducedMotion, hidden]);

  if (hidden) {
    return null;
  }

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[50] isolate overflow-hidden bg-background/85 text-foreground backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-busy={!ready}
    >
      <div className="relative flex h-full items-center justify-center px-6">
        <div className="flex w-full max-w-3xl flex-col items-center text-center">
          <p className="font-heading text-[clamp(0.7rem,1vw,0.85rem)] tracking-[0.55em] text-foreground/60 uppercase">
            MARIO SPASOVSKI
          </p>
          <p className="font-body mt-4 text-xs font-medium tracking-[0.45em] text-foreground/45 uppercase sm:text-sm">
            Personal Portfolio
          </p>

          <div className="mt-10 flex w-full max-w-md flex-col items-center gap-3" aria-hidden="true">
            <div
              className="h-px w-full overflow-hidden rounded-full ring-1 ring-foreground/10"
              style={{ backgroundColor: trackColor }}
            >
              <div
                className="h-full rounded-full bg-accent-gradient transition-[width] duration-300 ease-out"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
            <div className="font-body text-[10px] tracking-[0.35em] text-foreground/40 uppercase">
              Loading {Math.round(progress * 100)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
