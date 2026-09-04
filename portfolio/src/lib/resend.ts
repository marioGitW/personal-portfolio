import { Resend } from "resend";

let client: Resend | null = null;

// Built lazily and returned as null when unconfigured, mirroring getRedis().
// The constructor throws on a missing key, and Next evaluates this while
// collecting page data, so constructing at module scope fails the whole build
// when RESEND_API_KEY is not set.
export function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }

  client ??= new Resend(apiKey);
  return client;
}
