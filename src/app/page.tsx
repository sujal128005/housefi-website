import { Journey } from '@/components/sections/Journey'
import { HowItWorks } from '@/components/sections/HowItWorks'
import { WhyHousefi } from '@/components/sections/WhyHousefi'
import { AppPromo } from '@/components/sections/AppPromo'
import { About } from '@/components/sections/About'
import { Faq } from '@/components/sections/Faq'
import { site } from '@/content/site'

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: site.name,
  url: site.url,
  slogan: site.tagline,
  description: site.description,
}

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Journey />
      <HowItWorks />
      <WhyHousefi />
      <AppPromo />
      <About />
      <Faq />
    </>
  )
}
