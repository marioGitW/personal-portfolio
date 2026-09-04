import { createClient, type SanityClient } from "@sanity/client";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2024-01-01";

// Server-only. Not NEXT_PUBLIC_, so Next never inlines it into client JS.
const readToken = process.env.SANITY_API_READ_TOKEN;

// null when unconfigured, so a fresh clone falls back instead of throwing.
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
