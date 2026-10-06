'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'

export function LandingCTA({ ctaHref }) {
  const btnRef = useRef(null)

  useEffect(() => {
    const btn = btnRef.current
    if (!btn) return

    const onMove = (e) => {
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
        <span className="l-ctaey">Something&apos;s dropping near you</span>
        <h2 className="l-ctatitle">
          Don&apos;t miss
          <br />
          what&apos;s
          <br />
          <span className="it">happening now.</span>
        </h2>
        <p className="l-ctasub">
          Loot is free for hunters. Businesses can start dropping loot in minutes.
        </p>
        <div className="l-mag">
          <Link href={ctaHref} className="l-bcta" ref={btnRef}>
            Start hunting →
          </Link>
        </div>
        <div className="l-ctanote">Free to join · Sign in with your phone · Loot near you</div>
      </div>
    </section>
  )
}
