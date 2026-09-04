/**
 * Resets the portfolio counters in Upstash.
 *
 * Deliberately a local script and not an API route: there is no HTTP surface
 * that can reset anything, in any environment. It reads credentials from
 * `.env.local` and refuses to touch the production namespace unless you both
 * name it and pass `--yes`.
 *
 *   node scripts/reset-stats.mjs                    # show every counter, change nothing
 *   node scripts/reset-stats.mjs dev --yes          # reset dev:portfolio:*
 *   node scripts/reset-stats.mjs preview --yes      # reset preview:portfolio:*
 *   node scripts/reset-stats.mjs production --yes   # reset portfolio:*   (live numbers!)
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvLocal() {
  const env = {};
  let raw;
  try {
    raw = readFileSync(join(root, ".env.local"), "utf8");
  } catch {
    return env;
  }
  for (const line of raw.split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match) {
      env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }
  return env;
}

const env = { ...loadEnvLocal(), ...process.env };
const url = env.UPSTASH_REDIS_REST_URL;
const token = env.UPSTASH_REDIS_REST_TOKEN;

if (!url || !token) {
  console.error("Missing UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN in .env.local.");
  process.exit(1);
}

const PREFIXES = { development: "dev:", preview: "preview:", production: "" };

async function command(...parts) {
  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(parts),
  });
  const body = await response.json();
  if (body.error) {
    throw new Error(body.error);
  }
  return body.result;
}

const keysFor = (prefix) => [`${prefix}portfolio:visits`, `${prefix}portfolio:likes`];

async function report() {
  console.log("\nCurrent portfolio counters:\n");
  for (const [name, prefix] of Object.entries(PREFIXES)) {
    for (const key of keysFor(prefix)) {
      const value = await command("GET", key);
      console.log(`  ${name.padEnd(12)} ${key.padEnd(28)} ${value ?? "(missing)"}`);
    }
  }
}

const [target, ...flags] = process.argv.slice(2);

if (!target) {
  await report();
  console.log("\nNothing changed. Pass an environment and --yes to reset, e.g.");
  console.log("  node scripts/reset-stats.mjs dev --yes\n");
  process.exit(0);
}

const name = target === "dev" ? "development" : target === "prod" ? "production" : target;

if (!(name in PREFIXES)) {
  console.error(`Unknown environment "${target}". Use development, preview or production.`);
  process.exit(1);
}

const keys = keysFor(PREFIXES[name]);

if (!flags.includes("--yes")) {
  console.log(`\nWould reset these ${name} keys to 0:\n`);
  keys.forEach((key) => console.log(`  ${key}`));
  console.log("\nRe-run with --yes to actually do it.\n");
  process.exit(0);
}

if (name === "production") {
  console.log("\n!! Resetting the LIVE production counters. !!\n");
}

for (const key of keys) {
  const before = await command("GET", key);
  await command("SET", key, "0");
  console.log(`  ${key}: ${before ?? "(missing)"} -> 0`);
}

await report();
