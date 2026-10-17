'use client'
// The app is where the service happens: this section sends people there. Store buttons use the URLs in
// src/content/site.ts and show "Coming soon" until those exist.
import { Check } from 'lucide-react'
import { useRef } from 'react'
import { app } from '@/content/copy'
import { Phone } from '../ui/Phone'
import { StoreButtons } from '../ui/StoreButtons'
import { gsap } from '../motion/gsap'
import { useScrollScene } from '../motion/useScrollScene'
import styles from './AppPromo.module.css'

export function AppPromo() {
  const ref = useRef<HTMLElement>(null)
  useScrollScene(ref, (el) => {
    const phone = el.querySelector<HTMLElement>('[data-phone] > div')
    if (phone) {
      gsap.fromTo(phone, { '--ry': '28deg', '--rx': '14deg', '--rz': '-6deg', y: 120 }, {
        '--ry': '-8deg', '--rx': '2deg', '--rz': '2deg', y: -20, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'center center', scrub: 0.6 },
      })
    }
    el.querySelectorAll<HTMLElement>('[data-chip]').forEach((chip, i) => {
      gsap.fromTo(chip, { y: 80 + i * 40, opacity: 0 }, {
        y: -20 - i * 30, opacity: 1, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top 85%', end: 'bottom 40%', scrub: 0.6 },
      })
    })
    gsap.from(el.querySelectorAll('[data-point]'), {
      x: -24, opacity: 0, stagger: 0.08, duration: 0.8, ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 60%', toggleActions: 'play none none reverse' },
    })
  })

  return (
    <section ref={ref} id="app" className={`${styles.section} on-blue`} data-header-theme="dark" data-hide-floating-cta aria-labelledby="app-title">
      <div className={styles.bgWord} aria-hidden="true">
        Housefi
      </div>
      <div className={`container ${styles.grid}`}>
        <div className={styles.copy}>
          <p className="eyebrow">The Housefi app</p>
          <h2 id="app-title" className={`section-title ${styles.title}`}>
            {app.title}
          </h2>
          <p className={`section-lead ${styles.lead}`}>{app.body}</p>
          <ul className={styles.points}>
            {app.points.map((p) => (
              <li key={p} data-point="">
                <span className={styles.tick} aria-hidden="true">
                  <Check size={16} strokeWidth={3} />
                </span>
                {p}
              </li>
            ))}
          </ul>
          <StoreButtons tone="light" />
          <p className={styles.note}>{app.note}</p>
        </div>
        <div className={styles.visual}>
          <div className={styles.orbit} aria-hidden="true" />
          <Phone className={styles.phone} screens={['/screens/app-assigned.webp']} alt={['Housefi app: a technician has been assigned to the booking']} />
          <div className={`${styles.chip} ${styles.chipA}`} data-chip="" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/illustrations/check.webp" alt="" width={360} height={360} loading="lazy" />
            <span>
              <strong>Quote approved</strong>
              <small>Work can start</small>
            </span>
          </div>
          <div className={`${styles.chip} ${styles.chipB}`} data-chip="" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/illustrations/scooter.webp" alt="" width={360} height={360} loading="lazy" />
            <span>
              <strong>On the way</strong>
              <small>Your technician is coming</small>
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
