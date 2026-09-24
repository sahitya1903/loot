'use client'

// Affiliates — concept does not apply to Loot's discovery model.
// TODO(loot): if the team wants creator partnerships, rebuild against
// the loot-boost / pro-collaboration surface; legacy affiliate flow has
// been removed.

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default function AffiliatesPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-white/60">
        <Link href="/settings" className="inline-flex items-center gap-1 hover:text-white">
          <ChevronLeft size={14} aria-hidden /> Settings
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-white">Collaborators</h1>
      <p className="text-sm text-white/55">
        Loot doesn&apos;t use the legacy affiliate flow. Creator collaborations will be wired up
        through pro accounts in a future release.
      </p>
    </div>
  )
}
