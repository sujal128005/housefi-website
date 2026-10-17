// "The Glass House" scroll sequence as data. Everything the 3D scene and its captions show is a pure function of
// scroll progress p (0 at the top of the pinned stage, 1 at its end), so scrolling back replays the same frames in
// reverse and nothing can jump. See docs/ANIMATION-BLUEPRINT.md for the story behind the numbers.

export type Vec3 = readonly [number, number, number]

// ---------- maths ----------

export const clamp01 = (x: number): number => (x < 0 ? 0 : x > 1 ? 1 : x)
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t
export const mix3 = (a: Vec3, b: Vec3, t: number): Vec3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]

/** Progress through the window [a, b], clamped to 0..1. */
export const seg = (p: number, a: number, b: number): number => clamp01((p - a) / (b - a))

export const smooth = (t: number): number => t * t * (3 - 2 * t)
export const easeInOutCubic = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)
export const easeOutCubic = (t: number): number => 1 - (1 - t) ** 3
export const easeInCubic = (t: number): number => t * t * t
export const easeOutBack = (t: number): number => {
  const c1 = 1.4
  const c3 = c1 + 1
  return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2
}

/** Quadratic Bézier through a control point: smooth arcs for flying objects. */
export const bezier3 = (a: Vec3, c: Vec3, b: Vec3, t: number): Vec3 => mix3(mix3(a, c, t), mix3(c, b, t), t)

/** 1 inside [a, b], easing in over `fadeIn` and out over `fadeOut` (fractions of p). */
export function windowed(p: number, a: number, b: number, fadeIn = 0.02, fadeOut = 0.02): number {
  return smooth(seg(p, a, a + fadeIn)) * (1 - smooth(seg(p, b - fadeOut, b)))
}

// ---------- layout ----------

export interface Layout {
  /** Viewport width / height. */
  readonly aspect: number
  /** Wide landscape screens put the services list beside the house. */
  readonly wide: boolean
  /** Length of the pinned stage in viewport heights. */
  readonly pinViewports: number
}

export function layoutFor(width: number, height: number): Layout {
  const aspect = width / Math.max(1, height)
  const wide = width >= 1024 && aspect >= 1.2
  const pinViewports = wide ? 9 : width >= 640 ? 8.2 : 7.6
  return { aspect, wide, pinViewports }
}

// ---------- timeline ----------

/** Beat windows in p. */
export const BEATS = {
  arrive: [0.0, 0.12],
  burst: [0.085, 0.21],
  houseIn: [0.15, 0.225],
  dolly: [0.17, 0.33],
  toDoor: [0.205, 0.31],
  doorOpen: [0.215, 0.265],
  doorClose: [0.305, 0.34],
  inside: [0.33, 0.365],
  lid: [0.36, 0.4],
  emerge: [0.38, 0.44],
  services: [0.42, 0.86],
  settle: [0.855, 0.9],
  ticket: [0.88, 0.95],
} as const

export const SERVICE_COUNT = 6
export const SERVICE_BEAT = (BEATS.services[1] - BEATS.services[0]) / SERVICE_COUNT

/** Field of view of the opening shot, in degrees. */
export const FOV = 30
/** The opening camera looks straight down -z at the house's centre height. */
export const CAMERA_START: Vec3 = [0, 1.9, 34]

/** Point in the world that the opening camera shows at normalised screen position (ndcX, ndcY), `depth` units away. */
export function ndcToWorld(ndcX: number, ndcY: number, depth: number, aspect: number): Vec3 {
  const halfH = Math.tan((FOV * Math.PI) / 360) * depth
  return [CAMERA_START[0] + ndcX * halfH * aspect, CAMERA_START[1] + ndcY * halfH, CAMERA_START[2] - depth]
}

// House geometry the timeline needs to know about (the scene builds the meshes with the same numbers).
export const HOUSE = {
  width: 3.2,
  depth: 2.4,
  wallHeight: 2.65,
  roofHeight: 1.15,
  front: 1.2,
  /** Glass window opening on the front: x from -w/2 to w/2, y from y0 to y1. */
  window: { w: 2.7, y0: 0.95, y1: 2.45 },
  door: { x: -0.95, w: 0.56, h: 0.74 },
  slot: { x: 0.82, y: 0.42, w: 0.74 },
  /** Centre of the space behind the glass. */
  interior: [0, 1.7, 0.05] as Vec3,
} as const

export interface ServiceObjectState {
  readonly pos: Vec3
  readonly scale: number
  readonly spin: number
  /** 0..1: how far this object is "in focus" (brought forward to the glass). */
  readonly focus: number
  /** Scroll-driven phase for its micro-action (water, light, air, drum, bubbles, saw). */
  readonly action: number
}

export interface JourneyState {
  /** 0..1 of a viewport the hero panel has moved up. */
  readonly heroShift: number
  readonly headingIn: number
  readonly ringScale: number
  readonly ringTurn: number
  readonly camera: { readonly pos: Vec3; readonly target: Vec3; readonly fov: number; readonly shift: number }
  readonly toolbox: {
    readonly visible: boolean
    readonly pos: Vec3
    readonly rot: Vec3
    readonly scale: number
    /** 1 = pearl and iridescent (on the cobalt hero), 0 = cobalt (on light backgrounds). */
    readonly pearl: number
    readonly lid: number
  }
  readonly debris: { readonly burst: number; readonly visible: number }
  readonly house: { readonly scale: number; readonly door: number; readonly glow: number; readonly visible: boolean }
  readonly confetti: number
  readonly services: readonly ServiceObjectState[]
  readonly active: number
  readonly ticket: number
  readonly captions: { readonly glass: number; readonly list: number; readonly done: number }
}

const HOUSE_TARGET: Vec3 = [0, 2.15, 0]

function cameraAt(p: number, layout: Layout) {
  // Far enough for the whole house (with roof) to fit: tighter on landscape, further back on portrait.
  const fit = layout.aspect >= 1 ? 1 : Math.min(1.9, 1 / Math.max(0.42, layout.aspect) ** 0.85)
  const near: Vec3 = [1.3 * fit, 2.75, 14.2 * fit]
  // For the services the window (not the whole house) has to fit, so narrow screens can come closer.
  const serviceDist = Math.max(11.4, 1.75 / (Math.tan((13.5 * Math.PI) / 180) * layout.aspect))
  const portrait = layout.aspect < 1
  const service: Vec3 = [0.6, portrait ? 1.7 : 2.3, serviceDist]
  const end: Vec3 = [1.0 * fit, 2.2, 13.2 * fit]

  const d = easeInOutCubic(seg(p, ...BEATS.dolly))
  const s = easeInOutCubic(seg(p, BEATS.inside[0], BEATS.services[0] + 0.02))
  const e = easeInOutCubic(seg(p, BEATS.settle[0], BEATS.ticket[1]))
  let pos = mix3(CAMERA_START, near, d)
  pos = mix3(pos, service, s)
  pos = mix3(pos, end, e)
  const startTarget: Vec3 = [CAMERA_START[0], CAMERA_START[1], 0]
  let target = mix3(startTarget, HOUSE_TARGET, d)
  target = mix3(target, [0, portrait ? 1.45 : 2.0, 0.2], s)
  target = mix3(target, [0, 1.85, 0.4], e)
  // On wide screens the house moves to the right half while the services list is on the left.
  const shift = layout.wide ? smooth(seg(p, BEATS.inside[0], BEATS.services[0])) * (1 - smooth(seg(p, BEATS.settle[0], BEATS.ticket[0]))) : 0
  return { pos, target, fov: lerp(FOV, 27, d), shift }
}

function toolboxAt(p: number, layout: Layout) {
  const portrait = layout.aspect < 1
  const heroNdc: [number, number] = portrait ? [0.38, -0.56] : [0.6, -0.42]
  const heroPos = ndcToWorld(heroNdc[0], heroNdc[1], 10, layout.aspect)
  const landPos = ndcToWorld(0, portrait ? -0.18 : -0.2, 15, layout.aspect)
  const doorFront: Vec3 = [HOUSE.door.x, 0.36, HOUSE.front + 1.1]
  const doorIn: Vec3 = [HOUSE.door.x, 0.36, HOUSE.front - 0.6]
  const insidePos: Vec3 = [0, 1.18, 0.05]

  const a = easeInOutCubic(seg(p, ...BEATS.arrive))
  const i = easeOutBack(seg(p, ...BEATS.inside))
  const settle = easeInOutCubic(seg(p, ...BEATS.settle))

  let pos: Vec3
  let scale: number
  let visible = true
  if (p < BEATS.toDoor[0]) {
    pos = bezier3(heroPos, [heroPos[0] * 0.2, heroPos[1] + 1.4, (heroPos[2] + landPos[2]) / 2], landPos, a)
    scale = lerp(portrait ? 0.82 : 1, 0.62, a)
  } else if (p < BEATS.toDoor[1]) {
    // Over the front path and in through the open door; the façade hides it once it is past the doorway.
    const r = seg(p, ...BEATS.toDoor)
    const u = easeInOutCubic(clamp01(r / 0.75))
    const w = easeInOutCubic(clamp01((r - 0.75) / 0.25))
    pos = r < 0.75 ? bezier3(landPos, [landPos[0] * 0.5 - 0.6, 1.6, (landPos[2] + doorFront[2]) / 2], doorFront, u) : mix3(doorFront, doorIn, w)
    scale = lerp(0.62, 0.24, u)
    visible = w < 1
  } else if (p < BEATS.inside[0]) {
    pos = doorIn
    scale = 0.24
    visible = false
  } else {
    pos = mix3([insidePos[0], insidePos[1] - 0.4, insidePos[2]], insidePos, i)
    pos = mix3(pos, [0, 1.12, -0.5], settle)
    scale = 0.34 * Math.max(0, i)
  }

  // One full turn on the way in, ending square to the house; it keeps that heading to the door.
  const spinY = lerp(-0.6, 0.35 + Math.PI * 2, a)
  const rot: Vec3 = [lerp(0.5, 0.15, a), p < BEATS.inside[0] ? spinY : lerp(0.35, 0, seg(p, ...BEATS.inside)), lerp(-0.35, 0, a)]
  const pearl = 1 - smooth(seg(seg(p, 0, 1 / layout.pinViewports), 0.5, 0.9))
  return { visible, pos, rot, scale, pearl, lid: easeInOutCubic(seg(p, ...BEATS.lid)) * (1 - easeInOutCubic(seg(p, ...BEATS.settle)) * 0.6) }
}

/** Where each service object orbits inside the glass, and when it is in focus. */
function servicesAt(p: number): { readonly objects: ServiceObjectState[]; readonly active: number } {
  const [s0] = BEATS.services
  const swirl = (p - BEATS.emerge[0]) * Math.PI * 2 * 2.2
  const raw = (p - s0) / SERVICE_BEAT
  // A service stays selected for as long as the list can be on screen (it fades in and out around the beats), so
  // the list never shows with nothing selected.
  const active = p >= s0 - 0.012 && p < BEATS.settle[1] ? Math.min(SERVICE_COUNT - 1, Math.max(0, Math.floor(raw))) : -1
  const settle = easeInOutCubic(seg(p, ...BEATS.settle))
  const c = HOUSE.interior
  const objects: ServiceObjectState[] = []
  for (let k = 0; k < SERVICE_COUNT; k++) {
    const em = easeOutBack(seg(p, BEATS.emerge[0] + k * 0.008, BEATS.emerge[0] + k * 0.008 + 0.04))
    const ang = swirl + (k / SERVICE_COUNT) * Math.PI * 2
    const orbit: Vec3 = [c[0] + Math.cos(ang) * 0.92, c[1] + Math.sin(ang * 2 + k) * 0.16 + 0.05, c[2] + Math.sin(ang) * 0.5 - 0.15]
    const from: Vec3 = [0, 1.25, 0.05]
    let pos = mix3(from, orbit, clamp01(em))
    const local = raw - k
    const focus = local > 0 && local < 1 ? smooth(seg(local, 0, 0.22)) * (1 - smooth(seg(local, 0.8, 1))) : 0
    const front: Vec3 = [c[0], c[1] + 0.02, 0.72]
    pos = mix3(pos, front, focus)
    const floor: Vec3 = [-1.05 + k * 0.42, 1.13, k % 2 === 0 ? 0.4 : 0.05]
    pos = mix3(pos, floor, settle)
    const scale = clamp01(em) * lerp(lerp(0.4, 0.92, focus), 0.34, settle)
    objects.push({ pos, scale, spin: ang * 0.6 * (1 - focus) * (1 - settle), focus, action: Math.max(0, local) })
  }
  return { objects, active }
}

export function journeyState(p: number, layout: Layout): JourneyState {
  p = clamp01(p)
  const heroShift = clamp01(p * layout.pinViewports)
  const services = servicesAt(p)
  const houseIn = seg(p, ...BEATS.houseIn)
  const door = easeInOutCubic(seg(p, ...BEATS.doorOpen)) * (1 - easeInOutCubic(seg(p, ...BEATS.doorClose)))
  return {
    heroShift,
    // The services take over from the heading while the house fills the frame; narrow screens bring it back for
    // the ending, where the house is small again.
    headingIn: smooth(seg(p, 0.085, 0.14)) * clamp01(1 - smooth(seg(p, 0.375, 0.41)) + (layout.wide ? 0 : smooth(seg(p, 0.855, 0.89)))),
    ringScale: lerp(0.82, 1.18, easeInOutCubic(seg(p, 0.08, 0.5))),
    ringTurn: p * 220,
    camera: cameraAt(p, layout),
    toolbox: toolboxAt(p, layout),
    debris: { burst: easeInCubic(seg(p, ...BEATS.burst)), visible: 1 - seg(p, BEATS.burst[1] - 0.02, BEATS.burst[1]) },
    house: { scale: easeOutBack(houseIn), door, glow: smooth(seg(p, BEATS.doorOpen[0], BEATS.inside[1])), visible: p > BEATS.houseIn[0] },
    confetti: easeOutCubic(seg(p, BEATS.emerge[0], BEATS.emerge[1] + 0.04)),
    services: services.objects,
    active: services.active,
    ticket: easeInOutCubic(seg(p, ...BEATS.ticket)),
    captions: {
      glass: windowed(p, BEATS.inside[0], BEATS.services[0] + 0.01, 0.02, 0.025),
      list: windowed(p, BEATS.services[0] - 0.01, BEATS.settle[0] + 0.02, 0.025, 0.025), // inside the window where `active` >= 0
      done: smooth(seg(p, BEATS.ticket[0], BEATS.ticket[0] + 0.03)),
    },
  }
}

/** Scroll progress at which a service is fully in focus (used by "jump to" links in the services list). */
export function focusProgress(index: number): number {
  return BEATS.services[0] + (index + 0.5) * SERVICE_BEAT
}
