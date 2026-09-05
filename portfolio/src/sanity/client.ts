import "server-only";
import { createClient, type SanityClient } from "@sanity/client";

// None of these carry the NEXT_PUBLIC_ prefix, so Next never inlines them into
// client JS. The `server-only` import above is what keeps that true: a client
// component importing this file fails the build instead of leaking the values.
const projectId = process.env.CMS_PROJECT_ID;
const dataset = process.env.CMS_DATASET;
const apiVersion = process.env.CMS_API_VERSION ?? "2024-01-01";

const readToken = process.env.CMS_READ_TOKEN;

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
