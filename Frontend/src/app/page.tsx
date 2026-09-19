'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks'
import { LandingNav } from '@/components/landing/LandingNav'
import { LandingHero } from '@/components/landing/LandingHero'
import { LandingMarquee } from '@/components/landing/LandingMarquee'
import { LandingMoodBoard } from '@/components/landing/LandingMoodBoard'
import { LandingFeaturePillars } from '@/components/landing/LandingFeaturePillars'
import { LandingTestimonials } from '@/components/landing/LandingTestimonials'
import { LandingHowItWorks } from '@/components/landing/LandingHowItWorks'
import { LandingStats } from '@/components/landing/LandingStats'
import { LandingTrustBanner } from '@/components/landing/LandingTrustBanner'
import { LandingCTA } from '@/components/landing/LandingCTA'
import { LandingFooterNew } from '@/components/landing/LandingFooterNew'
import { LandingPreloader } from '@/components/ui/LandingPreloader'
import { LandingCursor } from '@/components/ui/LandingCursor'

/* ── Section IDs for nav dots ── */
const SECTIONS = [
  'hero',
  'moodboard',
  'pillars',
  'testimonials',
  'howitworks',
  'stats',
  'cta',
] as const
const SECTION_LABELS: Record<string, string> = {
  hero: 'Home',
  moodboard: 'Memories',
  pillars: 'Features',
  testimonials: 'Stories',
  howitworks: 'How it works',
  stats: 'Stats',
  cta: 'Get Started',
}

export default function LandingPage() {
  const router = useRouter()
  const { isAuthenticated, isInitialized } = useAuth()
  const pbRef = useRef<HTMLDivElement>(null)
  const secNavRef = useRef<HTMLDivElement>(null)

  // Redirect authenticated users
  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      router.push('/home')
    }
  }, [isInitialized, isAuthenticated, router])

  // Single scroll handler: progress bar + nav state + section dots
  useEffect(() => {
    const pb = pbRef.current
    const lnav = document.getElementById('lnav')
    const secNav = secNavRef.current

    // Pre-cache section elements
    const sectionEls = SECTIONS.map((id) => document.getElementById(id))
    const dotEls = SECTIONS.map(
      (id) => secNav?.querySelector<HTMLElement>(`[data-sec="${id}"]`) ?? null
    )

    const onScroll = () => {
      const sy = window.scrollY
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight

      // Progress bar
      if (pb) pb.style.width = ((sy / maxScroll) * 100).toFixed(1) + '%'

      // Nav scrolled state
      if (lnav) lnav.classList.toggle('scrolled', sy > 60)

      // Section dots — use offsetTop (no reflow when layout is stable)
      const mid = sy + window.innerHeight * 0.4
      SECTIONS.forEach((_, i) => {
        const el = sectionEls[i]
        const dot = dotEls[i]
        if (!el || !dot) return
        dot.classList.toggle('active', mid >= el.offsetTop && mid < el.offsetTop + el.offsetHeight)
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()

    // Click to scroll
    secNav?.querySelectorAll<HTMLElement>('.lsndot').forEach((dot) => {
      dot.addEventListener('click', () => {
        const id = dot.getAttribute('data-sec')
        if (id) document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    })

    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Scroll reveal IntersectionObserver
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in')
            obs.unobserve(e.target)
          }
        })
      },
      { threshold: 0.1 }
    )

    document.querySelectorAll('.l-sr').forEach((el) => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  const ctaHref = isAuthenticated ? '/home' : '/login'

  return (
    <div
      className="landing-page min-h-screen overflow-x-hidden"
      style={{ background: 'var(--ivory)' }}
    >
      {/* Fixed overlays */}
      <LandingPreloader />
      <LandingCursor />
      <div id="lpb" ref={pbRef} />

      {/* Section nav dots */}
      <div id="lsecnav" ref={secNavRef}>
        {SECTIONS.map((id, i) => (
          <div
            key={id}
            className={['lsndot', i === 0 ? 'active' : ''].filter(Boolean).join(' ')}
            data-sec={id}
            data-label={SECTION_LABELS[id]}
          />
        ))}
      </div>

      {/* Navigation */}
      <LandingNav ctaHref={ctaHref} />

      {/* 1. Hero */}
      <LandingHero ctaHref={ctaHref} />

      {/* 2. Marquee */}
      <LandingMarquee />

      {/* 3. Mood Board (includes torn paper dividers) */}
      <LandingMoodBoard />

      {/* 4. Feature Pillars */}
      <LandingFeaturePillars />

      {/* 5. Testimonials (quote carousel + cards) */}
      <LandingTestimonials />

      {/* 6. How It Works + Community stories */}
      <LandingHowItWorks />

      {/* 7. Stats bars */}
      <LandingStats />

      {/* 8. Trust banner */}
      <LandingTrustBanner />

      {/* 9. CTA */}
      <LandingCTA ctaHref={ctaHref} />

      {/* 10. Footer marquee strip */}
      <div className="l-footer-mq">
        <div className="l-mt rev" style={{ animationDuration: '25s' }}>
          {Array(12)
            .fill(null)
            .map((_, i) => (
              <div className="l-mi" key={i}>
                <span className="l-md" />
                {['Momento', 'Your Memories', 'Your Way', 'Forever'][i % 4]}
              </div>
            ))}
        </div>
      </div>

      {/* 11. Footer */}
      <LandingFooterNew />
    </div>
  )
}
