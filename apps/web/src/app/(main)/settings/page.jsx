'use client'

// Loot — settings landing.
//
// This is a fresh, slim Loot-native settings page. The legacy 1900-line
// settings file (account whitelisting, legacy storage plans, affiliate
// invites, face liveness) was removed during the Loot migration; rebuild
// individual surfaces here as needed.

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  ChevronRight,
  LogOut,
  Bell,
  Shield,
  Trash2,
  CreditCard,
  FileBarChart,
  Ban,
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth'
import { signOut } from '@/lib/auth'

export default function SettingsPage() {
  const router = useRouter()
  const profile = useAuthStore((s) => s.profile)
  const [isSigningOut, setIsSigningOut] = useState(false)

  const isPro = profile?.accountType === 'professional'

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await signOut()
      router.push('/login')
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
      </header>

      <section>
        <SectionLabel>Account</SectionLabel>
        <Group>
          <Row href="/profile/edit" label="Edit profile" />
          {isPro ? (
            <Row
              href="/settings/subscription"
              label="Pro subscription"
              icon={<CreditCard size={16} />}
            />
          ) : (
            <Row href="/onboarding/professional" label="Become a business" accent />
          )}
        </Group>
      </section>

      <section>
        <SectionLabel>Notifications</SectionLabel>
        <Group>
          <Row href="/notifications" label="Notification log" icon={<Bell size={16} />} />
        </Group>
      </section>

      {isPro && (
        <section>
          <SectionLabel>Pro</SectionLabel>
          <Group>
            <Row href="/pro/dashboard" label="Pro dashboard" />
            <Row href="/pro/branches" label="Branch management" />
            <Row href="/pro/analytics" label="Analytics" />
            <Row href="/settings/reports" label="Reports" icon={<FileBarChart size={16} />} />
            <Row href="/settings/verified" label="Verified badge" icon={<Shield size={16} />} />
          </Group>
        </section>
      )}

      <section>
        <SectionLabel>Safety</SectionLabel>
        <Group>
          <Row href="/settings/blocked" label="Blocked accounts" icon={<Ban size={16} />} />
        </Group>
      </section>

      <section>
        <SectionLabel>Danger zone</SectionLabel>
        <Group>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="flex w-full items-center justify-between px-4 py-3 text-left text-sm text-white hover:bg-white/5"
          >
            <span className="inline-flex items-center gap-2">
              <LogOut size={16} aria-hidden />
              {isSigningOut ? 'Signing out…' : 'Sign out'}
            </span>
            <ChevronRight size={14} aria-hidden />
          </button>
          <button
            type="button"
            disabled
            className="flex w-full items-center justify-between border-t border-white/5 px-4 py-3 text-left text-sm text-red-400/70 hover:bg-white/5"
          >
            <span className="inline-flex items-center gap-2">
              <Trash2 size={16} aria-hidden />
              Delete account
            </span>
            <span className="text-xs text-white/40">contact support</span>
          </button>
        </Group>
      </section>
    </div>
  )
}

function SectionLabel({ children }) {
  return (
    <div className="mb-2 px-1 text-[11px] font-semibold tracking-wider text-white/40 uppercase">
      {children}
    </div>
  )
}

function Group({ children }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-[var(--surface,_#161618)] ring-1 ring-white/5 [&>*+*]:border-t [&>*+*]:border-white/5">
      {children}
    </div>
  )
}

function Row({ href, label, icon, accent = false }) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-between px-4 py-3 text-sm transition hover:bg-white/5 ${accent ? 'text-[var(--accent,_#ff4d6d)]' : 'text-white'}`}
    >
      <span className="inline-flex items-center gap-2">
        {icon}
        {label}
      </span>
      <ChevronRight size={14} aria-hidden />
    </Link>
  )
}
