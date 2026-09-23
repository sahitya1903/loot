'use client'

import { motion, useReducedMotion, useInView } from 'framer-motion'
import { useRef } from 'react'
import {
  sectionReveal,
  scatteredReveal,
  ambientFloat,
  ambientFloatOffset,
  viewportConfig,
  duration,
  avatarPulse,
  typingDot,
} from '@/lib/motion'
import { MeshGradient } from '@/components/ui/MeshGradient'

const avatars = [
  { id: 1, name: 'Alex', message: 'Hey! 👋', x: '10%', y: '15%', delay: 0 },
  { id: 2, name: 'Maya', message: 'Love these photos!', x: '75%', y: '10%', delay: 1 },
  { id: 3, name: 'Jordan', message: 'Amazing event! 🎉', x: '5%', y: '55%', delay: 2 },
  { id: 4, name: 'Sam', message: '', x: '85%', y: '50%', delay: 3, typing: true },
  { id: 5, name: 'Taylor', message: 'Beautiful memories ❤️', x: '20%', y: '80%', delay: 4 },
  { id: 6, name: 'Riley', message: 'Thanks for sharing!', x: '70%', y: '75%', delay: 5 },
]

export function ConnectedSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, viewportConfig)
  const shouldReduceMotion = useReducedMotion()

  return (
    <section ref={ref} className="relative overflow-hidden px-4 py-20 sm:px-6 sm:py-32 lg:py-44">
      {/* Mesh gradient background */}
      <MeshGradient
        colors={['var(--primary)', 'var(--accent)', '#7c3aed', '#10b981']}
        opacity={0.06}
      />

      {/* Floating Avatars with staggered entrance */}
      {avatars.map((avatar, index) => (
        <motion.div
          key={avatar.id}
          custom={avatar.delay}
          variants={scatteredReveal}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="absolute hidden sm:block"
          style={{ left: avatar.x, top: avatar.y }}
        >
          <motion.div
            animate={
              shouldReduceMotion ? undefined : index % 2 === 0 ? ambientFloat : ambientFloatOffset
            }
            className="flex items-center gap-2"
          >
            {/* Avatar with pulse */}
            <motion.div
              animate={shouldReduceMotion ? undefined : avatarPulse}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] font-[family-name:var(--font-instrument)] text-sm font-semibold text-white shadow-lg transition-shadow hover:shadow-xl"
              whileHover={shouldReduceMotion ? undefined : { scale: 1.15 }}
            >
              {avatar.name[0]}
            </motion.div>

            {/* Message bubble or typing indicator */}
            <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 shadow-md">
              {'typing' in avatar && avatar.typing ? (
                <div className="flex items-center gap-1 px-1 py-0.5">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      custom={i}
                      variants={typingDot}
                      initial="hidden"
                      animate={isInView ? 'visible' : 'hidden'}
                      className="h-1.5 w-1.5 rounded-full bg-[var(--muted)]"
                    />
                  ))}
                </div>
              ) : (
                <span className="font-[family-name:var(--font-instrument)] text-xs whitespace-nowrap text-[var(--foreground)]">
                  {avatar.message}
                </span>
              )}
            </div>
          </motion.div>
        </motion.div>
      ))}

      {/* Central Message with section reveal */}
      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <motion.p
          variants={sectionReveal}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          transition={{ delay: duration.normal }}
          className="px-2 font-[family-name:var(--font-instrument)] text-xl leading-relaxed font-medium text-[var(--foreground)] sm:text-2xl md:text-3xl lg:text-[40px]"
        >
          With Loot, you can{' '}
          <span className="bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] bg-clip-text font-semibold text-transparent">
            share freely
          </span>{' '}
          and feel close to the most important people in your life, no matter where they are.
        </motion.p>
      </div>
    </section>
  )
}
