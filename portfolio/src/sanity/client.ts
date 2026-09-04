import { createClient, type SanityClient } from "@sanity/client";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2024-01-01";

/**
 * Server-only. The dataset is private, so reads need a viewer (read-only)
 * token. Deliberately NOT prefixed with `NEXT_PUBLIC_`, so Next never inlines
 * it into the client bundle — every query runs from a Server Component.
 */
const readToken = process.env.SANITY_API_READ_TOKEN;

/**
 * `null` when the project isn't configured, so the app degrades to its
 * hardcoded fallbacks instead of throwing at import time (e.g. a fresh clone
 * with no `.env.local`, or CI).
 */
export const sanityClient: SanityClient | null =
  projectId && dataset
    ? createClient({
        projectId,
        dataset,
        apiVersion,
        useCdn: true,
        token: readToken,
        perspective: "published",
      })
    : null;
