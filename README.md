# Personal Portfolio

A single-page portfolio site for Mario Spasovski — an animated, CMS-backed showcase of
projects, experience and skills, with a working contact form and lightweight engagement
counters.

Content is edited in a Sanity Studio and appears on the live site within a minute, with no
redeploy. If the CMS is empty or unreachable the site falls back to hardcoded content, so
it is never blank.

**Deep technical reference:** [`PRD.md`](PRD.md)

---

## What it does

- **Single scrollable page** with anchor navigation and an animated active-section indicator
- **Hero** with a masked two-line name lockup, cursor-tracked gradient highlight and portrait parallax
- **About** with bio, stats and language pills inside a panel with a rotating accent beam
- **Experience** timeline whose progress line scrubs as you scroll
- **Projects** that pin the page on desktop and scroll horizontally; each opens a modal with
  a screenshot carousel, optional demo video, tech stack, overview and links
- **Skills** — an SVG engineering-profile radar beside a paginated tool grid
- **Contact form** that validates inline and emails via Resend
- **Activity counter** — page visits plus a one-per-session like button
- **Dark and light themes**, a custom cursor, smooth scrolling, and a preloader

---

## Technologies

**Framework and language**

|                                              |                                                               |
| -------------------------------------------- | ------------------------------------------------------------- |
| [Next.js 16](https://nextjs.org)             | App Router, Route Handlers, Turbopack                         |
| [React 19](https://react.dev)                | Server Components for data, client components for interaction |
| [TypeScript](https://www.typescriptlang.org) | `strict` mode                                                 |

**UI and styling**

|                                                                        |                                                       |
| ---------------------------------------------------------------------- | ----------------------------------------------------- |
| [Tailwind CSS v4](https://tailwindcss.com)                             | CSS-first config — no `tailwind.config.js`            |
| [GSAP](https://gsap.com) + ScrollTrigger                               | Entrance timelines, scroll scrubbing, section pinning |
| [Lenis](https://lenis.darkroom.engineering)                            | Smooth scrolling, driven off the GSAP ticker          |
| [next-themes](https://github.com/pacocoursey/next-themes)              | Dark default, light toggle                            |
| [lucide-react](https://lucide.dev)                                     | Icons                                                 |
| [country-flag-icons](https://www.npmjs.com/package/country-flag-icons) | Language flags                                        |
| `next/font`                                                            | Space Grotesk (headings), Inter (body)                |

**Data and backend**

|                                                                         |                                                       |
| ----------------------------------------------------------------------- | ----------------------------------------------------- |
| [Sanity](https://www.sanity.io) v6                                      | Headless CMS, private dataset, server-side read token |
| [Upstash Redis](https://upstash.com)                                    | Visit/like counters and IP rate limiting              |
| [Resend](https://resend.com)                                            | Contact form delivery                                 |
| [React Hook Form](https://react-hook-form.com) + [Zod](https://zod.dev) | Form state and validation, shared client and server   |

**Tooling**

ESLint (`eslint-config-next`), Prettier, and `@tailwindcss/postcss`.

No database, no auth, no test suite. No WebGL or particle background.

---

## Repo layout

Two packages, deployed separately:

```
portfolio/          Next.js site + API routes        -> Vercel
portfolio-studio/   Sanity Studio (content editing)  -> sanity deploy
PRD.md              Full technical reference
```

Inside `portfolio/src`:

```
app/            routes, layout, API handlers, global CSS
components/     sections/ (page sections), projects/ (project UI), ui/ (shared)
hooks/          useFocusTrap
lib/            cms, content, format, animations, redis, rateLimit, resend, contact, visit
sanity/         client, queries, fetch, devicon helpers
content/        fallback content used when the CMS is unavailable
types/          CMS-shaped types
```

---

## Getting started

```bash
cd portfolio
npm install
cp .env.example .env.local   # then fill it in — see below
npm run dev                  # http://localhost:3000
```

The site builds and renders from fallback content even with no `.env.local`, so you can run
it before wiring up any service.

To edit content:

```bash
cd portfolio-studio
npm install
npm run dev                  # http://localhost:3333
```

### Scripts

| Command                                  | What it does                       |
| ---------------------------------------- | ---------------------------------- |
| `npm run dev`                            | Dev server                         |
| `npm run build`                          | Production build                   |
| `npm run start`                          | Serve the production build         |
| `npm run lint`                           | ESLint                             |
| `npm run format`                         | Prettier, write                    |
| `npm run format:check`                   | Prettier, check only               |
| `node scripts/reset-stats.mjs`           | Show every counter, change nothing |
| `node scripts/reset-stats.mjs dev --yes` | Reset the dev counters             |

---

## Environment variables

Documented in [`portfolio/.env.example`](portfolio/.env.example); set the same values in the
Vercel dashboard.

Every variable is server-only — the project ships no `NEXT_PUBLIC_*` values, so
nothing here is inlined into the browser bundle. `src/sanity/client.ts` imports
`server-only` to keep it that way: importing it from a client component fails the
build rather than leaking the values.

| Variable           | Notes                                          |
| ------------------ | ---------------------------------------------- |
| `MAIL_API_KEY`     | Contact form delivery                          |
| `MAIL_TO`          | Destination inbox                              |
| `KV_REST_URL`      | Counters and rate limiting                     |
| `KV_REST_TOKEN`    | "                                              |
| `CMS_PROJECT_ID`   | Sanity project id                              |
| `CMS_DATASET`      | `production`                                   |
| `CMS_API_VERSION`  | `2024-01-01`                                   |
| `CMS_READ_TOKEN`   | Read-only viewer token; the dataset is private |
| `SITE_URL`         | Origin for Open Graph URLs; optional on Vercel |

Counters are namespaced by environment (`portfolio:*`, `preview:portfolio:*`, `dev:portfolio:*`)
off `VERCEL_ENV`, so preview deploys and local work never touch the live numbers.

---

## Deployment

`portfolio/` deploys to Vercel as a standard Next.js app — no `vercel.json` needed. Set the
environment variables above, then push. `portfolio-studio/` is published separately with
`npm run deploy` from that directory.

Security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`,
`Permissions-Policy`) are set in `next.config.ts`, and all four API routes are IP rate
limited. See [`PRD.md`](PRD.md) for the full security posture.
