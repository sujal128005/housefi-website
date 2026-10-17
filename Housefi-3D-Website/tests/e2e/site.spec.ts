import { expect, test, type Page } from '@playwright/test'

async function collectErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  return errors
}

async function scrollThrough(page: Page) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight)
  for (let y = 0; y < height; y += 700) {
    await page.evaluate((y) => window.scrollTo(0, y), y)
    await page.waitForTimeout(60)
  }
}

test('home page loads with its sections and no errors', async ({ page }) => {
  const errors = await collectErrors(page)
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Your Home.')
  for (const id of ['top', 'services', 'how-it-works', 'why-housefi', 'app', 'about', 'founders', 'faq', 'contact']) {
    await expect(page.locator(`#${id}`)).toHaveCount(1)
  }
  await scrollThrough(page)
  expect(errors).toEqual([])
})

test('every in-page link has a target', async ({ page }) => {
  await page.goto('/')
  const hrefs = await page.$$eval('a[href^="#"]', (as) => [...new Set(as.map((a) => a.getAttribute('href')!))])
  for (const h of hrefs) await expect(page.locator(h), h).toHaveCount(1)
})

test('all images load', async ({ page }) => {
  await page.goto('/')
  await scrollThrough(page)
  await page.waitForTimeout(800)
  const broken = await page.$$eval('img', (imgs) =>
    imgs.filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.currentSrc || i.src),
  )
  expect(broken).toEqual([])
})

test('no horizontal scrolling', async ({ page }) => {
  await page.goto('/')
  await scrollThrough(page)
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(0)
})

test('the 3D story runs and the stage pins', async ({ page }) => {
  await page.goto('/')
  const journey = page.locator('#top')
  await expect(journey).toHaveAttribute('data-mode', 'motion')
  await expect(page.locator('#top canvas')).toHaveAttribute('data-ready', 'true', { timeout: 20_000 })
  const vh = await page.evaluate(() => window.innerHeight)
  const box = await journey.boundingBox()
  expect(box!.height).toBeGreaterThan(vh * 7)
  // Halfway through, the stage is still on screen (sticky) and a service is highlighted.
  await page.evaluate(() => {
    const el = document.getElementById('top')!
    window.scrollTo(0, el.offsetTop + 0.55 * (el.offsetHeight - window.innerHeight))
  })
  await expect
    .poll(() => page.evaluate(() => Math.abs(document.querySelector('#top > div:not([aria-hidden])')!.getBoundingClientRect().top)), { timeout: 20_000 })
    .toBeLessThan(2)
  await expect(page.locator('#top [data-active]')).not.toHaveAttribute('data-active', '-1', { timeout: 20_000 })
  // Scrolling back to the top restores the hero.
  await page.evaluate(() => window.scrollTo(0, 0))
  // The hero eases back with the scroll smoothing; software-rendered WebGL (CI, containers) can be slow to catch up.
  await expect(page.getByRole('heading', { level: 1 })).toBeInViewport({ timeout: 20_000 })
})

test.describe('reduced motion', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } })
  test('shows everything without pinning or 3D', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('#top')).toHaveAttribute('data-mode', 'static')
    await expect(page.locator('#top canvas')).toBeHidden()
    const position = await page.evaluate(() => getComputedStyle(document.querySelector('#top > div:not([aria-hidden])')!).position)
    expect(position).not.toBe('sticky')
    for (const name of ['Plumbing', 'Electrical', 'AC Repair', 'Appliances', 'Cleaning', 'Carpentry']) {
      await expect(page.locator('#top').getByText(name, { exact: true })).toBeVisible()
    }
  })
})

test('store buttons are not links until real URLs are configured', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('a[href*="play.google.com"], a[href*="apps.apple.com"]')).toHaveCount(0)
  await expect(page.getByText('Coming soon').first()).toBeAttached()
})

test('menu opens, traps focus and closes with Escape', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'The menu button is shown on narrow screens')
  await page.goto('/')
  const toggle = page.getByRole('button', { name: 'Open menu' })
  await toggle.click()
  const menu = page.getByRole('dialog', { name: 'Menu' })
  await expect(menu).toBeVisible()
  await expect(menu.getByRole('link', { name: /Services/ })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(menu).toBeHidden()
  await expect(page.getByRole('button', { name: 'Open menu' })).toBeFocused()
})

test('legal pages exist and say they are drafts', async ({ page }) => {
  for (const path of ['/privacy/', '/terms/']) {
    await page.goto(path)
    await expect(page.getByText('Draft placeholder.')).toBeVisible()
  }
})
