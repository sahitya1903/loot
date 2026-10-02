'use client'

import { useEffect } from 'react'

/**
 * useScrollReveal
 *
 * Observes every element with the `.sr` class inside the given root
 * (defaults to the entire document) and adds the `in` class when the
 * element enters the viewport, triggering the CSS reveal animation.
 *
 * Respects `prefers-reduced-motion` — if the user has opted out of
 * motion, all `.sr` elements are made visible immediately with no
 * animation.
 *
 * Call once at layout level so every child page benefits automatically.
 */
export function useScrollReveal(threshold = 0.12) {
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // If user prefers reduced motion, reveal everything immediately
    if (prefersReducedMotion) {
      document.querySelectorAll('.sr').forEach((el) => {
        el.classList.add('in')
        el.style.opacity = '1'
        el.style.transform = 'none'
      })
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold }
    )

    // Observe all current .sr elements
    const observe = () => {
      document.querySelectorAll('.sr:not(.in)').forEach((el) => {
        observer.observe(el)
      })
    }

    observe()

    // MutationObserver picks up elements added after initial mount
    // (e.g. when navigating between app pages without full reload)
    const mutation = new MutationObserver(observe)
    mutation.observe(document.body, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      mutation.disconnect()
    }
  }, [threshold])
}
