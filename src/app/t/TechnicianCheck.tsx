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
  /** Trades Housefi verified (empty unless active). Older API versions leave these out. */
  readonly verifiedSkills?: readonly string[]
  readonly certifications?: readonly Certificate[]
  /** The Skill Passport, only when the technician switched it on and is active. */
  readonly passport?: Passport | null
}

interface Certificate {
  readonly kind: 'ITI' | 'SKILL_INDIA' | 'OTHER' | 'HOUSEFI_COURSE'
  readonly title: string
}

interface Passport {
  readonly memberSince: number
  readonly experienceYears: number
  readonly city: string
  readonly level: 'UNSKILLED' | 'SEMI_SKILLED' | 'SKILLED' | 'HIGHLY_SKILLED' | null
  readonly jobsDone: number
  readonly rating: number | null
  readonly ratingCount: number
  readonly trades: readonly { readonly categoryId: string; readonly provenBy: 'EXAM' | 'VIDEO' | 'HQ' | 'EARLIER'; readonly examPoints: number | null; readonly examMaxPoints: number | null }[]
  readonly courses: readonly { readonly title: string; readonly at: number }[]
  readonly certificates: readonly Certificate[]
}

const TRADE: Record<string, string> = {
  PLUMBING: 'Plumbing',
  ELECTRICAL: 'Electrical',
  AC: 'AC service',
  APPLIANCES: 'Appliances',
  CLEANING: 'Cleaning',
  CARPENTRY: 'Carpentry',
}
const tradeName = (id: string) => TRADE[id] ?? id.charAt(0) + id.slice(1).toLowerCase().replace(/_/g, ' ')

const PROOF: Record<Passport['trades'][number]['provenBy'], string> = {
  EXAM: 'Passed the Housefi skill exam',
  VIDEO: 'Work video approved by Housefi',
  HQ: 'Verified by Housefi',
  EARLIER: 'Verified by Housefi',
}

const LEVEL: Record<NonNullable<Passport['level']>, string> = {
  UNSKILLED: 'New (learning)',
  SEMI_SKILLED: 'Semi-skilled',
  SKILLED: 'Skilled',
  HIGHLY_SKILLED: 'Highly skilled',
}

const CERT: Record<Certificate['kind'], string> = { ITI: 'ITI', SKILL_INDIA: 'Skill India', OTHER: 'Certificate', HOUSEFI_COURSE: 'Housefi course' }

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
      {r.active && r.passport ? (
        <PassportCard p={r.passport} />
      ) : r.active && (r.verifiedSkills?.length || r.certifications?.length) ? (
        <section className={styles.section} aria-label="Verified skills">
          {r.verifiedSkills?.length ? (
            <>
              <h2 className={styles.sectionTitle}>Verified trades</h2>
              <ul className={styles.chips}>
                {r.verifiedSkills.map((s) => (
                  <li key={s} className={styles.chip}>
                    ✓ {tradeName(s)}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
          <Certificates list={r.certifications ?? []} />
        </section>
      ) : null}
    </div>
  )
}

function PassportCard({ p }: { readonly p: Passport }) {
  const since = new Date(p.memberSince).toLocaleDateString('en-IN', { month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' })
  return (
    <section className={styles.section} aria-label="Skill Passport" data-testid="skill-passport">
      <div>
        <h2 className={styles.sectionTitle}>Skill Passport</h2>
        <p className={styles.muted}>
          With Housefi since {since}
          {p.city ? ` · ${p.city}` : ''}
          {p.level ? ` · ${LEVEL[p.level]}` : ''}
        </p>
      </div>
      <dl className={styles.stats}>
        <div>
          <dt>Jobs done</dt>
          <dd>{p.jobsDone}</dd>
        </div>
        <div>
          <dt>{p.rating !== null ? `${p.ratingCount} ratings` : 'Rating'}</dt>
          <dd>{p.rating !== null ? `★ ${p.rating.toFixed(1)}` : 'New'}</dd>
        </div>
        <div>
          <dt>Years of work</dt>
          <dd>{p.experienceYears}</dd>
        </div>
      </dl>
      {p.trades.length ? (
        <>
          <h3 className={styles.subTitle}>Proven trades</h3>
          <ul className={styles.lines}>
            {p.trades.map((t) => (
              <li key={t.categoryId}>
                <span className={styles.tick} aria-hidden="true">
                  ✓
                </span>
                <span>
                  <strong>{tradeName(t.categoryId)}</strong>
                  <span className={styles.muted}>
                    {' · '}
                    {PROOF[t.provenBy]}
                    {t.examPoints !== null && t.examMaxPoints ? ` (score ${t.examPoints}/${t.examMaxPoints})` : ''}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : null}
      {p.courses.length ? (
        <>
          <h3 className={styles.subTitle}>Housefi courses completed</h3>
          <ul className={styles.lines}>
            {p.courses.map((c, i) => (
              <li key={`${c.title}-${i}`}>
                <span className={styles.tick} aria-hidden="true">
                  ✓
                </span>
                <span>{c.title}</span>
              </li>
            ))}
          </ul>
        </>
      ) : null}
      <Certificates list={p.certificates} />
      <p className={styles.note}>Shared by the technician. Housefi checked every item here. No phone number or address is shown.</p>
    </section>
  )
}

function Certificates({ list }: { readonly list: readonly Certificate[] }) {
  if (!list.length) return null
  return (
    <>
      <h3 className={styles.subTitle}>Certificates checked by Housefi</h3>
      <ul className={styles.chips}>
        {list.map((c, i) => (
          <li key={`${c.kind}-${i}`} className={styles.chip}>
            {c.title || CERT[c.kind]}
          </li>
        ))}
      </ul>
    </>
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
