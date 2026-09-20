'use client'

import { useState } from 'react'
import { useClaimLoot, useSaveLoot, useShareLoot } from '@/hooks/use-loot'
import { Bookmark, Send, Sparkles } from 'lucide-react'
import clsx from 'clsx'

interface Props {
  lootId: string
  initialSaved?: boolean
  initialClaimed?: boolean
  disabled?: boolean
  onClaimed?: () => void
}

export function LootActions({ lootId, initialSaved = false, initialClaimed = false, disabled = false, onClaimed }: Props) {
  const [saved, setSaved] = useState(initialSaved)
  const [claimed, setClaimed] = useState(initialClaimed)

  const claim = useClaimLoot()
  const save = useSaveLoot()
  const share = useShareLoot()

  const handleClaim = async () => {
    if (claimed || disabled) return
    await claim.mutateAsync(lootId)
    setClaimed(true)
    onClaimed?.()
  }

  const handleSave = async () => {
    const next = !saved
    setSaved(next)
    try {
      await save.mutateAsync({ lootId, save: next })
    } catch {
      setSaved(!next)
    }
  }

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/loot/${lootId}` : ''
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ url, title: 'Check this loot' })
        await share.mutateAsync({ lootId, channel: 'native' })
      } catch {
        /* dismissed */
      }
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(url)
      await share.mutateAsync({ lootId, channel: 'copy_link' })
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleClaim}
        disabled={disabled || claimed || claim.isPending}
        className={clsx(
          'inline-flex flex-1 items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold tracking-tight transition-all',
          'bg-[var(--accent,_#ff4d6d)] text-black hover:brightness-110 active:scale-[0.98]',
          'disabled:opacity-60 disabled:cursor-not-allowed',
          claimed && 'bg-emerald-500/90',
        )}
      >
        <Sparkles size={16} aria-hidden />
        {claimed ? 'Claimed' : 'Claim'}
      </button>

      <button
        type="button"
        onClick={handleSave}
        aria-pressed={saved}
        className={clsx(
          'inline-flex h-10 w-10 items-center justify-center rounded-full border transition-all active:scale-[0.95]',
          saved
            ? 'border-[var(--accent,_#ff4d6d)] bg-[var(--accent,_#ff4d6d)]/10 text-[var(--accent,_#ff4d6d)]'
            : 'border-white/15 text-white hover:bg-white/5',
        )}
      >
        <Bookmark size={18} fill={saved ? 'currentColor' : 'none'} aria-hidden />
      </button>

      <button
        type="button"
        onClick={handleShare}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white hover:bg-white/5 active:scale-[0.95]"
        aria-label="Share loot"
      >
        <Send size={18} aria-hidden />
      </button>
    </div>
  )
}
