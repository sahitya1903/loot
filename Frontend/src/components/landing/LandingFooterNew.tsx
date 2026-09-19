'use client'

import Link from 'next/link'

const LINKS = [
  {
    heading: 'Product',
    items: [
      { label: 'How it works', href: '#howitworks' },
      { label: 'Features', href: '#pillars' },
      { label: 'Pricing', href: '#' },
      { label: 'Gallery', href: '#' },
      { label: 'QR Sharing', href: '#' },
    ],
  },
  {
    heading: 'Company',
    items: [
      { label: 'About', href: '#' },
      { label: 'Blog', href: '/blogs' },
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
      { label: 'hello@momento.app', href: 'mailto:hello@momento.app' },
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
            Momento<span>.</span>
          </Link>
          <p className="l-ftag">
            Capture, share, and relive your most precious moments — beautifully, together.
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
      <div className="l-fbig">Momento.</div>

      <div className="l-fb">
        <span>© 2025 Momento. All rights reserved.</span>
        <span>Crafted with love ✦</span>
        <span>Your memories, your way</span>
      </div>
    </footer>
  )
}
