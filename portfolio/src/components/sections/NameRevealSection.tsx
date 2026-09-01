"use client";

import { Heart } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { getSiteSettings } from "@/lib/content";
import { LIKED_STORAGE_KEY } from "@/lib/nav";
import type { SiteStats } from "@/lib/types";

function subscribeLiked(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function getLikedSnapshot() {
  return window.localStorage.getItem(LIKED_STORAGE_KEY) === "1";
}

let visitRecorded = false;

function formatCount(value: number): string {
  return value.toLocaleString("en-US");
}

export function NameRevealSection() {
  const site = getSiteSettings();
  const [stats, setStats] = useState<SiteStats>({ visits: 0, likes: 0 });
  const storedLiked = useSyncExternalStore(subscribeLiked, getLikedSnapshot, () => false);
  const [liked, setLiked] = useState(false);
  const [thanks, setThanks] = useState(false);
  const [pending, setPending] = useState(false);
  const isLiked = liked || storedLiked;

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/stats");
        if (response.ok) {
          const data = (await response.json()) as SiteStats;
          setStats(data);
        }
      } catch {
        // Counters stay at zero if the API is unavailable.
      }

      if (visitRecorded) {
        return;
      }
      visitRecorded = true;

      try {
        const response = await fetch("/api/stats/visit", { method: "POST" });
        if (response.ok) {
          const data = (await response.json()) as { visits: number };
          setStats((current) => ({ ...current, visits: data.visits }));
        }
      } catch {
        // Keep the last known visit count.
      }
    };

    void load();
  }, []);

  const onLike = async () => {
    if (isLiked || pending) {
      return;
    }

    setPending(true);
    window.localStorage.setItem(LIKED_STORAGE_KEY, "1");
    setLiked(true);
    setThanks(true);

    try {
      const response = await fetch("/api/stats/like", { method: "POST" });
      if (response.ok) {
        const data = (await response.json()) as { likes: number };
        setStats((current) => ({ ...current, likes: data.likes }));
      } else {
        setStats((current) => ({ ...current, likes: current.likes + 1 }));
      }
    } catch {
      setStats((current) => ({ ...current, likes: current.likes + 1 }));
    } finally {
      setPending(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-[1400px] px-4 py-28 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <p className="font-heading text-[11px] tracking-[0.18em] text-slate-500 uppercase">
          EOF — thanks for scrolling
        </p>
        <p className="font-body flex items-center gap-2 text-xs text-slate-400">
          <span className="size-2 animate-pulse rounded-full bg-emerald-400" />
          {formatCount(stats.visits)} visits
        </p>
      </div>

      <h2 className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-2 text-center text-5xl font-extrabold tracking-tight uppercase sm:text-7xl lg:text-8xl">
        {site.nameWords.map((word, index) => {
          const filled = index === site.highlightedWordIndex;
          return (
            <span
              key={`${word}-${index}`}
              className={filled ? "text-name-fill" : "text-ghost transition duration-300"}
            >
              {word}
            </span>
          );
        })}
      </h2>

      <div className="mt-10 flex flex-col items-center gap-3">
        {thanks ? (
          <p className="text-sm text-slate-400">Thank you — that lands.</p>
        ) : (
          <span className="h-5" />
        )}
        <button
          type="button"
          onClick={() => void onLike()}
          disabled={isLiked || pending}
          aria-pressed={isLiked}
          className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm transition hover:border-indigo-500 disabled:cursor-not-allowed disabled:opacity-80 dark:border-slate-700"
        >
          <Heart
            className={`size-4 ${isLiked ? "fill-love text-love" : "text-slate-400"}`}
          />
          <span>
            {formatCount(stats.likes)} {stats.likes === 1 ? "love" : "loves"}
          </span>
        </button>
      </div>
    </section>
  );
}
