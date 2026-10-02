'use client'

// Reports — pro-only loot reports / activity exports.
// TODO(loot): rebuild against the new pro analytics surface; legacy event-report
// PDF flow has been removed during the Loot migration.

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default function ReportsPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-white/60">
        <Link href="/settings" className="inline-flex items-center gap-1 hover:text-white">
          <ChevronLeft size={14} aria-hidden /> Settings
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-white">Reports</h1>
      <p className="text-sm text-white/55">
        Pro reports are getting a refresh — we&apos;re rebuilding around loot performance and claim
        funnels. Check the analytics dashboard in the meantime.
      </p>
      <Link
        href="/pro/analytics"
        className="inline-flex w-fit rounded-full bg-[var(--accent,_#ff4d6d)] px-5 py-2 text-sm font-semibold text-black"
      >
        Go to analytics
      </Link>
    </div>
  )
}
