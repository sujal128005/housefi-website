'use client'
import { useEffect, useState } from 'react'
import styles from './TechnicianCheck.module.css'

/** The Housefi API (set NEXT_PUBLIC_HOUSEFI_API_URL at build time for a staging API). */
const API = process.env.NEXT_PUBLIC_HOUSEFI_API_URL ?? 'https://api.housefi.tech'
const TOKEN = /^[A-Za-z0-9]{24}$/

interface Result {
  readonly techCode: string
  readonly displayName: string
  readonly photo: string | null
  readonly gender: 'M' | 'F'
  readonly verification: 'PENDING' | 'APPROVED' | 'NEEDS_CORRECTION' | 'REJECTED' | 'SUSPENDED'
  readonly simulated: boolean
  readonly active: boolean
  readonly checkedAt: number
}

type State =
  | { readonly kind: 'checking' }
  | { readonly kind: 'no-token' }
  | { readonly kind: 'unknown' }
  | { readonly kind: 'offline' }
  | { readonly kind: 'done'; readonly result: Result }

const STATUS: Record<Result['verification'], string> = {
  APPROVED: 'Verified',
  PENDING: 'Verification in progress',
  NEEDS_CORRECTION: 'Verification in progress',
  REJECTED: 'Not verified',
  SUSPENDED: 'Suspended',
}

export function TechnicianCheck() {
  const [state, setState] = useState<State>({ kind: 'checking' })

  useEffect(() => {
    let ctrl: AbortController | null = null
    // Checks the token in the address; again whenever it changes (a second card scanned into the same tab).
    const check = () => {
      ctrl?.abort()
      const token = window.location.hash.replace(/^#/, '')
      if (!TOKEN.test(token)) {
        void Promise.resolve().then(() => setState({ kind: 'no-token' }))
        return
      }
      const mine = new AbortController()
      ctrl = mine
      void Promise.resolve().then(() => setState({ kind: 'checking' }))
      const timer = setTimeout(() => mine.abort(), 12_000)
      fetch(`${API}/v1/verify/technicians/${token}`, { signal: mine.signal, cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer' })
        .then(async (res) => {
          if (mine !== ctrl) return
          if (res.status === 404) return setState({ kind: 'unknown' })
          if (!res.ok) return setState({ kind: 'offline' })
          const result = (await res.json()) as Result
          if (mine === ctrl) setState({ kind: 'done', result })
        })
        .catch(() => {
          if (mine === ctrl) setState({ kind: 'offline' })
        })
        .finally(() => clearTimeout(timer))
    }
    check()
    window.addEventListener('hashchange', check)
    return () => {
      window.removeEventListener('hashchange', check)
      ctrl?.abort()
    }
  }, [])

  return (
    <article className={styles.page} data-header-theme="light">
      <div className="container">
        <p className="eyebrow">Technician ID check</p>
        <h1 className={styles.title}>Is this a Housefi technician?</h1>
        <div className={styles.card} aria-live="polite">
          {state.kind === 'checking' ? <p className={styles.muted}>Checking with Housefi…</p> : null}
          {state.kind === 'no-token' ? (
            <Verdict tone="warn" title="Scan the QR code on the ID card">
              Open your phone camera and point it at the QR code on the technician&apos;s Housefi ID card (in their Housefi app). This page opens with the result.
            </Verdict>
          ) : null}
          {state.kind === 'unknown' ? (
            <Verdict tone="bad" title="Not a valid Housefi ID">
              This QR code does not belong to any Housefi technician, or it was replaced. Do not share your arrival code, and contact Housefi support from your app.
            </Verdict>
          ) : null}
          {state.kind === 'offline' ? (
            <Verdict tone="warn" title="Could not check right now">
              Check your internet connection and scan again. You can also see your technician&apos;s details in your Housefi app under the booking.
            </Verdict>
          ) : null}
          {state.kind === 'done' ? <ResultCard r={state.result} /> : null}
        </div>
        <ul className={styles.tips}>
          <li>Match the face and the Technician ID with the person at your door, and with the technician shown in your Housefi app.</li>
          <li>Share your 4-digit arrival code only after it matches. Housefi never asks for it on a call.</li>
        </ul>
      </div>
    </article>
  )
}

function ResultCard({ r }: { readonly r: Result }) {
  // The photo link is short-lived; if it cannot load, the initial shows instead of a broken image.
  const [photoFailed, setPhotoFailed] = useState(false)
  const checked = new Date(r.checkedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' })
  return (
    <div className={styles.result}>
      <div className={styles.person}>
        {r.photo && !photoFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className={styles.photo} src={r.photo} alt={`Photo of ${r.displayName}`} width={112} height={112} referrerPolicy="no-referrer" onError={() => setPhotoFailed(true)} />
        ) : (
          <div className={styles.photoEmpty} aria-hidden="true">
            {r.displayName.slice(0, 1)}
          </div>
        )}
        <div>
          <p className={styles.name}>{r.displayName}</p>
          <p className={styles.code}>{r.techCode}</p>
          {r.simulated ? <p className={styles.demo}>Housefi team demo account</p> : null}
        </div>
      </div>
      {r.active ? (
        <Verdict tone="good" title="Verified · working for Housefi now">
          Identity checked by Housefi. {STATUS[r.verification]} as of {checked} IST.
        </Verdict>
      ) : (
        <Verdict tone="bad" title={`${STATUS[r.verification]} · not working for Housefi now`}>
          Do not let this person in on Housefi&apos;s behalf. Checked {checked} IST. Contact Housefi support from your app.
        </Verdict>
      )}
    </div>
  )
}

function Verdict({ tone, title, children }: { readonly tone: 'good' | 'bad' | 'warn'; readonly title: string; readonly children: React.ReactNode }) {
  return (
    <div className={`${styles.verdict} ${styles[tone]}`} role={tone === 'bad' ? 'alert' : 'status'}>
      <span className={styles.icon} aria-hidden="true">
        {tone === 'good' ? '✓' : tone === 'bad' ? '✕' : '!'}
      </span>
      <div>
        <p className={styles.verdictTitle}>{title}</p>
        <p className={styles.verdictBody}>{children}</p>
      </div>
    </div>
  )
}
