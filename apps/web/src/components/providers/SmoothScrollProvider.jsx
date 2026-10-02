'use client'
import { ReactLenis, useLenis } from 'lenis/react'
import { prefersReducedMotion } from '@/lib/motion'

export function SmoothScrollProvider({ children }) {
  const shouldDisable = typeof window !== 'undefined' && prefersReducedMotion()

  if (shouldDisable) {
    return <>{children}</>
  }

  return (
    <ReactLenis
      root
      options={{
        lerp: 0.1,
        duration: 1.2,
        smoothWheel: true,
        touchMultiplier: 1.5,
      }}
    >
      {children}
    </ReactLenis>
  )
}

/**
 * Hook to access the Lenis instance for scroll control
 */
export { useLenis }
