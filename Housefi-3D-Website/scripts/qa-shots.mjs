// Visual QA: opens the built site in headless Chromium and saves screenshots of the scroll sequence at chosen
// progress values, forwards and then backwards, plus every section. Output: qa/<viewport>/*.png
// Usage: node scripts/qa-shots.mjs [desktop|tablet|mobile|all] [p1,p2,...]
import { chromium } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { spawn } from 'node:child_process'

const VIEWPORTS = {
  desktop: { width: 1440, height: 900, deviceScaleFactor: 1 },
  tablet: { width: 820, height: 1180, deviceScaleFactor: 1, isMobile: true, hasTouch: true },
  mobile: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
}
const which = process.argv[2] ?? 'desktop'
const points = (process.argv[3] ?? '0,0.05,0.1,0.16,0.22,0.27,0.3,0.36,0.4,0.47,0.55,0.62,0.7,0.77,0.84,0.9,0.95,1').split(',').map(Number)
const PORT = 4174
const server = spawn('node', ['scripts/serve-static.mjs', 'out', String(PORT)], { stdio: 'ignore' })
await new Promise((r) => setTimeout(r, 600))

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const errors = []
try {
  for (const name of which === 'all' ? Object.keys(VIEWPORTS) : [which]) {
    const vp = VIEWPORTS[name]
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.deviceScaleFactor, isMobile: vp.isMobile, hasTouch: vp.hasTouch })
    const page = await ctx.newPage()
    page.on('console', (m) => m.type() === 'error' && errors.push(`[${name}] console: ${m.text()}`))
    page.on('pageerror', (e) => errors.push(`[${name}] pageerror: ${e.message}`))
    page.on('requestfailed', (r) => errors.push(`[${name}] request failed: ${r.url()}`))
    await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(2500)
    const dir = `qa/${name}`
    await mkdir(dir, { recursive: true })
    const scrollToP = async (p) => {
      await page.evaluate((p) => {
        const el = document.querySelector('#top')
        const top = el.getBoundingClientRect().top + window.scrollY
        window.scrollTo(0, top + p * (el.offsetHeight - window.innerHeight))
      }, p)
      await page.waitForTimeout(1800)
    }
    const mode = await page.evaluate(() => document.querySelector('#top')?.getAttribute('data-mode'))
    console.log(name, 'journey mode:', mode)
    for (const p of points) {
      await scrollToP(p)
      await page.screenshot({ path: `${dir}/fwd-${String(p).padEnd(4, '0')}.png` })
    }
    for (const p of [...points].reverse().filter((_, i) => i % 3 === 1)) {
      await scrollToP(p)
      await page.screenshot({ path: `${dir}/back-${String(p).padEnd(4, '0')}.png` })
    }
    // Sections after the journey
    const ids = ['how-it-works', 'why-housefi', 'app', 'about', 'founders', 'faq', 'contact']
    for (const id of ids) {
      const ok = await page.evaluate((id) => {
        const el = document.getElementById(id)
        if (!el) return false
        window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY)
        return true
      }, id)
      if (!ok) continue
      await page.waitForTimeout(1600)
      await page.screenshot({ path: `${dir}/section-${id}.png` })
    }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    if (overflow > 0) errors.push(`[${name}] horizontal overflow: ${overflow}px`)
    await ctx.close()
  }
} finally {
  await browser.close()
  server.kill()
}
console.log(errors.length ? errors.join('\n') : 'No console errors, failed requests or horizontal overflow.')
