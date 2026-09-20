'use client'

import { useCountdown } from '@/hooks/use-countdown'
import type { FirebaseTimestamp } from '@/types'
import clsx from 'clsx'

interface Props {
  expiryAt: FirebaseTimestamp | number | null | undefined
  compact?: boolean
}

export function LootCountdown({ expiryAt, compact = false }: Props) {
  const { label, tier } = useCountdown(expiryAt)

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full font-medium tracking-tight',
        compact ? 'px-2 py-[2px] text-[11px]' : 'px-3 py-1 text-xs',
        tier === 'normal' && 'bg-white/10 text-white',
        tier === 'warm' && 'bg-[var(--urgency-amber,_#f5b300)]/15 text-[var(--urgency-amber,_#f5b300)]',
        tier === 'urgent' && 'bg-[var(--urgency-red,_#ff3b3b)]/20 text-[var(--urgency-red,_#ff5e5e)] animate-loot-pulse',
        tier === 'expired' && 'bg-zinc-700/40 text-zinc-400 line-through',
      )}
      data-tier={tier}
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {tier === 'expired' ? 'Expired' : tier === 'urgent' ? `Ends in ${label}` : label}
    </span>
  )
}
