'use client'

// Pro subscription plans — TODO(loot): rebuild against the new pro
// subscription Cloud Functions (`getProSubscriptionPlans`, `createProSubscription`,
// `cancelProSubscription`, `getProSubscriptionStatus`).
// Legacy storage-tier subscription has been removed.

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default function SubscriptionPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-white/60">
        <Link href="/settings" className="inline-flex items-center gap-1 hover:text-white">
          <ChevronLeft size={14} aria-hidden /> Settings
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-white">Pro subscription</h1>
      <p className="text-sm text-white/55">
        Pro subscription tiers (analytics, multi-branch, higher loot quota) are being wired up.
      </p>
    </div>
  )
}
