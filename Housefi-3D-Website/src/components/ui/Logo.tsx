// The Housefi logo (official artwork from site.logo.src), isolated in one component so it can be swapped in one
// place. If `site.logo.src` is null, a neutral monogram stands in.
import { site } from '@/content/site'
import styles from './Logo.module.css'

export function Logo({ tone = 'auto', showWordmark = true }: { readonly tone?: 'auto' | 'light' | 'dark'; readonly showWordmark?: boolean }) {
  return (
    <span className={styles.logo} data-tone={tone}>
      {site.logo.src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={site.logo.src} alt="" width={44} height={44} className={styles.mark} />
      ) : (
        <span className={styles.placeholder} data-logo="fallback" aria-hidden="true">
          h
        </span>
      )}
      {showWordmark ? <span className={styles.word}>{site.name}</span> : <span className="sr-only">{site.name}</span>}
    </span>
  )
}
