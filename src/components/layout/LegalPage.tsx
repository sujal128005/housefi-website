import Link from 'next/link'
// Placeholder legal pages. The final documents come from Housefi; until then the page says so plainly.
import styles from './LegalPage.module.css'

export function LegalPage({ title, children }: { readonly title: string; readonly children: React.ReactNode }) {
  return (
    <article className={styles.page} data-header-theme="light">
      <div className="container">
        <p className="eyebrow">Legal</p>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.notice}>
          <strong>Draft placeholder.</strong> The final {title.toLowerCase()} will be published here before launch.
        </p>
        <div className={styles.body}>{children}</div>
        <p>
          <Link href="/" className={styles.back}>
            ← Back to the home page
          </Link>
        </p>
      </div>
    </article>
  )
}
