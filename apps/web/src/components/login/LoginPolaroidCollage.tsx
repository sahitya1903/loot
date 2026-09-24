'use client'

import { useEffect, useRef } from 'react'

const COLLAGE_CARDS = [
  {
    cls: 'l-hc1',
    cf: 'l-cf1',
    cap: 'Wedding Day',
    sp: '0.06',
    tape: { col: 'rgba(212,168,67,.7)', type: 'solid', rot: '-8deg', left: '20%' },
  },
  {
    cls: 'l-hc2',
    cf: 'l-cf2',
    cap: 'Graduation',
    sp: '-0.04',
    tape: { col: 'rgba(200,75,47,.65)', type: 'stripe', rot: '6deg', left: '25%' },
  },
  { cls: 'l-hc3', cf: 'l-cf3', cap: 'Reunion', sp: '0.05', tape: null },
  {
    cls: 'l-hc4',
    cf: 'l-cf4',
    cap: 'Concert',
    sp: '-0.07',
    tape: { col: 'rgba(120,160,200,.6)', type: 'dots', rot: '-4deg', left: '20%' },
  },
  { cls: 'l-hc5', cf: 'l-cf5', cap: 'Birthday', sp: '0.09', tape: null },
]

export function LoginPolaroidCollage() {
  const collageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const isCoarse = window.matchMedia('(pointer: coarse)').matches
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (isCoarse || reducedMotion) return

    const cards = collageRef.current
      ? Array.from(collageRef.current.querySelectorAll<HTMLDivElement>('[data-sp]'))
      : []
    if (!cards.length) return

    const strengths = cards.map((c) => parseFloat(c.getAttribute('data-sp') ?? '0'))
    let rafPending = false

    const onMove = (e: MouseEvent) => {
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
      {COLLAGE_CARDS.map((card) => (
        <div key={card.cls} className={`l-hc ${card.cls} l-pol`} data-sp={card.sp}>
          <div className={`l-cf ${card.cf}`} style={{ height: 'calc(100% - 34px)' }} />
          <span className="l-pol-cap">{card.cap}</span>
          {card.tape && (
            <div
              className={`l-tape l-tape-${card.tape.type}`}
              style={{
                ['--tape-col' as string]: card.tape.col,
                position: 'absolute',
                width: '70px',
                top: '-7px',
                left: card.tape.left,
                transform: `rotate(${card.tape.rot})`,
                zIndex: 10,
              }}
            >
              <div className="l-tape-inner" />
            </div>
          )}
        </div>
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
