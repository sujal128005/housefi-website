import type { Metadata } from 'next'
import { LegalPage } from '@/components/layout/LegalPage'

export const metadata: Metadata = { title: 'Privacy policy', alternates: { canonical: '/privacy/' } }

export default function Privacy() {
  return (
    <LegalPage title="Privacy policy">
      <p>This website does not use cookies, analytics or tracking, and it has no forms. It does not collect personal information.</p>
      <p>Bookings, accounts and payments happen in the Housefi app, which has its own privacy policy.</p>
    </LegalPage>
  )
}
