// Whether this browser can draw WebGL at all. Kept apart from the scene so the check does not load three.js.
export function webglAvailable(): boolean {
  try {
    const gl = document.createElement('canvas').getContext('webgl2') ?? document.createElement('canvas').getContext('webgl')
    // Hand the test context back at once: browsers allow only a few at a time.
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
    return !!gl
  } catch {
    return false
  }
}
