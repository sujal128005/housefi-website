'use client'
import { useEffect, useRef, useState } from 'react'
import buttons from '../../components/ui/Button.module.css'
import styles from '../t/TechnicianCheck.module.css'

const CHECKOUT_JS = 'https://checkout.razorpay.com/v1/checkout.js'

interface Order {
  readonly key: string
  readonly orderId: string
  /** Paise. */
  readonly amount: number
  readonly description: string
  /** Where the result goes: the Housefi app's link. */
  readonly returnUrl: string
}

interface RazorpaySuccess {
  readonly razorpay_payment_id: string
  readonly razorpay_order_id: string
  readonly razorpay_signature: string
}

interface RazorpayInstance {
  open(): void
  on(event: 'payment.failed', handler: () => void): void
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance
  }
}

/**
 * Only the Housefi app may receive the result: its own link (housefi://), Expo Go during development (exp://, exps://),
 * or the web preview on this site or a local computer.
 */
export function safeReturnUrl(raw: string | null): string | null {
  if (!raw) return null
  try {
    const u = new URL(raw)
    if (u.protocol === 'housefi:' || u.protocol === 'exp:' || u.protocol === 'exps:') return raw
    if (u.protocol === 'https:' && (u.hostname === 'housefi.tech' || u.hostname.endsWith('.housefi.tech'))) return raw
    if (u.protocol === 'http:' && (u.hostname === 'localhost' || u.hostname === '127.0.0.1')) return raw
  } catch {
    return null
  }
  return null
}

export function readOrder(hash: string): Order | null {
  const p = new URLSearchParams(hash.replace(/^#/, ''))
  const key = p.get('k') ?? ''
  const orderId = p.get('o') ?? ''
  const amount = Number(p.get('a'))
  const returnUrl = safeReturnUrl(p.get('r'))
  if (!/^rzp_(test|live)_[A-Za-z0-9]+$/.test(key) || !/^order_[A-Za-z0-9]+$/.test(orderId) || !Number.isInteger(amount) || amount <= 0 || !returnUrl) return null
  return { key, orderId, amount, description: (p.get('d') ?? 'Housefi booking').slice(0, 80), returnUrl }
}

function back(order: Order, params: Record<string, string>): void {
  const sep = order.returnUrl.includes('?') ? '&' : '?'
  window.location.replace(`${order.returnUrl}${sep}${new URLSearchParams(params).toString()}`)
}

type State = { readonly kind: 'loading' } | { readonly kind: 'invalid' } | { readonly kind: 'offline' } | { readonly kind: 'open' } | { readonly kind: 'returning' }

export function PayCheckout() {
  const [state, setState] = useState<State>({ kind: 'loading' })
  const [shown, setShown] = useState<Order | null>(null)
  const order = useRef<Order | null>(null)

  const open = () => {
    const o = order.current
    if (!o || !window.Razorpay) return
    const rzp = new window.Razorpay({
      key: o.key,
      order_id: o.orderId,
      amount: o.amount,
      currency: 'INR',
      name: 'Housefi',
      description: o.description,
      theme: { color: '#0A3CFD' },
      // UPI apps return to the browser by themselves; the result then comes through the handler.
      handler: (r: RazorpaySuccess) => {
        setState({ kind: 'returning' })
        back(o, { status: 'paid', oid: r.razorpay_order_id, pid: r.razorpay_payment_id, sig: r.razorpay_signature })
      },
      modal: {
        confirm_close: true,
        ondismiss: () => {
          setState({ kind: 'returning' })
          back(o, { status: 'dismissed' })
        },
      },
    })
    rzp.open()
    setState({ kind: 'open' })
  }

  useEffect(() => {
    const o = readOrder(window.location.hash)
    if (!o) {
      void Promise.resolve().then(() => setState({ kind: 'invalid' }))
      return
    }
    order.current = o
    void Promise.resolve().then(() => setShown(o))
    if (window.Razorpay) {
      open()
      return
    }
    const s = document.createElement('script')
    s.src = CHECKOUT_JS
    s.async = true
    s.onload = () => open()
    s.onerror = () => setState({ kind: 'offline' })
    document.body.appendChild(s)
    // open() only reads refs and the global checkout.
  }, [])

  const amount = shown ? `₹${(shown.amount / 100).toLocaleString('en-IN')}` : ''
  return (
    <article className={styles.page} data-header-theme="light">
      <div className="container">
        <p className="eyebrow">Secure payment</p>
        <h1 className={styles.title}>{amount ? `Pay ${amount} to Housefi` : 'Pay Housefi'}</h1>
        <div className={styles.card} aria-live="polite">
          {state.kind === 'loading' ? <p className={styles.muted}>Opening Razorpay…</p> : null}
          {state.kind === 'returning' ? <p className={styles.muted}>Returning to the Housefi app…</p> : null}
          {state.kind === 'open' ? (
            <>
              <p className={styles.muted}>Complete the payment in the Razorpay window. UPI apps, cards and net banking are supported.</p>
              <p><button type="button" className={`${buttons.button} ${buttons.primary}`} onClick={open}><span>Open payment again</span></button></p>
            </>
          ) : null}
          {state.kind === 'invalid' ? (
            <p className={styles.muted}>This payment link is incomplete. Go back to the Housefi app and tap Pay again.</p>
          ) : null}
          {state.kind === 'offline' ? (
            <p className={styles.muted}>Couldn&apos;t reach Razorpay. Check your internet connection, then go back to the Housefi app and tap Pay again.</p>
          ) : null}
        </div>
        <ul className={styles.tips}>
          <li>Payments are processed by Razorpay. Housefi never sees your card or UPI details.</li>
          <li>You are charged only after you approve the payment in your UPI app or bank page.</li>
        </ul>
      </div>
    </article>
  )
}
