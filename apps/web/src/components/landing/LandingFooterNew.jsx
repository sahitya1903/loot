'use client'

import Link from 'next/link'

const LINKS = [
  {
    heading: 'Product',
    items: [
      { label: 'How it works', href: '#howitworks' },
      { label: 'Features', href: '#pillars' },
      { label: 'For business', href: '/login' },
    ],
  },
  {
    heading: 'Company',
    items: [
      { label: 'About', href: '#' },
      { label: 'Careers', href: '#' },
      { label: 'Press', href: '#' },
      { label: 'Privacy', href: '#' },
    ],
  },
  {
    heading: 'Connect',
    items: [
      { label: 'Instagram', href: '#' },
      { label: 'Twitter / X', href: '#' },
      { label: 'LinkedIn', href: '#' },
      { label: 'Discord', href: '#' },
      { label: 'hello@example.com', href: 'mailto:hello@example.com' },
    ],
  },
]

const SOCIALS = ['𝕏', 'in', '◎', '▶']

export function LandingFooterNew() {
  return (
    <footer className="l-footer">
      <div className="l-ft">
        {/* Brand col */}
        <div>
          <Link href="/" className="l-flogo">
            Loot<span>.</span>
          </Link>
          <p className="l-ftag">
            The live feed of what&apos;s happening around you — deals, drops and pop-ups nearby.
          </p>
          <div className="l-fsocs">
            {SOCIALS.map((s) => (
              <div key={s} className="l-fsoc">
                {s}
              </div>
            ))}
          </div>
        </div>

        {/* Link cols */}
        {LINKS.map((col) => (
          <div key={col.heading} className="l-fc">
            <h5>{col.heading}</h5>
            <ul>
              {col.items.map((item) => (
                <li key={item.label}>
                  <a href={item.href}>{item.label}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Big watermark */}
      <div className="l-fbig">Loot.</div>

      <div className="l-fb">
        <span>© 2026 Loot. All rights reserved.</span>
        <span>Crafted with love ✦</span>
        <span>Nearby. Right now.</span>
      </div>
    </footer>
  )
}
