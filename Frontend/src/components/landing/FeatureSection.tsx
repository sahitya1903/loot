'use client'

import { motion, useReducedMotion, useInView } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useRef } from 'react'
import { ArrowRight, Sparkles, Zap, Heart } from 'lucide-react'
import {
  staggerContainer,
  headlineReveal,
  subtextReveal,
  ctaReveal,
  visualReveal,
  ambientFloat,
  ambientFloatOffset,
  viewportConfig,
  linkInteraction,
} from '@/lib/motion'
import { SplitText } from '@/components/ui/SplitText'
import { TiltCard } from '@/components/ui/TiltCard'
import { ShineCard } from '@/components/ui/ShineCard'
import { useMagnetic } from '@/hooks/use-magnetic'

interface FeatureSectionProps {
  title: string
  description: string
  imageSrc: string
  imageAlt: string
  reverse?: boolean
  ctaText?: string
  ctaHref?: string
  accentIcon?: 'sparkles' | 'zap' | 'heart'
  highlightColor?: 'primary' | 'accent' | 'purple'
}

const iconMap = {
  sparkles: Sparkles,
  zap: Zap,
  heart: Heart,
}

const colorMap = {
  primary: {
    bg: 'from-[var(--primary)]/15 to-[var(--primary)]/8',
    border: 'border-[var(--primary)]/30',
    glow: 'bg-[var(--primary)]/25',
    text: 'text-[var(--primary)]',
  },
  accent: {
    bg: 'from-[var(--accent)]/15 to-[var(--accent)]/8',
    border: 'border-[var(--accent)]/30',
    glow: 'bg-[var(--accent)]/25',
    text: 'text-[var(--accent)]',
  },
  purple: {
    bg: 'from-violet-500/15 to-purple-500/8',
    border: 'border-violet-500/30',
    glow: 'bg-violet-500/25',
    text: 'text-violet-500',
  },
}

export function FeatureSection({
  title,
  description,
  imageSrc,
  imageAlt,
  reverse = false,
  ctaText,
  ctaHref,
  accentIcon = 'sparkles',
  highlightColor = 'primary',
}: FeatureSectionProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, viewportConfig)
  const shouldReduceMotion = useReducedMotion()
  const [magneticRef, magneticStyle, magneticOnMouseMove, magneticOnMouseLeave] = useMagnetic({
    strength: 0.2,
  })

  const Icon = iconMap[accentIcon]
  const colors = colorMap[highlightColor]

  // Decorative floating elements
  const floatingDots = [
    { size: 6, x: '15%', y: '20%', delay: 0 },
    { size: 4, x: '85%', y: '30%', delay: 0.5 },
    { size: 8, x: '10%', y: '70%', delay: 1 },
    { size: 5, x: '90%', y: '80%', delay: 1.5 },
  ]

  return (
    <section ref={ref} className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-28 lg:py-40">
      {/* Decorative floating dots */}
      {floatingDots.map((dot, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, scale: 0 }}
          animate={isInView ? { opacity: 0.6, scale: 1 } : {}}
          transition={{ duration: 0.5, delay: dot.delay }}
          className="absolute hidden lg:block"
          style={{ left: dot.x, top: dot.y }}
        >
          <motion.div
            animate={
              shouldReduceMotion ? undefined : idx % 2 === 0 ? ambientFloat : ambientFloatOffset
            }
            className={`w-${dot.size} h-${dot.size} rounded-full ${colors.glow} blur-sm`}
            style={{ width: dot.size * 4, height: dot.size * 4 }}
          />
        </motion.div>
      ))}

      {/* Decorative lines */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={isInView ? { opacity: 0.1, scaleX: 1 } : {}}
          transition={{ duration: 1, delay: 0.3 }}
          className={`absolute top-1/4 ${reverse ? 'right-0 origin-right' : 'left-0 origin-left'} h-px w-1/3 bg-gradient-to-r ${reverse ? 'from-transparent to-[var(--primary)]' : 'from-[var(--primary)] to-transparent'}`}
        />
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={isInView ? { opacity: 0.1, scaleX: 1 } : {}}
          transition={{ duration: 1, delay: 0.5 }}
          className={`absolute bottom-1/3 ${reverse ? 'left-0 origin-left' : 'right-0 origin-right'} h-px w-1/4 bg-gradient-to-r ${reverse ? 'from-[var(--accent)] to-transparent' : 'from-transparent to-[var(--accent)]'}`}
        />
      </div>

      <div className="relative mx-auto max-w-7xl">
        <div className={`grid items-center gap-8 sm:gap-10 lg:grid-cols-12 lg:gap-16`}>
          {/* Text Content - takes 5 columns */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            className={`lg:col-span-5 ${reverse ? 'lg:order-2 lg:col-start-8' : 'lg:order-1'}`}
          >
            {/* Feature badge */}
            <motion.div variants={subtextReveal} className="mb-6">
              <span
                className={`inline-flex items-center gap-2 rounded-full border bg-[var(--card)] px-4 py-2 ${colors.border} shadow-sm dark:shadow-black/20`}
              >
                <Icon className={`h-4 w-4 ${colors.text}`} />
                <span
                  className={`font-[family-name:var(--font-instrument)] text-sm font-medium ${colors.text}`}
                >
                  {accentIcon === 'sparkles'
                    ? 'Effortless'
                    : accentIcon === 'zap'
                      ? 'Real-time'
                      : 'Connected'}
                </span>
              </span>
            </motion.div>

            <motion.h2 variants={headlineReveal}>
              <SplitText
                text={title}
                mode="word"
                staggerDelay={0.06}
                trigger="inView"
                tag="span"
                className="mb-4 block font-[family-name:var(--font-instrument)] text-2xl leading-[1.15] font-bold tracking-tight text-[var(--foreground)] sm:mb-6 sm:text-3xl md:text-4xl lg:text-5xl"
              />
            </motion.h2>

            <motion.p
              variants={subtextReveal}
              className="mb-6 max-w-lg font-[family-name:var(--font-instrument)] text-base leading-relaxed text-[var(--muted)] sm:mb-8 sm:text-lg"
            >
              {description}
            </motion.p>

            {ctaText && ctaHref && (
              <motion.div variants={ctaReveal}>
                <motion.div
                  ref={magneticRef}
                  style={magneticStyle}
                  onMouseMove={magneticOnMouseMove}
                  onMouseLeave={magneticOnMouseLeave}
                  variants={linkInteraction}
                  initial="rest"
                  whileHover={shouldReduceMotion ? undefined : 'hover'}
                  className="inline-block"
                >
                  <Link
                    href={ctaHref}
                    className={`inline-flex items-center gap-2 px-6 py-3 font-[family-name:var(--font-instrument)] text-[15px] font-semibold ${colors.text} border bg-[var(--card)] ${colors.border} group rounded-full transition-shadow duration-300 hover:shadow-lg`}
                  >
                    {ctaText}
                    <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-1" />
                  </Link>
                </motion.div>
              </motion.div>
            )}
          </motion.div>

          {/* Visual - takes 7 columns with creative container */}
          <motion.div
            variants={visualReveal}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            className={`lg:col-span-7 ${reverse ? 'lg:order-1' : 'lg:order-2'}`}
          >
            <TiltCard className="relative" intensity={0.8}>
              {/* Glow effect behind image */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.8, delay: 0.2 }}
                className={`absolute -inset-2 sm:-inset-4 lg:-inset-8 ${colors.glow} rounded-3xl opacity-40 blur-3xl`}
              />

              {/* Main image container */}
              <div className="relative">
                {/* Decorative frame */}
                <div
                  className={`absolute -inset-1.5 rounded-3xl border sm:-inset-3 lg:-inset-6 ${colors.border} opacity-50`}
                />
                <div
                  className={`absolute -inset-0.5 rounded-2xl border border-[var(--border)] opacity-30 sm:-inset-1.5 lg:-inset-3`}
                />

                {/* Image with gradient overlay */}
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[var(--card)] shadow-2xl sm:aspect-[4/3] lg:aspect-[16/10] lg:rounded-2xl">
                  <Image
                    src={imageSrc}
                    alt={imageAlt}
                    fill
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="object-cover"
                  />

                  {/* Subtle gradient overlay */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent`}
                  />
                </div>

                {/* Floating stat cards */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  className="absolute top-1/4 -left-4 hidden md:block lg:-left-8"
                >
                  <motion.div animate={shouldReduceMotion ? undefined : ambientFloatOffset}>
                    <ShineCard className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 shadow-lg dark:shadow-black/40">
                      <div
                        className={`text-2xl font-bold ${colors.text} font-[family-name:var(--font-instrument)]`}
                      >
                        {accentIcon === 'sparkles' ? '10x' : accentIcon === 'zap' ? '< 1s' : '100+'}
                      </div>
                      <div className="font-[family-name:var(--font-instrument)] text-xs text-[var(--muted)]">
                        {accentIcon === 'sparkles'
                          ? 'Faster uploads'
                          : accentIcon === 'zap'
                            ? 'Sync time'
                            : 'Connections'}
                      </div>
                    </ShineCard>
                  </motion.div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.8 }}
                  className="absolute -right-4 bottom-1/4 hidden md:block lg:-right-8"
                >
                  <motion.div
                    animate={shouldReduceMotion ? undefined : ambientFloat}
                    className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 shadow-lg"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)]">
                        <span className="text-xs text-white">✓</span>
                      </div>
                      <div className="font-[family-name:var(--font-instrument)] text-sm font-medium text-[var(--foreground)]">
                        {accentIcon === 'sparkles'
                          ? 'Auto-organized'
                          : accentIcon === 'zap'
                            ? 'Always synced'
                            : 'Shared'}
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              </div>
            </TiltCard>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
