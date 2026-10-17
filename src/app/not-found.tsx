import Link from 'next/link'
import styles from '@/components/layout/LegalPage.module.css'

export default function NotFound() {
  return (
    <article className={styles.page} data-header-theme="light">
      <div className="container">
        <p className="eyebrow">404</p>
        <h1 className={styles.title}>This page is not here.</h1>
        <p className={styles.body}>The link may be old, or the address mistyped.</p>
        <p>
          <Link href="/" className={styles.back}>
            ← Back to the home page
          </Link>
        </p>
      </div>
    </article>
  )
}
