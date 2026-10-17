# Research notes: reference site and tooling

These notes record what could and could not be investigated for this build, and why each design decision was made.
Observed facts, inferences and gaps are kept apart.

## 1. Environment (inspected 17 Oct 2026)

| Item | Finding | Evidence |
|---|---|---|
| OS | Ubuntu 24.04.5 LTS, x86_64, Linux 6.18 (cloud container) | `uname -a`, `/etc/os-release` |
| Node.js / npm | v22.22.0 / 10.9.4 | `node -v`, `npm -v` |
| Browser | Playwright Chromium (build 1194), headless | `/opt/pw-browsers` |
| Archive tools | `zip` / `unzip` present | `which zip unzip` |
| Network | Outbound access is restricted by the environment's network policy. `registry.npmjs.org` and GitHub are reachable; **`super.money`, `web.archive.org` and `awwwards.com` are not** (`CONNECT tunnel failed, response 403` from the proxy; the web-fetch tool returned `ENOTFOUND super.money`). | `curl -sS https://super.money/` |

## 2. REA (Reverse Engineer Anything)

- Repository reviewed: <https://github.com/morluto/rea> (README and `docs/browser-observation.md`).
- REA ships two equivalent surfaces: an MCP server (registered by `npx rea-agents setup`) and a CLI
  (`npx rea-agents <command>`). The docs state that every browser surface "has equivalent CLI and MCP contracts".
- **`npx rea-agents setup` was not run.** It rewrites the agent's MCP configuration and requires an agent restart
  before the MCP tools appear. A restart is not possible inside this running cloud session, so the MCP route
  could not have been verified. The CLI gives the same capabilities without changing any configuration.
- CLI readiness: `npx -y rea-agents@latest --version` → `6.5.0` (installed from npm, works).
- REA's website capabilities are **passive**: it attaches to a Chrome-family browser that you start with
  `--remote-debugging-port`, then captures DOM/accessibility structure, scripts, network metadata, console metadata
  and viewport screenshots (`list-browser-targets`, `inspect-web-page`, `analyze-web-bundle`,
  `capture-web-screenshot`, `compare-web-screenshots`). It does not scroll or drive pages itself; scripted
  scenarios use its Playwright provider.
- **Blocker:** REA analyses pages that the local browser can load. Because the environment cannot reach
  `super.money`, REA could not inspect it. REA was used on the Housefi site itself during QA (see `QA-REPORT.md`).

## 3. Super.money: observations from the screen recording

The site itself was unreachable from this environment, so the investigation used **a screen recording supplied
by the owner** (1892 × 936, 60 fps, 117.7 s: a full scroll from top to bottom, then back to the top). Frames were
extracted with `ffmpeg` at 1 fps for the whole video and 4 fps for the key sequences (0–9 s and 16–24 s), and
studied as contact sheets and full-resolution stills. No DOM, scripts, network data or source code were available,
so **every statement about implementation below is an inference** from what is visible. The recording's frames are
not included in this project (they show another company's proprietary artwork).

### 3.1 Page order (top → bottom)

| t (s) | Section | Look |
|---|---|---|
| 0 | Hero: "Unlock the power of / superUPI / crafted for the superYou", glass "Download Now" card with a QR code | Saturated indigo (~#4B44F5) full-bleed; white type; 3D blue blocks at the corners; a 3D holographic banknote at bottom-right |
| 2–7 | "Up to 5% cashback / on every merchant UPI transaction" | Very light lavender-white; concentric pale circles; circular text "CASHBACK ON EVERY TRANSACTION" on two rings |
| 7–21 | Same heading; the **machine** (glass-fronted cash machine) pinned in the centre | Machine in indigo; white lit interior |
| 21–23 | Indigo curtain rises from the bottom and covers the screen | Solid indigo |
| 23–30 | "Redefining the way you / Scan and pay" with a 3D payment terminal; a QR card slides out of it | Indigo |
| 24–33 | "superUPI simple yet powerful" with a phone mock-up; "The UPI party has only begun" | White, with a large indigo shape |
| 37–44 | "Beyond UPI" → superCard (card rises between glass panes) → superDeposit (isometric 3D vault, shield, padlock, coins) → superCash (bank on a speckled plinth with a credit gauge) | Alternating white and indigo panels |
| 45–51 | FAQs (accordion) and footer (link columns, address, social icons); a huge pale "Let's be sup(er)" word mark at the very bottom | White |
| 84–117 | Full-screen indigo menu (big links, contact line, social icons); sub-pages (Tech Blog, Newsroom with a stacked-card carousel) | Indigo / white |

Persistent elements: logo top-left, a hamburger icon top-right, and a floating glass "Check eligibility" card with
a QR code at bottom-right once the hero has gone.

### 3.2 The banknote → machine sequence (highest priority)

| Phase (t) | Observed behaviour | Evidence | Mechanism (inferred) |
|---|---|---|---|
| Hero (0–0.5 s) | A 3D banknote rests at the bottom-right, tilted ~30°, curling slightly. On the indigo background it reads as **holographic silver-blue** with a diamond pattern and the brand mark. | stills at 0 s, 0.25 s | Pre-rendered 3D art (image sequence or video frames). |
| Leaving the hero (0.5–2 s) | While the hero content scrolls up, the note **travels down and towards the centre**, shrinking and rotating. As it crosses the edge between the indigo and white sections its colour becomes **green**. | 0.5 s → 1.75 s frames | The note sits on a fixed or sticky layer independent of the scrolling content; the colour change is either a different frame range or a mask at the section edge. |
| Arrival (2–3 s) | The note lands in the centre of the concentric rings, under the heading. Small blue cubes appear around it. | 2.0–3.0 s | |
| Burst (3–5 s) | Blue 3D block shapes (the logo's building blocks) **grow and move outwards** towards the screen edges; those nearest the camera are **blurred** (depth of field). The note shrinks to a thin curved strip orbiting the centre. The ring text rotates. | 3.25–4.5 s; blur visible at 5.2 s | Scrubbed scale/translate of pre-rendered objects; blur either baked or `filter: blur`. |
| Reveal (5–7 s) | A tiny machine appears at the centre and **grows** as if the camera moves in; the blocks leave the frame. | 4.75–7.25 s | Scale on scroll of the machine layer. |
| Pinned (7–21 s) | The machine stays centred and fixed in size. Behind its **glass window**, green notes and coloured confetti cubes swirl above stacks of notes. The swirl **advances only when scrolling** and plays backwards when scrolling up (see 1:18–1:23 in the upward pass). The pale circle behind slowly grows. | 16–20 s frames; reverse pass | Very likely an image sequence drawn to a canvas and scrubbed by scroll progress (the interior is photoreal and fully consistent frame to frame, which suits pre-rendering). |
| Emerging (19–21 s) | A green note **slides out of the dispensing slot** at the bottom of the machine. | 18.75–20.5 s | Same sequence. |
| Exit (20–22 s) | The pin releases: heading and machine scroll up and **blur as they pass under the top edge**. An indigo panel rises from the bottom and covers the screen. | 20–22 s | A progressive blur band at the top of the viewport (backdrop blur with a gradient mask), and a section with a solid background scrolling in. |
| Backwards | Scrolling up replays every step in reverse with no jumps: the note flies back up into the hero and turns holographic again. | 1:18–1:27 | Scrubbed animation (state is a function of scroll position, not time-based triggers). |

### 3.3 Other motion details

- **Top-edge blur**: every element that scrolls under the header becomes progressively blurred (hero copy at
  0.25–1.25 s; heading at 20 s). This gives the page depth without a solid header bar.
- **Curtain transitions**: whole-screen colour panels (indigo ↔ white) slide over the previous section.
- **3D device reveal**: the payment terminal slides in from the right, and a QR "card" detaches from its screen and
  moves left (23–30 s).
- **Glass cards**: frosted, slightly glowing indigo cards (QR CTA), with soft inner highlights.
- **Circular rotating text** on concentric rings.
- **Depth of field** on foreground objects.
- **Menu**: full-screen indigo overlay; links are very large, bold, white at 60–70 % opacity, full opacity on hover.
- **Footer**: oversized, very light word mark ("Let's be super") cropped by the bottom of the page.

### 3.4 Principles carried into Housefi (adapted, not copied)

1. One branded hero object travels continuously from the hero into the next scene, and reacts to the background it
   crosses.
2. The brand's own geometry becomes 3D debris that bursts outwards with depth of field.
3. A glass-fronted object is the stage: things happen **behind the window**, and something **emerges** from it.
4. A long pinned section where scroll drives the motion; scrolling back reverses it exactly.
5. Progressive blur at the top edge; curtain transitions; glass CTA cards; rotating ring text; a huge footer word
   mark; a full-screen menu.

Nothing from Super.money is reused: no artwork, logos, copy, colours (Housefi uses its own cobalt, cyan and amber)
or code.

## 4. Housefi context used (from `sujal128005/housefi`, commit `ad95c41`)

- Brand: "Housefi by Nexara9", tagline "Home Help, Made Easy." (`docs/APP-REPORT.md`, `docs/DESIGN-SYSTEM.md`).
- Logo: supplied by the owner during the build (rounded cobalt tile, white house glyph with a frosted right half, an
  orange elliptical arc). Used as artwork in the page and rebuilt as 3D geometry from measurements of the file.
- Founders: Navya Made and Sujal Negi (names, photos and links supplied by the owner).
- Colours from the logo: cobalt `#0A3CF5`, cyan `#00B2EE`, amber `#FFB21C`, ink `#0B1B3F`, warm ivory canvas.
- Typeface: Anek Latin (the app also uses Anek Telugu).
- Categories (`src/data/catalog.ts`): Plumbing, Electrical, AC Repair, Appliances, Cleaning, Carpentry, with their
  taglines.
- Customer journey (`src/i18n/en.ts`, `docs/screens`): describe the problem (photo, voice or text) → pick a time
  (now or a slot) → a technician is assigned and you can track them → share the 4-digit arrival code at the door →
  approve the quote before any work → repair, pay, rate.
- Trust features present in the app: quote approval before work, arrival code, Technician ID card with a QR
  verification page, English and Telugu.
- Illustrations: Housefi's own soft-3D tiles (`assets/illustrations`), reused here unchanged.
- The app is in a demo phase ("Demo prices, not final"). The website therefore states **no prices, counts,
  ratings, coverage areas or guarantees**.
