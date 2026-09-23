'use client'

import { useEffect, useRef } from 'react'

const BARS = [
  { name: 'Photos uploaded per event', pct: 94, cls: 'rust' },
  { name: 'User satisfaction score', pct: 97, cls: '' },
  { name: 'Upload success rate', pct: 99, cls: 'amber' },
  { name: 'Events with returning users', pct: 88, cls: 'rust' },
]

export function LandingStats() {
  const barsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = barsRef.current
    if (!container) return

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            container.querySelectorAll<HTMLElement>('.l-skill-bar').forEach((bar) => {
              bar.style.width = (bar.getAttribute('data-w') ?? '0') + '%'
            })
            obs.unobserve(container)
          }
        })
      },
      { threshold: 0.3 }
    )

    obs.observe(container)
    return () => obs.disconnect()
  }, [])

  return (
    <section className="l-skills" id="stats">
      <div className="l-skills-left l-sr l-srl">
        <h2>
          Built for scale,
          <br />
          designed <em>for joy</em>
        </h2>
        <p>
          Loot handles everything from intimate birthdays to large corporate events. Powered by
          enterprise-grade infrastructure so your memories are always safe and instant.
        </p>
      </div>

      <div className="l-skills-bars l-sr l-srr" ref={barsRef}>
        {BARS.map((b) => (
          <div key={b.name} className="l-skill-row">
            <div className="l-skill-meta">
              <span className="l-skill-name">{b.name}</span>
              <span className="l-skill-pct">{b.pct}%</span>
            </div>
            <div className="l-skill-track">
              <div className={`l-skill-bar${b.cls ? ' ' + b.cls : ''}`} data-w={b.pct} />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
