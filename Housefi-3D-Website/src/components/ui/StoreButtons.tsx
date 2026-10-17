// App store buttons. URLs come from src/content/site.ts; without a URL the button is a clearly labelled
// "Coming soon" placeholder that is not a link.
import { Play, Smartphone } from 'lucide-react'
import { site } from '@/content/site'
import styles from './StoreButtons.module.css'

const STORES = [
  { key: 'googlePlay', label: 'Google Play', small: 'Get it on', icon: Play },
  { key: 'appStore', label: 'App Store', small: 'Download on the', icon: Smartphone },
] as const

export function StoreButtons({ tone = 'dark' }: { readonly tone?: 'dark' | 'light' }) {
  return (
    <ul className={styles.list} data-tone={tone}>
      {STORES.map(({ key, label, small, icon: Icon }) => {
        const url = site.appLinks[key]
        const content = (
          <>
            <Icon className={styles.icon} aria-hidden="true" size={22} strokeWidth={2.2} />
            <span className={styles.text}>
              <span className={styles.small}>{url ? small : 'Coming soon'}</span>
              <span className={styles.label}>{label}</span>
            </span>
          </>
        )
        return (
          <li key={key}>
            {url ? (
              <a className={styles.store} href={url} target="_blank" rel="noopener noreferrer">
                {content}
              </a>
            ) : (
              <span className={styles.store} data-pending="true" aria-label={`${label}: coming soon`}>
                {content}
              </span>
            )}
          </li>
        )
      })}
    </ul>
  )
}
