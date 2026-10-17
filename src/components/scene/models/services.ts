// The six service objects that come out of the toolbox, modelled after Housefi's illustrations. Each fits a
// roughly 1-unit box and has a micro-action driven by scroll (`action` grows while its beat is on screen):
// water runs, the bulb lights, air flows, the drum turns, bubbles rise, the saw rocks.
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { COLORS, bubble, chrome, glow, matte, plastic, type Quality } from '../materials'
import { fadeTexture, woodTexture } from '../textures'

export interface ServiceObject {
  readonly group: THREE.Group
  update(action: number, focus: number): void
}

const TAU = Math.PI * 2
const frac = (x: number) => x - Math.floor(x)

function faucet(): ServiceObject {
  const group = new THREE.Group()
  const steel = chrome()
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.08, 40), steel)
  base.position.y = -0.46
  group.add(base)
  const riser = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.5, 32), steel)
  riser.position.y = -0.18
  group.add(riser)
  const spoutCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.02, 0), new THREE.Vector3(0, 0.3, 0.02), new THREE.Vector3(0.12, 0.42, 0.04), new THREE.Vector3(0.36, 0.36, 0.05), new THREE.Vector3(0.46, 0.18, 0.05),
  ])
  const spout = new THREE.Mesh(new THREE.TubeGeometry(spoutCurve, 48, 0.055, 20, false), steel)
  group.add(spout)
  const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.06, 24), steel)
  tip.position.set(0.46, 0.16, 0.05)
  group.add(tip)
  const lever = new THREE.Mesh(new RoundedBoxGeometry(0.42, 0.07, 0.11, 3, 0.03), plastic(COLORS.royal))
  lever.position.set(-0.16, 0.12, 0.0)
  lever.rotation.z = 0.35
  group.add(lever)
  const leverCap = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.1, 24), steel)
  leverCap.position.set(0, 0.06, 0)
  group.add(leverCap)

  const waterMat = new THREE.MeshPhysicalMaterial({ color: COLORS.cyan, transparent: true, opacity: 0.75, roughness: 0.05, emissive: '#48D9F5', emissiveIntensity: 0.25, clearcoat: 1 })
  const stream = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 1, 20, 1, true), waterMat)
  stream.position.set(0.46, 0.13, 0.05)
  group.add(stream)
  const drops = Array.from({ length: 3 }, () => {
    const d = new THREE.Mesh(new THREE.SphereGeometry(0.045, 18, 14), waterMat)
    d.scale.y = 1.35
    group.add(d)
    return d
  })

  return {
    group,
    update(action, focus) {
      const flow = THREE.MathUtils.smoothstep(focus, 0.15, 0.7)
      const len = 0.62 * flow
      stream.visible = len > 0.01
      stream.scale.y = Math.max(0.001, len)
      stream.position.y = 0.13 - len / 2
      lever.rotation.z = 0.35 + flow * 0.35
      drops.forEach((d, i) => {
        const t = frac(action * 2.2 + i / 3)
        d.visible = flow > 0.3
        d.position.set(0.46, 0.13 - len - t * 0.3, 0.05)
        d.scale.setScalar(1 - t * 0.5)
      })
    },
  }
}

function bulb(quality: Quality): ServiceObject {
  const group = new THREE.Group()
  const profile = [
    [0, 0.62], [0.12, 0.6], [0.22, 0.54], [0.28, 0.44], [0.29, 0.34], [0.25, 0.22], [0.17, 0.1], [0.13, 0.0], [0.12, -0.04],
  ].map(([x, y]) => new THREE.Vector2(x!, y!))
  const glassMat = new THREE.MeshPhysicalMaterial(
    quality === 'high'
      ? { color: '#FFFFFF', transmission: 0.92, roughness: 0.08, thickness: 0.05, ior: 1.4, emissive: '#FFC857', emissiveIntensity: 0, clearcoat: 1 }
      : { color: '#FFF6DE', transparent: true, opacity: 0.5, roughness: 0.08, emissive: '#FFC857', emissiveIntensity: 0, clearcoat: 1 },
  )
  const bulbGlass = new THREE.Mesh(new THREE.LatheGeometry(profile, 48), glassMat)
  group.add(bulbGlass)
  const filamentMat = glow('#FFB13D', 0.2)
  const filament = new THREE.Mesh(new THREE.TorusKnotGeometry(0.06, 0.008, 64, 8, 2, 5), filamentMat)
  filament.position.y = 0.34
  group.add(filament)
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.16, 24, 18), new THREE.MeshBasicMaterial({ color: '#FFE3A1', transparent: true, opacity: 0 }))
  core.position.y = 0.36
  group.add(core)
  const screwProfile: THREE.Vector2[] = []
  for (let i = 0; i <= 12; i++) screwProfile.push(new THREE.Vector2(0.13 + (i % 2 ? 0.015 : 0), -0.04 - i * 0.02))
  screwProfile.push(new THREE.Vector2(0.06, -0.3), new THREE.Vector2(0, -0.31))
  const screw = new THREE.Mesh(new THREE.LatheGeometry(screwProfile, 40), chrome({ color: '#D9DEE8', roughness: 0.22 }))
  group.add(screw)
  const light = new THREE.PointLight('#FFC857', 0, 2.2, 1.5)
  light.position.y = 0.36
  group.add(light)

  // Switch beside the bulb
  const plate = new THREE.Mesh(new RoundedBoxGeometry(0.34, 0.46, 0.06, 3, 0.05), plastic('#FFFFFF', { roughness: 0.4 }))
  plate.position.set(0.48, -0.1, -0.05)
  group.add(plate)
  const rocker = new THREE.Mesh(new RoundedBoxGeometry(0.12, 0.2, 0.06, 3, 0.03), plastic(COLORS.royal))
  rocker.position.set(0.48, -0.1, 0.0)
  group.add(rocker)
  group.position.x = -0.12

  return {
    group,
    update(action, focus) {
      const on = THREE.MathUtils.smoothstep(focus, 0.2, 0.75)
      const flicker = on > 0 && on < 1 ? 0.85 + 0.15 * Math.sin(action * 40) : 1
      filamentMat.emissiveIntensity = 0.2 + on * 3.2 * flicker
      glassMat.emissiveIntensity = on * 0.5
      ;(core.material as THREE.MeshBasicMaterial).opacity = on * 0.55
      light.intensity = on * 2.2
      rocker.rotation.x = on > 0.5 ? -0.3 : 0.3
    },
  }
}

function airConditioner(): ServiceObject {
  const group = new THREE.Group()
  const body = new THREE.Mesh(new RoundedBoxGeometry(1.15, 0.36, 0.3, 5, 0.12), plastic('#FFFFFF', { roughness: 0.35 }))
  body.position.y = 0.22
  group.add(body)
  const vent = new THREE.Mesh(new RoundedBoxGeometry(0.98, 0.07, 0.04, 2, 0.02), matte('#C9D2E6'))
  vent.position.set(0, 0.1, 0.14)
  group.add(vent)
  const louver = new THREE.Mesh(new RoundedBoxGeometry(0.96, 0.03, 0.08, 2, 0.012), plastic('#E8EEFA'))
  louver.position.set(0, 0.06, 0.16)
  louver.rotation.x = 0.5
  group.add(louver)
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.018, 12, 10), glow(COLORS.cyan, 1.4))
  led.position.set(0.44, 0.28, 0.152)
  group.add(led)
  const stripe = new THREE.Mesh(new RoundedBoxGeometry(0.3, 0.03, 0.02, 2, 0.01), plastic(COLORS.royal))
  stripe.position.set(-0.32, 0.3, 0.15)
  group.add(stripe)

  const ribbonTex = fadeTexture([[0, 'rgba(72,217,245,0)'], [0.25, 'rgba(72,217,245,0.9)'], [0.6, 'rgba(160,236,250,0.6)'], [1, 'rgba(72,217,245,0)']])
  const ribbonMat = new THREE.MeshBasicMaterial({ map: ribbonTex, transparent: true, side: THREE.DoubleSide, depthWrite: false, opacity: 0 })
  const ribbons = [-0.32, 0, 0.32].map((x, i) => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(x, 0.06, 0.18), new THREE.Vector3(x + 0.05, -0.12, 0.42), new THREE.Vector3(x - 0.06, -0.32, 0.55), new THREE.Vector3(x + 0.04, -0.55, 0.62),
    ])
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.035 + i * 0.006, 8, false), ribbonMat)
    tube.scale.x = 1.6
    group.add(tube)
    return tube
  })
  void ribbons

  return {
    group,
    update(action, focus) {
      const on = THREE.MathUtils.smoothstep(focus, 0.15, 0.6)
      ribbonMat.opacity = on
      ribbonTex.offset.x = -action * 2.5
      louver.rotation.x = 0.2 + on * 0.5
    },
  }
}

function washer(quality: Quality): ServiceObject {
  const group = new THREE.Group()
  const body = new THREE.Mesh(new RoundedBoxGeometry(0.86, 0.96, 0.78, 5, 0.1), plastic('#FFFFFF', { roughness: 0.32 }))
  group.add(body)
  const panel = new THREE.Mesh(new RoundedBoxGeometry(0.76, 0.14, 0.04, 2, 0.02), plastic('#EEF2FB'))
  panel.position.set(0, 0.36, 0.39)
  group.add(panel)
  const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.04, 24), plastic(COLORS.royal))
  knob.rotation.x = Math.PI / 2
  knob.position.set(0.26, 0.36, 0.42)
  group.add(knob)
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.05, 20, 56), plastic(COLORS.royal, { roughness: 0.25 }))
  ring.position.set(0, -0.06, 0.39)
  group.add(ring)
  const drumBack = new THREE.Mesh(new THREE.CircleGeometry(0.25, 40), matte('#1B2B6B'))
  drumBack.position.set(0, -0.06, 0.3)
  group.add(drumBack)
  const drum = new THREE.Group()
  drum.position.set(0, -0.06, 0.32)
  group.add(drum)
  const cloth = [COLORS.orange, COLORS.cyan, COLORS.amber, '#FFFFFF']
  cloth.forEach((c, i) => {
    const blob = new THREE.Mesh(new THREE.SphereGeometry(0.08, 18, 14), plastic(c, { roughness: 0.6, clearcoat: 0.2 }))
    const a = (i / cloth.length) * TAU
    blob.position.set(Math.cos(a) * 0.13, Math.sin(a) * 0.13, 0)
    blob.scale.set(1.3, 0.8, 0.6)
    drum.add(blob)
  })
  const porthole = new THREE.Mesh(
    new THREE.SphereGeometry(0.25, 40, 20, 0, TAU, 0, Math.PI / 4),
    quality === 'high'
      ? new THREE.MeshPhysicalMaterial({ color: '#DDF5FF', transmission: 0.9, roughness: 0.05, thickness: 0.04, ior: 1.4, clearcoat: 1 })
      : new THREE.MeshPhysicalMaterial({ color: '#DDF5FF', transparent: true, opacity: 0.3, roughness: 0.05, clearcoat: 1 }),
  )
  porthole.rotation.x = Math.PI / 2
  porthole.position.set(0, -0.06, 0.24)
  group.add(porthole)

  return {
    group,
    update(action) {
      drum.rotation.z = -action * TAU * 1.4
    },
  }
}

function cleaning(): ServiceObject {
  const group = new THREE.Group()
  const bottleProfile = [
    [0, -0.5], [0.17, -0.5], [0.2, -0.46], [0.2, 0.06], [0.16, 0.14], [0.08, 0.2], [0.075, 0.26], [0, 0.26],
  ].map(([x, y]) => new THREE.Vector2(x!, y!))
  const orange = plastic(COLORS.orange, { roughness: 0.22 })
  const bottle = new THREE.Mesh(new THREE.LatheGeometry(bottleProfile, 48), orange)
  bottle.position.x = -0.18
  group.add(bottle)
  const label = new THREE.Mesh(new THREE.CylinderGeometry(0.205, 0.205, 0.22, 48, 1, true, -Math.PI / 2.2, Math.PI / 1.1), plastic('#FFFFFF', { roughness: 0.5 }))
  label.position.set(-0.18, -0.2, 0)
  group.add(label)
  const head = new THREE.Mesh(new RoundedBoxGeometry(0.2, 0.14, 0.34, 3, 0.05), plastic(COLORS.royal))
  head.position.set(-0.18, 0.32, 0.06)
  group.add(head)
  const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.08, 16), plastic(COLORS.royal))
  nozzle.rotation.x = Math.PI / 2
  nozzle.position.set(-0.18, 0.32, 0.26)
  group.add(nozzle)
  const trigger = new THREE.Mesh(new RoundedBoxGeometry(0.06, 0.2, 0.06, 2, 0.025), plastic(COLORS.royal))
  trigger.position.set(-0.18, 0.18, 0.2)
  trigger.rotation.x = 0.35
  group.add(trigger)

  const sponge = new THREE.Mesh(new RoundedBoxGeometry(0.42, 0.18, 0.28, 4, 0.06), matte(COLORS.amber, { roughness: 0.95 }))
  sponge.position.set(0.3, -0.42, 0.05)
  sponge.rotation.y = -0.4
  group.add(sponge)
  const scrub = new THREE.Mesh(new RoundedBoxGeometry(0.42, 0.06, 0.28, 3, 0.03), matte(COLORS.leaf, { roughness: 0.9 }))
  scrub.position.set(0.3, -0.3, 0.05)
  scrub.rotation.y = -0.4
  group.add(scrub)

  const film = bubble()
  const bubbles = Array.from({ length: 6 }, (_, i) => {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.06 + (i % 3) * 0.025, 24, 18), film)
    group.add(b)
    return b
  })

  return {
    group,
    update(action, focus) {
      const on = THREE.MathUtils.smoothstep(focus, 0.1, 0.5)
      trigger.rotation.x = 0.35 - on * 0.25 * (0.5 + 0.5 * Math.sin(action * 20))
      bubbles.forEach((b, i) => {
        const t = frac(action * 0.9 + i / bubbles.length)
        b.visible = on > 0.05
        b.position.set(0.1 + Math.sin(i * 2.1 + t * 4) * 0.28, -0.2 + t * 1.0, 0.15 + Math.cos(i * 1.3) * 0.15)
        b.scale.setScalar(on * (0.6 + t * 0.6) * (1 - THREE.MathUtils.smoothstep(t, 0.85, 1)))
      })
    },
  }
}

function carpentry(): ServiceObject {
  const group = new THREE.Group()
  const plankMat = new THREE.MeshStandardMaterial({ map: woodTexture(), roughness: 0.7 })
  const plank = new THREE.Mesh(new RoundedBoxGeometry(1.0, 0.12, 0.36, 3, 0.03), plankMat)
  plank.position.set(0, -0.42, 0)
  plank.rotation.y = 0.2
  group.add(plank)

  // Saw: toothed blade and a cobalt handle with an orange grip.
  const blade = new THREE.Shape()
  blade.moveTo(0, 0)
  const teeth = 18
  for (let i = 0; i <= teeth; i++) {
    const x = (i / teeth) * 0.78
    blade.lineTo(x, -0.025 * (1 - i / teeth) - (i % 2 ? 0.035 : 0))
  }
  blade.lineTo(0.8, 0.0)
  blade.lineTo(0.76, 0.12)
  blade.lineTo(0.0, 0.2)
  blade.closePath()
  const saw = new THREE.Group()
  const bladeMesh = new THREE.Mesh(new THREE.ExtrudeGeometry(blade, { depth: 0.012, bevelEnabled: false }), chrome({ roughness: 0.18 }))
  saw.add(bladeMesh)
  const handleShape = new THREE.Shape()
  handleShape.moveTo(0, -0.02)
  handleShape.lineTo(-0.24, -0.06)
  handleShape.quadraticCurveTo(-0.34, 0.1, -0.24, 0.28)
  handleShape.lineTo(0.04, 0.24)
  handleShape.closePath()
  const grip = new THREE.Path()
  grip.moveTo(-0.08, 0.04)
  grip.lineTo(-0.2, 0.02)
  grip.quadraticCurveTo(-0.26, 0.1, -0.2, 0.18)
  grip.lineTo(-0.06, 0.16)
  grip.closePath()
  handleShape.holes.push(grip)
  const handle = new THREE.Mesh(new THREE.ExtrudeGeometry(handleShape, { depth: 0.07, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.015, bevelSegments: 2 }), plastic(COLORS.royal))
  handle.position.z = -0.03
  saw.add(handle)
  const insert = new THREE.Mesh(new RoundedBoxGeometry(0.05, 0.16, 0.09, 2, 0.02), plastic(COLORS.orange))
  insert.position.set(-0.26, 0.1, 0.005)
  insert.rotation.z = -0.4
  saw.add(insert)
  saw.position.set(-0.22, -0.12, 0.08)
  saw.rotation.z = 0.25
  group.add(saw)

  // Hammer
  const hammer = new THREE.Group()
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.62, 16), new THREE.MeshStandardMaterial({ map: woodTexture(), roughness: 0.6 }))
  hammer.add(shaft)
  const headMesh = new THREE.Mesh(new RoundedBoxGeometry(0.3, 0.09, 0.09, 3, 0.03), chrome({ color: '#B9C2D3', roughness: 0.25 }))
  headMesh.position.y = 0.3
  hammer.add(headMesh)
  hammer.position.set(0.36, 0.08, -0.08)
  hammer.rotation.z = -0.5
  group.add(hammer)

  return {
    group,
    update(action, focus) {
      const rock = Math.sin(action * TAU * 1.5) * 0.12 * focus
      saw.position.x = -0.22 + rock
      saw.rotation.z = 0.25 + rock * 0.6
      hammer.rotation.z = -0.5 - Math.max(0, Math.sin(action * TAU * 1.5 + 1)) * 0.35 * focus
    },
  }
}

export function createServiceObjects(quality: Quality): ServiceObject[] {
  const list = [faucet(), bulb(quality), airConditioner(), washer(quality), cleaning(), carpentry()]
  for (const s of list) {
    s.group.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) o.castShadow = quality === 'high'
    })
  }
  return list
}
