import type { ReactNode, Ref } from "react";

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
  /** About animates the eyebrow and heading separately, so it needs both refs. */
  eyebrowRef?: Ref<HTMLParagraphElement>;
  headingRef?: Ref<HTMLHeadingElement>;
};

export function SectionHeading({
  eyebrow,
  title,
  accent,
  description,
  descriptionClassName = "",
  titleId,
  eyebrowRef,
  headingRef,
}: SectionHeadingProps) {
  return (
    <>
      <p ref={eyebrowRef} className="section-eyebrow">
        {eyebrow}
      </p>
      <h2 id={titleId} ref={headingRef} className="mt-3">
        {title}
        {accent ? ` ${accent}` : null}
      </h2>
      {description ? (
        <p className={`mt-4 text-muted ${descriptionClassName}`.trim()}>{description}</p>
      ) : null}
    </>
  );
}
