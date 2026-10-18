import type { Metadata } from 'next'
import { PayCheckout } from './PayCheckout'

// Payment page the Housefi app opens in the phone's secure in-app browser: it runs Razorpay's checkout for the order
// the Housefi API created, then hands the result back to the app. The order travels after "#", so it never reaches any
// server log; no secret key, card or UPI detail ever passes through Housefi.
export const metadata: Metadata = {
  title: 'Pay · Housefi',
  description: 'Secure payment for your Housefi booking, by Razorpay.',
  alternates: { canonical: '/pay/' },
  robots: { index: false, follow: false },
}

export default function PayPage() {
  return <PayCheckout />
}
