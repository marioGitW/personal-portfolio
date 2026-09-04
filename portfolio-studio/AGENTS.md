# AGENTS.md — `portfolio-studio` (Sanity Studio)

This file gives coding agents context for working in the Sanity Studio app. Read this before making any changes.

---

## Project Summary

Headless CMS for the portfolio site (sibling app: `../portfolio`, the Next.js frontend). This Studio authors the `portfolio` singleton (Hero, About, Experience, Skills, Social) and one `project` document per project. Site name, tagline and email are **not** in the CMS — they live in `../portfolio/src/content/fallbacks.ts`.

This app is **independent** of the Next.js app — it has its own `package.json`, its own dev server (default port 3333), and its own Vercel deployment. It is not imported into `portfolio`; the two only connect via the Sanity Content Lake API (project ID + dataset).

---

## Tech Stack

- Sanity Studio (TypeScript, `clean` template)
- Dataset: `production`, visibility: **private**

---

## Hard Rules

1. **Every content field is optional.** No `Rule.required()` anywhere in `schemaTypes/`. This is intentional: the CMS must allow partially-completed content, and the frontend is responsible for null/undefined handling, fallbacks and conditional rendering. Type-level validation (valid URL if provided, positive number if provided) is fine and encouraged.
2. **Two document types only:** the `portfolio` singleton and `project`. Hero, About, Experience and Skills are **object fields inside `portfolio`**, not standalone documents. Do not promote them to documents.
3. **Do not add fields speculatively.** Only add what's in the PRD/roadmap for the current phase.
4. **Keep the dataset private.** Do not change dataset visibility to public.
5. **Don't modify anything in `../portfolio`** from this app's context — cross-app changes should be explicit, separate tasks.

---

## Folder Structure

```
/schemaTypes
  /documents
    portfolio.ts        # singleton: hero, about, experience, skills
    project.ts          # one document per project
  /objects
    hero.ts
    about.ts
    aboutTag.ts
    experience.ts
    experienceItem.ts
    skills.ts
    skillItem.ts
  /shared
    icon.ts             # defineIconField() — SVG/PNG/JPG/JPEG file field
  index.ts              # registers all schemas
structure.ts            # Studio desk structure + singleton constants
sanity.config.ts        # wires structure, filters singleton templates/actions
```

---

## Content Model

**`portfolio` (singleton, document id `portfolio`)** — grouped into Studio tabs:

| Group | Field | Shape |
|---|---|---|
| Hero | `hero` | `roleTag`, `mainTitle`, `subtitle` |
| About | `about` | `description`, `tags[]` (`highlightedText`, `description`) |
| Experience | `experience` | `experienceDescription`, `experienceItems[]` |
| Skills | `skills` | `skillItems[]` (`title`, `deviconPath`, `icon` override) |
| Social | `social` | `socialLinks[]` (`platform`, `linkType`, `value`, `label`, `icon` override) |

`experienceItem`: `order`, `icon`, `name`, `place` (On-site/Remote/Hybrid select), `position`, `type` (free string — deliberately **not** an enum), `keyFeatures[]`, `durationMonths` (number only, no unit text), `durationLabel` (free-text override for open-ended periods like "2022 — Present"; wins over `durationMonths` — see `resolveDuration` in the frontend's `lib/format.ts`).

`socialLink`: `platform` picks the icon, `linkType` decides how `value` becomes an href (`whatsapp` strips the number to bare digits for `wa.me`). Adding a platform means editing three places: the option list here, `SocialPlatform` in the frontend's `types/sanity.ts`, and `SOCIAL_ICONS` in `components/ui/SocialIcons.tsx` — otherwise it silently falls back to the generic globe icon.

**`project` (one document per project)** — groups: Card / Media / Details / Links.
`order`, `title`, `slug`, `featured`, `thumbnail`, `thumbnailTag`, `thumbnailTitle`, `thumbnailDescription`, `screenshots[]`, `demoVideoUrl`, `techStack[]`, `projectOverview`, `keyFeatures[]`, `liveProjectUrl`, `sourceCodeUrl`.

The `thumbnail*` fields are the **single source of truth** — the expanded/modal view reuses them rather than duplicating into separate fields.

---

## Conventions

- **Ordering is explicit, never creation-date.** Both `experienceItem.order` and `project.order` are numbers, sorted ascending by the frontend (lower = first). The Studio's Projects list uses the same default ordering.
- **Icons are `file` fields, not `image` fields.** Sanity's image pipeline cannot transform SVG (no crop/hotspot, empty metadata). See the comment in `schemaTypes/shared/icon.ts`. Use `defineIconField()` rather than hand-rolling.
- **Skill icons are devicon paths first, uploads second.** The frontend already sources them from the devicon CDN (`../portfolio/src/content/skills.ts`), so `skillItem.deviconPath` holds e.g. `java/java-original.svg` and `skillItem.icon` is an optional upload for technologies devicon doesn't ship. Resolution order when wiring up: **`icon` asset URL if present, else `deviconUrl(deviconPath)`**. Company logos in `experienceItem` are uploads only — they're bespoke and will never be in devicon.
- `skillItem.tsx` is `.tsx` (not `.ts`) because its preview renders an `<img>` so a mistyped devicon path is visible in the Studio immediately.
- **Singletons** are declared in `structure.ts` (`SINGLETON_TYPES`, `SINGLETON_ACTIONS`) and enforced in `sanity.config.ts` by filtering initial-value templates and document actions. To add another singleton, add it to both sets.

---

## Frontend Wiring Status

**Connected.** `../portfolio` reads this CMS live. The relevant frontend files:

| File | Role |
|---|---|
| `src/sanity/client.ts` | Client; reads `NEXT_PUBLIC_SANITY_*` + server-only `SANITY_API_READ_TOKEN` |
| `src/sanity/queries.ts` | All GROQ. Dereferences `asset->url` for images *and* file assets |
| `src/sanity/devicon.ts` | Client-safe icon helpers (no `@sanity/client` import) |
| `src/sanity/image.ts` | `urlFor` builder — **server-side only** |
| `src/types/sanity.ts` | Types mirroring this schema; every field nullable |
| `src/lib/cms.ts` | Merges CMS content over fallbacks, per field |
| `src/content/fallbacks.ts` | Every hardcoded value in the frontend, in one file |

**Schema changes must be mirrored in `src/types/sanity.ts` and `src/sanity/queries.ts`** — a new field is invisible to the frontend until it's added to the GROQ projection.

### Constraints that are easy to break

- **The dataset is private.** The frontend authenticates with a read-only token (`SANITY_API_READ_TOKEN`, no `NEXT_PUBLIC_` prefix). Queries therefore run in Server Components only.
- **Never import `@/sanity/client`, `@/sanity/fetch` or `@/sanity/image` from a client component.** Doing so ships ~576KB of `@sanity/client` to the browser. `@/sanity/devicon` is the client-safe module.
- **Renaming a field is a breaking change** — the frontend falls back to hardcoded content when a field comes back empty, so a rename fails silently rather than erroring. Grep `queries.ts` before renaming.

---

## Testing / Validation Expectations

- `npx tsc --noEmit` passes
- `npx sanity schema validate` reports 0 errors, 0 warnings
- `npm run build` completes cleanly
- `npx eslint .` passes
- After adding/editing a schema, manually verify in the Studio UI (`localhost:3333`) that the field renders and a test entry saves

---

## Related Files

- `/PRD.md` (repo root) — full product requirements
- `../portfolio/AGENTS.md` — conventions for the Next.js frontend
- `../portfolio/src/lib/types.ts` — source of truth for content shapes
