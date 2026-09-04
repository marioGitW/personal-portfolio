"use client";

import { useEffect, useId, useRef } from "react";
import gsap from "gsap";
import { prefersReducedMotion, registerGsapPlugins } from "@/lib/animations";

type RadarDimension = {
  label: string;
  /** Visual shape weighting only; never rendered as a number. */
  value: number;
};

const DIMENSIONS: RadarDimension[] = [
  { label: "Problem Solving", value: 0.8 },
  { label: "Product Development", value: 0.7 },
  { label: "Automation", value: 0.5 },
  { label: "Learning", value: 0.9 },
  { label: "Systems Thinking", value: 0.6 },
  { label: "Teamwork", value: 0.85 },
];

const SIZE = 480;
const CENTER = SIZE / 2;
const MAX_RADIUS = 118;
const LABEL_RADIUS = MAX_RADIUS + 40;
const RINGS = [0.25, 0.5, 0.75, 1];

function pointAt(index: number, fraction: number, radius = MAX_RADIUS) {
  const angle = (Math.PI / 180) * (-90 + index * 60);
  return {
    x: CENTER + Math.cos(angle) * radius * fraction,
    y: CENTER + Math.sin(angle) * radius * fraction,
  };
}

function ringPoints(fraction: number) {
  return DIMENSIONS.map((_, i) => {
    const { x, y } = pointAt(i, fraction);
    return `${x},${y}`;
  }).join(" ");
}

function profilePoints() {
  return DIMENSIONS.map((dimension, i) => {
    const { x, y } = pointAt(i, dimension.value);
    return `${x},${y}`;
  }).join(" ");
}

function labelAnchor(index: number): "start" | "middle" | "end" {
  if (index === 0 || index === 3) {
    return "middle";
  }
  return index === 1 || index === 2 ? "start" : "end";
}

export function EngineeringRadar({ className = "" }: { className?: string }) {
  const gradientId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<SVGGElement>(null);
  const polygonRef = useRef<SVGPolygonElement>(null);
  const pointsRef = useRef<SVGGElement>(null);
  const labelsRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const grid = gridRef.current;
    const polygon = polygonRef.current;
    const points = pointsRef.current;
    const labels = labelsRef.current;

    if (!container || !grid || !polygon || !points || !labels) {
      return;
    }

    const reducedMotion = prefersReducedMotion();
    const pointEls = points.querySelectorAll<SVGCircleElement>("circle");

    if (reducedMotion) {
      gsap.set([grid, labels], { opacity: 1 });
      gsap.set(polygon, { opacity: 1, scale: 1 });
      gsap.set(pointEls, { opacity: 1, scale: 1 });
      return;
    }

    registerGsapPlugins();

    gsap.set(grid, { opacity: 0 });
    gsap.set(labels, { opacity: 0, y: 6 });
    gsap.set(polygon, { opacity: 0, scale: 0, transformOrigin: `${CENTER}px ${CENTER}px` });
    gsap.set(pointEls, { opacity: 0, scale: 0, transformOrigin: "center" });

    const timeline = gsap.timeline({
      defaults: { ease: "power3.out" },
      scrollTrigger: {
        trigger: container,
        start: "top 85%",
        toggleActions: "play none none none",
      },
    });

    timeline
      .to(grid, { opacity: 1, duration: 0.6 })
      .to(polygon, { opacity: 1, scale: 1, duration: 0.7, ease: "power2.out" }, "-=0.2")
      .to(pointEls, { opacity: 1, scale: 1, duration: 0.4, stagger: 0.06 }, "-=0.3")
      .to(labels, { opacity: 1, y: 0, duration: 0.5 }, "-=0.5");

    return () => {
      timeline.scrollTrigger?.kill();
      timeline.kill();
    };
  }, []);

  return (
    <div ref={containerRef} className={className}>
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="w-full"
        role="img"
        aria-label={`Engineering profile across ${DIMENSIONS.map((d) => d.label).join(", ")}`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: "var(--color-accent-from)" }} />
            <stop offset="100%" style={{ stopColor: "var(--color-accent-to)" }} />
          </linearGradient>
        </defs>

        <g ref={gridRef}>
          {RINGS.map((ring) => (
            <polygon
              key={ring}
              points={ringPoints(ring)}
              fill="none"
              className={ring === 1 ? "stroke-foreground/15" : "stroke-foreground/8"}
              strokeWidth={1}
            />
          ))}
          {DIMENSIONS.map((dimension, i) => {
            const { x, y } = pointAt(i, 1);
            return (
              <line
                key={dimension.label}
                x1={CENTER}
                y1={CENTER}
                x2={x}
                y2={y}
                className="stroke-foreground/10"
                strokeWidth={1}
              />
            );
          })}
        </g>

        <polygon
          ref={polygonRef}
          points={profilePoints()}
          fill={`url(#${gradientId})`}
          fillOpacity={0.16}
          stroke={`url(#${gradientId})`}
          strokeWidth={1.75}
          strokeLinejoin="round"
        />

        <g ref={pointsRef}>
          {DIMENSIONS.map((dimension, i) => {
            const { x, y } = pointAt(i, dimension.value);
            return (
              <circle
                key={dimension.label}
                cx={x}
                cy={y}
                r={4.5}
                fill={`url(#${gradientId})`}
                className="drop-shadow-[0_0_6px_var(--color-accent-to)]"
              />
            );
          })}
        </g>

        <g ref={labelsRef} className="font-heading">
          {DIMENSIONS.map((dimension, i) => {
            const { x, y } = pointAt(i, 1, LABEL_RADIUS);
            const words = dimension.label.split(" ");
            const anchor = labelAnchor(i);

            return (
              <text
                key={dimension.label}
                x={x}
                y={y}
                textAnchor={anchor}
                className="fill-foreground/75 text-[11px] font-semibold tracking-[0.06em] uppercase"
              >
                {words.map((word, wordIndex) => (
                  <tspan key={word} x={x} dy={wordIndex === 0 ? (words.length > 1 ? -6 : 4) : 13}>
                    {word}
                  </tspan>
                ))}
              </text>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
