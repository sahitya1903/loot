import { cn } from '@/lib/utils'

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
