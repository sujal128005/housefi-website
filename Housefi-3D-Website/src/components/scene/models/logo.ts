// The Housefi logo in 3D, built from measurements of the official logo file (public/brand/housefi-logo.png):
// a rounded cobalt tile, the house glyph (left half white, right half frosted glass, as in the logo) and the orange
// arc that sits behind the right leg. Coordinates below are pixels in the 1278 × 1230 source image; the tile spans
// x 65–1213, so one unit here is half the tile (574 px) and the whole tile is 2 × 2 units.
import * as THREE from 'three'
import { albedo, type Quality } from '../materials'

const CX = 639
const CY = 627
const UNIT = 574
const v = (x: number, y: number) => new THREE.Vector2((x - CX) / UNIT, (CY - y) / UNIT)

/** A polygon with rounded corners (radius per corner, in source pixels). */
function roundedPolygon(points: readonly (readonly [number, number, number])[]): THREE.Shape {
  const shape = new THREE.Shape()
  const n = points.length
  for (let i = 0; i < n; i++) {
    const [x, y, r] = points[i]!
    const p = v(x, y)
    const prev = v(points[(i - 1 + n) % n]![0], points[(i - 1 + n) % n]![1])
    const next = v(points[(i + 1) % n]![0], points[(i + 1) % n]![1])
    const rr = r / UNIT
    const a = p.clone().add(prev.clone().sub(p).setLength(Math.min(rr, prev.distanceTo(p) / 2)))
    const b = p.clone().add(next.clone().sub(p).setLength(Math.min(rr, next.distanceTo(p) / 2)))
    if (i === 0) shape.moveTo(a.x, a.y)
    else shape.lineTo(a.x, a.y)
    shape.quadraticCurveTo(p.x, p.y, b.x, b.y)
  }
  shape.closePath()
  return shape
}

// The glyph, split at the ridge (x = 637) into the white left half and the translucent right half; the right half
// is split again into its roof (light blue in the logo) and its leg (clearer, the arc shows through).
const GLYPH_LEFT: readonly (readonly [number, number, number])[] = [
  [293, 980, 46], [293, 470, 64], [637, 222, 44], [637, 435, 0], [487, 545, 6], [487, 980, 46],
]
const GLYPH_RIGHT_ROOF: readonly (readonly [number, number, number])[] = [
  [637, 222, 44], [981, 470, 64], [981, 660, 0], [783, 541, 4], [637, 435, 0],
]
const GLYPH_RIGHT_LEG: readonly (readonly [number, number, number])[] = [
  [783, 541, 0], [981, 660, 0], [981, 980, 46], [783, 980, 46],
]

/** The orange arc: a quarter of an elliptical ring centred at the foot of the left leg's inner edge. */
function arcShape(): THREE.Shape {
  const c = { x: 488, y: 980 }
  const outer = { rx: 465, ry: 352 }
  const inner = { rx: 297, ry: 190 }
  const s = new THREE.Shape()
  const steps = 48
  for (let i = 0; i <= steps; i++) {
    const t = (Math.PI / 2) * (1 - i / steps)
    const p = v(c.x + outer.rx * Math.cos(t), c.y - outer.ry * Math.sin(t))
    if (i === 0) s.moveTo(p.x, p.y)
    else s.lineTo(p.x, p.y)
  }
  for (let i = 0; i <= steps; i++) {
    const t = (Math.PI / 2) * (i / steps)
    const p = v(c.x + inner.rx * Math.cos(t), c.y - inner.ry * Math.sin(t))
    s.lineTo(p.x, p.y)
  }
  s.closePath()
  return s
}

function tileShape(): THREE.Shape {
  const r = 0.47
  const s = new THREE.Shape()
  s.moveTo(-1 + r, -1)
  s.lineTo(1 - r, -1)
  s.bezierCurveTo(1 - r * 0.2, -1, 1, -1 + r * 0.2, 1, -1 + r)
  s.lineTo(1, 1 - r)
  s.bezierCurveTo(1, 1 - r * 0.2, 1 - r * 0.2, 1, 1 - r, 1)
  s.lineTo(-1 + r, 1)
  s.bezierCurveTo(-1 + r * 0.2, 1, -1, 1 - r * 0.2, -1, 1 - r)
  s.lineTo(-1, -1 + r)
  s.bezierCurveTo(-1, -1 + r * 0.2, -1 + r * 0.2, -1, -1 + r, -1)
  return s
}

/** Paints a vertex-colour gradient across a geometry from a function of (x, y). */
function paint(geo: THREE.BufferGeometry, colorAt: (x: number, y: number, out: THREE.Color) => void): THREE.BufferGeometry {
  const pos = geo.getAttribute('position')
  const colors = new Float32Array(pos.count * 3)
  const c = new THREE.Color()
  for (let i = 0; i < pos.count; i++) {
    colorAt(pos.getX(i), pos.getY(i), c)
    colors.set([c.r, c.g, c.b], i * 3)
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  return geo
}

// Colours sampled from the logo file (as albedo, see materials.albedo).
const TILE_CYAN = albedo('#06BFF8')
const TILE_BLUE = albedo('#0A45F5')
const TILE_DEEP = albedo('#0420E8')
const ARC_ORANGE = albedo('#FF8A10')
const ARC_YELLOW = albedo('#FFD52E')
const ARC_DEEP = albedo('#FF6A00')

export interface LogoParts {
  readonly tile: THREE.BufferGeometry
  readonly glyphLeft: THREE.BufferGeometry
  readonly glyphRoof: THREE.BufferGeometry
  readonly glyphLeg: THREE.BufferGeometry
  readonly arc: THREE.BufferGeometry
  readonly materials: { tile: THREE.Material; white: THREE.Material; roof: THREE.Material; glass: THREE.Material; arc: THREE.Material }
}

let shared: LogoParts | null = null

/** Geometries and materials, built once and shared by every logo in the scene. */
export function logoParts(quality: Quality): LogoParts {
  if (shared) return shared
  const bevel = { bevelEnabled: true, bevelSegments: 4, curveSegments: 24 }
  const tile = new THREE.ExtrudeGeometry(tileShape(), { ...bevel, depth: 0.14, bevelSize: 0.06, bevelThickness: 0.06 })
  paint(tile, (x, y, out) => {
    // Cyan glow at the top-left corner, deep blue towards the bottom-right, as in the logo.
    const toCorner = Math.min(1, Math.hypot(x + 1, y - 1) / 1.6)
    out.copy(TILE_CYAN).lerp(TILE_BLUE, THREE.MathUtils.smoothstep(toCorner, 0, 1))
    out.lerp(TILE_DEEP, THREE.MathUtils.clamp((x - y) / 2 - 0.2, 0, 1) * 0.6)
  })
  const glyphOpts = { ...bevel, depth: 0.16, bevelSize: 0.025, bevelThickness: 0.03 }
  const glyphLeft = new THREE.ExtrudeGeometry(roundedPolygon(GLYPH_LEFT), glyphOpts)
  const glyphRoof = new THREE.ExtrudeGeometry(roundedPolygon(GLYPH_RIGHT_ROOF), glyphOpts)
  const glyphLeg = new THREE.ExtrudeGeometry(roundedPolygon(GLYPH_RIGHT_LEG), glyphOpts)
  const arc = new THREE.ExtrudeGeometry(arcShape(), { ...bevel, depth: 0.07, bevelSize: 0.015, bevelThickness: 0.02 })
  // Position along the arc: 0 at its left end, 1 at its foot (angle around the ellipse centre).
  const centre = v(488, 980)
  const rx = (465 + 297) / 2 / UNIT
  const ry = (352 + 190) / 2 / UNIT
  paint(arc, (x, y, out) => {
    const t = Math.atan2((y - centre.y) / ry, (x - centre.x) / rx)
    const u = THREE.MathUtils.clamp(1 - t / (Math.PI / 2), 0, 1)
    // Orange at the left end, a bright yellow highlight over the top of the curve, deep orange at the foot.
    const highlight = Math.exp(-(((u - 0.38) / 0.2) ** 2))
    out.copy(ARC_ORANGE).lerp(ARC_YELLOW, highlight)
    out.lerp(ARC_DEEP, THREE.MathUtils.smoothstep(u, 0.62, 1))
  })
  shared = {
    tile, glyphLeft, glyphRoof, glyphLeg, arc,
    materials: {
      // Low environment reflection keeps the tile's cobalt saturated (bright reflections would wash it out).
      tile: new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.4, specularIntensity: 0.4, clearcoat: 0.6, clearcoatRoughness: 0.2, envMapIntensity: 0.25 }),
      white: new THREE.MeshPhysicalMaterial({ color: '#F4F8FF', roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.1, envMapIntensity: 0.8 }),
      // The right half is a translucent white over the blue tile, as in the logo (light blue roof, the arc showing
      // through the leg).
      roof: new THREE.MeshPhysicalMaterial({ color: '#DCEDFF', transparent: true, opacity: 0.82, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.1, depthWrite: false }),
      glass: new THREE.MeshPhysicalMaterial({ color: '#CFE6FF', transparent: true, opacity: quality === 'high' ? 0.32 : 0.36, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.1, depthWrite: false }),
      arc: new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.35, specularIntensity: 0.4, clearcoat: 0.6, clearcoatRoughness: 0.2, envMapIntensity: 0.25, emissive: '#FF8A10', emissiveIntensity: 0.1 }),
    },
  }
  return shared
}

/** The Housefi logo as a 3D object, 2 units wide (with the tile) and centred on its origin, facing +z. */
export function createLogo(quality: Quality, { tile = true }: { tile?: boolean } = {}): THREE.Group {
  const p = logoParts(quality)
  const group = new THREE.Group()
  const back = tile ? 0.2 : 0
  if (tile) group.add(new THREE.Mesh(p.tile, p.materials.tile))
  const arc = new THREE.Mesh(p.arc, p.materials.arc)
  arc.position.z = back + 0.02
  group.add(arc)
  const left = new THREE.Mesh(p.glyphLeft, p.materials.white)
  left.position.z = back
  group.add(left)
  for (const [geo, mat] of [[p.glyphRoof, p.materials.roof], [p.glyphLeg, p.materials.glass]] as const) {
    const m = new THREE.Mesh(geo, mat)
    m.position.z = back
    m.renderOrder = 1
    group.add(m)
  }
  // Centre the depth.
  group.children.forEach((m) => (m.position.z -= (back + 0.18) / 2))
  group.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) o.castShadow = quality === 'high'
  })
  return group
}

/** Lets the shared geometries be rebuilt after the scene is disposed. */
export function resetLogoParts(): void {
  shared = null
}
