import type { ReactNode } from "react";

type AssetIconProps = {
  src: string | null | undefined;
  alt: string;
  className?: string;
  /** Rendered when there is no icon, so the layout never collapses. */
  fallback?: ReactNode;
};

// A plain <img>, not next/image: these are Sanity file assets that may be SVG,
// which the optimizer only handles with dangerouslyAllowSVG — a setting that
// would then apply to every remote image on the site.
export function AssetIcon({ src, alt, className = "", fallback = null }: AssetIconProps) {
  if (!src) {
    return <>{fallback}</>;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- SVG assets can't use next/image.
    <img src={src} alt={alt} loading="lazy" decoding="async" className={className} />
  );
}
