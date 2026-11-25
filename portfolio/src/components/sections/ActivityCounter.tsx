"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { HudFrame } from "@/components/ui/hud-frame";
import { useHudReveal } from "@/hooks/useHudReveal";
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
  useHudReveal(sectionRef);

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
    <section
      aria-labelledby="activity-title"
      ref={sectionRef}
      className="mx-auto w-full max-w-[1400px] px-4 py-24 sm:px-6 max-[431px]:py-10"
    >
      <HudFrame size="lg" reveal className="px-6 py-12 sm:px-12 sm:py-14">
        <div className="relative flex flex-col items-center gap-10 text-center lg:flex-row lg:items-center lg:justify-between lg:gap-8 lg:text-left">
          <div className="max-w-md">
            <p data-hud-item className="section-eyebrow">
              One last thing
            </p>
            <div data-hud-item>
              <h2 id="activity-title" className="mt-3 text-3xl sm:text-4xl">
                Enjoyed the journey?
              </h2>
              <p className="mt-3 text-muted">
                A single click, nothing tracked — just a quiet way to say it landed.
              </p>
            </div>
          </div>

          <div data-hud-item className="flex flex-col items-center gap-5 lg:items-end">
            <Button
              variant="secondary"
              onClick={() => void onLike()}
              disabled={isLiked || pending}
              aria-pressed={isLiked}
              className="gap-2.5 [--hud-fill:var(--background)] disabled:cursor-default"
            >
              <Heart
                className={`size-4 ${isLiked ? "fill-foreground text-foreground" : "text-muted"}`}
              />
              <span>{isLiked ? "Liked" : "Leave a like"}</span>
            </Button>

            <p className="font-body flex items-center gap-2 text-xs text-muted">
              {stats ? (
                <>
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 bg-emerald-400" />
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
                <span className="inline-flex h-4 w-32 bg-border" />
              )}
            </p>
          </div>
        </div>
      </HudFrame>
    </section>
  );
}
