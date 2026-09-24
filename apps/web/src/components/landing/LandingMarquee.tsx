'use client'

import { useEffect, useRef } from 'react'

const ITEMS_1 = [
  'Capture',
  'Share',
  'Relive',
  'Connect',
  'Remember',
  'Celebrate',
  'Capture',
  'Share',
  'Relive',
  'Connect',
  'Remember',
  'Celebrate',
]
const ITEMS_2 = [
  'Awarded Platform',
  'Best App 2024',
  'Top Rated',
  'Privacy First',
  'Unlimited Storage',
  'Always Secure',
  'Awarded Platform',
  'Best App 2024',
  'Top Rated',
  'Privacy First',
  'Unlimited Storage',
  'Always Secure',
]

export function LandingMarquee() {
  const track1Ref = useRef<HTMLDivElement>(null)
  const track2Ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const tracks = [track1Ref.current, track2Ref.current]
    tracks.forEach((t) => {
      if (!t) return
      t.parentElement?.addEventListener('mouseenter', () => {
        t.style.animationPlayState = 'paused'
      })
      t.parentElement?.addEventListener('mouseleave', () => {
        t.style.animationPlayState = 'running'
      })
    })
  }, [])

  return (
    <>
      {/* Band 1 — dark, Playfair italic */}
      <div className="l-mw">
        <div className="l-mt" ref={track1Ref}>
          {ITEMS_1.map((item, i) => (
            <div className="l-mi" key={i}>
              <span className="l-md" />
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Band 2 — rust tint, uppercase */}
      <div className="l-mw l-mw2">
        <div className="l-mt rev" ref={track2Ref}>
          {ITEMS_2.map((item, i) => (
            <div className="l-mi" key={i}>
              <span className="l-md" />
              {item}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
