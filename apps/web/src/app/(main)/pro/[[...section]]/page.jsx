'use client'

// Every /pro/* route (dashboard, create, analytics, branches) until the business tools are
// built on the web. Businesses set up and manage loot in the Android app for now, so this
// page explains how instead of leaving them at a dead end. A real route under pro/
// (e.g. pro/dashboard/page.jsx) takes precedence over this one.

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Building2, Loader2 } from 'lucide-react'
import { chooseAccountType } from '@loot/shared/api'
import { useAuthStore } from '@/stores/auth'

const TITLES = {
  dashboard: 'Business dashboard',
  create: 'Create loot',
  analytics: 'Analytics',
  branches: 'Branches',
}

const ANDROID_APP_URL = process.env.NEXT_PUBLIC_ANDROID_APP_URL

const primaryButton =
  'inline-flex w-fit items-center gap-2 rounded-full bg-[var(--accent,_#ff4d6d)] px-5 py-2 text-sm font-semibold text-black disabled:opacity-60'
const secondaryButton =
  'inline-flex w-fit rounded-full bg-white/10 px-5 py-2 text-sm font-semibold text-white'

function AppSteps() {
  return (
    <ol className="list-decimal space-y-1 pl-5 text-sm text-white/70">
      <li>Open the Loot Android app and sign in with this phone number.</li>
      <li>
        Go to <span className="font-semibold text-white">Profile</span> →{' '}
        <span className="font-semibold text-white">Set up a business account</span>.
      </li>
      <li>Add your business and first branch, then publish loot. It shows up here for everyone.</li>
    </ol>
  )
}

export default function ProPage() {
  const { section } = useParams()
  const profile = useAuthStore((s) => s.profile)
  const setProfile = useAuthStore((s) => s.setProfile)
  const [switching, setSwitching] = useState(false)
  const [error, setError] = useState(null)

  const title = TITLES[section?.[0]] ?? 'Business tools'
  const isPro = profile?.accountType === 'professional'
  const hasBusiness = isPro && !!profile?.businessId

  // A business account with no business (possible for accounts made by older web sign-ups)
  // can't claim loot or post any. Switching back lets them set up properly in the app.
  const switchToPersonal = async () => {
    setError(null)
    setSwitching(true)
    try {
      const { user } = await chooseAccountType({ accountType: 'personal' })
      setProfile(user)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong, please try again')
    } finally {
      setSwitching(false)
    }
  }

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
        <Building2 size={22} className="text-[var(--accent-2,_#c4ff3b)]" aria-hidden />
        {title}
      </h1>

      {hasBusiness ? (
        <>
          <p className="text-sm text-white/65">
            Create loot, redeem customers&apos; codes and manage branches in the Loot Android app.
            Business tools on the web are coming soon.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href={`/business/${profile.businessId}`} className={primaryButton}>
              View your business page
            </Link>
            {ANDROID_APP_URL && (
              <a href={ANDROID_APP_URL} className={secondaryButton}>
                Get the Android app
              </a>
            )}
          </div>
        </>
      ) : isPro ? (
        <>
          <p className="text-sm text-white/65">
            Your account is set as a business, but no business has been set up yet. Switch back to a
            personal account, then set up your business in the Loot Android app.
          </p>
          <AppSteps />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={switchToPersonal}
              disabled={switching}
              className={primaryButton}
            >
              {switching && <Loader2 size={16} className="animate-spin" aria-hidden />}
              Switch to a personal account
            </button>
            {ANDROID_APP_URL && (
              <a href={ANDROID_APP_URL} className={secondaryButton}>
                Get the Android app
              </a>
            )}
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
        </>
      ) : (
        <>
          <p className="text-sm text-white/65">
            Businesses post loot from the Loot Android app for now. Business tools on the web are
            coming soon.
          </p>
          <AppSteps />
          <div className="flex flex-wrap gap-2">
            {ANDROID_APP_URL && (
              <a href={ANDROID_APP_URL} className={primaryButton}>
                Get the Android app
              </a>
            )}
            <Link href="/feed" className={ANDROID_APP_URL ? secondaryButton : primaryButton}>
              Browse the feed
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
