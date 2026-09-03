"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

const MIN_VISIBLE_MS = 1900;
const LOADING_TAGS = ["Design", "Build", "Test", "Ship"];

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
      onComplete: () => {
        setHidden(true);
        // Lets the hero hold its entrance timeline until the curtain is up.
        window.dispatchEvent(new Event("preloader:done"));
      },
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

  const activeTagIndex = Math.min(
    LOADING_TAGS.length - 1,
    Math.floor(progress * LOADING_TAGS.length),
  );

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[50] isolate overflow-hidden bg-background/90 text-foreground backdrop-blur-2xl"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-busy={!ready}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -left-24 size-96 rounded-full bg-accent-from/25 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -bottom-32 size-96 rounded-full bg-accent-to/25 blur-3xl"
      />

      <div className="relative flex h-full items-center justify-center px-6">
        <div className="flex w-full max-w-3xl flex-col items-center text-center">
          <p className="font-heading text-4xl font-extrabold tracking-tight uppercase sm:text-6xl">
            <span className="text-foreground">Mario</span>{" "}
            <span className="text-accent-gradient">Spasovski</span>
          </p>

          <div className="mt-4 flex items-center justify-center gap-3">
            <span aria-hidden="true" className="h-px w-8 bg-foreground/25 sm:w-10" />
            <p className="font-body text-xs font-semibold tracking-[0.4em] text-foreground/50 uppercase sm:text-sm">
              Personal Portfolio
            </p>
            <span aria-hidden="true" className="h-px w-8 bg-foreground/25 sm:w-10" />
          </div>

          <div className="mt-10 flex w-full max-w-md flex-col items-center gap-3" aria-hidden="true">
            <div
              className="h-1.5 w-full overflow-hidden rounded-full ring-1 ring-foreground/10"
              style={{ backgroundColor: trackColor }}
            >
              <div
                className="h-full rounded-full bg-accent-gradient shadow-[0_0_10px_1px_color-mix(in_srgb,var(--color-accent-from)_45%,transparent)] transition-[width] duration-300 ease-out"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
            <div className="font-body text-[10px] tracking-[0.35em] text-foreground/40 uppercase">
              Loading {Math.round(progress * 100)}%
            </div>
          </div>

          <div
            className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2"
            aria-hidden="true"
          >
            {LOADING_TAGS.map((tag, index) => (
              <span
                key={tag}
                className={`font-heading text-xs font-bold tracking-[0.25em] uppercase transition-colors duration-300 sm:text-sm ${
                  index === activeTagIndex
                    ? "text-accent-gradient"
                    : index < activeTagIndex
                      ? "text-foreground/50"
                      : "text-foreground/25"
                }`}
              >
                {tag}.
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
