import type { ReactNode } from "react";

type SectionHeadingProps = {
  eyebrow: string;
  title: ReactNode;
  /** Trailing words of the heading, in the same colour. Omitted by Skills. */
  accent?: string | null;
  description?: string | null;
  /** Experience constrains its description; the centred sections do not. */
  descriptionClassName?: string;
  /** Target for the section's aria-labelledby, so it is a named region. */
  titleId?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  accent,
  description,
  descriptionClassName = "",
  titleId,
}: SectionHeadingProps) {
  return (
    <>
      <p className="section-eyebrow">{eyebrow}</p>
      <h2 id={titleId} className="mt-3">
        {title}
        {accent ? ` ${accent}` : null}
      </h2>
      {description ? (
        <p className={`mt-4 text-muted ${descriptionClassName}`.trim()}>{description}</p>
      ) : null}
    </>
  );
}
