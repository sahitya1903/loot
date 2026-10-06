'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { LOOT_DROPS, LootDropCard } from './LootDropCard'

export function LandingHero({ ctaHref }) {
  const collageRef = useRef(null)

  useEffect(() => {
    const cards = collageRef.current
      ? Array.from(collageRef.current.querySelectorAll('[data-sp]'))
      : []
    if (!cards.length) return

    // Pre-read parallax strengths once
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
    document.addEventListener('mousemove', onMove)
    return () => document.removeEventListener('mousemove', onMove)
  }, [])

  return (
    <section className="l-hero" id="hero">
      {/* background text */}
      <div className="l-hbgn">✦</div>

      {/* LEFT col */}
      <div className="l-hl">
        <h1 className="l-ht">
          <span className="l-htl">
            <span className="l-htli">Nearby.</span>
          </span>
          <span className="l-htl">
            <span className="l-htli">Right now.</span>
          </span>
          <span className="l-htl">
            <span className="l-htli">Gone soon.</span>
          </span>
        </h1>

        <p className="l-hd">
          Loot is the live feed of what&apos;s happening around you — flash deals, limited drops and
          pop-up offers from businesses nearby. Every loot has a clock on it, so claim it before
          it&apos;s gone.
        </p>

        <div className="l-ha">
          <Link href={ctaHref} className="l-bp">
            Explore Loot
          </Link>
          <Link href="/login" className="l-bs">
            For Business
          </Link>
        </div>
      </div>

      {/* RIGHT col — polaroid collage */}
      <div className="l-hr" ref={collageRef} id="lhcollage">
        {LOOT_DROPS.map((drop) => (
          <LootDropCard key={drop.cls} drop={drop} />
        ))}

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

        {/* star spinner 1 */}
        <svg className="l-dco l-ds1" width="56" height="56" viewBox="0 0 56 56" fill="none">
          <g transform="translate(28,28)">
            {[0, 45, 90, 135, 22.5, 67.5, 112.5, 157.5].map((a, i) => (
              <line
                key={i}
                x1={Math.cos((a * Math.PI) / 180) * -25}
                y1={Math.sin((a * Math.PI) / 180) * -25}
                x2={Math.cos((a * Math.PI) / 180) * 25}
                y2={Math.sin((a * Math.PI) / 180) * 25}
                stroke="var(--ink)"
                strokeWidth="1"
              />
            ))}
          </g>
        </svg>

        {/* star spinner 2 */}
        <svg className="l-dco l-ds2" width="46" height="46" viewBox="0 0 46 46" fill="none">
          <g transform="translate(23,23)">
            {[0, 45, 90, 135, 22.5, 67.5, 112.5, 157.5].map((a, i) => (
              <line
                key={i}
                x1={Math.cos((a * Math.PI) / 180) * -21}
                y1={Math.sin((a * Math.PI) / 180) * -21}
                x2={Math.cos((a * Math.PI) / 180) * 21}
                y2={Math.sin((a * Math.PI) / 180) * 21}
                stroke="var(--ink)"
                strokeWidth="1"
              />
            ))}
          </g>
        </svg>

        {/* spiral */}
        <svg className="l-dco l-dsp" width="88" height="88" viewBox="0 0 88 88" fill="none">
          <path
            d="M44 8C65 8,80 23,80 44C80 65,65 80,44 80C23 80,8 65,8 44C8 28,20 15,36 12C52 9,65 20,68 36C71 52,60 65,44 68C28 71,18 60,18 44C18 32,28 24,40 24C52 24,60 34,57 46"
            stroke="var(--ink)"
            strokeWidth="1.3"
            fill="none"
            strokeLinecap="round"
          />
        </svg>

        {/* dashed circle */}
        <svg className="l-dco l-dci" width="60" height="60" viewBox="0 0 60 60" fill="none">
          <circle
            cx="30"
            cy="30"
            r="28"
            stroke="var(--amber)"
            strokeWidth="1.5"
            strokeDasharray="6 4"
          />
        </svg>
      </div>

      {/* stats row */}
      <div className="l-hstats">
        {[
          { val: '5', sup: 'km', label: 'Discovery radius' },
          { val: '4', sup: '', label: 'Live feeds' },
          { val: '1', sup: 'tap', label: 'To claim' },
          { val: 'Free', sup: '', label: 'For hunters' },
        ].map((s) => (
          <div key={s.label}>
            <div className="l-hsn">
              {s.val}
              <sup>{s.sup}</sup>
            </div>
            <div className="l-hsl">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
