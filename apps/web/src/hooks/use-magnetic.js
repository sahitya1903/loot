'use client'

import { useRef, useCallback } from 'react'
import { useMotionValue, useSpring, useReducedMotion } from 'framer-motion'

export function useMagnetic(options = {}) {
  const { strength = 0.3, radius = 150 } = options
  const ref = useRef(null)
  const shouldReduceMotion = useReducedMotion()

  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const springX = useSpring(x, { stiffness: 150, damping: 15, mass: 0.1 })
  const springY = useSpring(y, { stiffness: 150, damping: 15, mass: 0.1 })

  const handleMouseMove = useCallback(
    (e) => {
      if (shouldReduceMotion || !ref.current) return

      const rect = ref.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      const distX = e.clientX - centerX
      const distY = e.clientY - centerY
      const distance = Math.sqrt(distX * distX + distY * distY)

      if (distance < radius) {
        const maxDisplacement = 12 * strength
        const factor = (1 - distance / radius) * maxDisplacement
        x.set((distX / distance) * factor)
        y.set((distY / distance) * factor)
      }
    },
    [shouldReduceMotion, radius, strength, x, y]
  )

  const handleMouseLeave = useCallback(() => {
    x.set(0)
    y.set(0)
  }, [x, y])

  return [ref, { x: springX, y: springY }, handleMouseMove, handleMouseLeave]
}
