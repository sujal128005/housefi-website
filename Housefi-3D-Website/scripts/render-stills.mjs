// Renders still images from the real 3D scene (transparent background) into public/stills/:
// hero posters shown until three.js has loaded, the glass-house picture used by the static version, and the
// social share image (public/og.png).
// Usage: npm run build && node scripts/render-stills.mjs && npm run build
import { chromium } from '@playwright/test'
import { spawn } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import sharp from 'sharp'

const PORT = 4175
const server = spawn('node', ['scripts/serve-static.mjs', 'out', String(PORT)], { stdio: 'ignore' })
await new Promise((r) => setTimeout(r, 600))
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })

const SHOTS = [
  { file: 'hero-landscape.webp', width: 1600, height: 1000, p: 0, quality: 82 },
  { file: 'hero-portrait.webp', width: 780, height: 1688, p: 0, quality: 82 },
  { file: 'glass-house.webp', width: 1200, height: 1000, p: 0.905, quality: 84, crop: true },
]

try {
  for (const shot of SHOTS) {
    const page = await browser.newPage({ viewport: { width: shot.width, height: shot.height }, deviceScaleFactor: 1 })
    await page.goto(`http://127.0.0.1:${PORT}/?stills`, { waitUntil: 'networkidle' })
    await page.waitForFunction(() => window.__housefiScene, null, { timeout: 30000 })
    const dataUrl = await page.evaluate((p) => {
      const scene = window.__housefiScene
      scene.stop()
      scene.resize()
      scene.renderAt(p)
      return document.querySelector('canvas').toDataURL('image/png')
    }, shot.p)
    let img = sharp(Buffer.from(dataUrl.split(',')[1], 'base64'))
    if (shot.crop) img = sharp(await img.trim().toBuffer()).extend({ top: 24, bottom: 24, left: 24, right: 24, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    await writeFile(`public/stills/${shot.file}`, await img.webp({ quality: shot.quality, alphaQuality: 90 }).toBuffer())
    console.log('wrote', shot.file)
    await page.close()
  }

  // Social share image (1200 × 630) with the brand font and the glass-house still.
  const og = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })
  const font = await readFile('node_modules/@fontsource-variable/anek-latin/files/anek-latin-latin-wdth-normal.woff2')
  const house = await readFile('public/stills/glass-house.webp')
  await og.route('**/og-font.woff2', (r) => r.fulfill({ body: font, contentType: 'font/woff2' }))
  await og.route('**/og-house.webp', (r) => r.fulfill({ body: house, contentType: 'image/webp' }))
  const logo = await readFile('public/brand/housefi-logo-256.webp')
  await og.route('**/og-logo.webp', (r) => r.fulfill({ body: logo, contentType: 'image/webp' }))
  await og.goto(`http://127.0.0.1:${PORT}/robots.txt`)
  await og.setContent(`<!doctype html><html><head><style>
    @font-face { font-family: Anek; src: url(/og-font.woff2) format('woff2'); font-weight: 100 800; font-stretch: 75% 125%; }
    html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; }
    body { font-family: Anek, sans-serif; color: #fff; background: radial-gradient(110% 90% at 80% 10%, #4a78ff, #1746e8 45%, #0e2db5); }
    .copy { position: absolute; left: 72px; top: 92px; width: 560px; }
    .tag { display: inline-block; padding: 8px 16px; border-radius: 999px; background: rgba(255,255,255,.14); font-size: 22px; font-weight: 600; }
    h1 { margin: 28px 0 0; font-size: 76px; line-height: .98; font-weight: 800; font-stretch: 108%; letter-spacing: -.03em; }
    p { margin: 24px 0 0; font-size: 28px; opacity: .85; }
    .word { position: absolute; left: 72px; bottom: 50px; display: flex; align-items: center; gap: 16px; font-size: 40px; font-weight: 750; font-stretch: 116%; }
    .word img { position: static; width: 64px; filter: none; }
    .house { position: absolute; right: -10px; bottom: 30px; width: 600px; filter: drop-shadow(0 30px 40px rgba(5,15,70,.45)); }
  </style></head><body>
    <div class="copy"><span class="tag">Home services, in one app</span><h1>Your Home.<br>Our Responsibility.</h1><p>Thoughtful home care, made simple.</p></div>
    <div class="word"><img src="/og-logo.webp" alt="">Housefi</div>
    <img class="house" src="/og-house.webp" alt="">
  </body></html>`)
  await og.evaluate(() => document.fonts.ready)
  await og.waitForTimeout(400)
  await writeFile('public/og.png', await sharp(await og.screenshot({ type: 'png' })).png({ compressionLevel: 9, palette: true, quality: 90 }).toBuffer())
  console.log('wrote og.png')
} finally {
  await browser.close()
  server.kill()
}
