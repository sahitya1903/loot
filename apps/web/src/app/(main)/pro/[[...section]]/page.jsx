'use client'

// Placeholder for every /pro/* route (dashboard, create, analytics, branches)
// until the business tools are built — see .claude/tasks/backend-rewrite/TODO.md.
// Replace with real routes as each one lands.

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Building2 } from 'lucide-react'
import { useAuthStore } from '@/stores/auth'

const TITLES = {
  dashboard: 'Business dashboard',
  create: 'Create loot',
  analytics: 'Analytics',
  branches: 'Branches',
}

export default function ProComingSoonPage() {
  const { section } = useParams()
  const profile = useAuthStore((s) => s.profile)
  const title = TITLES[section?.[0]] ?? 'Business tools'
  const isPro = profile?.accountType === 'professional'

  return (
    <div className="space-y-4">
      <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
        <Building2 size={22} className="text-[var(--accent-2,_#c4ff3b)]" aria-hidden />
        {title}
      </h1>
      <p className="text-sm text-white/55">
        {isPro
          ? 'Business tools are on the way — soon you’ll drop loot, manage branches and see how your drops perform right here.'
          : 'Business tools are for professional accounts. Switching to a business account will be available here soon.'}
      </p>
      <Link
        href="/feed"
        className="inline-flex w-fit rounded-full bg-[var(--accent,_#ff4d6d)] px-5 py-2 text-sm font-semibold text-black"
      >
        Browse the feed
      </Link>
    </div>
  )
}
