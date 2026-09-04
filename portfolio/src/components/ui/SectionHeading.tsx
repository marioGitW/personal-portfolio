import type { ReactNode, Ref } from "react";

type SectionHeadingProps = {
  eyebrow: string;
  title: ReactNode;
  /** Rendered in the accent gradient after the title. Omitted by Skills. */
  accent?: string | null;
  description?: string | null;
  /** Experience constrains its description; the centred sections do not. */
  descriptionClassName?: string;
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
  eyebrowRef,
  headingRef,
}: SectionHeadingProps) {
  return (
    <>
      <p ref={eyebrowRef} className="section-eyebrow">
        {eyebrow}
      </p>
      <h2 ref={headingRef} className="mt-3">
        {title}
        {accent ? (
          <>
            {" "}
            <span className="text-accent-gradient">{accent}</span>
          </>
        ) : null}
      </h2>
      {description ? (
        <p className={`mt-4 text-muted ${descriptionClassName}`.trim()}>{description}</p>
      ) : null}
    </>
  );
}
