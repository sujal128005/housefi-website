import type { ComponentProps, ReactNode } from 'react'
import styles from './Button.module.css'

type Variant = 'primary' | 'light' | 'ghost' | 'ghost-light'

export function ButtonLink({ variant = 'primary', icon, children, className, ...rest }: ComponentProps<'a'> & { readonly variant?: Variant; readonly icon?: ReactNode }) {
  return (
    <a className={[styles.button, styles[variant], className].filter(Boolean).join(' ')} {...rest}>
      <span>{children}</span>
      {icon ? <span className={styles.icon} aria-hidden="true">{icon}</span> : null}
    </a>
  )
}
