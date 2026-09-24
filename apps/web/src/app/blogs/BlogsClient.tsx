'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { LandingNav } from '@/components/landing/LandingNav'
import { LandingFooterNew } from '@/components/landing/LandingFooterNew'
import { LandingCursor } from '@/components/ui/LandingCursor'
import { useAuth } from '@/hooks'
import type { Blog } from '@/lib/blogs'

interface BlogsClientProps {
  blogs: Omit<Blog, 'content'>[]
}

export default function BlogsClient({ blogs }: BlogsClientProps) {
  const { isAuthenticated } = useAuth()
  const ctaHref = isAuthenticated ? '/home' : '/login'
  const srRef = useRef<IntersectionObserver | null>(null)

  // Scroll-reveal observer (same pattern as business page)
  useEffect(() => {
    srRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in')
            srRef.current?.unobserve(e.target)
          }
        })
      },
      { threshold: 0.1 }
    )
    document.querySelectorAll('.l-sr').forEach((el) => srRef.current?.observe(el))
    return () => srRef.current?.disconnect()
  }, [])

  return (
    <div
      className="landing-page min-h-screen overflow-x-hidden"
      style={{ background: 'var(--ivory)' }}
    >
      {/* Custom cursor */}
      <LandingCursor />

      {/* Navigation */}
      <LandingNav ctaHref={ctaHref} />

      {/* ═══════════════ HERO HEADER ═══════════════ */}
      <section className="blog-hero">
        <div className="blog-hero-bg" aria-hidden="true">
          <span className="blog-hero-glyph">✦</span>
        </div>
        <div className="blog-hero-content l-sr l-sru">
          <span className="blog-eyebrow">Loot Blog</span>
          <h1 className="blog-h1">
            Stories, Tips
            <br />& <span className="it">Inspiration.</span>
          </h1>
          <p className="blog-hero-sub">
            Discover the latest insights on event photography, memory sharing, and making every
            moment count.
          </p>
        </div>
      </section>

      {/* ═══════════════ BLOG GRID ═══════════════ */}
      <section className="blog-grid-section">
        <div className="blog-container l-sr l-sru">
          <div className="blog-grid">
            {blogs.map((blog, i) => (
              <Link
                key={blog.id}
                href={`/blogs/${blog.slug}`}
                className={`blog-card l-sr l-sru l-sd${Math.min(i + 1, 5)}`}
                id={`blog-card-${blog.slug}`}
              >
                <div className="blog-card-img">
                  <Image
                    src={blog.coverImage}
                    alt={blog.title}
                    fill
                    priority={i < 4}
                    sizes="(max-width: 640px) 100vw, (max-width: 960px) 50vw, 33vw"
                    className="blog-card-img-inner"
                  />
                </div>
                <div className="blog-card-body">
                  <span className="blog-card-date">
                    {new Date(blog.createdAt).toLocaleDateString('en-US', {
                      timeZone: 'UTC',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  <h2 className="blog-card-title">{blog.title}</h2>
                  <p className="blog-card-desc">{blog.shortDescription}</p>
                  <span className="blog-card-read">
                    Read Article <span aria-hidden="true">→</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer marquee strip */}
      <div className="l-footer-mq">
        <div className="l-mt rev" style={{ animationDuration: '25s' }}>
          {Array(12)
            .fill(null)
            .map((_, i) => (
              <div className="l-mi" key={i}>
                <span className="l-md" />
                {['Loot', 'Your Memories', 'Your Way', 'Forever'][i % 4]}
              </div>
            ))}
        </div>
      </div>

      {/* Footer */}
      <LandingFooterNew />
    </div>
  )
}
