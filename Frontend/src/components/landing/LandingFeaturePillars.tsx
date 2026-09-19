'use client'

import { useEffect, useRef } from 'react'

const PILLARS = [
  { num: '01', name: 'Capture', tag: 'Upload · Organize', img: '/images/landing-capture.png' },
  { num: '02', name: 'Connect', tag: 'Collaborate · Sync', img: '/images/landing-connect.png' },
  { num: '03', name: 'Share', tag: 'Galleries · One Link', img: '/images/landing-share.png' },
]

export function LandingFeaturePillars() {
  const prevRef = useRef<HTMLDivElement>(null)
  const prevBgRef = useRef<HTMLDivElement>(null)
  const visRef = useRef(false)

  useEffect(() => {
    const prev = prevRef.current
    const bg = prevBgRef.current
    if (!prev || !bg) return

    const rows = document.querySelectorAll<HTMLElement>('.l-sr2')
    rows.forEach((row) => {
      row.addEventListener('mouseenter', () => {
        const img = row.getAttribute('data-img') || ''
        bg.style.background = `url(${img}) center/cover no-repeat`
        prev.classList.add('vis')
        visRef.current = true
      })
      row.addEventListener('mouseleave', () => {
        prev.classList.remove('vis')
        visRef.current = false
      })
    })

    const onMove = (e: MouseEvent) => {
      if (visRef.current) {
        prev.style.left = e.clientX + 24 + 'px'
        prev.style.top = e.clientY - 80 + 'px'
      }
    }
    document.addEventListener('mousemove', onMove)
    return () => document.removeEventListener('mousemove', onMove)
  }, [])

  return (
    <>
      {/* Service preview */}
      <div id="lsprev" ref={prevRef}>
        <div ref={prevBgRef} style={{ width: '100%', height: '100%' }} />
      </div>

      <section className="l-svs" id="pillars">
        <div className="l-svh l-sr l-sru">
          <h2 className="l-stitle">
            What
            <br />
            Momento does
          </h2>
          <a href="#" className="l-slink">
            See all features →
          </a>
        </div>

        <div className="l-svl l-sr l-sru l-sd2">
          {PILLARS.map((p) => (
            <div key={p.num} className="l-sr2" data-img={p.img}>
              <span className="l-sn2">{p.num}</span>
              <span className="l-sname">{p.name}</span>
              <span className="l-stg">{p.tag}</span>
              <span className="l-sarr">↗</span>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
