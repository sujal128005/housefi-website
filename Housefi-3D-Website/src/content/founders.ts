// The founders of Housefi, as provided by Housefi. Only these facts are shown: name, role, photo and links.
export interface Founder {
  readonly name: string
  readonly role: string
  readonly photo: string
  readonly links: readonly { readonly kind: 'linkedin' | 'website'; readonly label: string; readonly href: string }[]
}

export const founders: readonly Founder[] = [
  {
    name: 'Navya Made',
    role: 'Co-founder',
    photo: '/founders/navya-made.webp',
    links: [{ kind: 'linkedin', label: 'LinkedIn', href: 'https://www.linkedin.com/in/navya-made-7236b633a/' }],
  },
  {
    name: 'Sujal Negi',
    role: 'Co-founder',
    photo: '/founders/sujal-negi.webp',
    links: [
      { kind: 'linkedin', label: 'LinkedIn', href: 'https://www.linkedin.com/in/sujalnegi128005' },
      { kind: 'website', label: 'Portfolio', href: 'https://sujalnegi.tech/' },
    ],
  },
]
