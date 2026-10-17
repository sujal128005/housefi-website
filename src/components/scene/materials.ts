// Shared colours and materials for the 3D scene. One place to tune the look: glossy "soft 3D" plastics with a
// clearcoat, chrome, warm wood and a glass that refracts on capable devices.
import * as THREE from 'three'

export type Quality = 'high' | 'low'

export const COLORS = {
  royal: '#1746E8',
  cobalt: '#2455F5',
  deep: '#0E2DB5',
  cyan: '#48D9F5',
  orange: '#FF8A35',
  amber: '#FFC857',
  white: '#FFFFFF',
  soft: '#F5F7FC',
  ink: '#151927',
  pearl: '#EEF1FF',
  leaf: '#3BBF7A',
  leafDark: '#24965C',
  wood: '#C98A4B',
} as const

/**
 * Albedo for a brand colour. The scene is lit brightly enough for white walls to read as white, which would push
 * saturated colours past 1.0 and the tone mapping would wash them out to pastel. Saturated colours are therefore
 * darkened in linear space, so that after lighting they land on the brand colour itself.
 */
export function albedo(color: THREE.ColorRepresentation): THREE.Color {
  const c = new THREE.Color(color)
  const hsl = { h: 0, s: 0, l: 0 }
  c.getHSL(hsl)
  if (hsl.s > 0.45) c.multiplyScalar(THREE.MathUtils.lerp(1, 0.5, THREE.MathUtils.smoothstep(hsl.s, 0.45, 0.9)))
  return c
}

export function plastic(color: string, opts: Partial<THREE.MeshPhysicalMaterialParameters> = {}): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({ roughness: 0.32, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.18, ...opts, color: albedo(opts.color ?? color) })
}

export function matte(color: string, opts: Partial<THREE.MeshStandardMaterialParameters> = {}): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ roughness: 0.62, metalness: 0, ...opts, color: albedo(opts.color ?? color) })
}

export function chrome(opts: Partial<THREE.MeshStandardMaterialParameters> = {}): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color: '#E9EDF5', roughness: 0.12, metalness: 1, ...opts })
}

export function glow(color: string, intensity = 1): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity, roughness: 0.4 })
}

/** Window glass: real refraction and roughness blur on the high tier; a light tinted pane on the low tier. */
export function glass(quality: Quality, opts: Partial<THREE.MeshPhysicalMaterialParameters> = {}): THREE.MeshPhysicalMaterial {
  if (quality === 'high') {
    return new THREE.MeshPhysicalMaterial({
      color: '#FFFFFF',
      transmission: 1,
      roughness: 0.16,
      thickness: 0.08,
      ior: 1.45,
      attenuationColor: new THREE.Color('#CFF4FF'),
      attenuationDistance: 1.2,
      specularIntensity: 1,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
      envMapIntensity: 1.2,
      ...opts,
    })
  }
  return new THREE.MeshPhysicalMaterial({
    color: '#E4F7FF',
    transparent: true,
    opacity: 0.22,
    roughness: 0.05,
    metalness: 0,
    clearcoat: 1,
    depthWrite: false,
    ...opts,
  })
}

/** Soap-bubble film. */
export function bubble(): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: '#FFFFFF',
    transparent: true,
    opacity: 0.35,
    roughness: 0,
    metalness: 0,
    iridescence: 1,
    iridescenceIOR: 1.33,
    iridescenceThicknessRange: [180, 620],
    clearcoat: 1,
    depthWrite: false,
  })
}

/** Releases every geometry, material and texture under an object. */
export function disposeTree(root: THREE.Object3D): void {
  root.traverse((o) => {
    const mesh = o as THREE.Mesh
    if (mesh.geometry) mesh.geometry.dispose()
    const m = mesh.material as THREE.Material | THREE.Material[] | undefined
    for (const mat of Array.isArray(m) ? m : m ? [m] : []) {
      for (const v of Object.values(mat)) if (v instanceof THREE.Texture) v.dispose()
      mat.dispose()
    }
  })
}
