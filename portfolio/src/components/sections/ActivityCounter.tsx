"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import gsap from "gsap";
import { Heart } from "lucide-react";
import { prefersReducedMotion, registerGsapPlugins } from "@/lib/animations";
import { LIKED_STORAGE_KEY, recordVisit } from "@/lib/visit";
import type { SiteStats } from "@/lib/types";

// sessionStorage gives "one like per session, surviving refreshes" for free.
// Nothing to subscribe to, so this is a no-op; useSyncExternalStore is here
// only for its SSR-safe read.
function subscribeLiked() {
  return () => {};
}

function getLikedSnapshot() {
  return window.sessionStorage.getItem(LIKED_STORAGE_KEY) === "1";
}

function formatCount(value: number): string {
  return value.toLocaleString("en-US");
}

export function ActivityCounter() {
  const [stats, setStats] = useState<SiteStats | null>(null);
  const storedLiked = useSyncExternalStore(subscribeLiked, getLikedSnapshot, () => false);
  const [liked, setLiked] = useState(false);
  const [pending, setPending] = useState(false);
  const [likesPop, setLikesPop] = useState(false);
  const isLiked = liked || storedLiked;
  const prevLikes = useRef<number | null>(null);
  const likeInFlight = useRef(false);

  const sectionRef = useRef<HTMLElement>(null);
  const eyebrowRef = useRef<HTMLParagraphElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const actionRef = useRef<HTMLDivElement>(null);

  // The one place a visit is recorded; recordVisit counts once per page load.
  useEffect(() => {
    const load = async () => {
      try {
        const data = await recordVisit();
        if (data) {
          setStats(data);
        }
      } catch {
        // Keeps the loading skeleton if the API is unavailable.
      }
    };

    void load();
  }, []);

  useEffect(() => {
    if (!stats) {
      return;
    }
    if (prevLikes.current !== null && stats.likes !== prevLikes.current) {
      setLikesPop(true);
    }
    prevLikes.current = stats.likes;
  }, [stats]);

  useEffect(() => {
    const section = sectionRef.current;
    const eyebrow = eyebrowRef.current;
    const heading = headingRef.current;
    const action = actionRef.current;

    if (!section || !eyebrow || !heading || !action) {
      return;
    }

    const reducedMotion = prefersReducedMotion();
    const revealTargets = [eyebrow, heading, action];

    if (reducedMotion) {
      gsap.set(revealTargets, { opacity: 1, y: 0, filter: "blur(0px)" });
      return;
    }

    registerGsapPlugins();

    gsap.set(revealTargets, { opacity: 0, y: 22, filter: "blur(8px)" });

    const timeline = gsap.timeline({
      defaults: { ease: "power3.out" },
      scrollTrigger: {
        trigger: section,
        start: "top 80%",
        toggleActions: "play none none none",
      },
    });

    timeline
      .to(eyebrow, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.6 })
      .to(heading, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.7 }, "-=0.35")
      .to(action, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.6 }, "-=0.35");

    return () => {
      timeline.scrollTrigger?.kill();
      timeline.kill();
    };
  }, []);

  const onLike = async () => {
    // The ref is claimed synchronously, which is what makes rapid clicking
    // safe — `pending` only reaches the DOM on the next render.
    if (isLiked || likeInFlight.current) {
      return;
    }
    likeInFlight.current = true;

    setPending(true);
    window.sessionStorage.setItem(LIKED_STORAGE_KEY, "1");
    setLiked(true);

    try {
      const response = await fetch("/api/stats/like", { method: "POST" });
      if (!response.ok) {
        throw new Error(`Like request failed with ${response.status}`);
      }
      const data = (await response.json()) as { likes: number };
      setStats((current) => (current ? { ...current, likes: data.likes } : current));
    } catch {
      // Nothing was recorded, so roll the optimistic like back.
      window.sessionStorage.removeItem(LIKED_STORAGE_KEY);
      setLiked(false);
    } finally {
      likeInFlight.current = false;
      setPending(false);
    }
  };

  return (
    <section ref={sectionRef} className="mx-auto w-full max-w-[1400px] px-4 py-24 sm:px-6">
      <div className="relative overflow-hidden rounded-3xl surface-card px-6 py-12 sm:px-12 sm:py-14">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 size-64 rounded-full bg-accent-gradient opacity-[0.07] blur-3xl"
        />

        <div className="relative flex flex-col items-center gap-10 text-center lg:flex-row lg:items-center lg:justify-between lg:gap-8 lg:text-left">
          <div className="max-w-md">
            <p ref={eyebrowRef} className="section-eyebrow">
              One last thing
            </p>
            <div ref={headingRef}>
              <h2 className="mt-3 text-3xl sm:text-4xl">
                Enjoyed the <span className="text-accent-gradient">journey?</span>
              </h2>
              <p className="mt-3 text-muted">
                A single click, nothing tracked — just a quiet way to say it landed.
              </p>
            </div>
          </div>

          <div ref={actionRef} className="flex flex-col items-center gap-5 lg:items-end">
            <button
              type="button"
              onClick={() => void onLike()}
              disabled={isLiked || pending}
              aria-pressed={isLiked}
              className="group inline-flex items-center gap-2.5 rounded-full border border-slate-300 bg-background px-5 py-2.5 text-sm font-medium transition duration-300 hover:-translate-y-0.5 hover:border-love active:scale-95 disabled:cursor-default disabled:hover:translate-y-0 dark:border-slate-700"
            >
              <Heart
                className={`size-4 transition-all duration-300 ${
                  isLiked ? "scale-110 fill-love text-love" : "text-slate-400 group-hover:text-love"
                }`}
              />
              <span>{isLiked ? "Liked" : "Leave a like"}</span>
            </button>

            <p className="font-body flex items-center gap-2 text-xs text-slate-400">
              {stats ? (
                <>
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 animate-pulse rounded-full bg-emerald-400" />
                    {formatCount(stats.visits)} visits
                  </span>
                  <span aria-hidden="true">·</span>
                  <span
                    className={likesPop ? "count-pop" : undefined}
                    onAnimationEnd={() => setLikesPop(false)}
                  >
                    {formatCount(stats.likes)} likes
                  </span>
                </>
              ) : (
                <span className="inline-flex h-4 w-32 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
              )}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
