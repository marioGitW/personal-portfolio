# Personal Portfolio

A single-page portfolio site for Mario Spasovski — an animated, CMS-backed showcase of
projects, experience and skills, with a working contact form.

**Full technical reference:** [`PRD.md`](PRD.md)

---

## How it works

Two packages, deployed separately:

```
portfolio/          Next.js site + API routes        -> Vercel
portfolio-studio/   Sanity Studio (content editing)  -> sanity deploy
```

Content is written in the Sanity Studio. The site renders on the server and revalidates
every 60 seconds, so publishing shows up on the live site within a minute without a
redeploy. If the CMS is empty or unreachable, the page falls back to hardcoded content in
`portfolio/src/content/fallbacks.ts`, so it is never blank.

The site is one scrollable page — hero, about, experience, projects, skills, contact form
and an activity counter — with anchor navigation between sections. GSAP drives the entrance
and scroll animations, Lenis the smooth scrolling, and everything respects
`prefers-reduced-motion`.

Each project also has its own page at `/projects/<slug>`. Clicking a card still opens a
modal, but the page exists so project content is crawlable, indexable and shareable.

## Built with

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · GSAP + ScrollTrigger ·
Lenis · Sanity · Upstash Redis (counters and rate limiting) · Resend (contact email) ·
React Hook Form + Zod

## Running locally

```bash
cd portfolio
npm install
npm run dev          # http://localhost:3000
```

It builds and runs on fallback content with no configuration at all. To connect the CMS and
the other services, copy `.env.example` to `.env.local` and fill it in — every variable is
documented there, and all of them are server-only, so nothing reaches the browser bundle.

To edit content:

```bash
cd portfolio-studio
npm install
npm run dev          # http://localhost:3333
```

## Deploying

`portfolio/` is a standard Next.js app on Vercel — set the environment variables from
`.env.example` in the dashboard, then push. `portfolio-studio/` is published separately with
`npm run deploy` from that directory.
