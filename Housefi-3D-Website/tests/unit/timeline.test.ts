import { describe, expect, it } from 'vitest'
import { BEATS, focusProgress, journeyState, layoutFor, SERVICE_COUNT, type JourneyState, type Vec3 } from '@/lib/timeline'

const LAYOUTS = {
  desktop: layoutFor(1440, 900),
  tablet: layoutFor(820, 1180),
  mobile: layoutFor(390, 844),
}
const STEP = 0.0005
const dist = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])

/**
 * A jump is a step much larger than both neighbouring steps (a discontinuity), as opposed to fast but smooth motion.
 * Returns the indexes of such steps.
 */
function jumps(steps: readonly number[], floor: number): number[] {
  const out: number[] = []
  for (let i = 1; i < steps.length - 1; i++) {
    const d = steps[i]!
    if (d > floor && d > 3 * Math.max(steps[i - 1]!, steps[i + 1]!)) out.push(i)
  }
  return out
}

function sample(layout: ReturnType<typeof layoutFor>): JourneyState[] {
  const out: JourneyState[] = []
  for (let p = 0; p <= 1 + 1e-9; p += STEP) out.push(journeyState(p, layout))
  return out
}

describe('layoutFor', () => {
  it('uses the wide layout only on large landscape screens', () => {
    expect(LAYOUTS.desktop.wide).toBe(true)
    expect(LAYOUTS.tablet.wide).toBe(false)
    expect(LAYOUTS.mobile.wide).toBe(false)
    expect(layoutFor(1100, 1000).wide).toBe(false)
  })
  it('gives each breakpoint its pin length', () => {
    expect(LAYOUTS.desktop.pinViewports).toBe(9)
    expect(LAYOUTS.tablet.pinViewports).toBe(8.2)
    expect(LAYOUTS.mobile.pinViewports).toBe(7.6)
  })
})

describe('beats', () => {
  it('are ordered windows inside 0..1', () => {
    for (const [name, [a, b]] of Object.entries(BEATS)) {
      expect(a, name).toBeGreaterThanOrEqual(0)
      expect(b, name).toBeLessThanOrEqual(1)
      expect(b, name).toBeGreaterThan(a)
    }
  })
})

describe.each(Object.entries(LAYOUTS))('journeyState on %s', (_, layout) => {
  const frames = sample(layout)

  it('is a pure function of p (scrolling back gives the same frame)', () => {
    for (const p of [0, 0.13, 0.27, 0.5, 0.77, 0.93, 1]) {
      const forward = journeyState(p, layout)
      journeyState(1 - p, layout)
      expect(journeyState(p, layout)).toEqual(forward)
    }
  })

  it('keeps every 0..1 value in range', () => {
    for (const s of frames) {
      for (const v of [s.heroShift, s.headingIn, s.house.door, s.house.glow, s.confetti, s.ticket, s.toolbox.pearl, s.toolbox.lid, s.captions.glass, s.captions.list, s.captions.done, s.camera.shift]) {
        expect(v).toBeGreaterThanOrEqual(-1e-9)
        expect(v).toBeLessThanOrEqual(1 + 1e-9)
      }
    }
  })

  it('never jumps: the camera moves smoothly', () => {
    const steps = frames.slice(1).map((f, i) => dist(f.camera.pos, frames[i]!.camera.pos))
    const targets = frames.slice(1).map((f, i) => dist(f.camera.target, frames[i]!.camera.target))
    expect(Math.max(...steps)).toBeLessThan(0.5)
    expect(jumps(steps, 0.02)).toEqual([])
    expect(jumps(targets, 0.02)).toEqual([])
  })

  it('never jumps: the toolbox moves smoothly while it is visible', () => {
    const steps = frames.slice(1).map((f, i) => {
      const a = frames[i]!.toolbox
      const b = f.toolbox
      return a.visible && b.visible && a.scale > 0.01 && b.scale > 0.01 ? dist(a.pos, b.pos) : 0
    })
    const turns = frames.slice(1).map((f, i) => (frames[i]!.toolbox.visible && f.toolbox.visible && f.toolbox.scale > 0.01 && frames[i]!.toolbox.scale > 0.01 ? Math.abs(f.toolbox.rot[1] - frames[i]!.toolbox.rot[1]) : 0))
    expect(Math.max(...steps)).toBeLessThan(0.5)
    expect(Math.max(...turns)).toBeLessThan(0.1)
    expect(jumps(steps, 0.02)).toEqual([])
    expect(jumps(turns, 0.01)).toEqual([])
  })

  it('never jumps: the service objects move smoothly', () => {
    for (let k = 0; k < SERVICE_COUNT; k++) {
      const steps = frames.slice(1).map((f, i) => dist(f.services[k]!.pos, frames[i]!.services[k]!.pos))
      expect(Math.max(...steps)).toBeLessThan(0.08)
      expect(jumps(steps, 0.01)).toEqual([])
    }
  })

  it('brings each service into focus in turn', () => {
    for (let k = 0; k < SERVICE_COUNT; k++) {
      const s = journeyState(focusProgress(k), layout)
      expect(s.active).toBe(k)
      expect(s.services[k]!.focus).toBeGreaterThan(0.99)
      s.services.forEach((o, j) => j !== k && expect(o.focus).toBe(0))
    }
  })

  it('never shows the services list with nothing selected', () => {
    for (const s of frames) if (s.captions.list > 0) expect(s.active).toBeGreaterThanOrEqual(0)
  })

  it('starts on the hero and ends with the ticket out', () => {
    const start = frames[0]!
    const end = frames[frames.length - 1]!
    expect(start.heroShift).toBe(0)
    expect(start.toolbox.pearl).toBe(1)
    expect(start.house.visible).toBe(false)
    expect(end.heroShift).toBe(1)
    expect(end.ticket).toBeCloseTo(1)
    expect(end.toolbox.pearl).toBe(0)
  })

  it('moves the hero exactly one viewport over the first viewport of scroll', () => {
    const oneViewport = 1 / layout.pinViewports
    expect(journeyState(oneViewport / 2, layout).heroShift).toBeCloseTo(0.5)
    expect(journeyState(oneViewport, layout).heroShift).toBeCloseTo(1)
  })
})
