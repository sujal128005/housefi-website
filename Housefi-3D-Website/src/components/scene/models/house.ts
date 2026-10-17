// The glass house: a soft-3D home whose front is a large window. The services happen behind the glass; the door
// lets the toolbox in, and the letterbox lets the "Job done" ticket out.
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { HOUSE } from '@/lib/timeline'
import { COLORS, chrome, glass, matte, plastic, type Quality } from '../materials'
import { fadeTexture } from '../textures'
import { createLogo } from './logo'

export interface House {
  readonly group: THREE.Group
  /** door 0..1 open, glow 0..1 interior light, sweep: position of the highlight across the glass. */
  update(door: number, glow: number, sweep: number): void
}

const W = HOUSE.width
const H = HOUSE.wallHeight
const F = HOUSE.front
const win = HOUSE.window

function rectPath(path: THREE.Path, x0: number, y0: number, x1: number, y1: number, r: number) {
  path.moveTo(x0 + r, y0)
  path.lineTo(x1 - r, y0)
  path.quadraticCurveTo(x1, y0, x1, y0 + r)
  path.lineTo(x1, y1 - r)
  path.quadraticCurveTo(x1, y1, x1 - r, y1)
  path.lineTo(x0 + r, y1)
  path.quadraticCurveTo(x0, y1, x0, y1 - r)
  path.lineTo(x0, y0 + r)
  path.quadraticCurveTo(x0, y0, x0 + r, y0)
}

function gableShape(): THREE.Shape {
  const s = new THREE.Shape()
  s.moveTo(-W / 2, 0)
  s.lineTo(W / 2, 0)
  s.lineTo(W / 2, H)
  s.lineTo(0, H + HOUSE.roofHeight)
  s.lineTo(-W / 2, H)
  s.closePath()
  return s
}

const extrude = (shape: THREE.Shape, depth: number) =>
  new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.025, bevelSegments: 3, curveSegments: 18 })

export function createHouse(quality: Quality): House {
  const group = new THREE.Group()
  const wall = matte('#FFFFFF', { roughness: 0.55 })
  const roofMat = plastic(COLORS.royal, { roughness: 0.3 })
  const frameMat = plastic(COLORS.cobalt, { roughness: 0.3 })

  // ---- platform and garden ----
  const platformProfile = [new THREE.Vector2(0, -0.24), new THREE.Vector2(3.15, -0.24), new THREE.Vector2(3.3, -0.16), new THREE.Vector2(3.32, -0.06), new THREE.Vector2(3.24, 0), new THREE.Vector2(0, 0)]
  const platform = new THREE.Mesh(new THREE.LatheGeometry(platformProfile, 96), matte('#EEF1FB', { roughness: 0.8 }))
  platform.receiveShadow = true
  group.add(platform)

  const stoneMat = matte('#DCE3F5', { roughness: 0.85 })
  for (let i = 0; i < 3; i++) {
    const stone = new THREE.Mesh(new THREE.CylinderGeometry(0.2 - i * 0.01, 0.2 - i * 0.01, 0.04, 28), stoneMat)
    stone.position.set(HOUSE.door.x + (i % 2 ? 0.08 : -0.04), 0.02, F + 0.45 + i * 0.5)
    stone.receiveShadow = true
    group.add(stone)
  }
  const leaf = plastic(COLORS.leaf, { roughness: 0.55, clearcoat: 0.4 })
  const leafDark = plastic(COLORS.leafDark, { roughness: 0.6, clearcoat: 0.3 })
  const bushes: [number, number, number, number, THREE.Material][] = [
    [1.95, 0.32, 1.35, 0.42, leaf], [2.4, 0.22, 0.85, 0.3, leafDark], [-2.05, 0.3, 1.25, 0.38, leaf], [-2.5, 0.2, 0.65, 0.26, leafDark],
  ]
  for (const [x, y, z, r, m] of bushes) {
    const b = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 3), m)
    b.position.set(x, y, z)
    b.scale.y = 0.85
    b.castShadow = true
    group.add(b)
  }
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.2, 12), matte(COLORS.wood))
  trunk.position.set(-2.55, 0.6, -0.9)
  group.add(trunk)
  for (const [x, y, z, r] of [[-2.55, 1.45, -0.9, 0.5], [-2.25, 1.25, -0.75, 0.34], [-2.8, 1.2, -1.0, 0.32]] as const) {
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 3), leaf)
    crown.position.set(x, y, z)
    crown.castShadow = true
    group.add(crown)
  }

  // ---- shell ----
  const front = gableShape()
  const windowHole = new THREE.Path()
  rectPath(windowHole, -win.w / 2, win.y0, win.w / 2, win.y1, 0.12)
  const doorHole = new THREE.Path()
  rectPath(doorHole, HOUSE.door.x - HOUSE.door.w / 2, 0.06, HOUSE.door.x + HOUSE.door.w / 2, 0.06 + HOUSE.door.h, 0.06)
  const slotHole = new THREE.Path()
  rectPath(slotHole, HOUSE.slot.x - HOUSE.slot.w / 2, HOUSE.slot.y - 0.045, HOUSE.slot.x + HOUSE.slot.w / 2, HOUSE.slot.y + 0.045, 0.03)
  front.holes.push(windowHole, doorHole, slotHole)
  const facade = new THREE.Mesh(extrude(front, 0.12), wall)
  facade.position.z = F - 0.12
  facade.castShadow = true
  facade.receiveShadow = true
  group.add(facade)

  const back = new THREE.Mesh(extrude(gableShape(), 0.12), wall)
  back.position.z = -F
  back.castShadow = true
  group.add(back)

  for (const side of [-1, 1]) {
    const sideWall = new THREE.Mesh(new RoundedBoxGeometry(0.14, H, HOUSE.depth, 2, 0.03), wall)
    sideWall.position.set(side * (W / 2 - 0.07), H / 2, 0)
    sideWall.castShadow = true
    sideWall.receiveShadow = true
    group.add(sideWall)
  }

  // Roof: two slabs with an overhang, a ridge cap and a chimney.
  const slope = Math.atan2(HOUSE.roofHeight, W / 2)
  const slabLength = Math.hypot(W / 2, HOUSE.roofHeight) + 0.38
  for (const side of [-1, 1]) {
    const slab = new THREE.Mesh(new RoundedBoxGeometry(slabLength, 0.16, HOUSE.depth + 0.36, 4, 0.06), roofMat)
    const nx = -Math.sin(slope) * side
    const ny = Math.cos(slope)
    slab.position.set(side * (W / 4 + 0.17) + nx * 0.09, H + HOUSE.roofHeight / 2 - 0.02 + ny * 0.09, 0)
    slab.rotation.z = -side * slope
    slab.castShadow = true
    group.add(slab)
  }
  const ridge = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, HOUSE.depth + 0.36, 24), roofMat)
  ridge.rotation.x = Math.PI / 2
  ridge.position.set(0, H + HOUSE.roofHeight + 0.1, 0)
  ridge.castShadow = true
  group.add(ridge)
  const chimney = new THREE.Mesh(new RoundedBoxGeometry(0.34, 0.7, 0.34, 3, 0.06), plastic(COLORS.deep, { roughness: 0.35 }))
  chimney.position.set(0.95, H + 0.75, -0.45)
  chimney.castShadow = true
  group.add(chimney)

  // The Housefi logo as a sign on the gable.
  const sign = createLogo(quality)
  sign.scale.setScalar(0.26)
  sign.position.set(0, H + 0.36, F + 0.06)
  group.add(sign)

  // ---- window ----
  const frameShape = new THREE.Shape()
  rectPath(frameShape, -win.w / 2 - 0.1, win.y0 - 0.1, win.w / 2 + 0.1, win.y1 + 0.1, 0.18)
  const frameHole = new THREE.Path()
  rectPath(frameHole, -win.w / 2 + 0.01, win.y0 + 0.01, win.w / 2 - 0.01, win.y1 - 0.01, 0.12)
  frameShape.holes.push(frameHole)
  const frame = new THREE.Mesh(extrude(frameShape, 0.06), frameMat)
  frame.position.z = F - 0.02
  frame.castShadow = true
  group.add(frame)
  // Sill
  const sill = new THREE.Mesh(new RoundedBoxGeometry(win.w + 0.5, 0.08, 0.3, 3, 0.03), frameMat)
  sill.position.set(0, win.y0 - 0.16, F + 0.06)
  group.add(sill)

  const pane = new THREE.Mesh(new RoundedBoxGeometry(win.w, win.y1 - win.y0, 0.035, 2, 0.015), glass(quality))
  pane.position.set(0, (win.y0 + win.y1) / 2, F - 0.03)
  pane.renderOrder = 2
  group.add(pane)

  // A highlight that sweeps across the glass with scroll.
  const sweepTex = fadeTexture([[0, 'rgba(255,255,255,0)'], [0.45, 'rgba(255,255,255,0)'], [0.5, 'rgba(255,255,255,0.55)'], [0.56, 'rgba(255,255,255,0)'], [1, 'rgba(255,255,255,0)']])
  const sweepMat = new THREE.MeshBasicMaterial({ map: sweepTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.6 })
  const sweep = new THREE.Mesh(new THREE.PlaneGeometry(win.w - 0.06, win.y1 - win.y0 - 0.06), sweepMat)
  sweep.position.set(0, (win.y0 + win.y1) / 2, F + 0.0)
  sweep.rotation.z = -0.08
  sweep.renderOrder = 3
  group.add(sweep)

  // ---- interior behind the glass ----
  const interiorMat = new THREE.MeshStandardMaterial({ color: '#DCE4FB', emissive: '#C9D5FF', emissiveIntensity: 0.1, roughness: 0.9 })
  const floor = new THREE.Mesh(new RoundedBoxGeometry(W - 0.28, 0.1, HOUSE.depth - 0.26, 2, 0.03), matte('#E3E8F8', { roughness: 0.7 }))
  floor.position.set(0, win.y0 - 0.05, 0)
  floor.receiveShadow = true
  group.add(floor)
  const backInner = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.28, H), interiorMat)
  backInner.position.set(0, H / 2 + 0.2, -F + 0.13)
  group.add(backInner)
  for (const side of [-1, 1]) {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(HOUSE.depth - 0.26, H), interiorMat)
    s.position.set(side * (W / 2 - 0.145), H / 2 + 0.2, 0)
    s.rotation.y = -side * Math.PI / 2
    group.add(s)
  }
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.28, HOUSE.depth - 0.26), interiorMat)
  ceiling.position.set(0, H - 0.02, 0)
  ceiling.rotation.x = Math.PI / 2
  group.add(ceiling)
  const lightBarMat = new THREE.MeshStandardMaterial({ color: '#FFFFFF', emissive: '#FFFFFF', emissiveIntensity: 0.4 })
  const lightBar = new THREE.Mesh(new RoundedBoxGeometry(2.0, 0.07, 0.12, 2, 0.03), lightBarMat)
  lightBar.position.set(0, win.y1 - 0.12, F - 0.3)
  group.add(lightBar)
  const lamp = new THREE.PointLight('#F2F5FF', 0, 5, 1.6)
  lamp.position.set(0, 2.3, 0.6)
  group.add(lamp)

  // ---- door ----
  const recessGlow = new THREE.MeshStandardMaterial({ color: '#FFE2B0', emissive: '#FFB866', emissiveIntensity: 0.2 })
  const recess = new THREE.Mesh(new THREE.PlaneGeometry(HOUSE.door.w, HOUSE.door.h), recessGlow)
  recess.position.set(HOUSE.door.x, 0.06 + HOUSE.door.h / 2, F - 0.32)
  group.add(recess)
  const recessSide = matte('#2A3570', { side: THREE.DoubleSide })
  for (const sx of [-1, 1]) {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(0.32, HOUSE.door.h), recessSide)
    s.position.set(HOUSE.door.x + sx * HOUSE.door.w / 2, 0.06 + HOUSE.door.h / 2, F - 0.16)
    s.rotation.y = Math.PI / 2
    group.add(s)
  }
  const top = new THREE.Mesh(new THREE.PlaneGeometry(HOUSE.door.w, 0.32), recessSide)
  top.position.set(HOUSE.door.x, 0.06 + HOUSE.door.h, F - 0.16)
  top.rotation.x = Math.PI / 2
  group.add(top)

  const doorHinge = new THREE.Group()
  doorHinge.position.set(HOUSE.door.x - HOUSE.door.w / 2 + 0.01, 0.06, F - 0.02)
  group.add(doorHinge)
  const door = new THREE.Mesh(new RoundedBoxGeometry(HOUSE.door.w - 0.02, HOUSE.door.h - 0.01, 0.06, 3, 0.03), plastic(COLORS.royal, { roughness: 0.3 }))
  door.position.set(HOUSE.door.w / 2 - 0.01, HOUSE.door.h / 2, 0)
  door.castShadow = true
  doorHinge.add(door)
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.035, 20, 14), plastic(COLORS.amber, { metalness: 0.4, roughness: 0.25 }))
  knob.position.set(HOUSE.door.w - 0.12, HOUSE.door.h * 0.48, 0.05)
  doorHinge.add(knob)
  const doorLight = new THREE.PointLight('#FFB866', 0, 2.2, 1.4)
  doorLight.position.set(HOUSE.door.x, 0.5, F - 0.1)
  group.add(doorLight)

  // ---- letterbox ----
  const slotFrameShape = new THREE.Shape()
  rectPath(slotFrameShape, HOUSE.slot.x - HOUSE.slot.w / 2 - 0.07, HOUSE.slot.y - 0.11, HOUSE.slot.x + HOUSE.slot.w / 2 + 0.07, HOUSE.slot.y + 0.11, 0.06)
  const slotFrameHole = new THREE.Path()
  rectPath(slotFrameHole, HOUSE.slot.x - HOUSE.slot.w / 2, HOUSE.slot.y - 0.045, HOUSE.slot.x + HOUSE.slot.w / 2, HOUSE.slot.y + 0.045, 0.03)
  slotFrameShape.holes.push(slotFrameHole)
  const slotFrame = new THREE.Mesh(extrude(slotFrameShape, 0.03), chrome({ roughness: 0.2 }))
  slotFrame.position.z = F - 0.005
  group.add(slotFrame)
  const slotBack = new THREE.Mesh(new THREE.PlaneGeometry(HOUSE.slot.w, 0.09), matte('#0B1240'))
  slotBack.position.set(HOUSE.slot.x, HOUSE.slot.y, F - 0.1)
  group.add(slotBack)
  // Two small keys under the letterbox, a nod to a machine's control panel.
  const keyMat = plastic(COLORS.cobalt, { roughness: 0.3 })
  for (const dx of [-0.16, 0, 0.16]) {
    const key = new THREE.Mesh(new RoundedBoxGeometry(0.12, 0.06, 0.04, 2, 0.02), keyMat)
    key.position.set(HOUSE.slot.x + dx, HOUSE.slot.y - 0.24, F + 0.02)
    group.add(key)
  }
  const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.03, 24), plastic(COLORS.amber))
  bell.rotation.x = Math.PI / 2
  bell.position.set(HOUSE.door.x + HOUSE.door.w / 2 + 0.16, 0.48, F + 0.02)
  group.add(bell)

  return {
    group,
    update(doorOpen, glowAmount, sweepPos) {
      doorHinge.rotation.y = -doorOpen * 1.7
      recessGlow.emissiveIntensity = 0.2 + doorOpen * 1.4
      doorLight.intensity = doorOpen * 1.6
      interiorMat.emissiveIntensity = 0.06 + glowAmount * 0.16
      lightBarMat.emissiveIntensity = 0.3 + glowAmount * 1.6
      lamp.intensity = glowAmount * 2.4
      sweepTex.offset.x = -0.6 + sweepPos * 1.2
    },
  }
}
