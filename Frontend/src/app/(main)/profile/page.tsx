'use client'

import Link from 'next/link'
import { useAuthStore } from '@/stores/auth'
import { useGeo } from '@/hooks/use-geo'
import { Settings, ChevronRight, BadgeCheck, MapPin } from 'lucide-react'

export default function ProfilePage() {
  const profile = useAuthStore((s) => s.profile)
  const business = useAuthStore((s) => s.business)
  const { coords, status } = useGeo()

  if (!profile) {
    return <div className="h-40 w-full animate-pulse rounded-2xl bg-zinc-800/60" />
  }

  const isPro = profile.accountType === 'professional'

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-4 rounded-2xl bg-[var(--surface,_#161618)] p-4 ring-1 ring-white/5">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-white/10">
          {profile.profilePicture ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.profilePicture} alt={profile.name} className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-xl font-bold text-white/70">
              {profile.name.slice(0, 1).toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="flex items-center gap-1 text-lg font-bold text-white">
            <span className="truncate">{profile.name || profile.username}</span>
            {isPro && business?.verified && (
              <BadgeCheck size={16} className="text-[var(--accent,_#ff4d6d)]" aria-label="Verified" />
            )}
          </h1>
          <div className="text-sm text-white/55">@{profile.username}</div>
          {isPro && business && (
            <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-[var(--accent,_#ff4d6d)]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--accent,_#ff4d6d)]">
              Business
            </div>
          )}
        </div>
        <Link href="/settings" className="rounded-full p-2 text-white/70 hover:bg-white/5" aria-label="Settings">
          <Settings size={20} />
        </Link>
      </header>

      {profile.about && <p className="text-sm text-white/85">{profile.about}</p>}

      <section className="grid grid-cols-3 gap-2 text-center text-xs">
        <Stat label="Following" value={profile.followingCount} />
        <Stat label="Saved" value={profile.savesCount} />
        <Stat label="Claimed" value={profile.claimsCount} />
      </section>

      <section className="space-y-2">
        {coords ? (
          <div className="flex items-center gap-2 rounded-xl bg-white/5 p-3 text-xs text-white/65">
            <MapPin size={14} className="text-[var(--accent,_#ff4d6d)]" aria-hidden />
            <span>Loot near {profile.serviceCity || 'your location'}</span>
            <span className="ml-auto opacity-60">{coords.lat.toFixed(2)}, {coords.lng.toFixed(2)}</span>
          </div>
        ) : status === 'denied' ? (
          <div className="rounded-xl bg-amber-500/10 p-3 text-xs text-amber-300">
            Location off — your feed will be empty until you allow it in settings.
          </div>
        ) : null}

        <ProfileLink href="/saved" label="Saved loot" />
        <ProfileLink href="/claims" label="My claims" />
        {isPro ? (
          <>
            <ProfileLink href="/pro/dashboard" label="Pro dashboard" />
            <ProfileLink href="/pro/branches" label="Branches" />
          </>
        ) : (
          <ProfileLink href="/onboarding/professional" label="Switch to a professional account" accent />
        )}
        <ProfileLink href="/profile/edit" label="Edit profile" />
      </section>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-white/5 p-3">
      <div className="text-base font-semibold text-white">{value}</div>
      <div className="mt-0.5 uppercase tracking-wide text-[10px] text-white/45">{label}</div>
    </div>
  )
}

function ProfileLink({ href, label, accent = false }: { href: string; label: string; accent?: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm transition ${
        accent
          ? 'bg-[var(--accent,_#ff4d6d)]/10 text-[var(--accent,_#ff4d6d)] hover:bg-[var(--accent,_#ff4d6d)]/20'
          : 'bg-white/5 text-white hover:bg-white/10'
      }`}
    >
      {label}
      <ChevronRight size={16} aria-hidden />
    </Link>
  )
}
