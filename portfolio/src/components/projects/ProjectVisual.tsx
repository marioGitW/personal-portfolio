import Image from "next/image";

type ProjectVisualProps = {
  title: string | null;
  imageUrl: string | null;
  /** Blur placeholder from Sanity's asset metadata, when available. */
  lqip?: string | null;
  className?: string;
};

function getInitials(title: string | null): string {
  return (title ?? "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

export function ProjectVisual({ title, imageUrl, lqip, className = "" }: ProjectVisualProps) {
  if (imageUrl) {
    return (
      // Dark placeholder in both themes, not bg-slate-100: the card always
      // renders this behind a photo under a near-black gradient, so a light
      // backdrop can only ever show up as a pale seam if the scaled image and
      // its container disagree by a sub-pixel at the rounded edge.
      <div className={`relative overflow-hidden bg-slate-900 ${className}`}>
        <Image
          src={imageUrl}
          alt=""
          fill
          sizes="(min-width: 1024px) 42vw, 100vw"
          className="object-cover"
          {...(lqip ? { placeholder: "blur" as const, blurDataURL: lqip } : {})}
        />
      </div>
    );
  }

  // No thumbnail set, so fall back to the initials placeholder.
  return (
    <div className={`relative isolate overflow-hidden bg-slate-100 dark:bg-slate-900 ${className}`}>
      <span aria-hidden="true" className="project-visual-grid absolute inset-0" />
      <span
        aria-hidden="true"
        className="absolute -top-10 -right-10 size-40 rounded-full bg-accent-gradient opacity-20 blur-3xl"
      />
      <span
        aria-hidden="true"
        className="absolute -bottom-10 -left-10 size-40 rounded-full bg-accent-gradient opacity-10 blur-3xl"
      />
      <span className="relative flex h-full items-center justify-center font-heading text-5xl font-bold text-accent-gradient opacity-70 sm:text-6xl">
        {getInitials(title)}
      </span>
    </div>
  );
}
