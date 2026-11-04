import type { SVGProps } from "react";

// The MS monogram, drawn on a 512x256 grid. The letters take currentColor, so
// the mark follows whatever text colour its parent sets and flips with the
// theme; the ">_" prompt is always the accent pink. Inline rather than an
// <img> so it switches theme without a second file and costs no request.
// The same paths, as standalone files, live in /brand at the repo root.
const LETTERS =
  "M0 0H50L150 155.04L250 0H299.23A102 91 0 0 0 255.19 69.48L169.71 202H130.29L44 68.22V256H0ZM256 256V87.47A86 82 0 0 0 300 147.08V219H421.5A45.5 39 0 0 0 467 180A45.5 39 0 0 0 421.5 141H341A70 66 0 0 1 271 75A86 75 0 0 1 357 0H473L512 39L464.5 86.5L444.7 66.7L472.4 39H360A44 32.5 0 0 0 316 71.5A44 32.5 0 0 0 360 104H432A80 76 0 0 1 512 180A80 76 0 0 1 432 256Z";
const PROMPT = "M311 154h28l26 26-26 26h-28l26-26zM373 190h50v16h-50z";

type LogoProps = Omit<SVGProps<SVGSVGElement>, "viewBox" | "children"> & {
  /** Accessible name. Leave unset when a surrounding link or label already names it. */
  title?: string;
};

export function Logo({ title, ...props }: LogoProps) {
  const a11y = title ? { role: "img", "aria-label": title } : { "aria-hidden": true };

  return (
    <svg viewBox="0 0 512 256" fill="currentColor" {...a11y} {...props}>
      <path d={LETTERS} />
      <path d={PROMPT} className="fill-accent" />
    </svg>
  );
}
