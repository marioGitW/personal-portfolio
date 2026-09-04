# PRD Addendum — Visual & Interaction Features

### Reference: https://qazimaazarshad.github.io/

This addendum adds new features on top of the existing `PRD.md`. Scope: visual polish + one new interactive section. Does not change backend/CMS decisions already made, except where noted (visit/like counter needs persistent storage — see Feature 6).

---

## Feature 1 — Page Load Progress Circle

A preloader shown on initial page load: a circular SVG progress ring that animates from 0–100% while assets load, then fades out to reveal the site.

- Implementation: custom SVG circle (`stroke-dasharray`/`stroke-dashoffset` animated), driven by GSAP
- Trigger: shows on first load only (not on every route change, since this is a single-page site)
- No new library required — GSAP (already in stack) handles the tween

---

## Feature 2 — Solid Background Color (confirmed, exact values from screenshot)

Pixel-sampled directly from your uploaded screenshot — this is a very close match to **Tailwind's `slate-950` (`#020617`)**.

- Background: `#030712` (near-identical to Tailwind `slate-950`)
- Use this as the dark theme's base background token in `tailwind.config.ts`

---

## Feature 3 — Accent Gradient Color (confirmed, exact values from screenshot)

Pixel-sampled from the "Maaz" hero text, the "View Projects" button, and the avatar ring glow — all use the same two-stop gradient:

- **Start (indigo/violet-blue):** `#6366F1` (very close to Tailwind `indigo-500`)
- **End (cyan):** `#22D3EE` (very close to Tailwind `cyan-400`)
- Direction: left-to-right (`to right` / `bg-gradient-to-r`)

Applies to: gradient text on names/highlighted words, primary CTA buttons, the avatar/photo ring glow, active nav indicator, hover glows.

- Implementation: define as Tailwind utilities, e.g. `bg-gradient-to-r from-indigo-500 to-cyan-400`, and `bg-clip-text text-transparent` for gradient text
- These are close matches, not pixel-perfect exports (compressed screenshot + anti-aliasing) — fine-tune by eye once implemented if you want it tighter

---

## Feature 4 — Custom Cursor with Motion

Default browser cursor replaced with a custom element (dot, ring, or dot+ring combo) that follows the mouse with a slight lag/spring, and changes state on hover over interactive elements (links, buttons, cards) — e.g. grows, changes color, or shows text like "View".

- Implementation: custom `Cursor` component using GSAP `quickTo()` for smooth trailing motion (no new library needed — GSAP already covers this well)
- Must be disabled on touch devices (mobile/tablet) — detect via `matchMedia('(pointer: fine)')` and don't render the custom cursor if pointer isn't fine (mouse)
- Respect `prefers-reduced-motion` — reduce or disable trailing lag if set

---

## Feature 5 — Custom Scrollbar Style

Styled scrollbar (thin track, accent-colored thumb, rounded) instead of the browser default.

- Implementation: CSS-only via `::-webkit-scrollbar` pseudo-elements (Chrome/Edge/Safari) + `scrollbar-width`/`scrollbar-color` (Firefox) in `globals.css`
- No new library required for basic styling
- **Recommended addition:** pair this with **Lenis** (smooth-scroll library) — it's the standard pairing with GSAP ScrollTrigger for this exact aesthetic (buttery inertia scrolling), and most sites with this look use it. Adds one dependency: `lenis`

---

## Feature 6 — Name Reveal + Visits/Likes Section — NEW SECTION (corrected spec, based on actual screenshot)

Placed directly before the Footer. This is **not** a generic stats-card grid — it's a specific composition, confirmed from your screenshot:

**Layout (top to bottom):**

1. A thin top row: left side reads small monospace-style label like `EOF — THANKS FOR SCROLLING`; right side shows a small pulsing dot (green) + live **visit count** (e.g. `● 697 visits`)
2. Below that: the owner's **full name spelled out in large outlined/ghost text** (stroke-only, same color as background so it's barely visible — essentially `text-transparent` with a subtle 1px border/stroke), spanning close to full container width, big bold display font
3. **One word of the name** (in the reference, the middle name) is filled solid with the accent gradient (Feature 3) instead of being ghost-outlined — this is the visual focal point
4. **Hover effect:** on hover, the ghost-outlined words fill in with the gradient too (or shift/glow), while un-hovered returns to ghost outline — a reveal-on-hover interaction across each word
5. Below the name: a centered **like button** — heart icon (filled pink/red `#FF6978` when liked, outline when not) + text showing count, e.g. `🤍 11 loves`, with a small confirmation microcopy above/below like `Thank you — that lands.` that appears after clicking

**This requires persistent storage that survives across all visitors** — a real change to backend scope, since counts must increment server-side and persist, not reset per session.

- **Recommended:** Upstash Redis (free tier, generous limits, simple REST API, integrates cleanly with Vercel/Next.js API routes) — assumption made here since you haven't chosen a KV store yet; alternative is Vercel KV (same underlying tech, tighter Vercel integration) if you'd rather stay all-in on Vercel
- Implementation:
  - New API routes: `POST /api/stats/visit` (increments + returns visit count, called once per page load client-side), `POST /api/stats/like` (increments + returns like count, called on click), `GET /api/stats` (returns current counts for initial render)
  - New section component: `NameRevealSection.tsx` (or similar) — implements the ghost-text/gradient-fill word reveal (per-word `<span>`s, each independently hoverable via CSS `:hover` or GSAP), the visits counter with pulsing dot (simple CSS `animate-pulse` on a small circle), and the like button with local "already liked" state
  - Like button should debounce/prevent spam-clicking — disable it and keep it visually "liked" after click, tracked via a `localStorage` flag so one visitor can only like once per browser
- **New dependency:** `@upstash/redis`

---

## Feature 7 — Menu Style

Refined navigation menu styling — likely a distinct look from a plain horizontal nav (e.g. pill-shaped nav container, active-section indicator that slides/morphs between links, or a fullscreen overlay menu on mobile with staggered link entrance animation).

- Implementation: extend existing `Header`/`Nav` component (from original roadmap Phase 4) — add active-link tracking (via `IntersectionObserver` or ScrollTrigger) and an animated indicator (sliding pill/underline) using GSAP
- No new library required

---

## Font

Per your note, font will differ from the reference — no action needed here beyond what's already in the original PRD (`next/font`, your choice of typeface). Not inheriting the reference's font.

---

## Updated Library List (additions only)

```
lenis              — smooth scroll, pairs with GSAP ScrollTrigger
@upstash/redis     — persistent visit/like counters
```

Everything else (custom cursor, loading circle, scrollbar, menu, gradient) is achievable with the existing stack (GSAP, Tailwind) — no additional libraries needed for those.

---

## Env Variables — New

Add to `.env.example` / `.env.local`:

```
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

(Get these from your Upstash dashboard after creating a free Redis database.)

---

## Roadmap Placement

Insert as a new phase — **Phase 5.5** (after section components, before/alongside GSAP animation phase):

```
Phase 5   → section components (unchanged)
Phase 5.5 → NEW: loading circle, custom cursor, custom scrollbar, menu polish, stats section + API routes
Phase 6   → GSAP scroll animations (extends to cover Phase 5.5's elements too)
Phase 7   → contact form (unchanged)
```
