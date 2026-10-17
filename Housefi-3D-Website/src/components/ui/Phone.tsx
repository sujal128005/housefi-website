// A phone mock-up that shows real Housefi app screens. Several screens stack and cross-fade via `data-active`.
import type { CSSProperties } from 'react'
import styles from './Phone.module.css'

export function Phone({ screens, active = 0, alt, className, style }: {
  readonly screens: readonly string[]
  readonly active?: number
  /** One description per screen. */
  readonly alt: readonly string[]
  readonly className?: string
  readonly style?: CSSProperties
}) {
  return (
    <div className={[styles.phone, className].filter(Boolean).join(' ')} style={style} data-phone="">
      <div className={styles.frame}>
        <div className={styles.screen}>
          {screens.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={src} src={src} alt={alt[i] ?? ''} width={540} height={1200} loading="lazy" className={styles.shot} data-on={i === active} data-screen={i} />
          ))}
        </div>
        <span className={styles.island} aria-hidden="true" />
      </div>
    </div>
  )
}
