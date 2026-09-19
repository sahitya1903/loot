'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion'
import { Star, ChevronLeft, ChevronRight } from 'lucide-react'
import { SplitText } from '@/components/ui/SplitText'
import { sectionReveal, viewportConfig } from '@/lib/motion'

interface Testimonial {
  name: string
  role: string
  avatar: string
  quote: string
  rating: number
}

const testimonials: Testimonial[] = [
  {
    name: 'Priya Sharma',
    role: 'Wedding Planner',
    avatar: 'PS',
    quote:
      'Momento transformed how we collect wedding photos. Guests upload in real-time and the couple gets a beautiful gallery instantly.',
    rating: 5,
  },
  {
    name: 'James Chen',
    role: 'Event Coordinator',
    avatar: 'JC',
    quote:
      'We used Momento for a 500-person corporate gala. The shared link made it effortless — no app installs, just memories.',
    rating: 5,
  },
  {
    name: 'Aisha Patel',
    role: 'Photographer',
    avatar: 'AP',
    quote:
      'As a photographer, I love how beautifully Momento presents galleries. My clients are always impressed by the experience.',
    rating: 5,
  },
  {
    name: 'Marcus Rivera',
    role: 'Birthday Party Host',
    avatar: 'MR',
    quote:
      "My daughter's birthday party photos were all in one place within minutes. The face recognition feature is incredible!",
    rating: 5,
  },
  {
    name: 'Sophie Laurent',
    role: 'Travel Blogger',
    avatar: 'SL',
    quote:
      'Group trips are 10x better with Momento. Everyone contributes their best shots and we relive the journey together.',
    rating: 5,
  },
  {
    name: 'David Kim',
    role: 'Startup Founder',
    avatar: 'DK',
    quote:
      "We use Momento for every team offsite. It's become our go-to for capturing company culture moments.",
    rating: 4,
  },
]

const AUTO_ADVANCE_MS = 5000

const gradientColors = [
  'from-[var(--primary)] to-blue-400',
  'from-[var(--accent)] to-emerald-400',
  'from-violet-500 to-pink-500',
  'from-amber-400 to-orange-500',
  'from-rose-500 to-fuchsia-500',
  'from-cyan-400 to-blue-500',
]

export function TestimonialCarousel() {
  const shouldReduceMotion = useReducedMotion()
  const [active, setActive] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startAutoAdvance = useCallback(() => {
    intervalRef.current = setInterval(() => {
      setActive((prev) => (prev + 1) % testimonials.length)
    }, AUTO_ADVANCE_MS)
  }, [])

  const stopAutoAdvance = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
  }, [])

  useEffect(() => {
    startAutoAdvance()
    return stopAutoAdvance
  }, [startAutoAdvance, stopAutoAdvance])

  const goTo = (idx: number) => {
    stopAutoAdvance()
    setActive(idx)
    startAutoAdvance()
  }

  const prev = () => goTo((active - 1 + testimonials.length) % testimonials.length)
  const next = () => goTo((active + 1) % testimonials.length)

  const t = testimonials[active]

  return (
    <section className="relative px-4 py-20 sm:px-6 sm:py-28 lg:py-36">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <motion.div
          variants={sectionReveal}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          className="mb-14 text-center sm:mb-20"
        >
          <span className="mb-5 inline-block rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-1.5 font-[family-name:var(--font-instrument)] text-xs font-semibold tracking-widest text-violet-500 uppercase">
            Testimonials
          </span>
          <SplitText
            text="Loved by thousands"
            mode="word"
            staggerDelay={0.08}
            trigger="inView"
            tag="h2"
            className="mb-4 font-[family-name:var(--font-instrument)] text-3xl font-bold text-[var(--foreground)] sm:text-4xl lg:text-5xl"
          />
          <p className="mx-auto max-w-xl font-[family-name:var(--font-instrument)] text-base text-[var(--muted)] sm:text-lg">
            See what our community has to say about Momento.
          </p>
        </motion.div>

        {/* Card */}
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -24 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-8 text-center shadow-xl shadow-black/5 sm:p-12 dark:shadow-black/25"
            >
              {/* Avatar */}
              <div
                className={`mx-auto mb-6 h-16 w-16 rounded-full bg-gradient-to-br ${gradientColors[active % gradientColors.length]} flex items-center justify-center font-[family-name:var(--font-instrument)] text-xl font-bold text-white shadow-lg`}
              >
                {t.avatar}
              </div>

              {/* Stars */}
              <div className="mb-5 flex justify-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${i < t.rating ? 'fill-yellow-500 text-yellow-500' : 'text-[var(--border)]'}`}
                  />
                ))}
              </div>

              {/* Quote */}
              <p className="mx-auto mb-6 max-w-2xl font-[family-name:var(--font-instrument)] text-lg leading-relaxed text-[var(--foreground)] sm:text-xl lg:text-2xl">
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Author */}
              <p className="font-[family-name:var(--font-instrument)] font-semibold text-[var(--foreground)]">
                {t.name}
              </p>
              <p className="font-[family-name:var(--font-instrument)] text-sm text-[var(--muted)]">
                {t.role}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Navigation arrows */}
          <button
            onClick={prev}
            aria-label="Previous testimonial"
            className="absolute top-1/2 left-0 flex h-10 w-10 -translate-x-3 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] text-[var(--muted)] shadow-md transition-all duration-150 hover:border-[var(--primary)]/50 hover:text-[var(--primary)] sm:-translate-x-6 dark:shadow-black/30"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            aria-label="Next testimonial"
            className="absolute top-1/2 right-0 flex h-10 w-10 translate-x-3 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] text-[var(--muted)] shadow-md transition-all duration-150 hover:border-[var(--primary)]/50 hover:text-[var(--primary)] sm:translate-x-6 dark:shadow-black/30"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Dots */}
        <div className="mt-8 flex justify-center gap-2">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to testimonial ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === active
                  ? 'w-8 bg-[var(--primary)]'
                  : 'w-2 bg-[var(--foreground)]/20 hover:bg-[var(--foreground)]/40'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
