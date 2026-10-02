import { cn } from '@/lib/utils'

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
export function PageHeader({ title, subtitle, actions, className, size = 'lg' }) {
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
