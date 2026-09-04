import type { ReactNode } from "react";

type AssetIconProps = {
  src: string | null | undefined;
  alt: string;
  className?: string;
  /** Rendered instead when there is no icon, so the layout never collapses. */
  fallback?: ReactNode;
};

/**
 * Renders a CMS icon asset (experience logos, skill icons).
 *
 * Deliberately a plain `<img>` rather than `next/image`: these come from
 * Sanity file assets and may be SVG, which the Next image optimizer refuses to
 * process unless `dangerouslyAllowSVG` is enabled — a setting that would apply
 * to every remote image on the site. Icons are small, already-optimized assets,
 * so there is nothing meaningful to gain from the optimizer here.
 */
export function AssetIcon({ src, alt, className = "", fallback = null }: AssetIconProps) {
  if (!src) {
    return <>{fallback}</>;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- see note above: SVG file assets can't go through next/image.
    <img src={src} alt={alt} loading="lazy" decoding="async" className={className} />
  );
}
