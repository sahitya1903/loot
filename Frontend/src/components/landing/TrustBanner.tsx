'use client'

import { motion, useReducedMotion, useInView } from 'framer-motion'
import Link from 'next/link'
import { useRef } from 'react'
import { ArrowRight, Shield, Lock, Heart } from 'lucide-react'
import {
  staggerContainer,
  headlineReveal,
  subtextReveal,
  ctaReveal,
  buttonInteraction,
  viewportConfig,
  stagger,
  ambientFloat,
  ambientFloatOffset,
  glowBorder,
} from '@/lib/motion'
import { SplitText } from '@/components/ui/SplitText'
import { MeshGradient } from '@/components/ui/MeshGradient'
import { useMagnetic } from '@/hooks/use-magnetic'

interface TrustBannerProps {
  ctaHref: string
}

const trustPoints = [
  { icon: Shield, label: 'Private by design' },
  { icon: Lock, label: 'Your data, your control' },
  { icon: Heart, label: 'Built with care' },
]

export function TrustBanner({ ctaHref }: TrustBannerProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, viewportConfig)
  const shouldReduceMotion = useReducedMotion()
  const [magneticRef, magneticStyle, magneticOnMouseMove, magneticOnMouseLeave] = useMagnetic({
    strength: 0.3,
  })

  const trustPointVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
        delay: i * stagger.fast,
      },
    }),
  }

  return (
    <section ref={ref} className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-24 lg:py-32">
      {/* Mesh gradient */}
      <MeshGradient
        colors={['#10b981', 'var(--primary)', 'var(--accent)', '#10b981']}
        opacity={0.06}
      />

      <div className="relative mx-auto max-w-6xl">
        <div className="grid items-center gap-8 sm:gap-12 lg:grid-cols-2 lg:gap-20">
          {/* Left: Trust indicators with floating icons & glow border */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
          >
            <div className="space-y-4 sm:space-y-6">
              {trustPoints.map((point, idx) => (
                <motion.div
                  key={point.label}
                  custom={idx}
                  variants={trustPointVariants}
                  className="group relative flex items-center gap-3 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-3 shadow-sm sm:gap-4 sm:p-4 dark:shadow-black/20"
                >
                  {/* Glowing border animation */}
                  <motion.div
                    className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    style={{
                      background:
                        'conic-gradient(from 0deg, transparent, var(--primary), var(--accent), transparent)',
                      filter: 'blur(8px)',
                    }}
                    animate={shouldReduceMotion ? undefined : glowBorder}
                  />
                  <div className="absolute inset-[1px] z-[1] rounded-[calc(var(--radius-lg)-1px)] bg-[var(--card)]" />

                  <motion.div
                    animate={
                      shouldReduceMotion
                        ? undefined
                        : idx % 2 === 0
                          ? ambientFloat
                          : ambientFloatOffset
                    }
                    className="relative z-[2] flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-gradient-to-br from-[var(--primary)]/25 to-[var(--accent)]/20 sm:h-12 sm:w-12"
                  >
                    <point.icon className="h-5 w-5 text-[var(--primary)]" />
                  </motion.div>
                  <span className="relative z-[2] font-[family-name:var(--font-instrument)] text-base font-medium text-[var(--foreground)] sm:text-lg">
                    {point.label}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right: Message with SplitText headline */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
          >
            <motion.div variants={headlineReveal}>
              <SplitText
                text="Your moments, always safe"
                mode="word"
                staggerDelay={0.08}
                trigger="inView"
                tag="h2"
                className="mb-5 font-[family-name:var(--font-instrument)] text-2xl leading-[1.2] font-bold tracking-tight text-[var(--foreground)] sm:text-3xl md:text-4xl lg:text-[42px]"
              />
            </motion.div>

            <motion.p
              variants={subtextReveal}
              className="mb-6 max-w-md font-[family-name:var(--font-instrument)] text-sm leading-relaxed text-[var(--muted)] sm:mb-8 sm:text-[17px]"
            >
              We believe your memories are precious. That&apos;s why we&apos;ve built Momento with
              privacy and security at its core. Share confidently, knowing you&apos;re always in
              control.
            </motion.p>

            <motion.div variants={ctaReveal}>
              <motion.div
                ref={magneticRef}
                style={magneticStyle}
                onMouseMove={magneticOnMouseMove}
                onMouseLeave={magneticOnMouseLeave}
                variants={buttonInteraction}
                initial="rest"
                whileHover={shouldReduceMotion ? undefined : 'hover'}
                whileTap={shouldReduceMotion ? undefined : 'tap'}
                className="inline-block"
              >
                <Link
                  href={ctaHref}
                  className="group inline-flex items-center gap-2 rounded-[var(--radius-full)] bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] px-7 py-3.5 font-[family-name:var(--font-instrument)] text-[15px] font-semibold text-white shadow-[var(--primary)]/25 shadow-lg transition-shadow duration-300 hover:shadow-[var(--primary)]/40"
                >
                  Start Capturing
                  <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-1" />
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
