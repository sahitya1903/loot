'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform, useReducedMotion, useSpring } from 'framer-motion'
import { Camera, Share2, Heart, type LucideIcon } from 'lucide-react'
import { SplitText } from '@/components/ui/SplitText'
import { sectionReveal, viewportConfig } from '@/lib/motion'

interface Step {
  number: string
  title: string
  description: string
  icon: LucideIcon
  gradient: string
  glow: string
  color: string
}

const steps: Step[] = [
  {
    number: '01',
    title: 'Create an Event',
    description:
      'Set up your event in seconds — add details, pick a theme, and get a unique sharing link ready to send.',
    icon: Camera,
    gradient: 'from-[var(--primary)] to-blue-400',
    glow: 'rgba(68,109,229,0.35)',
    color: 'var(--primary)',
  },
  {
    number: '02',
    title: 'Share the Link',
    description:
      'Send one link to all your guests. They upload photos instantly — no app download needed.',
    icon: Share2,
    gradient: 'from-[var(--accent)] to-emerald-400',
    glow: 'rgba(56,211,255,0.3)',
    color: 'var(--accent)',
  },
  {
    number: '03',
    title: 'Relive Together',
    description:
      'Browse a stunning shared gallery, download favourites, and relive every magical moment together.',
    icon: Heart,
    gradient: 'from-violet-500 to-pink-500',
    glow: 'rgba(139,92,246,0.3)',
    color: '#8b5cf6',
  },
]

export function HowItWorks() {
  const containerRef = useRef<HTMLDivElement>(null)
  const shouldReduceMotion = useReducedMotion()

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 0.8', 'end 0.2'],
  })

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 60,
    damping: 20,
  })

  // For non-sticky mobile layout, just show all steps normally
  return (
    <section ref={containerRef} className="relative px-4 py-20 sm:px-6 sm:py-28 lg:py-36">
      <div className="mx-auto max-w-5xl">
        {/* Section header */}
        <motion.div
          variants={sectionReveal}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          className="mb-16 text-center sm:mb-24"
        >
          <span className="mb-5 inline-block rounded-full border border-[var(--primary)]/20 bg-[var(--primary)]/10 px-4 py-1.5 font-[family-name:var(--font-instrument)] text-xs font-semibold tracking-widest text-[var(--primary)] uppercase">
            How It Works
          </span>
          <SplitText
            text="Three simple steps"
            mode="word"
            staggerDelay={0.08}
            trigger="inView"
            tag="h2"
            className="mb-4 font-[family-name:var(--font-instrument)] text-3xl font-bold text-[var(--foreground)] sm:text-4xl lg:text-5xl"
          />
          <p className="mx-auto max-w-xl font-[family-name:var(--font-instrument)] text-base text-[var(--muted)] sm:text-lg">
            From event creation to lasting memories — it only takes a minute.
          </p>
        </motion.div>

        {/* Two-column layout: left sticky number, right scroll steps */}
        <div className="grid grid-cols-1 items-start gap-16 lg:grid-cols-[1fr_2fr] lg:gap-24">
          {/* Left: large animated step number — sticky on desktop */}
          <div className="sticky top-1/3 hidden lg:block">
            <motion.div className="relative select-none">
              {steps.map((step, i) => {
                return (
                  <motion.div
                    key={step.number}
                    className="absolute inset-0 flex items-center justify-center"
                    animate={{
                      opacity: shouldReduceMotion ? 1 : undefined,
                    }}
                  >
                    <ScrollNumber
                      step={step}
                      index={i}
                      total={steps.length}
                      scrollProgress={smoothProgress}
                    />
                  </motion.div>
                )
              })}
              {/* Spacer to hold height */}
              <div className="mx-auto aspect-square w-full max-w-[280px]" />
            </motion.div>
          </div>

          {/* Right: steps flow */}
          <StepList steps={steps} scrollProgress={smoothProgress} />
        </div>
      </div>
    </section>
  )
}

function ScrollNumber({
  step,
  index,
  total,
  scrollProgress,
}: {
  step: Step
  index: number
  total: number
  scrollProgress: ReturnType<typeof useSpring>
}) {
  const band = 1 / total
  const start = index * band
  const end = start + band

  const opacity = useTransform(
    scrollProgress,
    [start - 0.05, start + 0.05, end - 0.05, end + 0.05],
    [0, 1, 1, 0]
  )
  const scale = useTransform(scrollProgress, [start, start + 0.1, end - 0.1, end], [0.7, 1, 1, 0.7])
  const y = useTransform(scrollProgress, [start, start + 0.1, end - 0.1, end], [30, 0, 0, -30])

  return (
    <motion.div style={{ opacity, scale, y }} className="text-center">
      <div
        className={`bg-gradient-to-br font-[family-name:var(--font-instrument)] text-[180px] leading-none font-black ${step.gradient} bg-clip-text text-transparent`}
        style={{ filter: `drop-shadow(0 0 40px ${step.glow})` }}
      >
        {step.number}
      </div>
      <motion.div
        className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${step.gradient} mx-auto mt-4 flex items-center justify-center shadow-2xl`}
        style={{ boxShadow: `0 0 30px 6px ${step.glow}` }}
      >
        {(() => {
          const Icon = step.icon
          return <Icon className="h-7 w-7 text-white" />
        })()}
      </motion.div>
    </motion.div>
  )
}

function StepList({
  steps,
  scrollProgress,
}: {
  steps: Step[]
  scrollProgress: ReturnType<typeof useSpring>
}) {
  return (
    <div>
      {steps.map((step, i) => (
        <ScrollDrivenStep
          key={step.number}
          step={step}
          index={i}
          total={steps.length}
          progressMotion={scrollProgress}
        />
      ))}
    </div>
  )
}

function ScrollDrivenStep({
  step,
  index,
  total,
  progressMotion,
}: {
  step: Step
  index: number
  total: number
  progressMotion: ReturnType<typeof useSpring>
}) {
  const band = 1 / total
  const start = index * band
  const end = start + band

  // Animate opacity and x based on scroll
  const opacity = useTransform(
    progressMotion,
    [start - 0.05, start + 0.1, end, end + 0.05],
    [0.25, 1, 1, 0.25]
  )
  const x = useTransform(progressMotion, [start - 0.1, start + 0.1], [-16, 0])
  const lineH = useTransform(progressMotion, [start, end], ['0%', '100%'])
  const iconScale = useTransform(
    progressMotion,
    [start, start + 0.1, end - 0.1, end],
    [0.85, 1.1, 1.1, 0.85]
  )
  const iconGlow = useTransform(progressMotion, [start, start + 0.1, end - 0.1, end], [0, 1, 1, 0])

  return (
    <motion.div className="flex items-start gap-6 sm:gap-8" style={{ opacity }}>
      {/* Icon column */}
      <div className="flex flex-shrink-0 flex-col items-center">
        <motion.div
          className={`relative h-14 w-14 rounded-2xl bg-gradient-to-br sm:h-16 sm:w-16 ${step.gradient} flex items-center justify-center`}
          style={{
            scale: iconScale,
            boxShadow: useTransform(iconGlow, (g) => `0 0 ${g * 32}px ${g * 8}px ${step.glow}`),
          }}
        >
          {(() => {
            const Icon = step.icon
            return <Icon className="h-6 w-6 text-white sm:h-7 sm:w-7" />
          })()}
        </motion.div>

        {/* Connector line */}
        {index < total - 1 && (
          <div className="mt-2 h-20 w-0.5 overflow-hidden rounded-full bg-[var(--foreground)]/10 sm:h-24">
            <motion.div
              className={`w-full bg-gradient-to-b ${step.gradient} rounded-full`}
              style={{ height: lineH }}
            />
          </div>
        )}
      </div>

      {/* Content */}
      <motion.div className="flex-1 pb-12 sm:pb-16" style={{ x }}>
        <span
          className="mb-2 inline-block font-[family-name:var(--font-instrument)] text-xs font-bold tracking-widest uppercase"
          style={{ color: step.color }}
        >
          Step {step.number}
        </span>
        <h3 className="mb-3 font-[family-name:var(--font-instrument)] text-2xl leading-tight font-bold text-[var(--foreground)] sm:text-3xl">
          {step.title}
        </h3>
        <p className="max-w-md font-[family-name:var(--font-instrument)] text-base leading-relaxed text-[var(--muted)]">
          {step.description}
        </p>
      </motion.div>
    </motion.div>
  )
}
