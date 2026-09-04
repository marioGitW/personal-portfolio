import { createImageUrlBuilder, type SanityImageSource } from "@sanity/image-url";
import { sanityConfig } from "./client";

/**
 * Sanity's image-url builder, for transforms (resize, crop, format).
 *
 * The common case is already handled in GROQ — `queries.ts` dereferences
 * `asset->url` so components receive plain URLs, which works uniformly for
 * image assets and for file assets (icons, which may be SVG). Reach for this
 * only when a specifically sized or reformatted URL is needed.
 *
 * Server-side only: this imports `./client`, which pulls in `@sanity/client`.
 * Client components must not import this module — see `./devicon` for the
 * client-safe icon helpers.
 */

const builder =
  sanityConfig.projectId && sanityConfig.dataset
    ? createImageUrlBuilder({
        projectId: sanityConfig.projectId,
        dataset: sanityConfig.dataset,
      })
    : null;

/** Returns null rather than throwing when the project isn't configured. */
export function urlFor(source: SanityImageSource) {
  return builder?.image(source) ?? null;
}
