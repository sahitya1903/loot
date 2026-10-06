'use client'

import { useEffect, useRef } from 'react'
import { LOOT_DROPS, LootDropCard } from '@/components/landing/LootDropCard'

export function LoginPolaroidCollage() {
  const collageRef = useRef(null)

  useEffect(() => {
    const isCoarse = window.matchMedia('(pointer: coarse)').matches
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (isCoarse || reducedMotion) return

    const cards = collageRef.current
      ? Array.from(collageRef.current.querySelectorAll('[data-sp]'))
      : []
    if (!cards.length) return

    const strengths = cards.map((c) => parseFloat(c.getAttribute('data-sp') ?? '0'))
    let rafPending = false

    const onMove = (e) => {
      if (rafPending) return
      rafPending = true
      requestAnimationFrame(() => {
        rafPending = false
        const dx = e.clientX - window.innerWidth / 2
        const dy = e.clientY - window.innerHeight / 2
        cards.forEach((c, i) => {
          c.style.translate = `${dx * strengths[i]}px ${dy * strengths[i]}px`
        })
      })
    }

    document.addEventListener('mousemove', onMove, { passive: true })
    return () => document.removeEventListener('mousemove', onMove)
  }, [])

  return (
    <div ref={collageRef} className="l-hr login-collage-wrap">
      {LOOT_DROPS.map((drop) => (
        <LootDropCard key={drop.cls} drop={drop} />
      ))}

      {/* ✦ background deco */}
      <span className="login-collage-star">✦</span>

      {/* wavy lines deco */}
      <svg className="l-dco l-dw" width="200" height="65" viewBox="0 0 200 65" fill="none">
        <path
          d="M0 16 Q25 2 50 16 Q75 30 100 16 Q125 2 150 16 Q175 30 200 16"
          stroke="var(--ink)"
          strokeWidth="1.3"
          fill="none"
        />
        <path
          d="M0 32 Q25 18 50 32 Q75 46 100 32 Q125 18 150 32 Q175 46 200 32"
          stroke="var(--ink)"
          strokeWidth="1.3"
          fill="none"
        />
        <path
          d="M0 48 Q25 34 50 48 Q75 62 100 48 Q125 34 150 48 Q175 62 200 48"
          stroke="var(--ink)"
          strokeWidth="1.3"
          fill="none"
        />
      </svg>
    </div>
  )
}
