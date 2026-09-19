import { cn } from '@/lib/utils'

export interface SectionWrapperProps {
  children: React.ReactNode
  /** HTML id — used for anchor links and scroll targets */
  id?: string
  /** Additional className on the section element */
  className?: string
  /**
   * Scroll-reveal direction applied to this section's wrapper.
   * Pass `false` to disable scroll reveal for a section entirely.
   * Defaults to `'up'`.
   */
  reveal?: 'up' | 'left' | 'right' | 'scale' | false
  /**
   * Stagger delay index (1–6) — applied when multiple SectionWrappers
   * stack on the same page and you want them to cascade in.
   */
  delay?: 1 | 2 | 3 | 4 | 5 | 6
}

const REVEAL_CLASS: Record<string, string> = {
  up: 'sr sr-up',
  left: 'sr sr-left',
  right: 'sr sr-right',
  scale: 'sr sr-scale',
}

/**
 * SectionWrapper
 *
 * Consistent vertical-rhythm and max-width container for page sections.
 * Carries scroll-reveal classes so content animates in automatically
 * when `useScrollReveal` is running at the layout level.
 *
 * Renders as a `<section>` element by default.
 */
export function SectionWrapper({
  children,
  id,
  className,
  reveal = 'up',
  delay,
}: SectionWrapperProps) {
  const revealCls = reveal ? REVEAL_CLASS[reveal] : ''
  const delayCls = delay ? `sr-delay-${delay}` : ''

  return (
    <section id={id} className={cn('py-6 lg:py-8', revealCls, delayCls, className)}>
      {children}
    </section>
  )
}
