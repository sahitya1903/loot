'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ui/theme-toggle'

export function LandingNav({ ctaHref, bizHref = '/login', bizLabel = 'For Business' }) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const ctaRef = useRef(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Magnetic CTA effect
  useEffect(() => {
    const btn = ctaRef.current
    if (!btn) return
    const onMove = (e) => {
      const r = btn.getBoundingClientRect()
      const dx = e.clientX - (r.left + r.width / 2)
      const dy = e.clientY - (r.top + r.height / 2)
      btn.style.transform = `translate(${dx * 0.28}px, ${dy * 0.28}px)`
    }
    const onLeave = () => {
      btn.style.transition = 'transform .6s cubic-bezier(.16,1,.3,1)'
      btn.style.transform = 'translate(0,0)'
    }
    const onEnter = () => {
      btn.style.transition = 'transform .1s'
    }
    btn.addEventListener('mousemove', onMove)
    btn.addEventListener('mouseleave', onLeave)
    btn.addEventListener('mouseenter', onEnter)
    return () => {
      btn.removeEventListener('mousemove', onMove)
      btn.removeEventListener('mouseleave', onLeave)
      btn.removeEventListener('mouseenter', onEnter)
    }
  }, [])

  return (
    <nav id="lnav" className={['l-nav', scrolled ? 'scrolled' : ''].filter(Boolean).join(' ')}>
      <div className="l-nav-inner">
        {/* Logo */}
        <Link href="/" className="l-nav-logo">
          <span className="l-nav-logo-text">
            Loot<span className="l-nav-logo-dot">.</span>
          </span>
        </Link>

        {/* Right side */}
        <div className="l-nav-right">
          <Link href={bizHref} className="l-nav-biz">
            {bizLabel}
          </Link>
          <ThemeToggle />
          <Link ref={ctaRef} href={ctaHref} className="l-nav-cta">
            Get Started
          </Link>
          {/* Hamburger */}
          <button
            className="l-nav-ham"
            aria-label="Toggle menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span className={menuOpen ? 'open' : ''} />
            <span className={menuOpen ? 'open' : ''} />
            <span className={menuOpen ? 'open' : ''} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="l-nav-mob">
          <Link href={bizHref} className="l-nav-link" onClick={() => setMenuOpen(false)}>
            {bizLabel}
          </Link>
          <Link href={ctaHref} className="l-nav-cta" onClick={() => setMenuOpen(false)}>
            Get Started
          </Link>
        </div>
      )}
    </nav>
  )
}
