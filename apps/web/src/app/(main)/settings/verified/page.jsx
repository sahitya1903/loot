'use client'

// Verified badge — for Loot, verification is part of business onboarding,
// not a paid badge purchase. TODO(loot): wire this to `submitVerification`
// in `@loot/shared/api` (business.js) for pro accounts.

import Link from 'next/link'
import { ChevronLeft, BadgeCheck } from 'lucide-react'

export default function VerifiedPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-white/60">
        <Link href="/settings" className="inline-flex items-center gap-1 hover:text-white">
          <ChevronLeft size={14} aria-hidden /> Settings
        </Link>
      </div>
      <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
        <BadgeCheck size={22} className="text-[var(--accent,_#ff4d6d)]" aria-hidden />
        Business verification
      </h1>
      <p className="text-sm text-white/55">
        For Loot, verification is part of business onboarding. Submit your business documents from
        the pro dashboard to start the review.
      </p>
      <Link
        href="/pro/dashboard"
        className="inline-flex w-fit rounded-full bg-[var(--accent,_#ff4d6d)] px-5 py-2 text-sm font-semibold text-black"
      >
        Open dashboard
      </Link>
    </div>
  )
}
