// Supporting cast: brand-shape debris that bursts past the camera, confetti behind the glass, and the "Job done"
// ticket that slides out of the letterbox.
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { HOUSE, type Vec3 } from '@/lib/timeline'
import { COLORS, plastic, type Quality } from '../materials'
import { createLogo, logoParts } from './logo'
import { ticketTexture } from '../textures'

// ---------- debris ----------

/** Brand pieces: the logo's glyph and arc (no tile), the full logo tile, and cyan cubes. */
export type DebrisKind = 'glyph' | 'tile' | 'arc' | 'cube'

export interface DebrisPiece {
  readonly kind: DebrisKind
  /** Screen anchor in the opening shot (normalised device coordinates) and distance from the camera. */
  readonly ndc: readonly [number, number]
  readonly depth: number
  readonly size: number
  readonly rot: Vec3
}

export const DEBRIS: readonly DebrisPiece[] = [
  { kind: 'glyph', ndc: [-0.86, 0.62], depth: 9, size: 0.62, rot: [0.4, 0.5, 0.3] },
  { kind: 'cube', ndc: [-0.7, -0.78], depth: 8, size: 0.55, rot: [0.6, 0.8, 0.1] },
  { kind: 'arc', ndc: [0.88, -0.84], depth: 7.5, size: 1.1, rot: [0.3, -0.6, 0.4] },
  { kind: 'tile', ndc: [0.9, 0.5], depth: 12, size: 0.55, rot: [-0.5, -0.4, -0.5] },
  { kind: 'cube', ndc: [0.52, 0.7], depth: 14, size: 0.45, rot: [0.2, 0.4, 0.9] },
  { kind: 'arc', ndc: [-0.96, 0.02], depth: 13, size: 0.9, rot: [0.7, 0.3, -0.2] },
  { kind: 'cube', ndc: [-0.32, 0.74], depth: 16, size: 0.36, rot: [0.9, 0.2, 0.3] },
  { kind: 'glyph', ndc: [0.15, -0.95], depth: 11, size: 0.45, rot: [0.2, 0.9, 0.1] },
]

/** The logo's orange arc on its own, centred on its origin. */
function logoArc(quality: Quality): THREE.Group {
  const parts = logoParts(quality)
  const mesh = new THREE.Mesh(parts.arc, parts.materials.arc)
  parts.arc.computeBoundingBox()
  const c = new THREE.Vector3()
  parts.arc.boundingBox!.getCenter(c)
  mesh.position.set(-c.x, -c.y, -c.z)
  const g = new THREE.Group()
  g.add(mesh)
  return g
}

export function createDebris(quality: Quality): { group: THREE.Group; pieces: THREE.Object3D[] } {
  const group = new THREE.Group()
  const cubeGeo = new RoundedBoxGeometry(1, 1, 1, 4, 0.18)
  const cubeMat = plastic(COLORS.cyan, { roughness: 0.2 })
  const pieces = DEBRIS.map((d) => {
    const o: THREE.Object3D =
      d.kind === 'cube' ? new THREE.Mesh(cubeGeo, cubeMat)
        : d.kind === 'arc' ? logoArc(quality)
          : createLogo(quality, { tile: d.kind === 'tile' })
    o.scale.setScalar(d.size)
    group.add(o)
    return o
  })
  return { group, pieces }
}

// ---------- confetti ----------

export function createConfetti(count: number): { mesh: THREE.InstancedMesh; update(amount: number, p: number): void } {
  const geo = new RoundedBoxGeometry(0.07, 0.07, 0.07, 2, 0.015)
  const mat = plastic('#FFFFFF', { roughness: 0.3 })
  const mesh = new THREE.InstancedMesh(geo, mat, count)
  const palette = [COLORS.cobalt, COLORS.cyan, COLORS.amber, COLORS.orange, COLORS.royal]
  const color = new THREE.Color()
  const seeds = Array.from({ length: count }, (_, i) => {
    color.set(palette[i % palette.length]!)
    mesh.setColorAt(i, color)
    const r = (n: number) => {
      const x = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453
      return x - Math.floor(x)
    }
    return { a: r(1) * Math.PI * 2, rad: 0.25 + r(2) * 1.0, y: r(3), speed: 0.6 + r(4) * 1.2, spin: r(5) * 6, s: 0.6 + r(6) * 0.8 }
  })
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  const m4 = new THREE.Matrix4()
  const q = new THREE.Quaternion()
  const e = new THREE.Euler()
  const v = new THREE.Vector3()
  const sc = new THREE.Vector3()
  const c = HOUSE.interior
  const floorY = HOUSE.window.y0 + 0.04
  const span = HOUSE.window.y1 - HOUSE.window.y0 - 0.2
  return {
    mesh,
    update(amount, p) {
      seeds.forEach((s, i) => {
        const ang = s.a + p * Math.PI * 2 * 3 * s.speed
        const lift = Math.min(1, amount * (1.2 - s.y * 0.4))
        const y = floorY + (s.y * span * 0.9 + Math.sin(ang * 1.3) * 0.08) * lift
        v.set(c[0] + Math.cos(ang) * s.rad * 1.15, y, c[2] + Math.sin(ang) * s.rad * 0.6 - 0.1)
        e.set(ang * s.spin, ang * 0.7, s.spin)
        q.setFromEuler(e)
        sc.setScalar(amount > 0.001 ? s.s * Math.min(1, amount * 3) : 0.0001)
        m4.compose(v, q, sc)
        mesh.setMatrixAt(i, m4)
      })
      mesh.instanceMatrix.needsUpdate = true
      mesh.visible = amount > 0.001
    },
  }
}

// ---------- ticket ----------

export function createTicket(onChange: () => void): { group: THREE.Group; update(t: number): void } {
  const group = new THREE.Group()
  const card = new THREE.Mesh(new RoundedBoxGeometry(0.62, 0.86, 0.02, 3, 0.008), plastic('#FFFFFF', { roughness: 0.4 }))
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.84), new THREE.MeshStandardMaterial({ map: ticketTexture(onChange), roughness: 0.5 }))
  face.position.z = 0.0115
  card.add(face)
  card.castShadow = true
  group.add(card)
  const slotZ = HOUSE.front
  return {
    group,
    update(t) {
      group.visible = t > 0.001
      // Slide out flat through the letterbox, then lift and turn to face the viewer.
      const slide = Math.min(1, t / 0.45)
      const lift = t <= 0.45 ? 0 : (t - 0.45) / 0.55
      const ls = lift * lift * (3 - 2 * lift)
      const z = slotZ - 0.43 + slide * 0.72 + ls * 0.9
      const y = HOUSE.slot.y + ls * 0.75
      group.position.set(HOUSE.slot.x + ls * 0.25, y, z)
      group.rotation.set(-Math.PI / 2 + ls * (Math.PI / 2 - 0.12), ls * -0.25, ls * 0.06)
      group.scale.setScalar(1 + ls * 0.55)
    },
  }
}
