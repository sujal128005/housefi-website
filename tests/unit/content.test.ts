import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { site } from '@/content/site'
import { services } from '@/content/services'
import * as copy from '@/content/copy'
import * as technicians from '@/content/technicians'

const publicFile = (p: string) => join(process.cwd(), 'public', p)

describe('site configuration', () => {
  it('has no guessed store, contact or social links', () => {
    const urls = [...Object.values(site.appLinks), ...Object.values(site.social)]
    for (const u of urls) expect(u === null || /^https:\/\//.test(u)).toBe(true)
    // Until real listings exist the values stay null; this guards against placeholder URLs slipping in.
    for (const u of urls) if (u) expect(u).not.toMatch(/example|placeholder|xxx/i)
  })

  it('points the logo at a file that exists, if set', () => {
    if (site.logo.src) expect(existsSync(publicFile(site.logo.src))).toBe(true)
  })
})

describe('content', () => {
  it('lists the six Housefi service categories with their artwork', () => {
    expect(services.map((s) => s.name)).toEqual(['Plumbing', 'Electrical', 'AC Repair', 'Appliances', 'Cleaning', 'Carpentry'])
    for (const s of services) expect(existsSync(publicFile(s.art)), s.art).toBe(true)
  })

  it('uses only images that exist', () => {
    for (const s of copy.steps) {
      expect(existsSync(publicFile(s.art)), s.art).toBe(true)
      expect(existsSync(publicFile(s.screen)), s.screen).toBe(true)
    }
    for (const c of copy.why.cards) expect(existsSync(publicFile(c.art)), c.art).toBe(true)
    for (const x of [...technicians.joinSteps, ...technicians.joinBenefits]) expect(existsSync(publicFile(x.art)), x.art).toBe(true)
  })

  it('makes no unverified claims (prices, counts, ratings, guarantees, certifications)', () => {
    const text = JSON.stringify(copy) + JSON.stringify(services) + JSON.stringify(technicians) + site.description
    expect(text).not.toMatch(/₹|\brs\.?\s?\d|\$\d/i)
    expect(text).not.toMatch(/\d[\d,.]*\s*(\+|k\b|customers|users|homes|technicians|cities|ratings?|reviews?)/i)
    expect(text).not.toMatch(/guarantee|certified|award|best in|#1|number one|insured/i)
    expect(text).not.toMatch(/\d(\.\d)?\s*(stars?|★)/i)
  })
})

describe('founders', async () => {
  const { founders } = await import('@/content/founders')
  it('have a photo and only https links', () => {
    expect(founders.map((f) => f.name)).toEqual(['Navya Made', 'Sujal Negi'])
    for (const f of founders) {
      expect(existsSync(publicFile(f.photo)), f.photo).toBe(true)
      for (const l of f.links) expect(l.href).toMatch(/^https:\/\//)
    }
  })
})
