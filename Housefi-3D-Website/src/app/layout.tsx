import type { Metadata, Viewport } from 'next'
import '@fontsource-variable/anek-latin/wdth.css'
import './globals.css'
import { site } from '@/content/site'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { FloatingCta } from '@/components/layout/FloatingCta'

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name}: ${site.tagline}`, template: `%s · ${site.name}` },
  description: site.description,
  applicationName: site.name,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: site.name,
    title: `${site.name}: Your Home. Our Responsibility.`,
    description: site.description,
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Housefi' }],
  },
  twitter: { card: 'summary_large_image', title: `${site.name}: Your Home. Our Responsibility.`, description: site.description, images: ['/og.png'] },
  icons: {
    icon: [{ url: '/favicon.ico', sizes: 'any' }, { url: '/favicon.png', type: 'image/png', sizes: '64x64' }],
    apple: '/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#1746E8',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <Header />
        <div className="top-blur" aria-hidden="true" />
        <main id="main">{children}</main>
        <Footer />
        <FloatingCta />
      </body>
    </html>
  )
}
