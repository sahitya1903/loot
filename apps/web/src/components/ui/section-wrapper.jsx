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
 *
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @param {string} [props.id] HTML id — used for anchor links and scroll targets
 * @param {string} [props.className] Additional className on the section element
 * @param {'up' | 'left' | 'right' | 'scale' | false} [props.reveal] Scroll-reveal direction applied
 *   to this section's wrapper. Pass `false` to disable scroll reveal entirely. Defaults to `'up'`.
 * @param {1 | 2 | 3 | 4 | 5 | 6} [props.delay] Stagger delay index — applied when multiple
 *   SectionWrappers stack on the same page and you want them to cascade in.
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
