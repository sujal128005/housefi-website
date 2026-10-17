'use client'
// Why Housefi: a statement whose words light up as you scroll, then a bento grid of what the app does to make a
// visit feel safe and clear. Every point describes a feature of the Housefi app; no numbers or guarantees.
import { useRef } from 'react'
import { why } from '@/content/copy'
import { gsap } from '../motion/gsap'
import { useScrollScene } from '../motion/useScrollScene'
import styles from './WhyHousefi.module.css'

export function WhyHousefi() {
  const ref = useRef<HTMLElement>(null)
  useScrollScene(ref, (el) => {
    const words = el.querySelectorAll('[data-word]')
    gsap.fromTo(words, { opacity: 0.16 }, {
      opacity: 1, stagger: 0.1, ease: 'none',
      scrollTrigger: { trigger: el.querySelector('[data-statement]'), start: 'top 78%', end: 'bottom 42%', scrub: true },
    })
    el.querySelectorAll<HTMLElement>('[data-card]').forEach((card, i) => {
      gsap.fromTo(card, { clipPath: 'inset(18% 8% 0% 8% round 32px)', y: 60, opacity: 0 }, {
        clipPath: 'inset(0% 0% 0% 0% round 32px)', y: 0, opacity: 1, duration: 1.1, ease: 'expo.out', delay: (i % 3) * 0.06,
        scrollTrigger: { trigger: card, start: 'top 90%', toggleActions: 'play none none reverse' },
      })
      const art = card.querySelector('[data-art]')
      if (art) {
        gsap.fromTo(art, { y: 40, rotate: -6 }, { y: -30, rotate: 4, ease: 'none', scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: true } })
      }
    })
  })

  return (
    <section ref={ref} id="why-housefi" className={styles.section} data-header-theme="light" aria-labelledby="why-title">
      <div className="container">
        <p className="eyebrow">Why Housefi</p>
        <h2 id="why-title" className="sr-only">
          Why Housefi
        </h2>
        <p className={styles.statement} data-statement>
          {why.statement.split(' ').map((w, i) => (
            <span key={i} data-word="">
              {w}{' '}
            </span>
          ))}
        </p>
        <ul className={styles.bento}>
          {why.cards.map((c) => (
            <li key={c.title} className={styles.card} data-size={c.size} data-card="">
              <div className={styles.cardText}>
                <h3 className={styles.cardTitle}>{c.title}</h3>
                <p className={styles.cardBody}>{c.body}</p>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className={styles.art} data-art="" src={c.art} alt="" width={360} height={360} loading="lazy" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
