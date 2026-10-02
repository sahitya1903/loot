import { cn } from '@/lib/utils'

const REVEAL_CLASS = {
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
export function SectionWrapper({ children, id, className, reveal = 'up', delay }) {
  const revealCls = reveal ? REVEAL_CLASS[reveal] : ''
  const delayCls = delay ? `sr-delay-${delay}` : ''

  return (
    <section id={id} className={cn('py-6 lg:py-8', revealCls, delayCls, className)}>
      {children}
    </section>
  )
}
