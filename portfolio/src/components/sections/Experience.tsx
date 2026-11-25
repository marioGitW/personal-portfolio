"use client";

import { useRef } from "react";
import { Calendar, MapPin, Wrench } from "lucide-react";
import { AssetIcon } from "@/components/ui/AssetIcon";
import { HudFrame, HudTag, HudTagRule } from "@/components/ui/hud-frame";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { sectionCopy } from "@/content/fallbacks";
import { useHudReveal } from "@/hooks/useHudReveal";
import { resolveDuration, sortByOrder } from "@/lib/format";
import type { Experience as ExperienceContent } from "@/types/sanity";

type ExperienceProps = {
  experience: ExperienceContent;
};

export function Experience({ experience }: ExperienceProps) {
  // Non-mutating; items without an order sink to the end.
  const items = sortByOrder(experience.experienceItems ?? []);

  const sectionRef = useRef<HTMLElement>(null);
  useHudReveal(sectionRef, { dependencies: [items.length] });

  return (
    <section
      id="experience"
      aria-labelledby="experience-title"
      ref={sectionRef}
      className="section-shell"
    >
      <SectionHeading
        titleId="experience-title"
        eyebrow={sectionCopy.experience.eyebrow}
        title={sectionCopy.experience.titleLead}
        accent={sectionCopy.experience.titleAccent}
        description={experience.experienceDescription}
        descriptionClassName="max-w-2xl"
      />

      <ol className="relative mt-14 space-y-10">
        <span aria-hidden="true" className="absolute top-2 bottom-2 left-6 w-px bg-border" />

        {items.map((item) => {
          const duration = resolveDuration(item);
          const bullets = item.keyFeatures ?? [];

          return (
            <li key={item._key} className="relative pl-18">
              {/* The wrapper is what keeps the line clear of the node. */}
              <span className="absolute top-1 left-0 grid size-13 place-items-center bg-background ring-4 ring-background">
                <HudFrame as="span" size="sm" reveal className="grid size-12 place-items-center">
                  <AssetIcon
                    src={item.iconUrl}
                    alt={item.name ? `${item.name} logo` : ""}
                    className="size-8 object-contain"
                    fallback={<Wrench className="size-5 text-muted" />}
                  />
                </HudFrame>
              </span>

              <HudFrame size="md" interactive reveal className="p-6 sm:p-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div data-hud-item className="min-w-0">
                    {item.name && (
                      <h3 className="text-xl font-semibold text-foreground">{item.name}</h3>
                    )}
                    {item.place && (
                      <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted">
                        <MapPin className="size-3.5 text-muted" />
                        {item.place}
                      </p>
                    )}
                  </div>

                  {duration && (
                    <HudTag data-hud-item className="w-fit shrink-0">
                      <Calendar aria-hidden="true" className="size-3.5 text-muted" />
                      <HudTagRule />
                      <span className="text-[13px]">{duration}</span>
                    </HudTag>
                  )}
                </div>

                {(item.position || item.type) && (
                  <div data-hud-item className="mt-5 flex flex-wrap items-center gap-2.5">
                    {item.position && <h4>{item.position}</h4>}
                    {item.type && (
                      <HudTag className="font-heading text-[11px] font-semibold tracking-[0.06em] uppercase">
                        {item.type}
                      </HudTag>
                    )}
                  </div>
                )}

                {bullets.length > 0 && (
                  <ul
                    data-hud-item
                    className="mt-4 list-disc space-y-1.5 border-t border-border pt-4 pl-5 text-sm text-muted"
                  >
                    {bullets.map((bullet, index) => (
                      // Index-keyed: bullet text is free-form and may repeat.
                      <li key={index}>{bullet}</li>
                    ))}
                  </ul>
                )}
              </HudFrame>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
