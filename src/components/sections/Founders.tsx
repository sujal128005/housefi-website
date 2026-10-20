'use client'
// The founders of Housefi. Portraits sit in an arched, door-like frame in front of a cobalt house shape; they
// rise into view with a mask reveal and a slow parallax, and tilt towards the pointer on devices with a mouse.
import { ArrowUpRight, Globe } from 'lucide-react'
import { useRef, type PointerEvent } from 'react'
import { founders } from '@/content/founders'
import { gsap } from '../motion/gsap'
import { useScrollScene } from '../motion/useScrollScene'
import styles from './Founders.module.css'

function LinkedInMark() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor">
      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.75h4V21H3V9.75Zm7 0h3.8v1.6h.06c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.77 2.6 4.77 6V21h-4v-5.1c0-1.22-.02-2.78-1.7-2.78-1.7 0-1.96 1.33-1.96 2.7V21h-4V9.75Z" />
    </svg>
  )
}

/** `page`: the section is the whole page (/founders/), so its title is the page's h1 and it clears the header. */
export function Founders({ page = false }: { readonly page?: boolean }) {
  const ref = useRef<HTMLElement>(null)

  useScrollScene(ref, (el) => {
    el.querySelectorAll<HTMLElement>('[data-founder]').forEach((card, i) => {
      const frame = card.querySelector('[data-frame]')
      const photo = card.querySelector('[data-photo]')
      const plate = card.querySelector('[data-plate]')
      const tl = gsap.timeline({ scrollTrigger: { trigger: card, start: 'top 85%', toggleActions: 'play none none reverse' } })
      tl.fromTo(frame, { clipPath: 'inset(100% -60% -60% -60% round 40px)' }, { clipPath: 'inset(-60% -60% -60% -60% round 0px)', duration: 1.3, ease: 'expo.out', delay: i * 0.12 })
        .fromTo(photo, { scale: 1.25 }, { scale: 1.06, duration: 1.6, ease: 'expo.out' }, '<')
        .fromTo(plate, { y: 80, rotate: i % 2 ? 10 : -10, opacity: 0 }, { y: 0, rotate: i % 2 ? 4 : -4, opacity: 1, duration: 1.2, ease: 'expo.out' }, '<0.1')
        .from(card.querySelectorAll('[data-text] > *'), { y: 24, opacity: 0, stagger: 0.07, duration: 0.8, ease: 'expo.out' }, '<0.3')
      gsap.fromTo(photo, { yPercent: -4 }, { yPercent: 4, ease: 'none', scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: true } })
      gsap.fromTo(plate, { yPercent: 6 }, { yPercent: -6, ease: 'none', scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: true } })
    })
  })

  // Pointer tilt (mouse and pen only).
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const r = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    e.currentTarget.style.setProperty('--tx', `${(-y * 10).toFixed(2)}deg`)
    e.currentTarget.style.setProperty('--ty', `${(x * 12).toFixed(2)}deg`)
    e.currentTarget.style.setProperty('--gx', `${((x + 0.5) * 100).toFixed(1)}%`)
    e.currentTarget.style.setProperty('--gy', `${((y + 0.5) * 100).toFixed(1)}%`)
  }
  const onLeave = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.style.setProperty('--tx', '0deg')
    e.currentTarget.style.setProperty('--ty', '0deg')
  }

  return (
    <section ref={ref} id="founders" className={`${styles.section}${page ? ` ${styles.page}` : ''}`} data-header-theme="light" aria-labelledby="founders-title">
      <div className="container">
        <div className={styles.head}>
          <p className="eyebrow">Founders</p>
          {page ? (
            <h1 id="founders-title" className={`section-title ${styles.title}`}>
              The people behind Housefi.
            </h1>
          ) : (
            <h2 id="founders-title" className={`section-title ${styles.title}`}>
              The people behind Housefi.
            </h2>
          )}
        </div>
        <ul className={styles.list}>
          {founders.map((f, i) => (
            <li key={f.name} className={styles.card} data-founder="" data-side={i % 2 ? 'right' : 'left'}>
              <div className={styles.stage} onPointerMove={onMove} onPointerLeave={onLeave}>
                <div className={styles.plate} data-plate="" aria-hidden="true" />
                <div className={styles.tilt}>
                  <div className={styles.frame} data-frame="">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className={styles.photo} data-photo="" src={f.photo} alt={`Portrait of ${f.name}, ${f.role} of Housefi`} width={600} height={801} loading="lazy" />
                    <span className={styles.shine} aria-hidden="true" />
                  </div>
                  <span className={styles.badge} aria-hidden="true">
                    {f.name
                      .split(' ')
                      .map((w) => w[0])
                      .join('')}
                  </span>
                </div>
              </div>
              <div className={styles.text} data-text="">
                <p className={styles.role}>{f.role}</p>
                <h3 className={styles.name}>{f.name}</h3>
                <ul className={styles.links}>
                  {f.links.map((l) => (
                    <li key={l.href}>
                      <a href={l.href} target="_blank" rel="noopener noreferrer" className={styles.link}>
                        {l.kind === 'linkedin' ? <LinkedInMark /> : <Globe size={18} aria-hidden="true" />}
                        <span>{l.label}</span>
                        <ArrowUpRight size={16} aria-hidden="true" className={styles.arrow} />
                        <span className="sr-only"> (opens in a new tab)</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
