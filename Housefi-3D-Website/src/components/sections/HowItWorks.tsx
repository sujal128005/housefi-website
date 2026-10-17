'use client'
// How Housefi works: five steps of the app's customer journey. On wide screens the section pins while a tilted
// phone shows the matching app screen for each step and a rail fills; elsewhere the steps are a simple list.
import { useRef, useState, type CSSProperties } from 'react'
import { steps } from '@/content/copy'
import { Phone } from '../ui/Phone'
import { gsap, ScrollTrigger } from '../motion/gsap'
import { useScrollScene } from '../motion/useScrollScene'
import styles from './HowItWorks.module.css'

export function HowItWorks() {
  const ref = useRef<HTMLElement>(null)
  const [active, setActive] = useState(0)

  useScrollScene(ref, (el) => {
    // Curtain: the section rises over the previous one with rounded corners that flatten.
    gsap.fromTo(el.querySelector('[data-curtain]'), { borderTopLeftRadius: 64, borderTopRightRadius: 64, scale: 0.94 }, {
      borderTopLeftRadius: 0, borderTopRightRadius: 0, scale: 1, ease: 'none',
      scrollTrigger: { trigger: el, start: 'top bottom', end: 'top top', scrub: true },
    })
    const mm = gsap.matchMedia()
    mm.add('(min-width: 1024px)', () => {
      const phone = el.querySelector<HTMLElement>('[data-phone] > div')
      const fill = el.querySelector<HTMLElement>('[data-rail-fill]')
      const st = ScrollTrigger.create({
        trigger: el.querySelector('[data-pin]'),
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.6,
        onUpdate: (self) => {
          const p = self.progress
          setActive(Math.min(steps.length - 1, Math.floor(p * steps.length)))
          if (fill) fill.style.transform = `scaleY(${p})`
          if (phone) {
            phone.style.setProperty('--ry', `${-22 + p * 30}deg`)
            phone.style.setProperty('--rx', `${8 - p * 6}deg`)
            phone.style.setProperty('--rz', `${3 - p * 4}deg`)
          }
        },
      })
      return () => st.kill()
    })
    // On narrow screens (no pin) the steps rise in; on wide screens the pinned highlight does the work.
    mm.add('(max-width: 1023px)', () => {
      gsap.from(el.querySelectorAll('[data-step-card]'), {
        y: 40, opacity: 0, stagger: 0.08, duration: 0.9, ease: 'expo.out',
        scrollTrigger: { trigger: el.querySelector('[data-steps]'), start: 'top 80%', toggleActions: 'play none none reverse' },
      })
    })
    return () => mm.revert()
  })

  return (
    <section ref={ref} id="how-it-works" className={styles.section} data-header-theme="dark" aria-labelledby="how-title">
      <div className={`${styles.curtain} on-blue`} data-curtain>
        <div className={styles.pin} data-pin style={{ '--steps': steps.length } as CSSProperties}>
          <div className={styles.sticky}>
            <div className={`container ${styles.grid}`}>
              <div className={styles.copy}>
                <p className="eyebrow">How it works</p>
                <h2 id="how-title" className={`section-title ${styles.title}`}>
                  From &ldquo;something&rsquo;s broken&rdquo; to fixed.
                </h2>
                <ol className={styles.steps} data-steps>
                  <span className={styles.rail} aria-hidden="true">
                    <span className={styles.railFill} data-rail-fill />
                  </span>
                  {steps.map((s, i) => (
                    <li key={s.title} className={styles.step} data-step-card data-on={i === active}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img className={styles.stepArt} src={s.art} alt="" width={360} height={360} loading="lazy" />
                      <div>
                        <p className={styles.stepNo}>Step {i + 1}</p>
                        <h3 className={styles.stepTitle}>{s.title}</h3>
                        <p className={styles.stepBody}>{s.body}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
              <div className={styles.visual}>
                <div className={styles.halo} aria-hidden="true" />
                <Phone
                  className={styles.phone}
                  screens={steps.map((s) => s.screen)}
                  alt={steps.map((s) => `Housefi app screen: ${s.title}`)}
                  active={active}
                />
                <p className={styles.note}>Screens from the Housefi app preview.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
