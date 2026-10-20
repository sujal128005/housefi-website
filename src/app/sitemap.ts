import type { MetadataRoute } from 'next'
import { site } from '@/content/site'

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  return ['/', '/technicians/', '/founders/', '/privacy/', '/terms/'].map((path) => ({ url: new URL(path, site.url).toString(), changeFrequency: 'monthly' }))
}
