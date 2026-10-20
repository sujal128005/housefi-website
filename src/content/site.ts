// Everything a non-developer may need to change lives here: brand words, logo, app store links, contact details and
// social profiles. A value set to `null` is "not provided yet": the site hides it or shows a clearly marked
// placeholder instead of inventing one.

export const site = {
  name: 'Housefi',
  /** Parent brand shown in the footer and About section (from the Housefi app). */
  by: 'Nexara9',
  byUrl: 'https://nexara9.me/' as string | null,
  tagline: 'Home Help, Made Easy.',
  description:
    'Housefi brings plumbing, electrical, AC, appliance, cleaning and carpentry help to your door through one simple app. You see the quote and approve it before any work starts.',
  /** Public URL of the site, used for canonical links and the sitemap. Set NEXT_PUBLIC_SITE_URL when deploying. */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://housefi.example',

  /**
   * The official Housefi logo (public/brand/housefi-logo.png, cut from the supplied artwork). Set to `null` to show
   * the neutral monogram fallback instead.
   */
  logo: { src: '/brand/housefi-logo.png' as string | null, alt: 'Housefi' },

  /**
   * App store links. Leave `null` until the real listings exist: the buttons then show "Coming soon" and are not
   * links. Never put a guessed URL here.
   */
  appLinks: {
    googlePlay: null as string | null,
    appStore: null as string | null,
  },

  /** Contact details. `null` shows "To be announced". */
  contact: {
    email: null as string | null,
    phone: null as string | null,
    /** Shown as plain text. */
    hours: null as string | null,
    address: null as string | null,
  },

  /** Social profiles. Only the ones with a URL are shown. */
  social: {
    instagram: null as string | null,
    x: null as string | null,
    linkedin: null as string | null,
    youtube: null as string | null,
    facebook: null as string | null,
  },
} as const

export type Site = typeof site

/** Main navigation (in-page sections). */
// "/#…" so the links also work from the other pages (on the home page they just scroll).
export const nav = [
  { href: '/#services', label: 'Services' },
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/#why-housefi', label: 'Why Housefi' },
  { href: '/#app', label: 'The app' },
  { href: '/#about', label: 'About' },
  { href: '/founders/', label: 'Founders' },
  { href: '/technicians/', label: 'For technicians' },
  { href: '/#contact', label: 'Contact' },
] as const
