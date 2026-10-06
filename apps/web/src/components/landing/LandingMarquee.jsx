'use client'

import { useEffect, useRef } from 'react'

const ROW_1 = ['Flash deals', 'Drops', 'Restocks', 'Pop-ups', 'Happy hours', 'Free trials']
const ROW_2 = ['Food & drink', 'Nightlife', 'Retail', 'Wellness', 'Entertainment', 'Experiences']
const ITEMS_1 = [...ROW_1, ...ROW_1]
const ITEMS_2 = [...ROW_2, ...ROW_2]

export function LandingMarquee() {
  const track1Ref = useRef(null)
  const track2Ref = useRef(null)

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
