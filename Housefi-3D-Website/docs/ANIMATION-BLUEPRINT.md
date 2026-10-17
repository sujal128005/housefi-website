# Animation blueprint: "The Glass House"

Built on the principles observed in the reference recording (see `RESEARCH.md` §3.4), told in Housefi's own story:

> **Help arrives, your home opens up, and every fix happens in plain sight.**

The reference's *banknote → glass-fronted cash machine → note emerges from the slot* becomes
**Housefi toolbox → glass-fronted house → the toolbox opens behind the glass, each service takes its turn, and a
"Job done" ticket slides out of the letterbox.** The glass stands for what the app promises: you see the quote and
approve it before any work starts.

## Single source of truth

All numbers live in `src/lib/timeline.ts`. The 3D scene is a **pure function of scroll progress `p ∈ [0, 1]`**
(`journeyState(p, layout)`), so:

- scrolling backwards replays the same frames in reverse (no time-based triggers inside the sequence);
- unit tests sample `p` every 0.0005 and check that nothing jumps (`tests/unit/timeline.test.ts`);
- the same function renders the posters used for the reduced-motion and no-WebGL versions.

## Stage layers (inside one pinned, full-viewport stage)

| z | Layer | Built with | Driven by `p` |
|---|---|---|---|
| 1 | Light background, concentric rings, rotating ring text | DOM + SVG | ring scale and rotation |
| 2 | Cobalt hero panel | DOM | moves up exactly one viewport over the first ninth of the pin (feels like normal scrolling) |
| 3 | 3D canvas (transparent): toolbox (logo on the front), 3D logo pieces, glass house (logo sign), six service objects, confetti, ticket | three.js (WebGL2) | everything |
| 4 | Hero copy and CTAs | DOM | moves with the hero panel; blurred by the global top-edge blur band |
| 5 | Section heading, services list or caption, ticket caption | DOM | opacity, offset, active item |

## Timeline

| `p` | Beat | 3D | DOM |
|---|---|---|---|
| 0.000–0.111 | **Hero exit** (one viewport of scroll) | The toolbox, pearl-white and iridescent on cobalt, travels from bottom-right towards the centre, shrinking and turning; as it crosses the hero's edge (0.06–0.10) it **turns cobalt**. Brand pieces drift at the corners: the Housefi logo in 3D (full tiles, and the glyph with its arc), the logo's orange arc, and cyan cubes. | Hero panel and copy move up by 100 vh. |
| 0.080–0.200 | **Arrival and burst** | The toolbox lands at the centre of the rings. The brand pieces **burst outwards and past the camera**. | Heading "Every fix your home needs." rises in; ring text rotates. |
| 0.150–0.320 | **The house appears** | A small glass-fronted house (with the Housefi logo as the sign on its gable) appears behind the toolbox and **grows as the camera moves in**. The door opens (0.22–0.27); the toolbox **goes in** (0.25–0.31); the door closes (0.31–0.34). | |
| 0.330–0.400 | **Behind the glass** | The toolbox reappears inside, **behind the glass window** (refracted, slightly blurred); its lid opens (0.36–0.40); six service objects and confetti rise out of it. | Caption: "Nothing hidden." |
| 0.400–0.860 | **Six services** (six equal beats) | Objects orbit in a slow vortex inside the house. On each beat one object comes **forward to the glass**, grows and performs its micro-action: water runs from the tap, the bulb lights, the AC blows air ribbons, the drum spins, bubbles rise, the saw rocks. | Services list: the active row highlights, with name and description. Mobile: one caption card. |
| 0.860–0.950 | **Job done** | Objects settle on the floor. A "Job done ✓" ticket **slides out of the letterbox** towards the camera. | Caption "Every visit ends with a clear receipt in the app." |
| 0.950–1.000 | hold | | The pin releases; the next section's cobalt panel rises over the stage like a curtain. |

Easing: `easeInOutCubic` for camera and travel, `easeOutBack` for pop-ins, `smoothstep` windows for fades.
Scroll smoothing: GSAP `scrub: 0.8`.

## Layout per viewport

| Viewport | Pin length | Framing |
|---|---|---|
| ≥ 1024 px, landscape | 900 vh | During the services beats the house moves to the right half (`camera.filmOffset`); the list sits on the left. |
| 640–1023 px | 820 vh | House centred, slightly smaller; caption card at the bottom. |
| < 640 px, portrait | 760 vh | Camera further back to fit the house's width; caption card at the bottom; fewer confetti pieces. |

## Quality tiers

| Tier | When | Differences |
|---|---|---|
| High | default | pixel ratio ≤ 1.75; physical glass (transmission, roughness blur, thickness); soft shadows; 60 confetti pieces |
| Low | ≤ 4 CPU cores, ≤ 4 GB device memory, Save-Data, or a phone-sized coarse pointer | pixel ratio ≤ 1.25; glass as a tinted transparent pane (no transmission pass); no shadow maps; 24 confetti pieces |
| Static | `prefers-reduced-motion: reduce`, no WebGL, or the scene fails to load | no pin; hero with a still image; services as a normal grid of illustration cards; all text present |

The renderer draws only while the stage is on screen, and only when `p` has changed or a micro-action is running.
three.js loads by dynamic import after the first paint.

## Motion in the rest of the site

| Element | Motion | Mechanism |
|---|---|---|
| Top edge | Content blurs progressively as it passes under the header | fixed band with `backdrop-filter` and a gradient mask |
| Header | Logo, "Get the app", full-screen menu (large links, staggered entrance) | CSS + GSAP |
| Floating CTA | Glass "Get the Housefi app" card at bottom-right after the hero | ScrollTrigger toggle |
| How it works | Cobalt curtain rises; pinned; a 3D-tilted phone shows real app screens that cross-fade per step while the step list advances; a progress rail fills | ScrollTrigger `scrub`, CSS 3D |
| Why Housefi | Statement whose words light up with scroll; bento cards reveal with clip-path; illustrations float with parallax | ScrollTrigger `scrub` |
| App | Phone turns from 18° to 0° and rises; glass store buttons | ScrollTrigger `scrub` |
| About | Rotating ring badge; outlined word mark drifts sideways | ScrollTrigger `scrub` |
| FAQ | Native `<details>` accordions with an animated chevron | CSS |
| Footer | Huge outlined word mark "Let's make it home." rises and is cropped by the bottom edge | ScrollTrigger |

Reduced motion: every scroll animation is registered inside `gsap.matchMedia('(prefers-reduced-motion: no-preference)')`.
With reduced motion, content is shown in its final position and nothing is pinned.
