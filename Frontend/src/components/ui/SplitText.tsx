'use client'

import { motion, useReducedMotion, Variants } from 'framer-motion'
const motionTags = {
  h1: motion.h1,
  h2: motion.h2,
  h3: motion.h3,
  p: motion.p,
  span: motion.span,
  div: motion.div,
} as const

interface SplitTextProps {
  text: string
  mode?: 'char' | 'word'
  staggerDelay?: number
  className?: string
  charClassName?: string
  trigger?: 'inView' | 'immediate'
  tag?: 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'div'
}

const containerVariants: Variants = {
  hidden: {},
  visible: (staggerDelay: number) => ({
    transition: {
      staggerChildren: staggerDelay,
      delayChildren: 0,
    },
  }),
}

const charVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    rotateX: -60,
    filter: 'blur(4px)',
  },
  visible: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.5,
      ease: [0.77, 0, 0.175, 1],
    },
  },
}

export function SplitText({
  text,
  mode = 'word',
  staggerDelay,
  className = '',
  charClassName = '',
  trigger = 'inView',
  tag: Tag = 'div',
}: SplitTextProps) {
  const shouldReduceMotion = useReducedMotion()
  const MotionTag = motionTags[Tag]
  const delay = staggerDelay ?? (mode === 'char' ? 0.03 : 0.08)

  // Split text into units
  const units = mode === 'char' ? text.split('') : text.split(' ')

  if (shouldReduceMotion) {
    return <Tag className={className}>{text}</Tag>
  }

  return (
    <MotionTag
      className={`${className}`}
      style={{ perspective: '600px' }}
      variants={containerVariants}
      custom={delay}
      initial="hidden"
      {...(trigger === 'inView'
        ? { whileInView: 'visible', viewport: { once: true, amount: 0.5 } }
        : { animate: 'visible' })}
    >
      {units.map((unit, i) => (
        <motion.span
          key={`${unit}-${i}`}
          variants={charVariants}
          className={`inline-block ${unit === ' ' ? '' : charClassName}`}
          style={{
            transformOrigin: 'center bottom',
            ...(unit === ' ' ? { width: '0.3em' } : {}),
          }}
        >
          {unit === ' ' ? '\u00A0' : unit}
          {mode === 'word' && i < units.length - 1 && '\u00A0'}
        </motion.span>
      ))}
    </MotionTag>
  )
}
