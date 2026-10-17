// Whether the header sits over a dark (cobalt) or light background. Sections opt in with
// data-header-theme="dark" | "light"; the journey stage, whose background moves inside a pinned frame, reports its
// own value through `reportHeaderTheme`.
export type HeaderTheme = 'dark' | 'light'

const EVENT = 'housefi:header-theme'

export function reportHeaderTheme(theme: HeaderTheme): void {
  window.dispatchEvent(new CustomEvent<HeaderTheme>(EVENT, { detail: theme }))
}

export function onHeaderTheme(fn: (theme: HeaderTheme) => void): () => void {
  const handler = (e: Event) => fn((e as CustomEvent<HeaderTheme>).detail)
  window.addEventListener(EVENT, handler)
  return () => window.removeEventListener(EVENT, handler)
}
