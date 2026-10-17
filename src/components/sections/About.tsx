'use client'
// About Housefi: what it is and what it is for, from the app's own description. No invented history, founders or
// figures.
import { useRef } from 'react'
import { about } from '@/content/copy'
import { site } from '@/content/site'
import { gsap } from '../motion/gsap'
import { useScrollScene } from '../motion/useScrollScene'
import styles from './About.module.css'

export function About() {
  const ref = useRef<HTMLElement>(null)
  useScrollScene(ref, (el) => {
    gsap.fromTo(el.querySelector('[data-marquee]'), { xPercent: 0 }, {
      xPercent: -30, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
    })
    gsap.fromTo(el.querySelector('[data-badge]'), { rotate: -40 }, {
      rotate: 140, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
    })
    gsap.fromTo(el.querySelector('[data-house]'), { y: 60, scale: 0.92 }, {
      y: -40, scale: 1, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
    })
  })

  return (
    <section ref={ref} id="about" className={styles.section} data-header-theme="light" aria-labelledby="about-title">
      <div className={styles.marquee} aria-hidden="true">
        <span data-marquee="">
          Home help, made easy · Home help, made easy · Home help, made easy ·
        </span>
      </div>
      <div className={`container ${styles.grid}`}>
        <div className={styles.visual}>
          <div className={styles.badgeWrap}>
            <svg viewBox="0 0 200 200" className={styles.badge} data-badge="" aria-hidden="true">
              <defs>
                <path id="about-ring" d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" />
              </defs>
              <text>
                <textPath href="#about-ring">
                  {`${site.name.toUpperCase()} · BY ${site.by.toUpperCase()} · ${site.tagline.toUpperCase()} · `}
                </textPath>
              </text>
            </svg>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={styles.house} data-house="" src="/illustrations/house_garden.webp" alt="" width={360} height={360} loading="lazy" />
          </div>
        </div>
        <div className={styles.copy}>
          <p className="eyebrow">About Housefi</p>
          <h2 id="about-title" className={`section-title ${styles.title}`}>
            {about.title}
          </h2>
          {about.paragraphs.map((p) => (
            <p key={p} className={styles.text}>
              {p}
            </p>
          ))}
          <p className={styles.by}>
            {site.name} is built by{' '}
            {site.byUrl ? (
              <a href={site.byUrl} target="_blank" rel="noopener noreferrer">
                {site.by}
              </a>
            ) : (
              site.by
            )}
            .
          </p>
        </div>
      </div>
    </section>
  )
}
