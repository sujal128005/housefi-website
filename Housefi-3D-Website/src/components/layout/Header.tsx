'use client'
// Fixed header: logo, in-page links on wide screens, "Get the app", and a full-screen menu. Text colour follows the
// background underneath (cobalt sections → white text).
import { Menu, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { nav, site } from '@/content/site'
import { onHeaderTheme, type HeaderTheme } from '@/lib/headerTheme'
import { Logo } from '../ui/Logo'
import styles from './Header.module.css'

export function Header() {
  const [theme, setTheme] = useState<HeaderTheme>('dark')
  const [open, setOpen] = useState(false)
  const [hidden, setHidden] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)

  // Theme from the section under the header.
  useEffect(() => {
    const off = onHeaderTheme(setTheme)
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setTheme(((e.target as HTMLElement).dataset.headerTheme as HeaderTheme) ?? 'light')
        }
      },
      { rootMargin: '0px 0px -96% 0px' },
    )
    document.querySelectorAll<HTMLElement>('[data-header-theme]').forEach((el) => io.observe(el))
    return () => {
      off()
      io.disconnect()
    }
  }, [])

  // Hide on scroll down, show on scroll up.
  useEffect(() => {
    let last = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      if (Math.abs(y - last) > 6) {
        setHidden(y > last && y > 400)
        last = y
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const close = useCallback(() => {
    setOpen(false)
    toggleRef.current?.focus()
  }, [])

  // Menu: Escape closes, focus stays inside, the page behind does not scroll.
  useEffect(() => {
    if (!open) return
    const root = document.documentElement
    root.style.overflow = 'hidden'
    const first = menuRef.current?.querySelector<HTMLElement>('a, button')
    first?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'Tab' && menuRef.current) {
        const items = [...menuRef.current.querySelectorAll<HTMLElement>('a, button')]
        const a = items[0]
        const b = items[items.length - 1]
        if (e.shiftKey && document.activeElement === a) {
          e.preventDefault()
          b?.focus()
        } else if (!e.shiftKey && document.activeElement === b) {
          e.preventDefault()
          a?.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      root.style.overflow = ''
      document.removeEventListener('keydown', onKey)
    }
  }, [open, close])

  return (
    <>
      <header className={styles.header} data-theme={open ? 'dark' : theme} data-hidden={hidden && !open}>
        <div className={styles.inner}>
          <a href="#top" className={styles.brand} aria-label={`${site.name}, back to top`} onClick={() => setOpen(false)}>
            <Logo />
          </a>
          <nav aria-label="Main" className={styles.nav}>
            <ul>
              {nav.map((item) => (
                <li key={item.href}>
                  <a href={item.href}>{item.label}</a>
                </li>
              ))}
            </ul>
          </nav>
          <div className={styles.actions}>
            <a href="#app" className={styles.cta}>
              Get the app
            </a>
            <button
              ref={toggleRef}
              type="button"
              className={styles.toggle}
              aria-expanded={open}
              aria-controls="site-menu"
              onClick={() => setOpen((o) => !o)}
            >
              {open ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
              <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
            </button>
          </div>
        </div>
      </header>

      <div id="site-menu" ref={menuRef} className={styles.menu} data-open={open} role="dialog" aria-modal="true" aria-label="Menu" hidden={!open}>
        <div className={styles.menuInner}>
          <ul className={styles.menuLinks}>
            {nav.map((item, i) => (
              <li key={item.href} style={{ '--i': i } as CSSProperties}>
                <a href={item.href} onClick={() => setOpen(false)}>
                  <span className={styles.menuIndex}>{String(i + 1).padStart(2, '0')}</span>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <div className={styles.menuSide}>
            <p className={styles.menuTag}>{site.tagline}</p>
            <p className={styles.menuNote}>Bookings happen in the Housefi app.</p>
            <a href="#app" className={styles.menuCta} onClick={() => setOpen(false)}>
              Get the app
            </a>
          </div>
        </div>
      </div>
    </>
  )
}
