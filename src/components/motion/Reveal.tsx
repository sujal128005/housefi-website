'use client'
// Fades and lifts its content in when it scrolls into view (and back out when scrolling up past it). Content is
// fully visible without JavaScript or with reduced motion.
import { useRef, type ReactNode } from 'react'
import { gsap } from './gsap'
import { useScrollScene } from './useScrollScene'

export function Reveal({ children, className, delay = 0, y = 36, as: Tag = 'div' }: {
  readonly children: ReactNode
  readonly className?: string
  readonly delay?: number
  readonly y?: number
  readonly as?: 'div' | 'section' | 'li' | 'article'
}) {
  const ref = useRef<HTMLElement>(null)
  useScrollScene(ref, (el) => {
    gsap.from(el, {
      y,
      opacity: 0,
      duration: 1,
      delay,
      ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none reverse' },
    })
  })
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Tag ref={ref as any} className={className} data-reveal="">
      {children}
    </Tag>
  )
}
