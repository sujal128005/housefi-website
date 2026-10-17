# Housefi website

The marketing website for **Housefi**: home services in one app. It introduces the brand and the six services,
explains how the app works, and sends people to the app. It does **not** take bookings or payments; the Housefi app
does that.

The centrepiece is **"The Glass House"**, a scroll-driven 3D story: a Housefi toolbox leaves the hero, flies into a
glass-fronted house, opens behind the window, each service takes its turn, and a "Job done" ticket slides out of the
letterbox. Scrolling back plays it in reverse.

- Static site: Next.js (App Router) with `output: 'export'`, so `npm run build` produces plain files in `out/` for
  any static host (Netlify, Vercel, Cloudflare Pages, S3, GitHub Pages, nginx…).
- 3D: three.js, loaded after the first paint, rendered only while on screen, with quality tiers and a static
  fallback.
- Motion: GSAP ScrollTrigger; every animation respects `prefers-reduced-motion`.
- No cookies, no analytics, no forms, no external requests at runtime (fonts are self-hosted).

## Quick start

Requirements: Node.js 20.9 or newer (tested with Node 22) and npm.

```bash
npm ci            # install exactly what package-lock.json lists
npm run dev       # development server on http://localhost:3000
npm run build     # static export to out/
npm start         # serve out/ on http://localhost:3000
```

## Checks

```bash
npm run lint        # ESLint (Next.js core-web-vitals + TypeScript rules)
npm run typecheck   # TypeScript, strict
npm test            # unit tests (Vitest): timeline continuity, content honesty, assets
npm run check       # all of the above plus the production build

# End-to-end (Playwright, Chromium). Build first; the tests serve out/.
npx playwright install chromium   # once, if Chromium is not already available
npm run test:e2e
```

Visual QA helpers (not part of the build):

```bash
node scripts/qa-shots.mjs all           # screenshots of the sequence forwards and backwards + every section → qa/
node scripts/render-stills.mjs          # re-render the poster stills and the share image from the 3D scene
```

`render-stills.mjs` needs a fresh `npm run build` first, and another build afterwards to include the new images.

## What to change before launch

Everything editable lives in **`src/content/`**:

| File | What it holds |
|---|---|
| `site.ts` | Name, tagline, description, **logo**, **app store links**, **contact details**, **social links**, site URL |
| `services.ts` | The six services: name, examples, description, artwork |
| `copy.ts` | Hero, story captions, How it works steps, Why Housefi, app section, About, FAQ |
| `founders.ts` | Founders: name, role, photo, links |

Items that are intentionally **not filled in** (the site shows them as "Coming soon" / "To be announced" instead of
inventing them):

- **App store URLs**: `site.appLinks.googlePlay`, `site.appLinks.appStore`. Until set, the buttons are not links.
- **Contact**: `site.contact.email`, `phone`, `hours`, `address`.
- **Social profiles**: `site.social.*` (only profiles with a URL are shown).
- **Site URL**: set `NEXT_PUBLIC_SITE_URL` (see `.env.example`) for canonical links, Open Graph and the sitemap.
- **Legal pages**: `/privacy/` and `/terms/` are clearly marked draft placeholders (`src/app/privacy`, `src/app/terms`).

Already filled in from what Housefi supplied: the logo, the founders (names, photos, LinkedIn and portfolio links),
the services (from the app's catalogue), the app screens and the illustrations.

### The logo

The official Housefi logo is in `public/brand/` (`housefi-logo.png`, 512 px, transparent; `housefi-logo-256.webp`),
cut from the supplied artwork; the favicons (`favicon.ico`, `favicon.png`, `apple-touch-icon.png`) and the share
image (`og.png`) are made from it. It is shown through one component, `src/components/ui/Logo.tsx`, whose source is
`site.logo.src` in `src/content/site.ts`.

In the 3D scene the logo is **geometry**, not a picture: `src/components/scene/models/logo.ts` rebuilds the tile, the
house glyph and the orange arc from measurements of the logo file (the arc is the elliptical quarter ring of the
original). It appears on the toolbox, as the sign on the glass house's gable, and in the floating brand pieces. If the
logo artwork changes, update the measurements there and re-render the stills.

## How the code is organised

```
src/
  app/                    pages: home, privacy, terms, 404; sitemap and robots
  content/                all words, links and settings (edit here)
  lib/
    timeline.ts           the scroll story as data: journeyState(p) — a pure function of scroll progress
    headerTheme.ts        header colour over dark/light sections
  components/
    layout/               Header (+ full-screen menu), Footer (contact), FloatingCta, LegalPage
    sections/             Journey (hero + 3D story + services), HowItWorks, WhyHousefi, AppPromo, About,
                          Founders, Faq
    scene/                three.js: GlassHouseScene (renderer, camera, quality), materials, textures,
                          models/ (3D logo, house, toolbox, six service objects, debris, confetti, ticket)
    motion/               GSAP setup, useScrollScene (reduced-motion aware), Reveal
    ui/                   Logo, Button, StoreButtons, Phone
public/
  illustrations/          Housefi's soft-3D illustrations (from the app)
  screens/                app screenshots (from the app's walkthrough)
  brand/                  the Housefi logo
  founders/               founder portraits
  stills/                 posters rendered from the 3D scene
tests/unit/               Vitest
tests/e2e/                Playwright
scripts/                  static server, QA screenshots, still rendering
docs/                     research notes, animation blueprint, QA report
```

### The 3D story in one paragraph

`src/lib/timeline.ts` defines beats as windows of scroll progress `p` (0–1) and returns everything the scene and
captions need for a given `p`: camera, toolbox, house door, each service object's position and focus, ticket,
caption opacities. `Journey.tsx` pins a full-viewport stage with CSS `position: sticky`, reads `p` from a GSAP
ScrollTrigger (with 0.8 s smoothing), updates the captions directly, and passes `p` to `GlassHouseScene`, which
draws a frame. Because nothing depends on time or on previous frames, scrolling backwards replays the same frames, and
unit tests check that nothing jumps. See `docs/ANIMATION-BLUEPRINT.md`.

### Performance and accessibility

- three.js (about 600 KB unminified, ~150 KB gzipped) loads in its own chunk after the first paint; a poster image
  rendered from the scene shows until then.
- Quality tiers: lower pixel ratio and no refraction or shadows on low-memory, low-core or Save-Data devices; the
  scene also steps down by itself if frames take too long.
- The canvas renders only while visible and only when the scroll position changed.
- `prefers-reduced-motion: reduce`, no WebGL, or a lost WebGL context → a static hero and a normal grid of service
  cards; no pinning anywhere.
- Semantic landmarks, a skip link, keyboard-operable menu (focus trap, Escape), native `<details>` FAQ, visible focus
  rings, alt text for content images.

## Credits and licences

- Logo, illustrations, app screenshots and founder photos: Housefi.
- Typeface: Anek Latin (SIL Open Font License), self-hosted via `@fontsource-variable/anek-latin`.
- Icons: Lucide (ISC). 3D: three.js (MIT). Framework: Next.js (MIT). Animation: GSAP (Standard "no charge" licence, https://gsap.com/standard-license).
- The motion design was inspired by principles observed in a screen recording of super.money; no artwork, code, copy
  or branding from that site is used (see `docs/RESEARCH.md`).
