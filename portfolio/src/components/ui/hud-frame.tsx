import type { ComponentPropsWithRef, ElementType, ReactNode } from "react";

type HudSize = "lg" | "md" | "sm";

type OwnProps<T extends ElementType> = {
  as?: T;
  size: HudSize;
  /** Reacts to the pointer and to keyboard focus. md and sm only. */
  interactive?: boolean;
  /** Comes in with useHudReveal, from the section it is in. */
  reveal?: boolean;
  /** lg only: where its chamfer goes from 16px to 24px. Must match --hud-cut. */
  wideFrom?: keyof typeof WIDE_FROM;
  className?: string;
  children?: ReactNode;
};

type HudFrameProps<T extends ElementType> = OwnProps<T> &
  Omit<ComponentPropsWithRef<T>, keyof OwnProps<T>>;

const CUT = { compact: 16, wide: 24 };

// Two outlines, as the length of a stroke can't come from CSS. One of them is always hidden.
const WIDE_FROM = {
  md: { compact: "md:hidden", wide: "hidden md:block" },
  lg: { compact: "lg:hidden", wide: "hidden lg:block" },
};

const BRACKET = 30;
const SEGMENT = { gap: 20, length: 60 };
const TICKS = {
  bottom: { count: 6, spacing: 14, inset: 64 },
  right: { count: 4, spacing: 12, top: 150 },
  long: 9,
  short: 5,
};

// Bar heights of the glyph in a panel's header, in pixels.
const SIGNAL = [5, 9, 12, 7, 12, 5, 10] as const;

const tickLength = (index: number) => (index % 2 === 0 ? TICKS.long : TICKS.short);

// The site's one box: chamfered top left and bottom right, bracketed at the other two corners.
// md and sm are CSS alone. The clip-path is on their pseudo-elements and never on the element,
// which would lose its focus ring and its lift to it. lg is drawn, so it can draw itself in.
export function HudFrame<T extends ElementType = "div">({
  as,
  size,
  interactive = false,
  reveal = false,
  wideFrom = "md",
  className = "",
  children,
  ...props
}: HudFrameProps<T>) {
  const Tag: ElementType = as ?? "div";

  return (
    <Tag
      className={`hud hud-${size} ${interactive ? "hud-live " : ""}${className}`.trim()}
      data-hud-frame={reveal ? size : undefined}
      {...props}
    >
      {size === "lg" && (
        <>
          <span data-hud-shape aria-hidden="true" className="hud-shape absolute inset-0">
            <span className="hud-dots absolute inset-0" />
          </span>
          <HudLines cut={CUT.compact} className={WIDE_FROM[wideFrom].compact} />
          <HudLines cut={CUT.wide} className={WIDE_FROM[wideFrom].wide} />
        </>
      )}
      {interactive && <span aria-hidden="true" className="hud-hot" />}
      {size === "md" && (
        <>
          <span aria-hidden="true" data-hud-corner className="hud-corner hud-corner-tr" />
          <span aria-hidden="true" data-hud-corner className="hud-corner hud-corner-bl" />
          {interactive && <span aria-hidden="true" className="hud-accent" />}
        </>
      )}
      {children}
      {size === "lg" && <HudBrackets />}
    </Tag>
  );
}

// The panel's outline, drawn over it because clip-path cuts a CSS border off with the corners.
// Nothing here is measured: lengths are from the near corner, and a nested <svg> moves the
// origin to a far one. Every stroke has pathLength 1, which is what the entrance draws it by.
function HudLines({ cut, className }: { cut: number; className: string }) {
  return (
    <svg
      aria-hidden="true"
      className={`hud-frame pointer-events-none absolute inset-0 size-full overflow-visible ${className}`}
    >
      <g className="hud-outline">
        <line data-hud-stroke pathLength={1} x1={cut} y1={0} x2="100%" y2={0} />
        {/* Full length from the near end, so the offset is what stops them at the chamfer. */}
        <svg y={-cut} className="overflow-visible">
          <line data-hud-stroke pathLength={1} x1="100%" y1={cut} x2="100%" y2="100%" />
        </svg>
        <svg x={-cut} className="overflow-visible">
          <line data-hud-stroke pathLength={1} x1="100%" y1="100%" x2={cut} y2="100%" />
        </svg>
        <line data-hud-stroke pathLength={1} x1={0} y1="100%" x2={0} y2={cut} />
      </g>

      <line
        data-hud-stroke
        pathLength={1}
        className="hud-edge hud-edge-ink"
        x1={0}
        y1={cut}
        x2={cut}
        y2={0}
      />
      <svg x="100%" y="100%" className="overflow-visible">
        <line
          data-hud-stroke
          pathLength={1}
          className="hud-edge hud-edge-accent"
          x1={0}
          y1={-cut}
          x2={-cut}
          y2={0}
        />
      </svg>

      <line
        data-hud-stroke
        pathLength={1}
        className="hud-segment"
        x1={cut + SEGMENT.gap}
        y1={0}
        x2={cut + SEGMENT.gap + SEGMENT.length}
        y2={0}
      />

      <g data-hud-detail className="hud-ticks">
        <svg x="100%" y="100%" className="overflow-visible">
          {Array.from({ length: TICKS.bottom.count }, (_, index) => {
            const x = -TICKS.bottom.inset - (TICKS.bottom.count - 1 - index) * TICKS.bottom.spacing;
            return <line key={index} x1={x} y1={0} x2={x} y2={-tickLength(index)} />;
          })}
        </svg>
        <svg x="100%" className="overflow-visible">
          {Array.from({ length: TICKS.right.count }, (_, index) => {
            const y = TICKS.right.top + index * TICKS.right.spacing;
            return <line key={index} x1={0} y1={y} x2={-tickLength(index)} y2={y} />;
          })}
        </svg>
      </g>
    </svg>
  );
}

/**
 * The brackets at a panel's two square corners. hot is the same two in the accent, to fade in
 * over them. They come after what is in the panel: the About one's are layers of their own, and
 * text over a layer loses its subpixel antialiasing.
 */
export function HudBrackets({ hot = false }: { hot?: boolean }) {
  const look = `hud-frame hud-bracket ${hot ? "hud-bracket-hot " : ""}pointer-events-none absolute overflow-visible`;
  const stroke = hot ? {} : { "data-hud-stroke": true, pathLength: 1 };

  return (
    <>
      <svg aria-hidden="true" width={BRACKET} height={BRACKET} className={`${look} top-0 right-0`}>
        <path className="hud-edge" d={`M0 0H${BRACKET}V${BRACKET}`} {...stroke} />
      </svg>
      <svg
        aria-hidden="true"
        width={BRACKET}
        height={BRACKET}
        className={`${look} bottom-0 left-0`}
      >
        <path className="hud-edge" d={`M0 0V${BRACKET}H${BRACKET}`} {...stroke} />
      </svg>
    </>
  );
}

/** A panel's name and signal glyph, along the top of it. */
export function HudLabel({ children }: { children: ReactNode }) {
  return (
    <>
      <p className="flex items-center gap-2.5 font-heading text-[11px] leading-none tracking-[0.24em] text-muted uppercase">
        <span aria-hidden="true" className="size-[7px] bg-foreground" />
        {children}
      </p>
      <span aria-hidden="true" className="flex h-3 items-end gap-[3px]">
        {SIGNAL.map((height, index) => (
          <span key={index} className="w-0.5 bg-border" style={{ height }} />
        ))}
      </span>
    </>
  );
}

/** Splits a tag in two, as in "MK | Macedonian". */
export function HudTagRule() {
  return <span aria-hidden="true" className="h-[13px] w-px bg-border" />;
}

/** The small labels: languages, durations, kinds of work, technologies. */
export function HudTag({
  as: Tag = "span",
  className = "",
  children,
  ...props
}: {
  as?: "span" | "li" | "div";
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tag className={`hud hud-sm hud-tag ${className}`.trim()} {...props}>
      {children}
    </Tag>
  );
}
