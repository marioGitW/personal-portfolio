"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Calendar, MapPin, Wrench } from "lucide-react";
import { AssetIcon } from "@/components/ui/AssetIcon";
import { HudFrame, HudTag, HudTagRule } from "@/components/ui/hud-frame";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { sectionCopy } from "@/content/fallbacks";
import { useActiveCards } from "@/hooks/useActiveCards";
import { useHudReveal } from "@/hooks/useHudReveal";
import { prefersReducedMotion, refreshWhenLoaded, registerGsapPlugins } from "@/lib/animations";
import { resolveDuration, sortByOrder } from "@/lib/format";
import type { Experience as ExperienceContent } from "@/types/sanity";

type ExperienceProps = {
  experience: ExperienceContent;
};

// The line is filled down to this far down the viewport, from the first logo to the last.
const FILL = { line: "center 60%", scrub: 0.3 };

export function Experience({ experience }: ExperienceProps) {
  // Non-mutating; items without an order sink to the end.
  const items = sortByOrder(experience.experienceItems ?? []);

  const sectionRef = useRef<HTMLElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);
  useHudReveal(sectionRef, { dependencies: [items.length] });
  useActiveCards(sectionRef, items.length);

  useGSAP(
    () => {
      const timeline = timelineRef.current;
      const fill = fillRef.current;
      const nodes = gsap.utils.toArray<HTMLElement>("[data-timeline-node]", timeline);
      if (!timeline || !fill || nodes.length === 0) {
        return;
      }

      registerGsapPlugins();

      // How far along the fill each logo's middle is, 0-1.
      let reached: number[] = [];
      let progress = 0;

      // From layout, not from rects: those move with whatever is being brought in.
      const measure = () => {
        const middles = nodes.map((node) => {
          const item = node.offsetParent as HTMLElement;
          return item.offsetTop + node.offsetTop + node.offsetHeight / 2;
        });
        const first = middles[0];
        const length = middles[middles.length - 1] - first;
        fill.style.top = `${first}px`;
        fill.style.height = `${length}px`;
        reached = middles.map((middle) => (length > 0 ? (middle - first) / length : 0));
      };

      const markNodes = () => {
        nodes.forEach((node, index) => {
          node.classList.toggle("is-passed", progress > 0 && progress >= reached[index]);
        });
      };

      measure();
      ScrollTrigger.addEventListener("refreshInit", measure);

      if (prefersReducedMotion()) {
        progress = 1;
        gsap.set(fill, { scaleY: 1 });
        markNodes();
      } else {
        gsap.fromTo(
          fill,
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: "none",
            // The fill's own progress, which the scrub has running a little behind the scroll's.
            onUpdate() {
              progress = this.progress();
              markNodes();
            },
            scrollTrigger: {
              trigger: nodes[0],
              start: FILL.line,
              endTrigger: nodes[nodes.length - 1],
              end: FILL.line,
              scrub: FILL.scrub,
            },
          },
        );
      }
      refreshWhenLoaded();

      return () => {
        ScrollTrigger.removeEventListener("refreshInit", measure);
        nodes.forEach((node) => node.classList.remove("is-passed"));
      };
    },
    { scope: timelineRef, dependencies: [items.length], revertOnUpdate: true },
  );

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

      <div ref={timelineRef} className="relative isolate mt-14">
        <span aria-hidden="true" className="absolute top-2 bottom-2 left-6 w-px bg-border" />

        <ol className="space-y-10">
          {items.map((item) => {
            const duration = resolveDuration(item);
            const bullets = item.keyFeatures ?? [];

            return (
              <li key={item._key} className="relative pl-18">
                {/* The wrapper is what keeps the line clear of the node, and the fill, which is
                  over everything else. */}
                <span
                  data-timeline-node
                  className="timeline-node absolute top-1 left-0 z-[1] grid size-13 place-items-center bg-background ring-4 ring-background"
                >
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

        {/* After the cards, as it is a layer of its own, and text over one loses its subpixel
            antialiasing. */}
        <span
          ref={fillRef}
          aria-hidden="true"
          className="absolute left-6 w-px origin-top [transform:scaleY(0)] bg-muted will-change-transform"
        />
      </div>
    </section>
  );
}
