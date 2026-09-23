'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'

interface LandingCTAProps {
  ctaHref: string
}

export function LandingCTA({ ctaHref }: LandingCTAProps) {
  const btnRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    const btn = btnRef.current
    if (!btn) return

    const onMove = (e: MouseEvent) => {
      const r = btn.getBoundingClientRect()
      const dx = ((e.clientX - (r.left + r.width / 2)) / (r.width / 2)) * 20
      const dy = ((e.clientY - (r.top + r.height / 2)) / (r.height / 2)) * 20
      btn.style.transform = `translate(${dx}px,${dy}px)`
    }
    const onLeave = () => {
      btn.style.transition = 'transform .5s cubic-bezier(.16,1,.3,1)'
      btn.style.transform = 'translate(0,0)'
      setTimeout(() => {
        btn.style.transition = ''
      }, 500)
    }

    btn.addEventListener('mousemove', onMove)
    btn.addEventListener('mouseleave', onLeave)
    return () => {
      btn.removeEventListener('mousemove', onMove)
      btn.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return (
    <section className="l-ctas" id="cta">
      <div className="l-ctabc l-cb1" />
      <div className="l-ctabc l-cb2" />

      <div className="l-sr l-sru">
        <span className="l-ctaey">Ready to preserve your moments?</span>
        <h2 className="l-ctatitle">
          Make every
          <br />
          memory
          <br />
          <span className="it">last forever.</span>
        </h2>
        <p className="l-ctasub">
          Join thousands of event creators who trust Loot to capture and share their most
          precious moments. Free to start, no credit card required.
        </p>
        <div className="l-mag">
          <Link href={ctaHref} className="l-bcta" ref={btnRef}>
            Start for free →
          </Link>
        </div>
        <div className="l-ctanote">Free to join · No credit card required · Always private</div>
      </div>
    </section>
  )
}
