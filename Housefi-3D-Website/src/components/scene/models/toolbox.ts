// The Housefi toolbox, with the Housefi logo on its front: the hero object that carries the story. Pearl and iridescent on the cobalt hero, cobalt on
// light backgrounds; the lid opens behind the glass to release the six services.
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { COLORS, albedo, chrome, plastic, type Quality } from '../materials'
import { createLogo } from './logo'

export interface Toolbox {
  readonly group: THREE.Group
  update(lid: number, pearl: number): void
}

const PEARL = new THREE.Color(COLORS.pearl)
const COBALT = albedo(COLORS.royal)

export function createToolbox(quality: Quality): Toolbox {
  const group = new THREE.Group()
  const inner = new THREE.Group()
  inner.position.y = -0.48 // origin at the centre of the closed box
  group.add(inner)

  const shell = plastic(COLORS.royal, { roughness: 0.26, iridescence: 0, iridescenceIOR: 1.6, iridescenceThicknessRange: [120, 480], sheen: 0.4, sheenColor: new THREE.Color('#BFD3FF') })
  const trim = plastic(COLORS.deep, { roughness: 0.35 })
  const orange = plastic(COLORS.orange, { roughness: 0.28 })
  const amber = plastic(COLORS.amber, { roughness: 0.3 })

  const body = new THREE.Mesh(new RoundedBoxGeometry(1.6, 0.68, 0.82, 5, 0.12), shell)
  body.position.y = 0.34
  inner.add(body)

  const band = new THREE.Mesh(new RoundedBoxGeometry(1.64, 0.07, 0.86, 3, 0.03), trim)
  band.position.y = 0.66
  inner.add(band)

  // The Housefi logo on the front.
  const logo = createLogo(quality)
  logo.scale.setScalar(0.19)
  logo.position.set(0, 0.32, 0.44)
  inner.add(logo)

  // Latches
  for (const x of [-0.52, 0.52]) {
    const latch = new THREE.Mesh(new RoundedBoxGeometry(0.16, 0.2, 0.06, 3, 0.025), amber)
    latch.position.set(x, 0.62, 0.43)
    inner.add(latch)
  }

  // Tools peeking out of the open box
  const tray = new THREE.Mesh(new RoundedBoxGeometry(1.42, 0.08, 0.66, 2, 0.03), orange)
  tray.position.y = 0.6
  inner.add(tray)
  const steel = chrome()
  const wrench = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.7, 12), steel)
  wrench.rotation.z = Math.PI / 2.4
  wrench.position.set(-0.35, 0.72, -0.05)
  inner.add(wrench)
  const screwdriver = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.26, 16), plastic(COLORS.cyan))
  screwdriver.rotation.z = -Math.PI / 3
  screwdriver.position.set(0.32, 0.72, 0.05)
  inner.add(screwdriver)

  // Lid hinged along the back edge
  const hinge = new THREE.Group()
  hinge.position.set(0, 0.69, -0.41)
  inner.add(hinge)
  const lid = new THREE.Mesh(new RoundedBoxGeometry(1.6, 0.24, 0.82, 5, 0.1), shell)
  lid.position.set(0, 0.12, 0.41)
  hinge.add(lid)

  // Handle
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.055, 18, 48, Math.PI), orange)
  handle.position.set(0, 0.24, 0.41)
  hinge.add(handle)
  for (const x of [-0.3, 0.3]) {
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.09, 0.06, 20), trim)
    foot.position.set(x, 0.25, 0.41)
    hinge.add(foot)
  }

  group.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) o.castShadow = true
  })

  return {
    group,
    update(lidOpen, pearl) {
      hinge.rotation.x = -lidOpen * 1.95
      tray.visible = wrench.visible = screwdriver.visible = lidOpen > 0.02
      shell.color.copy(COBALT).lerp(PEARL, pearl)
      shell.iridescence = pearl
      shell.roughness = THREE.MathUtils.lerp(0.26, 0.16, pearl)
      shell.metalness = THREE.MathUtils.lerp(0, 0.35, pearl)
    },
  }
}
