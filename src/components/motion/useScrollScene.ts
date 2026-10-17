'use client'
// Runs a GSAP setup function for one section, scoped to its root element, only when motion is allowed. Everything
// it creates is reverted on unmount and when the reduced-motion preference changes.
import { useLayoutEffect, useEffect, type RefObject } from 'react'
import { gsap, MOTION_OK } from './gsap'

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

export function useScrollScene(root: RefObject<HTMLElement | null>, setup: (el: HTMLElement) => void | (() => void), deps: readonly unknown[] = []) {
  useIsoLayoutEffect(() => {
    const el = root.current
    if (!el) return
    const mm = gsap.matchMedia(el)
    mm.add(MOTION_OK, () => setup(el))
    return () => mm.revert()
  }, deps)
}
