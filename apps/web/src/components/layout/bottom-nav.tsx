'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Compass, Map, Bookmark, Ticket, User, LayoutDashboard, Plus, BarChart3, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth'

const PERSONAL_NAV = [
  { href: '/feed', icon: Compass, label: 'Feed' },
  { href: '/nearby', icon: Map, label: 'Nearby' },
  { href: '/saved', icon: Bookmark, label: 'Saved' },
  { href: '/claims', icon: Ticket, label: 'Claims' },
  { href: '/profile', icon: User, label: 'Profile' },
]

const PRO_NAV = [
  { href: '/pro/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/pro/create', icon: Plus, label: 'Create' },
  { href: '/pro/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/pro/branches', icon: Building2, label: 'Branches' },
  { href: '/profile', icon: User, label: 'Profile' },
]

const VISIBLE_PREFIXES = [
  '/feed',
  '/nearby',
  '/saved',
  '/claims',
  '/profile',
  '/pro',
]

export function BottomNav() {
  const pathname = usePathname()
  const profile = useAuthStore((s) => s.profile)
  const isPro = profile?.accountType === 'professional'

  const items = isPro ? PRO_NAV : PERSONAL_NAV
  const isVisible = VISIBLE_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))
  if (!isVisible) return null

  return (
    <nav
      className="fixed bottom-3 left-3 right-3 z-50 flex h-[58px] items-center justify-around rounded-full bg-[var(--surface,_#161618)]/90 px-2 backdrop-blur lg:hidden"
      style={{ boxShadow: '0 8px 30px -10px rgba(0,0,0,0.5)' }}
    >
      {items.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex h-[44px] w-[44px] flex-col items-center justify-center gap-0.5 rounded-full transition-colors',
              isActive ? 'text-[var(--accent,_#ff4d6d)]' : 'text-white/60 hover:text-white',
            )}
            aria-label={item.label}
          >
            <Icon className="h-[22px] w-[22px]" aria-hidden />
            <span className="text-[9px] tracking-wide">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
