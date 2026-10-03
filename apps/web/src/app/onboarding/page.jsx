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

  const choose = async (accountType) => {
    setError(null)
    setBusy(accountType)
    try {
      const { user } = await chooseAccountType({ accountType })
      setProfile(user)
      clearNewUserFlag()
      if (accountType === 'professional') {
        router.push('/pro/dashboard')
      } else {
        router.push(redirect && redirect !== '/onboarding' ? redirect : '/feed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set account type')
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
          loading={busy === 'personal'}
          disabled={!!busy}
          onClick={() => choose('personal')}
        />
        <Choice
          title="I run a business"
          body="Drop loot to nearby people. Track who shows up."
          icon={<Building2 size={22} className="text-[var(--accent-2,_#c4ff3b)]" aria-hidden />}
          loading={busy === 'professional'}
          disabled={!!busy}
          onClick={() => choose('professional')}
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
