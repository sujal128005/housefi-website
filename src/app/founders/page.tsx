import type { Metadata } from 'next'
import { Founders } from '@/components/sections/Founders'

export const metadata: Metadata = {
  title: 'Founders',
  description: 'The people behind Housefi.',
  alternates: { canonical: '/founders/' },
}

export default function FoundersPage() {
  return <Founders page />
}
