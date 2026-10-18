import type { Metadata } from 'next'
import { TechnicianCheck } from './TechnicianCheck'

// The target of the QR code on every Housefi Technician ID card: https://housefi.tech/t/#<token>.
// The token sits after "#", so it never reaches any server or its logs; the page reads it in the browser and asks
// the Housefi API for the technician's status right now.
export const metadata: Metadata = {
  title: 'Verify a Housefi technician',
  description: 'Scan the QR code on a Housefi Technician ID card to check that the technician is verified and working for Housefi right now.',
  alternates: { canonical: '/t/' },
  robots: { index: false, follow: false },
}

export default function VerifyTechnicianPage() {
  return <TechnicianCheck />
}
