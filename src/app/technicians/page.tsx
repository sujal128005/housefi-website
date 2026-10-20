import type { Metadata } from 'next'
import Image from 'next/image'
import { StoreButtons } from '@/components/ui/StoreButtons'
import { joinBenefits, joinFaq, joinHero, joinNeeds, joinSteps } from '@/content/technicians'
import styles from './Join.module.css'

export const metadata: Metadata = {
  title: 'Become a Housefi technician',
  description: 'Plumbers, electricians, AC and appliance technicians, cleaners and carpenters in Hyderabad: join Housefi, get jobs near you, and get paid every week.',
  alternates: { canonical: '/technicians/' },
}

export default function BecomeATechnician() {
  return (
    <>
      <section className={`${styles.hero} on-blue`} data-header-theme="dark" aria-labelledby="join-title">
        <div className={`container ${styles.heroGrid}`}>
          <div>
            <p className={styles.eyebrow}>{joinHero.eyebrow}</p>
            <h1 id="join-title" className={styles.title}>{joinHero.title}</h1>
            <p className={styles.lead}>{joinHero.lead}</p>
            <div className={styles.cta}>
              <StoreButtons tone="light" />
              <p className={styles.ctaNote}>In the app, choose <strong>&ldquo;I&apos;m a technician&rdquo;</strong>.</p>
            </div>
          </div>
          <div className={styles.heroArt} aria-hidden="true">
            <Image src="/illustrations/scooter.webp" alt="" width={360} height={360} priority />
          </div>
        </div>
      </section>

      <section className={styles.section} data-header-theme="light" aria-labelledby="join-how">
        <div className="container">
          <p className="eyebrow">How to join</p>
          <h2 id="join-how" className={styles.h2}>Four steps, all in the app</h2>
          <ol className={styles.steps}>
            {joinSteps.map((s, i) => (
              <li key={s.title} className={styles.step}>
                <span className={styles.stepNo}>{i + 1}</span>
                <Image src={s.art} alt="" width={72} height={72} />
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className={`${styles.section} ${styles.tint}`} data-header-theme="light" aria-labelledby="join-why">
        <div className="container">
          <p className="eyebrow">Why Housefi</p>
          <h2 id="join-why" className={styles.h2}>Built for the people who do the work</h2>
          <div className={styles.benefits}>
            {joinBenefits.map((b) => (
              <article key={b.title} className={styles.benefit}>
                <Image src={b.art} alt="" width={56} height={56} />
                <div>
                  <h3>{b.title}</h3>
                  <p>{b.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section} data-header-theme="light" aria-labelledby="join-need">
        <div className={`container ${styles.needGrid}`}>
          <div>
            <p className="eyebrow">What you need</p>
            <h2 id="join-need" className={styles.h2}>Ready in a few minutes</h2>
            <ul className={styles.needs}>
              {joinNeeds.map((n) => <li key={n}>{n}</li>)}
            </ul>
          </div>
          <div className={styles.faq}>
            <h2 className={styles.h3}>Questions technicians ask</h2>
            {joinFaq.map((f) => (
              <details key={f.q} className={styles.qa}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className={`${styles.final} on-blue`} data-header-theme="dark" aria-labelledby="join-final">
        <div className="container">
          <h2 id="join-final" className={styles.h2}>Start getting jobs with Housefi</h2>
          <p className={styles.lead}>Download the app, choose &ldquo;I&apos;m a technician&rdquo; and finish your profile.</p>
          <StoreButtons tone="light" />
        </div>
      </section>
    </>
  )
}
