import Link from 'next/link'
// Contact details, links and the closing word mark. Anything not provided in src/content/site.ts is marked
// "To be announced" instead of being made up.
import { site, nav } from '@/content/site'
import { Logo } from '../ui/Logo'
import { StoreButtons } from '../ui/StoreButtons'
import { Reveal } from '../motion/Reveal'
import styles from './Footer.module.css'

const SOCIAL_LABELS: Record<keyof typeof site.social, string> = {
  instagram: 'Instagram',
  x: 'X',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
  facebook: 'Facebook',
}

function Pending() {
  return <span className={styles.pending}>To be announced</span>
}

export function Footer() {
  const socials = (Object.keys(site.social) as (keyof typeof site.social)[]).filter((k) => site.social[k])
  const year = new Date().getFullYear()
  return (
    <footer id="contact" className={styles.footer} data-header-theme="light" data-hide-floating-cta>
      <div className="container">
        <div className={styles.top}>
          <Reveal className={styles.lead}>
            <p className="eyebrow">Contact</p>
            <h2 className={styles.title}>Talk to Housefi.</h2>
            <p className={styles.sub}>For help with a booking, use the support options inside the app.</p>
          </Reveal>
          <Reveal className={styles.contact} delay={0.1}>
            <dl>
              <div>
                <dt>Email</dt>
                <dd>{site.contact.email ? <a href={`mailto:${site.contact.email}`}>{site.contact.email}</a> : <Pending />}</dd>
              </div>
              <div>
                <dt>Phone</dt>
                <dd>{site.contact.phone ? <a href={`tel:${site.contact.phone.replace(/\s/g, '')}`}>{site.contact.phone}</a> : <Pending />}</dd>
              </div>
              <div>
                <dt>Hours</dt>
                <dd>{site.contact.hours ?? <Pending />}</dd>
              </div>
              <div>
                <dt>Address</dt>
                <dd>{site.contact.address ?? <Pending />}</dd>
              </div>
            </dl>
          </Reveal>
        </div>

        <div className={styles.grid}>
          <div className={styles.brandCol}>
            <Logo tone="dark" />
            <p className={styles.tagline}>{site.tagline}</p>
            <StoreButtons />
          </div>
          <nav aria-label="Footer" className={styles.col}>
            <h3>Explore</h3>
            <ul>
              {nav.map((n) => (
                <li key={n.href}>
                  <a href={n.href}>{n.label}</a>
                </li>
              ))}
            </ul>
          </nav>
          <div className={styles.col}>
            <h3>Legal</h3>
            <ul>
              <li>
                <Link href="/privacy/" prefetch={false}>Privacy policy</Link>
              </li>
              <li>
                <Link href="/terms/" prefetch={false}>Terms of use</Link>
              </li>
            </ul>
          </div>
          <div className={styles.col}>
            <h3>Follow</h3>
            {socials.length ? (
              <ul>
                {socials.map((k) => (
                  <li key={k}>
                    <a href={site.social[k] ?? undefined} target="_blank" rel="noopener noreferrer">
                      {SOCIAL_LABELS[k]}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p>
                <Pending />
              </p>
            )}
          </div>
        </div>

        <div className={styles.bottom}>
          <p>
            © {year} {site.name}
            {site.byUrl ? (
              <>
                {' '}by{' '}
                <a href={site.byUrl} target="_blank" rel="noopener noreferrer">
                  {site.by}
                </a>
              </>
            ) : (
              ` by ${site.by}`
            )}
          </p>
          <p>Illustrations: Housefi.</p>
        </div>
      </div>
      <div className={styles.word} aria-hidden="true" data-footer-word>
        Let&rsquo;s make it home.
      </div>
    </footer>
  )
}
