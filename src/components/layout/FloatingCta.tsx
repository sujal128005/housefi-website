'use client'
// A small glass card at the bottom-right that points to the app, shown once the hero has scrolled away and hidden
// over the app section and the footer (where the same call to action is already on screen).
import { ArrowUpRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { homeLinks } from '@/content/site'
import styles from './FloatingCta.module.css'

export function FloatingCta() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const narrow = window.innerWidth < 1024
    const blockers = [...document.querySelectorAll<HTMLElement>(narrow ? '[data-hide-floating-cta], [data-hide-floating-cta-narrow]' : '[data-hide-floating-cta]')]
    let blocked = false
    const io = new IntersectionObserver(
      (entries) => {
        blocked = entries.some((e) => e.isIntersecting) || blockers.some((b) => {
          const r = b.getBoundingClientRect()
          return r.top < window.innerHeight && r.bottom > 0
        })
        update()
      },
      { threshold: 0 },
    )
    blockers.forEach((b) => io.observe(b))
    const update = () => setShow(window.scrollY > window.innerHeight * 0.85 && !blocked)
    window.addEventListener('scroll', update, { passive: true })
    update()
    return () => {
      io.disconnect()
      window.removeEventListener('scroll', update)
    }
  }, [])

  return (
    <a href={homeLinks.app} className={styles.card} data-show={show} aria-hidden={!show} tabIndex={show ? 0 : -1}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={styles.badge} src="/brand/housefi-logo-256.webp" alt="" width={46} height={46} />
      <span className={styles.text}>
        <span className={styles.small}>Book in the app</span>
        <span className={styles.big}>Get Housefi</span>
      </span>
      <ArrowUpRight className={styles.arrow} size={20} aria-hidden="true" />
    </a>
  )
}
