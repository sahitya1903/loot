import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface PageHeaderProps {
  /** Primary heading — rendered in Playfair Display */
  title: ReactNode
  /** Optional subtitle — rendered in Instrument Sans, muted */
  subtitle?: ReactNode
  /** Optional slot for action buttons / controls on the right */
  actions?: ReactNode
  /** Additional className on the wrapper */
  className?: string
  /**
   * Size variant.
   * - `lg` (default) — large hero-style heading (h1), used for top-level pages
   * - `md` — medium section heading (h2), used inside nested views
   */
  size?: 'lg' | 'md'
}

/**
 * PageHeader
 *
 * Standardised page-level heading block used across all app pages.
 * Applies Playfair Display for the title and Instrument Sans for the
 * subtitle, keeping typography consistent with the landing page system.
 *
 * The wrapper carries the `.sr.sr-up` scroll-reveal classes so it
 * animates in automatically when `useScrollReveal` is active on the
 * layout.
 */
export function PageHeader({ title, subtitle, actions, className, size = 'lg' }: PageHeaderProps) {
  const isLg = size === 'lg'

  return (
    <div className={cn('sr sr-up mb-6 flex flex-col gap-1 lg:mb-8', className)}>
      <div className="flex items-start justify-between gap-4">
        {isLg ? (
          <h1
            className={cn(
              'font-playfair leading-tight font-bold tracking-tight text-[var(--foreground)]',
              'text-[28px] lg:text-[34px]'
            )}
          >
            {title}
          </h1>
        ) : (
          <h2
            className={cn(
              'font-playfair leading-tight font-bold tracking-tight text-[var(--foreground)]',
              'text-2xl lg:text-3xl'
            )}
          >
            {title}
          </h2>
        )}

        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>

      {subtitle && (
        <p
          className={cn(
            'font-instrument text-[var(--muted)]',
            isLg ? 'text-base lg:text-lg' : 'text-sm lg:text-base'
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  )
}
