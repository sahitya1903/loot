'use client'

// Blocked users — TODO(loot): rebuild against the new report/moderation surface.
// Loot has no chat, so the legacy "blocked from messaging" model doesn't apply.

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default function BlockedPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-white/60">
        <Link href="/settings" className="inline-flex items-center gap-1 hover:text-white">
          <ChevronLeft size={14} aria-hidden /> Settings
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-white">Blocked accounts</h1>
      <p className="text-sm text-white/55">
        Loot is rebuilding moderation around loot reports. Block-from-messaging doesn&apos;t apply
        here.
      </p>
    </div>
  )
}
