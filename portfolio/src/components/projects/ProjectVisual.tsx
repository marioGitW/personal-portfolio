import Image from "next/image";

type ProjectVisualProps = {
  title: string | null;
  imageUrl: string | null;
  /** Blur placeholder from Sanity's asset metadata, when available. */
  lqip?: string | null;
  /** Defaults to the card's own layout; the modal and detail page differ. */
  sizes?: string;
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

export function ProjectVisual({
  title,
  imageUrl,
  lqip,
  sizes = "(min-width: 1024px) 42vw, 100vw",
  className = "",
}: ProjectVisualProps) {
  if (imageUrl) {
    return (
      // Surface, not a fixed tone: inside ProjectCard's dark token scope this is
      // navy like the fade over it, so the scaled image and its container
      // disagreeing by a sub-pixel at the rounded edge cannot show a pale seam.
      <div className={`relative overflow-hidden bg-surface ${className}`}>
        <Image
          src={imageUrl}
          alt=""
          fill
          sizes={sizes}
          className="object-cover"
          {...(lqip ? { placeholder: "blur" as const, blurDataURL: lqip } : {})}
        />
      </div>
    );
  }

  // No thumbnail set, so fall back to the initials placeholder.
  return (
    <div className={`relative isolate overflow-hidden bg-surface ${className}`}>
      <span aria-hidden="true" className="project-visual-grid absolute inset-0" />
      <span className="relative flex h-full items-center justify-center font-heading text-5xl font-bold text-muted sm:text-6xl">
        {getInitials(title)}
      </span>
    </div>
  );
}
