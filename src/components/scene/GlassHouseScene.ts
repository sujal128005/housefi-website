// The three.js side of "The Glass House". It owns one renderer, one camera and the models, and draws a frame from
// `journeyState(p)`. It draws only when the progress changed (plus a gentle idle float at the very top), and only
// while the stage is on screen.
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { journeyState, layoutFor, ndcToWorld, seg, type JourneyState, type Layout } from '@/lib/timeline'
import { disposeTree, type Quality } from './materials'
import { createHouse, type House } from './models/house'
import { createToolbox, type Toolbox } from './models/toolbox'
import { createServiceObjects, type ServiceObject } from './models/services'
import { DEBRIS, createConfetti, createDebris, createTicket } from './models/extras'
import { resetLogoParts } from './models/logo'

export interface SceneOptions {
  readonly quality: Quality
  readonly onContextLost?: () => void
}

export class GlassHouseScene {
  private readonly renderer: THREE.WebGLRenderer
  private readonly scene = new THREE.Scene()
  private readonly camera = new THREE.PerspectiveCamera(30, 1, 0.1, 120)
  private readonly target = new THREE.Vector3()
  private readonly houseRoot = new THREE.Group()
  private readonly house: House
  private readonly toolbox: Toolbox
  private readonly services: ServiceObject[]
  private readonly holders: THREE.Group[] = []
  private readonly debris: { group: THREE.Group; pieces: THREE.Object3D[] }
  private readonly confetti: ReturnType<typeof createConfetti>
  private readonly ticket: ReturnType<typeof createTicket>
  private readonly envTarget: THREE.WebGLRenderTarget
  private layout: Layout = layoutFor(1280, 800)
  private progress = 0
  private dirty = true
  private running = false
  private raf = 0
  private readonly canvas: HTMLCanvasElement
  private readonly onLost: (e: Event) => void
  private readonly key: THREE.DirectionalLight
  /** Recent frame costs, to step quality down on devices that cannot keep up. */
  private frameCosts: number[] = []
  private degraded = 0
  private disposed = false
  private lastDraw = 0
  /** Stands in for three.js's glass (transmission) render target when compiling ahead. */
  private readonly glassPass = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType })

  constructor(canvas: HTMLCanvasElement, private readonly options: SceneOptions) {
    this.canvas = canvas
    const high = options.quality === 'high'
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, high ? 1.75 : 1.25))
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.NeutralToneMapping
    this.renderer.toneMappingExposure = 1.02
    this.renderer.setClearColor(0x000000, 0)
    this.renderer.shadowMap.enabled = high
    this.renderer.shadowMap.type = THREE.PCFShadowMap

    const pmrem = new THREE.PMREMGenerator(this.renderer)
    this.envTarget = pmrem.fromScene(new RoomEnvironment(), 0.04)
    pmrem.dispose()
    this.scene.environment = this.envTarget.texture
    this.scene.environmentIntensity = 0.6

    // Lighting: a warm key from the upper right, a cool fill from the left, and a soft sky.
    this.scene.add(new THREE.HemisphereLight('#EEF2FF', '#C7D1F2', 0.55))
    const key = new THREE.DirectionalLight('#FFF5EA', 1.75)
    this.key = key
    key.position.set(5, 9, 7)
    key.castShadow = high
    key.shadow.mapSize.set(1024, 1024)
    key.shadow.camera.left = -5
    key.shadow.camera.right = 5
    key.shadow.camera.top = 6
    key.shadow.camera.bottom = -3
    key.shadow.camera.near = 1
    key.shadow.camera.far = 30
    key.shadow.radius = 6
    key.shadow.bias = -0.0006
    key.shadow.normalBias = 0.02
    this.scene.add(key)
    const fill = new THREE.DirectionalLight('#C9D8FF', 0.7)
    fill.position.set(-7, 3, 5)
    this.scene.add(fill)
    const rim = new THREE.DirectionalLight('#FFFFFF', 0.6)
    rim.position.set(-2, 6, -8)
    this.scene.add(rim)

    this.house = createHouse(options.quality)
    this.houseRoot.add(this.house.group)
    this.scene.add(this.houseRoot)

    this.services = createServiceObjects(options.quality)
    for (const s of this.services) {
      const holder = new THREE.Group()
      holder.add(s.group)
      this.houseRoot.add(holder)
      this.holders.push(holder)
    }
    this.confetti = createConfetti(high ? 60 : 24)
    this.houseRoot.add(this.confetti.mesh)
    this.ticket = createTicket(() => (this.dirty = true))
    this.houseRoot.add(this.ticket.group)

    this.toolbox = createToolbox(options.quality)
    this.scene.add(this.toolbox.group)
    this.debris = createDebris(options.quality)
    this.scene.add(this.debris.group)

    this.onLost = (e: Event) => {
      e.preventDefault()
      this.stop()
      options.onContextLost?.()
    }
    canvas.addEventListener('webglcontextlost', this.onLost)
    this.resize()
  }

  /**
   * Compiles the shaders for the opening frame without blocking the page (the first frame would otherwise compile them
   * on the main thread, which freezes the page for seconds on some laptops). Call before `start()`.
   */
  async prepare(): Promise<void> {
    await Promise.all(this.compileAt(this.progress, false))
    this.dirty = true
  }

  /**
   * Compiles every shader the rest of the story needs, in the background, so scrolling into a new part never stalls.
   * The story changes which objects show and how their materials look as it goes, so it steps through it in order,
   * one step at a time, so the compiling never crowds out the frames being drawn.
   */
  async warmUp(steps = 20): Promise<void> {
    for (let i = 0; i <= steps && !this.disposed; i++) await Promise.all(this.compileAt(i / steps, true))
    this.dirty = true
  }

  /**
   * Starts compiling (with KHR_parallel_shader_compile, off the main thread) the programs for the frame at progress p,
   * for the screen and, with `glass`, for the glass pass: three.js draws the scene behind glass into a render target
   * without tone mapping, which needs its own variant of every material. The scene is put back before returning, so
   * the render loop never sees the borrowed state.
   */
  private compileAt(p: number, glass: boolean): Promise<unknown>[] {
    const { renderer } = this
    const current = this.progress
    this.progress = p
    this.apply(journeyState(p, this.layout), 0)
    const jobs = [renderer.compileAsync(this.scene, this.camera)]
    if (glass) {
      const target = renderer.getRenderTarget()
      renderer.setRenderTarget(this.glassPass)
      jobs.push(renderer.compileAsync(this.scene, this.camera))
      renderer.setRenderTarget(target)
    }
    this.progress = current
    this.apply(journeyState(current, this.layout), 0)
    this.dirty = true
    return jobs.map((j) => j.catch(() => undefined))
  }

  setProgress(p: number): void {
    if (p !== this.progress) {
      this.progress = p
      this.dirty = true
    }
  }

  resize(): void {
    const w = Math.max(1, this.canvas.clientWidth)
    const h = Math.max(1, this.canvas.clientHeight)
    this.renderer.setSize(w, h, false)
    this.layout = layoutFor(w, h)
    this.camera.aspect = w / h
    this.dirty = true
  }

  start(): void {
    if (this.running) return
    this.running = true
    const loop = (time: number) => {
      if (!this.running) return
      const idle = this.progress < 0.02
      // The idle float is slow, so about 30 frames a second is enough for it; that leaves the GPU room for the
      // shaders still compiling in the background.
      if (this.dirty || (idle && time - this.lastDraw > 30)) {
        this.lastDraw = time
        const t0 = performance.now()
        this.apply(journeyState(this.progress, this.layout), idle ? time / 1000 : 0)
        this.renderer.render(this.scene, this.camera)
        this.dirty = false
        this.watchCost(performance.now() - t0)
      }
      this.raf = requestAnimationFrame(loop)
    }
    this.raf = requestAnimationFrame(loop)
  }

  stop(): void {
    this.running = false
    cancelAnimationFrame(this.raf)
  }

  /** Draws one frame at progress p immediately (used for still images). */
  renderAt(p: number): void {
    this.progress = p
    this.apply(journeyState(p, this.layout), 0)
    this.renderer.render(this.scene, this.camera)
  }

  dispose(): void {
    this.disposed = true
    this.stop()
    this.glassPass.dispose()
    this.canvas.removeEventListener('webglcontextlost', this.onLost)
    disposeTree(this.scene)
    resetLogoParts()
    this.envTarget.dispose()
    this.renderer.dispose()
  }

  /** Steps quality down (pixel ratio, then shadows) when frames take too long, so scrolling stays responsive. */
  private watchCost(ms: number): void {
    this.frameCosts.push(ms)
    if (this.frameCosts.length < 30) return
    const avg = this.frameCosts.reduce((a, b) => a + b, 0) / this.frameCosts.length
    this.frameCosts = []
    if (avg < 28 || this.degraded >= 2) return
    this.degraded++
    if (this.degraded === 1) {
      this.renderer.setPixelRatio(1)
      this.resize()
    } else {
      this.key.castShadow = false
      this.renderer.shadowMap.enabled = false
    }
  }

  private apply(s: JourneyState, time: number): void {
    const { camera } = this
    // Camera
    camera.position.set(...s.camera.pos)
    this.target.set(...s.camera.target)
    camera.lookAt(this.target)
    camera.fov = s.camera.fov
    const shiftNdc = s.camera.shift * 0.42
    camera.filmOffset = -shiftNdc * Math.tan((camera.fov * Math.PI) / 360) * camera.aspect * camera.getFilmWidth()
    camera.updateProjectionMatrix()

    // Toolbox
    const tb = s.toolbox
    const g = this.toolbox.group
    g.visible = tb.visible && tb.scale > 0.001
    g.position.set(...tb.pos)
    if (time > 0) g.position.y += Math.sin(time * 1.4) * 0.08
    g.rotation.set(tb.rot[0] + (time > 0 ? Math.sin(time * 0.9) * 0.04 : 0), tb.rot[1], tb.rot[2])
    g.scale.setScalar(Math.max(0.0001, tb.scale))
    this.toolbox.update(tb.lid, tb.pearl)

    // Debris: anchored to the opening shot, then thrown outwards and past the camera.
    const burst = s.debris.burst
    this.debris.group.visible = s.debris.visible > 0.01
    DEBRIS.forEach((d, i) => {
      const m = this.debris.pieces[i]!
      const base = ndcToWorld(d.ndc[0], d.ndc[1], d.depth, this.layout.aspect)
      const len = Math.hypot(d.ndc[0], d.ndc[1]) || 1
      m.position.set(base[0] + (d.ndc[0] / len) * burst * 5, base[1] + (d.ndc[1] / len) * burst * 3.5, base[2] + burst * (d.depth - 1.2))
      const drift = time > 0 ? Math.sin(time * 0.8 + i) * 0.05 : 0
      m.rotation.set(d.rot[0] + burst * 2.2 + drift, d.rot[1] + burst * 3 + drift, d.rot[2] + burst * 1.4)
    })

    // House
    this.houseRoot.visible = s.house.visible
    this.houseRoot.scale.setScalar(Math.max(0.0001, s.house.scale))
    this.house.update(s.house.door, s.house.glow, seg(this.progress, 0.3, 0.95))

    // Services
    s.services.forEach((o, i) => {
      const h = this.holders[i]!
      h.visible = o.scale > 0.002
      h.position.set(...o.pos)
      h.scale.setScalar(Math.max(0.0001, o.scale))
      h.rotation.set(0.12 * (1 - o.focus), o.spin - 0.25 * o.focus, 0)
      this.services[i]!.update(o.action, o.focus)
    })
    this.confetti.update(s.confetti * (1 - seg(this.progress, 0.86, 0.95) * 0.7), this.progress)
    this.ticket.update(s.ticket)
  }
}

/** Picks the quality tier from what the device reports. */
export function detectQuality(): Quality {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } }
  const cores = nav.hardwareConcurrency ?? 8
  const memory = nav.deviceMemory ?? 8
  const smallTouch = window.matchMedia('(pointer: coarse)').matches && Math.min(window.innerWidth, window.innerHeight) < 500
  if (cores <= 4 || memory <= 4 || nav.connection?.saveData || smallTouch) return 'low'
  return 'high'
}
