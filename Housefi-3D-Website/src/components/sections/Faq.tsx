// Common questions, answered from how the Housefi app works today. Native <details> elements: keyboard and screen
// reader friendly, and they work without JavaScript.
import { Plus } from 'lucide-react'
import { faq } from '@/content/copy'
import { Reveal } from '../motion/Reveal'
import styles from './Faq.module.css'

export function Faq() {
  return (
    <section id="faq" className={styles.section} data-header-theme="light" aria-labelledby="faq-title">
      <div className={`container ${styles.grid}`}>
        <Reveal>
          <p className="eyebrow">Questions</p>
          <h2 id="faq-title" className={`section-title ${styles.title}`}>
            Good to know.
          </h2>
        </Reveal>
        <div className={styles.list}>
          {faq.map((f, i) => (
            <Reveal key={f.q} delay={i * 0.04} y={20}>
              <details className={styles.item} name="faq">
                <summary className={styles.q}>
                  <span>{f.q}</span>
                  <Plus className={styles.icon} size={20} aria-hidden="true" />
                </summary>
                <p className={styles.a}>{f.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
