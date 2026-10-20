// Scroll smoothness check: opens the built site in Microsoft Edge with the real GPU, waits for the 3D scene, then
// scrolls the whole home page with the mouse wheel (much faster than a person reads), and reports frame times: `max`
// is the longest freeze, `slowPct` how many frames took longer than two screen refreshes (a visible stutter). Also
// reports when the 3D scene was ready and which layouts (`modes`) were painted, to catch a flash of the static version.
// Usage: npm run build && node scripts/scroll-perf.mjs [width] [height] [dpr]
//   PERF_URL=https://housefi.tech/   measure the live site instead of the build
//   PERF_DELAY=5000                  how long the visitor looks at the opening before scrolling (ms, default 1500)
//   PERF_PAUSE=50                    ms between wheel steps of 120px (default 16: very fast scrolling)
//   PERF_WARM=1                      wait until the scene has compiled every shader before scrolling
//   PERF_DEBUG=1                     list the slow frames (scroll position and length)
// Machines vary a lot from run to run (other apps use the GPU too): compare several runs.
import { chromium } from '@playwright/test'
import { spawn } from 'node:child_process'

const [width = 1440, height = 900, dpr = 1.25] = process.argv.slice(2).map(Number)
const PORT = 4176
const server = spawn('node', ['scripts/serve-static.mjs', 'out', String(PORT)], { stdio: 'ignore' })
await new Promise((r) => setTimeout(r, 600))
const browser = await chromium.launch({ channel: 'msedge', args: ['--ignore-gpu-blocklist'] })
try {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: dpr })
  await page.addInitScript(() => {
    const seen = []
    window.__modes = seen
    const watch = () => {
      const m = document.getElementById('top')?.getAttribute('data-mode')
      if (m && seen.at(-1)?.m !== m) seen.push({ m, t: Math.round(performance.now()) })
      if (performance.now() < 8000) requestAnimationFrame(watch)
    }
    requestAnimationFrame(watch)
  })
  const t0 = Date.now()
  await page.goto(process.env.PERF_URL || `http://127.0.0.1:${PORT}/`, { waitUntil: 'load' })
  await page.waitForSelector('canvas[data-ready="true"]', { timeout: 60000 }).catch(() => null)
  const readyMs = Date.now() - t0
  const warmMs = process.env.PERF_WARM ? await page.waitForSelector('canvas[data-warm]', { timeout: 90000 }).then(() => Date.now() - t0, () => -1) : null
  const gpu = await page.evaluate(() => {
    const gl = document.createElement('canvas').getContext('webgl')
    const ext = gl?.getExtension('WEBGL_debug_renderer_info')
    return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'unknown'
  })
  await page.waitForTimeout(Number(process.env.PERF_DELAY ?? 1500))
  const total = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight)
  await page.evaluate(() => {
    window.__frames = []
    window.__slow = []
    let last = performance.now()
    const tick = (t) => {
      window.__frames.push(t - last)
      if (t - last > 34) window.__slow.push([Math.round(scrollY), Math.round(t - last)])
      last = t
      if (!window.__stop) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
  await page.mouse.move(width / 2, height / 2)
  for (let i = 0; i < Math.ceil(total / 120); i++) {
    await page.mouse.wheel(0, 120)
    await page.waitForTimeout(Number(process.env.PERF_PAUSE ?? 16))
  }
  await page.waitForTimeout(800)
  const { frames, slowList, modes } = await page.evaluate(() => ((window.__stop = true), { frames: window.__frames.slice(2), slowList: window.__slow, modes: window.__modes }))
  if (process.env.PERF_DEBUG) console.log('slow frames [scroll y, ms]:', JSON.stringify(slowList))
  frames.sort((a, b) => a - b)
  const q = (x) => frames[Math.min(frames.length - 1, Math.floor(frames.length * x))].toFixed(1)
  const slow = frames.filter((f) => f > 34).length
  console.log(JSON.stringify({ viewport: `${width}x${height}@${dpr}`, gpu, sceneReadyMs: readyMs, warmMs, modes, frames: frames.length, p50: q(0.5), p95: q(0.95), max: frames.at(-1).toFixed(0), slowPct: ((slow / frames.length) * 100).toFixed(1) }))
} finally {
  await browser.close()
  server.kill()
}
