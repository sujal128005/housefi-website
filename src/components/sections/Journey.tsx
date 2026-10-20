'use client'
// "The Glass House": the hero and the services, told as one pinned, scroll-driven 3D sequence.
// - The stage is a sticky, full-viewport frame inside a tall section; scroll progress through the section drives
//   both the 3D scene and the captions through `journeyState(p)`.
// - With reduced motion, no WebGL, or if the scene fails, the same content renders as a normal hero followed by a
//   grid of service cards.
import { ArrowDown, ArrowRight } from 'lucide-react'
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { hero, journey } from '@/content/copy'
import { services } from '@/content/services'
import { focusProgress, journeyState, layoutFor, type Layout } from '@/lib/timeline'
import { reportHeaderTheme, type HeaderTheme } from '@/lib/headerTheme'
import { ButtonLink } from '../ui/Button'
import { gsap, ScrollTrigger, MOTION_OK } from '../motion/gsap'
import type { GlassHouseScene } from '../scene/GlassHouseScene'
import { webglAvailable } from '../scene/webgl'
import styles from './Journey.module.css'

type Mode = 'pending' | 'motion' | 'static'

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

/**
 * Runs while the page is still loading, before its first paint: switches the section to the animated layout straight
 * away (unless the visitor asked for reduced motion), so the static layout never flashes up before the scripts load.
 * The script's own check (and WebGL) still decides afterwards. Same pin lengths as `layoutFor`.
 */
const EARLY_MODE = `(function(){try{var s=document.currentScript.parentNode;if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;var w=innerWidth,h=innerHeight;s.style.setProperty('--pin',w>=1024&&w/h>=1.2?9:w>=640?8.2:7.6);s.setAttribute('data-mode','motion')}catch(e){}})()`

export function Journey() {
  const rootRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const heroFrontRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLDivElement>(null)
  const ringsRef = useRef<HTMLDivElement>(null)
  const glassRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const doneRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<GlassHouseScene | null>(null)
  const layoutRef = useRef<Layout>(layoutFor(1280, 800))
  const themeRef = useRef<HeaderTheme | null>(null)
  const activeRef = useRef(-2)
  const [mode, setMode] = useState<Mode>('pending')
  const [sceneReady, setSceneReady] = useState(false)

  // Decide between the animated and the static version, before the browser paints (it matters when arriving from
  // another page of the site; on a fresh load EARLY_MODE has already done it).
  useIsoLayoutEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    const decide = () => setMode(!reduced.matches && webglAvailable() ? 'motion' : 'static')
    decide()
    reduced.addEventListener('change', decide)
    return () => reduced.removeEventListener('change', decide)
  }, [])

  // Any change of layout mode changes the page height below this section.
  useEffect(() => {
    if (mode === 'pending') return
    const raf = requestAnimationFrame(() => ScrollTrigger.refresh())
    return () => cancelAnimationFrame(raf)
  }, [mode])

  /** Applies scroll progress to the captions and the 3D scene. */
  const apply = useCallback((p: number) => {
    const s = journeyState(p, layoutRef.current)
    const set = (el: HTMLElement | null, opacity: number, y: number) => {
      if (!el) return
      el.style.opacity = String(opacity)
      el.style.transform = `translate3d(0, ${y}px, 0)`
      el.style.visibility = opacity < 0.01 ? 'hidden' : 'visible'
    }
    for (const el of [heroRef.current, heroFrontRef.current]) if (el) el.style.transform = `translate3d(0, ${-s.heroShift * 100}%, 0)`
    set(headingRef.current, s.headingIn, (1 - s.headingIn) * 40)
    set(glassRef.current, s.captions.glass, (1 - s.captions.glass) * 24)
    set(listRef.current, s.captions.list, (1 - s.captions.list) * 24)
    set(doneRef.current, s.captions.done, (1 - s.captions.done) * 24)
    if (ringsRef.current) {
      ringsRef.current.style.transform = `translate(-50%, -50%) scale(${s.ringScale})`
      ringsRef.current.style.setProperty('--turn', `${s.ringTurn}deg`)
    }
    if (s.active !== activeRef.current && listRef.current) {
      activeRef.current = s.active
      listRef.current.dataset.active = String(s.active)
    }
    // Header colour: white over the cobalt hero, dark once it has gone.
    const rect = rootRef.current?.getBoundingClientRect()
    if (rect && rect.top <= 1 && rect.bottom > window.innerHeight * 0.5) {
      const theme: HeaderTheme = s.heroShift < 0.94 ? 'dark' : 'light'
      if (theme !== themeRef.current) {
        themeRef.current = theme
        reportHeaderTheme(theme)
      }
    } else {
      themeRef.current = null
    }
    sceneRef.current?.setProgress(p)
  }, [])

  // Animated version: pin length, scroll progress, and the 3D scene.
  useEffect(() => {
    if (mode !== 'motion') return
    const root = rootRef.current
    const canvas = canvasRef.current
    if (!root || !canvas) return
    let disposed = false

    const measure = () => {
      layoutRef.current = layoutFor(window.innerWidth, window.innerHeight)
      root.style.setProperty('--pin', String(layoutRef.current.pinViewports))
    }
    measure()

    // The section just grew to its pinned height: every ScrollTrigger below it must re-measure.
    const refreshRaf = requestAnimationFrame(() => ScrollTrigger.refresh())

    const proxy = { p: 0 }
    const mm = gsap.matchMedia(root)
    mm.add(MOTION_OK, () => {
      gsap.to(proxy, {
        p: 1,
        ease: 'none',
        scrollTrigger: { trigger: root, start: 'top top', end: 'bottom bottom', scrub: 0.8, invalidateOnRefresh: true },
        onUpdate: () => apply(proxy.p),
      })
      apply(proxy.p)
    })

    // Load three.js after the first paint, then draw only while the stage is on screen.
    let io: IntersectionObserver | null = null
    const load = async () => {
      try {
        const mod = await import('../scene/GlassHouseScene')
        if (disposed) return
        const scene = new mod.GlassHouseScene(canvas, { quality: mod.detectQuality(), onContextLost: () => setMode('static') })
        sceneRef.current = scene
        // Used by scripts/render-stills.mjs to export the poster images (no effect otherwise).
        if (new URLSearchParams(window.location.search).has('stills')) (window as Window & { __housefiScene?: GlassHouseScene }).__housefiScene = scene
        scene.setProgress(proxy.p)
        // The poster stays up while the first frame's shaders compile in the background; then the rest of the story's.
        await scene.prepare()
        if (disposed) return
        io = new IntersectionObserver(([e]) => (e?.isIntersecting ? scene.start() : scene.stop()), { rootMargin: '100px' })
        io.observe(root)
        requestAnimationFrame(() => requestAnimationFrame(() => !disposed && setSceneReady(true)))
        void scene.warmUp().then(() => !disposed && canvas.setAttribute('data-warm', ''))
      } catch (err) {
        console.error('Housefi: 3D scene unavailable, showing the static version.', err)
        if (!disposed) setMode('static')
      }
    }
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback
    if (idle) idle(() => void load(), { timeout: 600 })
    else setTimeout(() => void load(), 120)

    const onResize = () => {
      measure()
      sceneRef.current?.resize()
      ScrollTrigger.refresh()
    }
    let t = 0
    const debounced = () => {
      clearTimeout(t)
      t = window.setTimeout(onResize, 120)
    }
    window.addEventListener('resize', debounced)

    return () => {
      disposed = true
      cancelAnimationFrame(refreshRaf)
      clearTimeout(t)
      window.removeEventListener('resize', debounced)
      io?.disconnect()
      mm.revert()
      sceneRef.current?.dispose()
      sceneRef.current = null
      setSceneReady(false)
    }
  }, [mode, apply])

  /** Scrolls to the moment a service is in focus. */
  const jumpTo = (index: number) => {
    const root = rootRef.current
    if (!root || mode !== 'motion') return
    const top = root.getBoundingClientRect().top + window.scrollY
    const range = root.offsetHeight - window.innerHeight
    window.scrollTo({ top: top + focusProgress(index) * range, behavior: 'smooth' })
  }

  return (
    // EARLY_MODE may change data-mode and --pin before React loads; React sets both itself right after.
    <section ref={rootRef} id="top" className={styles.journey} data-mode={mode} data-hide-floating-cta-narrow aria-label="Housefi" suppressHydrationWarning>
      <script dangerouslySetInnerHTML={{ __html: EARLY_MODE }} />
      {/* In-flow anchors for the in-page navigation (the stage itself is sticky). */}
      <span id="services" className={styles.anchor} style={{ '--at': focusProgress(0) - 0.06 } as CSSProperties} aria-hidden="true" />

      <div ref={stageRef} className={styles.stage}>
        <div className={styles.light} aria-hidden="true">
          <div ref={ringsRef} className={styles.rings}>
            <svg viewBox="0 0 1000 1000" className={styles.ringSvg}>
              <defs>
                <path id="ring-outer" d="M500,500 m-430,0 a430,430 0 1,1 860,0 a430,430 0 1,1 -860,0" />
                <path id="ring-inner" d="M500,500 m-300,0 a300,300 0 1,1 600,0 a300,300 0 1,1 -600,0" />
              </defs>
              <circle cx="500" cy="500" r="480" className={styles.disc1} />
              <circle cx="500" cy="500" r="355" className={styles.disc2} />
              <g className={styles.spinA}>
                <text className={styles.ringText}>
                  <textPath href="#ring-outer">HOME CARE · ON EVERY VISIT · YOU APPROVE FIRST · HOME CARE · ON EVERY VISIT · YOU APPROVE FIRST ·</textPath>
                </text>
              </g>
              <g className={styles.spinB}>
                <text className={styles.ringTextSmall}>
                  <textPath href="#ring-inner">PLUMBING · ELECTRICAL · AC · APPLIANCES · CLEANING · CARPENTRY ·</textPath>
                </text>
              </g>
            </svg>
          </div>
        </div>

        <div ref={heroRef} className={styles.hero} data-header-theme="dark">
          <div className={styles.heroGlow} aria-hidden="true" />
          {/* Shown until the 3D scene has drawn its first frame. */}
          <picture>
            <source media="(orientation: portrait)" srcSet="/stills/hero-portrait.webp" />
            <img className={styles.poster} data-ready={sceneReady} src="/stills/hero-landscape.webp" alt="" width={1600} height={1000} fetchPriority="high" />
          </picture>
        </div>

        <canvas ref={canvasRef} className={styles.canvas} data-ready={sceneReady} aria-hidden="true" />

        {/* Hero text sits above the canvas so the 3D pieces never cover it; it moves with the hero panel. */}
        <div ref={heroFrontRef} className={styles.heroFront}>
          <div className={`container ${styles.heroInner}`}>
            <div className={styles.heroCopy}>
              <p className={styles.heroEyebrow}>{hero.eyebrow}</p>
              <h1 className={styles.heroTitle}>
                {hero.title.map((line) => (
                  <span key={line} className={styles.heroLine}>
                    {line}
                  </span>
                ))}
              </h1>
              <p className={styles.heroLead}>{hero.lead}</p>
              <div className={styles.heroCtas}>
                <ButtonLink href="#app" variant="light" icon={<ArrowRight size={18} />}>
                  {hero.primaryCta}
                </ButtonLink>
                <ButtonLink href="#services" variant="ghost-light">
                  {hero.secondaryCta}
                </ButtonLink>
              </div>
            </div>
            {/* The hero picture of the static version (reduced motion or no WebGL). */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={styles.staticArt} src="/stills/glass-house.webp" alt="The Housefi glass house: a home with a large window, with a toolbox and service tools inside." width={1200} height={1000} loading="lazy" />
          </div>
          <a href="#services" className={styles.scrollHint}>
            <ArrowDown size={16} aria-hidden="true" /> Scroll to explore
          </a>
        </div>

        <div ref={headingRef} className={styles.heading}>
          <h2 className={styles.headingTitle}>{journey.heading}</h2>
          <p className={styles.headingSub}>{journey.sub}</p>
        </div>

        <div ref={glassRef} className={`${styles.caption} ${styles.glassCaption}`} aria-hidden={mode === 'motion' ? 'true' : undefined}>
          <p className={styles.captionTitle}>{journey.glass.title}</p>
          <p className={styles.captionBody}>{journey.glass.body}</p>
        </div>

        <div ref={listRef} className={styles.services} data-active="-1">
          <h2 className={styles.servicesTitle}>Our services</h2>
          <ol className={styles.serviceList}>
            {services.map((s, i) => {
              const content = (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className={styles.serviceArt} src={s.art} alt="" width={360} height={360} loading="lazy" />
                  <span className={styles.serviceText}>
                    <span className={styles.serviceIndex}>{String(i + 1).padStart(2, '0')}</span>
                    <span className={styles.serviceName}>{s.name}</span>
                    <span className={styles.serviceExamples}>{s.examples}</span>
                    <span className={styles.serviceDesc}>{s.description}</span>
                  </span>
                </>
              )
              return (
                <li key={s.id} className={styles.service} style={{ '--accent': s.accent, '--i': i } as CSSProperties}>
                  {mode === 'motion' ? (
                    <button type="button" className={styles.serviceButton} onClick={() => jumpTo(i)}>
                      {content}
                    </button>
                  ) : (
                    <div className={styles.serviceButton}>{content}</div>
                  )}
                </li>
              )
            })}
          </ol>
        </div>

        <div ref={doneRef} className={`${styles.caption} ${styles.doneCaption}`} aria-hidden={mode === 'motion' ? 'true' : undefined}>
          <p className={styles.captionTitle}>{journey.done.title}</p>
          <p className={styles.captionBody}>{journey.done.body}</p>
        </div>
      </div>
    </section>
  )
}
