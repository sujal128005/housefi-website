import type { Metadata } from 'next'
import { LegalPage } from '@/components/layout/LegalPage'

export const metadata: Metadata = { title: 'Terms of use', alternates: { canonical: '/terms/' } }

export default function Terms() {
  return (
    <LegalPage title="Terms of use">
      <p>This website introduces Housefi. Services are booked and provided through the Housefi app, under the terms shown in the app.</p>
    </LegalPage>
  )
}
