# QA report

Run on 17–18 Oct 2026 in a Linux container (Ubuntu 24.04, Node 22.22, Chromium 141 headless). There is no GPU in
this environment, so all browser runs used **software WebGL (SwiftShader)**; frame rates there (about 4–6 fps for the
3D stage) say nothing about real devices, and no performance score was measured.

## Automated checks (final run)

| Check | Command | Result |
|---|---|---|
| Lint | `npm run lint` | ✅ no errors, no warnings |
| Types | `npm run typecheck` | ✅ no errors (strict, `noUncheckedIndexedAccess`) |
| Unit tests | `npm test` | ✅ 36 passed (timeline continuity on desktop, tablet and mobile layouts, reversibility, focus order, list never empty, content honesty, assets exist, founders) |
| Production build | `npm run build` | ✅ static export of `/`, `/privacy/`, `/terms/`, 404, `sitemap.xml`, `robots.txt` |
| End-to-end | `npm run test:e2e` | ✅ 17 passed, 1 skipped by design (the menu test runs on the mobile project only); desktop 1440 × 900 and Pixel 7 |

The end-to-end suite checks: page loads with every section and **no console errors**, every in-page link has a
target, **all images load**, **no horizontal scrolling**, the 3D stage reaches "ready", **pins** and highlights a
service mid-way, scrolling back restores the hero, **reduced motion** gives the static layout with all six
services, store buttons are not links until real URLs exist, the **menu** traps focus and closes with Escape, and the
legal pages are marked as drafts.

The pin test was repeated 10 times in a row after the final changes: 10 passed.

## What the tests caught (and what was fixed)

| Problem | Found by | Fix |
|---|---|---|
| The toolbox rushed towards the camera mid-flight (double easing) | unit test "never jumps" | one easing per phase (`timeline.ts`) |
| "How it works" steps stayed invisible on desktop | visual QA | entrance animation only on narrow screens |
| "How it works" panel did not stick | visual QA | `overflow: clip` instead of `hidden` on the curtain |
| Later sections measured scroll positions before the story section grew | visual QA (wrong active step) | `ScrollTrigger.refresh()` after the layout mode is set |
| Mobile caption card could show empty at the edges of the services | visual QA | a service stays selected while the list is visible (+ unit test) |
| Brand colours washed out to pastel in 3D (over-exposure) | logo comparison render | albedo compensation for saturated colours (`materials.albedo`) |
| First scroll into the house could stall on shader compilation | flaky e2e under load | `renderer.compileAsync` at load |
| Hero title overflowed at 1440 px; heading overlapped the house roof | visual QA | type scale; heading yields to the services list |

## Visual QA

`node scripts/qa-shots.mjs all` saves screenshots to `qa/` (not included in the ZIP; re-run to regenerate). Checked:

- **Desktop 1440 × 900**: 13 points through the story forwards (hero, exit, arrival, house reveal, door, behind the
  glass, each service, job done, curtain) and 4 points backwards; every section afterwards.
- **Tablet 820 × 1180** and **mobile 390 × 844 (2×)**: the same story points and every section.
- **Backwards**: frames at the same scroll position match the forward frames (the scene is a function of position).
- **Logo**: the 3D logo was rendered next to the official file and adjusted until tile colour, glyph halves, peak
  and arc gradient matched.
- **Founders**: portrait framing, reveal and the links on desktop and mobile.
- No console errors, failed requests or horizontal overflow on any viewport.

## REA (Reverse Engineer Anything) on the built site

REA 6.5.0 CLI against a Chromium started with `--remote-debugging-port`:

| Command | Result |
|---|---|
| `rea list-browser-targets` | one page target, "Housefi: Home Help, Made Easy." |
| `rea inspect-web-page --observation-ms 3000` | 22 resources (12 scripts, CSS, images, 1 font), 663 accessibility nodes, one frame, **no console events** during the window |
| `rea capture-web-screenshot` | viewport PNG of the hero, matching the Playwright screenshots |

## Size (measured from `out/`, gzip level 9)

| What | Raw | Gzipped |
|---|---|---|
| JS and CSS referenced by the home page HTML | 787 KB | 247 KB |
| three.js chunk (loaded after first paint, only for the 3D version) | 610 KB | 154 KB |
| Home page HTML | | 11 KB |
| All images, posters, portraits, font | about 1.1 MB in `public/` | |

## Known limitations

- Real-device performance (phones, low-end laptops) was not measured here; the scene steps its quality down by itself
  if frames are slow.
- Safari and Firefox were not available in this environment; the site uses standard APIs (WebGL 2/1, CSS sticky,
  `overflow: clip`, `backdrop-filter`) with fallbacks, but has only been run in Chromium.
- App store links, contact details, social profiles and the final legal texts are placeholders by design.
