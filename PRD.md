# Personal Portfolio — Product & Technical Reference

**Owner:** Mario Spasovski
**Status:** Built and deployed to Vercel
**Repo layout:** `portfolio/` (Next.js site) + `portfolio-studio/` (Sanity Studio)

This document describes how the project actually works. It replaces the original
pre-build spec — where the two disagree, this document is correct.

---

## 1. What it is

A single-page portfolio site for a software engineering role search. One scrollable
page with anchor navigation, backed by a Sanity CMS so content can be edited without
a redeploy, plus a contact form and lightweight engagement counters.

Two deployables, deployed separately:

| Package             | What it is                              | Where it runs                                |
| ------------------- | --------------------------------------- | -------------------------------------------- |
| `portfolio/`        | Next.js 16 App Router site + API routes | Vercel                                       |
| `portfolio-studio/` | Sanity Studio (content editing UI)      | Sanity-hosted, deployed with `sanity deploy` |

---

## 2. Stack

| Layer         | Choice                                                                       |
| ------------- | ---------------------------------------------------------------------------- |
| Framework     | Next.js 16 (App Router, Turbopack), React 19                                 |
| Language      | TypeScript, `strict`                                                         |
| Styling       | Tailwind CSS v4 (CSS-first config in `globals.css`, no `tailwind.config.js`) |
| Animation     | GSAP + ScrollTrigger                                                         |
| Smooth scroll | Lenis, driven off the GSAP ticker                                            |
| Theming       | `next-themes`, `attribute="class"`, dark default, system preference disabled |
| Icons         | `lucide-react`, plus hand-rolled inline SVGs for social platforms            |
| Forms         | React Hook Form with a Zod resolver                                          |
| Email         | Resend                                                                       |
| Counters      | Upstash Redis (REST)                                                         |
| CMS           | Sanity v6, private dataset, server-side read token                           |
| Fonts         | `next/font` — Space Grotesk (headings), Inter (body)                         |
| Formatting    | Prettier + `eslint-config-prettier`; ESLint via `eslint-config-next`         |

No database, no auth, no test suite. No Three.js or particle background — the
backdrop is a flat themed colour.

---

## 3. Content model

Sanity is the source of truth. The frontend degrades to hardcoded fallbacks in
`src/content/fallbacks.ts` when the CMS is empty or unreachable, so the site is
never blank.

**Documents**

- `portfolio` — a singleton (fixed id `portfolio`; duplicate/delete actions are stripped in the Studio) holding `hero`, `about`, `experience`, `skills`, `social`
- `project` — one per project, ordered by an `order` field with `_createdAt` as tiebreaker

**Fallback rules** (`src/lib/cms.ts`)

- Hero / About / Experience / Skills fall back **per field**, so a half-filled CMS still renders a complete page
- Projects are **all-or-nothing** — if the CMS has any project, only those show, so a deleted project actually disappears
- Social links have **no fallback**; entries that don't resolve to an href are dropped rather than rendered dead

Content is re-fetched at most once a minute (`export const revalidate = 60` in
`src/app/page.tsx`), so publishing in the Studio appears on the site without a redeploy.

**Asset handling.** GROQ dereferences assets to plain URLs (`asset->url`) in the query
itself, so one code path covers both image assets and SVG file assets. Icons are Sanity
_file_ fields, not image fields — the image pipeline can't transform SVG and returns
empty metadata for it. Skill icons resolve as: uploaded file first, else a devicon CDN path.

---

## 4. Page sections

Rendered in order by `src/app/page.tsx`:

1. **Hero** — two-line masked name lockup animated in by GSAP, cursor-tracked gradient
   highlight on the name, portrait with cursor and scroll parallax, CTA buttons
   ("Let's Connect" anchor, "View Resume" opens the resume modal)
2. **About** — portrait illustration, bio paragraphs, stat tags, language pills, and a
   rotating accent beam around the panel border
3. **Experience** — vertical timeline whose progress line scrubs with scroll; per entry:
   logo, role, place, duration pill, bullet points
4. **Projects** — on desktop, scrolling **pins the section** and drives a horizontal card
   track; below `lg` it falls back to a vertical stack. Clicking a card opens a modal with
   a screenshot carousel, optional demo video, tech stack, overview, features and links
5. **Skills** — an SVG "engineering profile" radar (decorative weighting, never shown as
   numbers) beside a paginated tool grid, 12 per page with pagination dots
6. **Contact** — name / email / message form with inline validation and a rotating beam
   on the submit button
7. **Activity counter** — site visits and a one-per-session like button
8. **Footer** — logo, tagline, social icons, copyright

Persistent chrome: sticky header with an animated active-section pill, a fixed social
sidebar (`md` and up), a custom cursor (fine pointers only), and a preloader that holds
the viewport for ~1.9s on first load then hands off to the hero entrance.

**Not built:** certifications, blog, admin panel, database, auth, skills category filtering
(the tool grid is paginated, not filtered).

---

## 5. API routes

All are Route Handlers under `src/app/api/`. Every one is rate limited by IP through
`src/lib/rateLimit.ts`, which uses `INCR` + `EXPIRE` on the existing Redis client and
**fails open** — a counter outage can never take the contact form down.

| Route              | Method | Limit    | Behaviour                                                                                                      |
| ------------------ | ------ | -------- | -------------------------------------------------------------------------------------------------------------- |
| `/api/contact`     | POST   | 5 / hour | Zod-validates, sends via Resend. Returns a flat `{field: message}` map on 400; raw Zod issues stay server-side |
| `/api/stats`       | GET    | —        | Reads visit and like counts; `force-dynamic` so it is never cached                                             |
| `/api/stats/visit` | POST   | 30 / min | Increments visits. POST-only so crawlers and prerenders can't move the counter                                 |
| `/api/stats/like`  | POST   | 30 / min | Increments likes                                                                                               |

Contact input is bounded (name 100, email 254, message 5000) so an oversized payload
can't be forwarded to Resend.

**Counter namespacing.** Keys are prefixed per environment — `portfolio:*` in production,
`preview:portfolio:*` on previews, `dev:portfolio:*` everywhere else. The switch is
`VERCEL_ENV`, **not** `NODE_ENV`, which is `"production"` on preview builds too and would
let a preview write into the live numbers. `scripts/reset-stats.mjs` is the only way to
reset a counter; there is deliberately no HTTP surface for it.

Visits count page loads, not unique visitors. The "already counted" flag lives on `window`,
so a React Strict Mode double-mount or a Fast Refresh still counts once, while a real
reload counts again.

---

## 6. Project structure

```
portfolio/
  src/
    app/
      api/contact/route.ts
      api/stats/{route.ts, like/route.ts, visit/route.ts}
      layout.tsx          # fonts, metadata, providers, preloader, cursor, sidebar
      page.tsx            # composes every section; revalidate = 60
      globals.css         # Tailwind v4 config, theme tokens, custom utilities, keyframes
    components/
      sections/           # Hero, About, Experience, Projects, Skills, Contact,
                          # ActivityCounter, SkillCard
      projects/           # ProjectCard, ProjectModal, ProjectsScroller, ProjectVisual,
                          # ProjectScreenshots, ProjectVideo, ProjectLinks, TechStack
      ui/                 # Button, Header, Footer, Cursor, Preloader, SmoothScroll,
                          # ThemeToggle, Providers, ResumeModal, AssetIcon,
                          # EngineeringRadar, SectionHeading, PaginationDots,
                          # SocialIcons, SocialLinkList, SocialSidebar
    hooks/useFocusTrap.ts
    lib/                  # cms, content, format, animations, redis, rateLimit,
                          # resend, contact, visit, nav, types, site, seo,
                          # structuredData
    sanity/               # client, fetch, queries, devicon
    content/fallbacks.ts  # every hardcoded content value
    types/sanity.ts       # CMS-shaped types
  scripts/reset-stats.mjs
  public/                 # CV pdf, hero/about art, logo, fallback project images,
                          # opengraph-image.png (the share card)

portfolio-studio/
  schemaTypes/{documents,objects,shared}/
  structure.ts            # singleton wiring
  sanity.config.ts
```

**Conventions.** Components are PascalCase, modules camelCase; everything is a named
export except the two Next-required defaults in `app/`. Imports use the `@/` alias and are
ordered react → next → third-party → `@/` → type-only.

**Where code goes.** `lib/cms.ts` is async and server-only (it pulls in `@sanity/client`);
`lib/content.ts` is the sync accessor safe for client components. `sanity/devicon.ts`
deliberately has type-only imports so client components can use it without shipping the
Sanity client to the browser.

---

## 7. Styling

Tailwind v4 with a CSS-first config in `globals.css`. Theme tokens are CSS custom
properties swapped by a `.dark` class:

- Accent is a **gradient**, not one colour: `--color-accent-from: #6366f1` → `--color-accent-to: #22d3ee`
- `--background` / `--foreground` flip per theme; `--color-love: #ff6978` for the like button

Repeated class combinations are `@utility` definitions rather than copy-paste:
`section-shell`, `section-eyebrow`, `text-muted`, `surface-card`, `pill-tech`,
`icon-button`, `pagination-dot`. Effects that Tailwind can't express — the rotating border
beam, the hero name outline and glow, the portrait bloom, the placeholder grid — are
hand-written classes in the same file.

Every animated component checks `prefers-reduced-motion` (via `prefersReducedMotion()` in
`lib/animations.ts`) and sets the final state directly instead of tweening.

---

## 8. Environment variables

Documented in `portfolio/.env.example`. Set all of these in the Vercel dashboard.

| Variable                         | Required | Notes                                                                                      |
| -------------------------------- | -------- | ------------------------------------------------------------------------------------------ |
| `MAIL_API_KEY`                 | yes      | Contact form delivery                                                                      |
| `MAIL_TO`                  | yes      | Destination inbox                                                                          |
| `KV_REST_URL`         | yes      | Counters and rate limiting                                                                 |
| `KV_REST_TOKEN`       | yes      | "                                                                                          |
| `CMS_PROJECT_ID`  | yes      | Sanity project id                                                                          |
| `CMS_DATASET`     | yes      | `production`                                                                               |
| `CMS_API_VERSION` | yes      | `2024-01-01`                                                                               |
| `CMS_READ_TOKEN`          | yes      | Read-only viewer token; the dataset is private                                             |
| `STATS_ENV`                      | no       | Only needed if hosted somewhere `VERCEL_ENV` is absent                                     |
| `SITE_URL`                       | no       | Origin for Open Graph URLs; falls back to `VERCEL_PROJECT_PRODUCTION_URL`                  |

No variable carries a `NEXT_PUBLIC_` prefix, so none is inlined into client JS.
`src/sanity/client.ts` imports `server-only`, which turns an accidental client
import into a build error rather than a silent leak.

Without Sanity configured the site still builds and renders from fallbacks.

---

## 9. Security posture

- Every API route is IP rate limited; the limiter fails open
- Contact input is length-bounded; validation internals are not returned to the client
- Response headers set in `next.config.ts`: `X-Content-Type-Options`, `X-Frame-Options`,
  `Referrer-Policy`, `Permissions-Policy`; `X-Powered-By` is disabled
- The demo-video iframe is sandboxed; only `http(s)` project URLs are rendered
- External links carry `rel="noopener noreferrer"`
- Counter resets exist only as a local script, never as an HTTP endpoint

---

## 10. Commands

```bash
# site
cd portfolio
npm run dev            # dev server
npm run build          # production build
npm run lint           # eslint
npm run format         # prettier --write
npm run format:check   # prettier --check
npx tsc --noEmit       # typecheck

node scripts/reset-stats.mjs                  # show every counter, change nothing
node scripts/reset-stats.mjs dev --yes        # reset the dev namespace

# studio
cd portfolio-studio
npm run dev            # local studio
npm run deploy         # publish the studio
```

---

## 11. Maintenance notes

- **`portfolio-studio` carries npm advisories** (moderate, transitive through the Sanity
  CLI toolchain). They are build-time only and never reach the browser or the Vercel
  deployment. `npm audit fix` proposes a **downgrade** of `sanity` a full major version —
  do not run it. Pinning `js-yaml` via `overrides` also fails: `@vercel/frameworks` requires
  `^3.x` and forcing `^4` produces an invalid tree.
- **`AGENTS.md` is regenerated by `next dev`.** It is gitignored and excluded from Prettier,
  so it stays local and never reaches the repo.
- **Adding a social platform** means three edits: the `SocialPlatform` union in
  `src/types/sanity.ts`, the Studio's `socialLink` schema options, and the icon map in
  `src/components/ui/SocialIcons.tsx`. Anything unlisted is authored as `other` with an
  uploaded icon.
- **The Projects pin distance is measured from the live DOM**, so any number of projects
  works — but with only two cards the horizontal travel is a few pixels, which is expected,
  not a bug.

---

## 12. Possible next steps

Not built, not scheduled:

- Analytics (`@vercel/analytics` was installed but never wired up, so it was removed)
- A test suite
