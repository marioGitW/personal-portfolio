"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { HudFrame } from "@/components/ui/hud-frame";
import { IconButton } from "@/components/ui/IconButton";
import { PaginationDots } from "@/components/ui/PaginationDots";
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
      <HudFrame size="md" className="hud-picture aspect-video w-full">
        <div className="hud-media">
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
        </div>

        {/* Placed by a wrapper: a button's translate is its hover's. */}
        {screenshots.length > 1 && (
          <>
            <span className="absolute inset-y-0 left-3 flex items-center">
              <IconButton
                onClick={() => goTo(index - 1)}
                aria-label="Previous screenshot"
                className="[--hud-fill:var(--background)]"
              >
                <ChevronLeft className="size-4" />
              </IconButton>
            </span>
            <span className="absolute inset-y-0 right-3 flex items-center">
              <IconButton
                onClick={() => goTo(index + 1)}
                aria-label="Next screenshot"
                className="[--hud-fill:var(--background)]"
              >
                <ChevronRight className="size-4" />
              </IconButton>
            </span>
          </>
        )}
      </HudFrame>

      {screenshots.length > 1 && (
        <PaginationDots
          count={screenshots.length}
          active={index}
          onSelect={goTo}
          variant="current"
          itemLabel={(i) => `Go to screenshot ${i + 1}`}
          className="mt-4 flex items-center justify-center gap-1"
        />
      )}
    </div>
  );
}
