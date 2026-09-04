"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { SanityScreenshot } from "@/types/sanity";

/** A screenshot the caller has already confirmed has a resolved URL. */
export type ResolvedScreenshot = SanityScreenshot & { url: string };

type ProjectScreenshotsProps = {
  screenshots: ResolvedScreenshot[];
  projectTitle: string | null;
  className?: string;
};

export function ProjectScreenshots({
  screenshots,
  projectTitle,
  className = "",
}: ProjectScreenshotsProps) {
  const [index, setIndex] = useState(0);

  if (screenshots.length === 0) {
    return null;
  }

  const altFor = (position: number) =>
    projectTitle
      ? `${projectTitle} screenshot ${position} of ${screenshots.length}`
      : `Screenshot ${position} of ${screenshots.length}`;

  const goTo = (next: number) => {
    setIndex((next + screenshots.length) % screenshots.length);
  };

  return (
    <div className={className}>
      <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900">
        <div
          className="flex h-full transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {screenshots.map((screenshot, i) => (
            <div key={screenshot._key} className="relative h-full w-full shrink-0">
              <Image
                src={screenshot.url}
                alt={altFor(i + 1)}
                fill
                sizes="(min-width: 640px) 60vw, 90vw"
                className="object-cover"
                {...(screenshot.lqip
                  ? { placeholder: "blur" as const, blurDataURL: screenshot.lqip }
                  : {})}
              />
            </div>
          ))}
        </div>

        {screenshots.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              aria-label="Previous screenshot"
              className="absolute top-1/2 left-3 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-300 bg-background/80 backdrop-blur-sm transition hover:border-indigo-500 dark:border-slate-700"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              aria-label="Next screenshot"
              className="absolute top-1/2 right-3 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-300 bg-background/80 backdrop-blur-sm transition hover:border-indigo-500 dark:border-slate-700"
            >
              <ChevronRight className="size-4" />
            </button>
          </>
        )}
      </div>

      {screenshots.length > 1 && (
        <div className="mt-4 flex items-center justify-center gap-1">
          {screenshots.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Go to screenshot ${i + 1}`}
              aria-current={i === index}
              className="grid cursor-pointer place-items-center p-2.5"
            >
              <span
                aria-hidden="true"
                className={`block h-1.5 rounded-full transition-all duration-300 ${
                  i === index
                    ? "w-6 bg-accent-gradient"
                    : "w-1.5 bg-slate-300 dark:bg-slate-700"
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
