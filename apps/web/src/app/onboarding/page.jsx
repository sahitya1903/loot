'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Compass, Building2, ChevronRight, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks'
import { useAuthStore } from '@/stores/auth'
import { chooseAccountType } from '@loot/shared/api'

function OnboardingContent() {
  const router = useRouter()
  const params = useSearchParams()
  const redirect = params.get('redirect')
  const { clearNewUserFlag } = useAuth()
  const setProfile = useAuthStore((s) => s.setProfile)
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)

  // Everyone starts as a personal account. A business account is created by setting up the
  // business itself (the Android app, for now), so "I run a business" only shows how.
  const choose = async (choice) => {
    setError(null)
    setBusy(choice)
    try {
      const { user } = await chooseAccountType({ accountType: 'personal' })
      setProfile(user)
      clearNewUserFlag()
      if (choice === 'business') {
        router.push('/pro/dashboard')
      } else {
        router.push(redirect && redirect !== '/onboarding' ? redirect : '/feed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong, please try again')
      setBusy(null)
    }
  }

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col justify-center gap-6 px-6">
      <header className="space-y-2 text-center">
        <h1 className="bg-gradient-to-br from-[var(--accent,_#ff4d6d)] to-[var(--accent-2,_#c4ff3b)] bg-clip-text text-4xl font-black tracking-tight text-transparent">
          Welcome to Loot
        </h1>
        <p className="text-sm text-white/65">
          Pick how you want to use Loot. You can switch later.
        </p>
      </header>

      <div className="space-y-3">
        <Choice
          title="I'm here to discover"
          body="Find what's dropping near you — claim, save, share."
          icon={<Compass size={22} className="text-[var(--accent,_#ff4d6d)]" aria-hidden />}
          loading={busy === 'discover'}
          disabled={!!busy}
          onClick={() => choose('discover')}
        />
        <Choice
          title="I run a business"
          body="Drop loot to nearby people. Set up in the Loot Android app."
          icon={<Building2 size={22} className="text-[var(--accent-2,_#c4ff3b)]" aria-hidden />}
          loading={busy === 'business'}
          disabled={!!busy}
          onClick={() => choose('business')}
        />
      </div>

      {error && <p className="text-center text-sm text-red-400">{error}</p>}
    </main>
  )
}

function Choice({ title, body, icon, loading, disabled, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center gap-3 rounded-2xl bg-[var(--surface,_#161618)] p-4 text-left ring-1 ring-white/5 transition hover:bg-white/5 disabled:opacity-60"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/5">
        {icon}
      </span>
      <span className="flex-1">
        <span className="block text-base font-semibold text-white">{title}</span>
        <span className="block text-sm text-white/55">{body}</span>
      </span>
      {loading ? (
        <Loader2 size={18} className="animate-spin text-white/70" aria-hidden />
      ) : (
        <ChevronRight size={18} className="text-white/40" aria-hidden />
      )}
    </button>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={null}>
      <OnboardingContent />
    </Suspense>
  )
}
