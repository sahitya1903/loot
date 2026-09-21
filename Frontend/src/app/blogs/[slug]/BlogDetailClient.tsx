'use client'

import { useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { LandingNav } from '@/components/landing/LandingNav'
import { LandingFooterNew } from '@/components/landing/LandingFooterNew'
import { LandingCursor } from '@/components/ui/LandingCursor'
import { useAuth } from '@/hooks'
import type { Blog } from '@/lib/blogs'
import DOMPurify from 'dompurify'
interface BlogDetailClientProps {
  blog: Blog
}

export default function BlogDetailClient({ blog }: BlogDetailClientProps) {
  const { isAuthenticated } = useAuth()
  const ctaHref = isAuthenticated ? '/home' : '/login'
  const srRef = useRef<IntersectionObserver | null>(null)
  const sanitizedContent = useMemo(
    () => (typeof window === 'undefined' ? blog.content : DOMPurify.sanitize(blog.content)),
    [blog.content]
  )

  // Scroll-reveal observer
  useEffect(() => {
    window.scrollTo(0, 0)
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

      {/* ═══════════════ BLOG DETAIL ═══════════════ */}
      <article className="blog-detail">
        {/* Cover image */}
        <div className="blog-detail-cover l-sr l-sru">
          <Image
            src={blog.coverImage}
            alt={blog.title}
            fill
            loading="lazy"
            sizes="100vw"
            className="blog-detail-cover-img"
          />
          <div className="blog-detail-cover-overlay" />
        </div>

        {/* Content */}
        <div className="blog-detail-content">
          <div className="blog-detail-meta l-sr l-sru">
            <Link href="/blogs" className="blog-detail-back" id="blog-back-link">
              ← Back to Blog
            </Link>
            <span className="blog-detail-date">
              {new Date(blog.createdAt).toLocaleDateString('en-US', {
                timeZone: 'UTC',
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>

          <h1 className="blog-detail-title l-sr l-sru l-sd1">{blog.title}</h1>

          <p className="blog-detail-excerpt l-sr l-sru l-sd2">{blog.shortDescription}</p>

          <div className="blog-detail-divider l-sr l-sru l-sd3" />

          <div
            className="blog-detail-body"
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />
        </div>
      </article>

      {/* Footer marquee strip */}
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

      {/* Footer */}
      <LandingFooterNew />
    </div>
  )
}
