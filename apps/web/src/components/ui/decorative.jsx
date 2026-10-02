import { cn } from '@/lib/utils'

/** ✦ star glyph — decorative accent near headings */
export function StarGlyph({ className }) {
  return (
    <span
      aria-hidden="true"
      className={cn('font-caveat text-[var(--rust)] opacity-50 select-none', className)}
    >
      ✦
    </span>
  )
}

/** Thin fading rule divider with optional ✦ center glyph */
export function WashiDivider({ className, glyph = false }) {
  return (
    <div
      aria-hidden="true"
      className={cn('pointer-events-none flex items-center gap-3 select-none', className)}
    >
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--ink-subtle)] to-transparent" />
      {glyph && <span className="font-caveat text-[13px] text-[var(--rust)] opacity-40">✦</span>}
      {glyph && (
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--ink-subtle)] to-transparent" />
      )}
    </div>
  )
}

/** Washi tape strip — decorative amber/rust strip */
export function WashiTape({ color = 'amber', className }) {
  const bg =
    color === 'rust'
      ? 'bg-[color-mix(in_srgb,var(--rust)_55%,transparent)]'
      : 'bg-[color-mix(in_srgb,var(--amber)_55%,transparent)]'

  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none select-none',
        'h-[5px] w-[56px] rounded-sm',
        '-rotate-[1.5deg]',
        bg,
        className
      )}
    />
  )
}

/** Caveat handwritten sub-label */
export function HandLabel({ children, className }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'font-caveat inline-block -rotate-[1deg] text-[15px] text-[var(--rust)] opacity-70 select-none',
        className
      )}
    >
      {children}
    </span>
  )
}

/** Ambient corner blob — very subtle ink radial gradient */
export function AmbientBlob({ position = 'top-right', className }) {
  const posClass = {
    'top-right': '-top-20 -right-20',
    'top-left': '-top-20 -left-20',
    'bottom-right': '-bottom-20 -right-20',
    'bottom-left': '-bottom-20 -left-20',
  }[position]

  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute h-64 w-64 rounded-full select-none',
        'bg-[radial-gradient(circle,color-mix(in_srgb,var(--rust)_8%,transparent)_0%,transparent_70%)]',
        posClass,
        className
      )}
    />
  )
}

/** Polaroid-style image frame wrapper */
export function PolaroidFrame({ children, rotate = 0, className }) {
  return (
    <div
      className={cn(
        'bg-[var(--ivory)] p-2 pb-8',
        'shadow-[0_4px_20px_color-mix(in_srgb,var(--ink)_18%,transparent)]',
        'ring-1 ring-[var(--ink-subtle)]',
        'rounded-sm',
        className
      )}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      {children}
    </div>
  )
}
