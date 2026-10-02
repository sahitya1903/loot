'use client'

import { useEffect, useRef } from 'react'

/**
 * useParallax
 *
 * Applies a subtle mouse-tracking parallax translation to the element
 * referenced by the returned ref. The `strength` parameter controls
 * displacement magnitude (0.03–0.08 recommended for app pages).
 *
 * Guards:
 *  - Disabled on touch / coarse-pointer devices (no mouse to track)
 *  - Disabled when the user prefers reduced motion
 *  - Uses requestAnimationFrame to avoid layout thrashing
 *
 * @param strength  Parallax strength multiplier (default 0.04)
 * @returns         A ref to attach to the target element
 *
 * @example
 * const ref = useParallax(0.04)
 * return <div ref={ref}>...</div>
 */
export function useParallax(strength = 0.04) {
  const ref = useRef(null)

  useEffect(() => {
    // Bail on touch / coarse-pointer devices — no mousemove events
    const isCoarse = window.matchMedia('(pointer: coarse)').matches
    if (isCoarse) return

    // Bail if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return

    const el = ref.current
    if (!el) return

    let rafId = null

    const onMove = (e) => {
      if (rafId !== null) return
      rafId = requestAnimationFrame(() => {
        rafId = null
        const dx = e.clientX - window.innerWidth / 2
        const dy = e.clientY - window.innerHeight / 2
        el.style.transform = `translate(${dx * strength}px, ${dy * strength}px)`
      })
    }

    window.addEventListener('mousemove', onMove, { passive: true })

    return () => {
      window.removeEventListener('mousemove', onMove)
      if (rafId !== null) cancelAnimationFrame(rafId)
      // Reset transform on cleanup (e.g. route change)
      el.style.transform = ''
    }
  }, [strength])

  return ref
}
