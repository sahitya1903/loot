'use client'

import dynamic from 'next/dynamic'
import { motion, useReducedMotion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Sparkles } from 'lucide-react'
import {
  heroContainer,
  headlineReveal,
  subtextReveal,
  ctaReveal,
  buttonInteraction,
} from '@/lib/motion'
import { SplitText } from '@/components/ui/SplitText'
import { MeshGradient } from '@/components/ui/MeshGradient'
import { useMagnetic } from '@/hooks/use-magnetic'

// Dynamic import for Antigravity to avoid SSR issues with Three.js
const Antigravity = dynamic(() => import('@/components/ui/Antigravity'), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-transparent" />,
})

interface HeroSectionProps {
  ctaHref: string
}

export function HeroSection({ ctaHref: _ctaHref }: HeroSectionProps) {
  void _ctaHref
  const shouldReduceMotion = useReducedMotion()
  const [magneticRef, magneticStyle, magneticOnMouseMove, magneticOnMouseLeave] = useMagnetic({
    strength: 0.35,
  })

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Mesh gradient background */}
      <MeshGradient
        colors={['var(--primary)', 'var(--accent)', '#7c3aed', 'var(--primary)']}
        opacity={0.08}
      />

      {/* Hero radial glow for dark mode depth */}
      <div className="pointer-events-none absolute inset-0 z-0 hidden dark:block">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% 20%, rgba(68, 109, 229, 0.12) 0%, transparent 60%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 50% 40% at 80% 60%, rgba(56, 211, 255, 0.06) 0%, transparent 50%)',
          }}
        />
      </div>

      {/* Subtle gradient overlay */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-[var(--background)]/40 via-transparent to-[var(--background)]/60" />

      {/* Centered content */}
      <div className="relative z-10 w-full px-4 pt-28 pb-16 sm:px-6 sm:pt-32 sm:pb-32">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div variants={heroContainer} initial="hidden" animate="visible">
            {/* Animated badge */}
            <motion.div
              variants={headlineReveal}
              className="mb-8 inline-flex items-center gap-2 rounded-full border border-[var(--primary)]/20 bg-[var(--primary)]/10 px-5 py-2.5 backdrop-blur-sm"
            >
              <Sparkles className="h-3.5 w-3.5 text-[var(--primary)] sm:h-4 sm:w-4" />
              <span className="font-[family-name:var(--font-instrument)] text-xs font-medium text-[var(--primary)] sm:text-sm">
                The future of event memories
              </span>
            </motion.div>

            {/* Main headline - catchy copy with per-char reveal */}
            <motion.div variants={headlineReveal}>
              <SplitText
                text="Your moments."
                mode="char"
                staggerDelay={0.04}
                trigger="immediate"
                tag="h1"
                className="font-[family-name:var(--font-instrument)] text-[2.5rem] leading-[1.05] font-bold tracking-tight text-[var(--foreground)] sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl"
              />
              <SplitText
                text="Unforgettable."
                mode="char"
                staggerDelay={0.04}
                trigger="immediate"
                tag="h1"
                className="mb-4 bg-gradient-to-r from-[var(--primary)] via-blue-400 to-[var(--accent)] bg-clip-text pb-1 font-[family-name:var(--font-instrument)] text-[2.5rem] leading-[1.15] font-bold tracking-tight text-transparent sm:mb-6 sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl"
              />
            </motion.div>

            {/* Catchy subtext */}
            <motion.p
              variants={subtextReveal}
              className="mx-auto mb-8 max-w-2xl px-2 font-[family-name:var(--font-instrument)] text-base leading-relaxed text-[var(--muted)] sm:mb-10 sm:text-lg md:text-xl lg:text-2xl"
            >
              Capture. Share. Relive. The only platform you need to turn fleeting moments into
              lasting memories.
            </motion.p>

            {/* CTAs */}
            <motion.div variants={ctaReveal} className="mb-8 flex justify-center">
              <motion.div
                ref={magneticRef}
                style={magneticStyle}
                onMouseMove={magneticOnMouseMove}
                onMouseLeave={magneticOnMouseLeave}
                variants={buttonInteraction}
                initial="rest"
                whileHover={shouldReduceMotion ? undefined : 'hover'}
                whileTap={shouldReduceMotion ? undefined : 'tap'}
              >
                <Link
                  href="/login"
                  className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] px-7 py-3.5 font-[family-name:var(--font-instrument)] text-base font-semibold text-white shadow-[var(--primary)]/30 shadow-2xl transition-all duration-300 hover:shadow-[var(--primary)]/50 sm:px-10 sm:py-4 sm:text-lg"
                >
                  Start Creating
                  <ArrowRight className="h-5 w-5 transition-transform duration-150 group-hover:translate-x-1" />
                </Link>
              </motion.div>
            </motion.div>

            {/* App Store badges */}
            <motion.div
              variants={subtextReveal}
              className="mb-12 flex items-center justify-center gap-4"
            >
              <Link
                href="https://apps.apple.com/in/app/momento-memories-for-life/id6746373161"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block h-10 opacity-80 transition-opacity duration-200 hover:opacity-100 sm:h-12"
              >
                <Image
                  src="/images/badge-appstore.svg"
                  alt="Download on the App Store"
                  width={135}
                  height={40}
                  className="h-full w-auto"
                />
              </Link>
              <Link
                href="https://play.google.com/store/apps/details?id=com.orion.momento"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block h-10 opacity-80 transition-opacity duration-200 hover:opacity-100 sm:h-12"
              >
                <Image
                  src="/images/badge-playstore.svg"
                  alt="Get it on Google Play"
                  width={135}
                  height={40}
                  className="h-full w-auto"
                />
              </Link>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              variants={subtextReveal}
              className="flex flex-col items-center justify-center gap-4 text-[var(--muted)] sm:flex-row sm:gap-8"
            >
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[var(--background)] bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-xs font-bold text-white"
                    >
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <span className="font-[family-name:var(--font-instrument)] text-sm">
                  <span className="font-semibold text-[var(--foreground)]">500K+</span> happy users
                </span>
              </div>

              <div className="hidden h-6 w-px bg-[var(--border)] sm:block" />

              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <svg key={i} className="h-4 w-4 fill-yellow-500" viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
                <span className="ml-1 font-[family-name:var(--font-instrument)] text-sm">
                  <span className="font-semibold text-[var(--foreground)]">4.9</span> rating
                </span>
              </div>

              <div className="hidden h-6 w-px bg-[var(--border)] sm:block" />

              <span className="font-[family-name:var(--font-instrument)] text-sm">
                <span className="font-semibold text-[var(--foreground)]">10M+</span> photos shared
              </span>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Antigravity particle overlay - visual only, pointer-events pass through to content */}
      <div className="pointer-events-none absolute inset-0 z-20 hidden sm:block">
        <Antigravity
          count={400}
          magnetRadius={10}
          ringRadius={7}
          waveSpeed={0.2}
          waveAmplitude={0.8}
          particleSize={0.8}
          lerpSpeed={0.04}
          color="#3B82F6"
          autoAnimate={false}
          particleVariance={0.6}
          rotationSpeed={0.05}
          depthFactor={0.8}
          pulseSpeed={2}
          fieldStrength={10}
        />
      </div>
    </section>
  )
}
