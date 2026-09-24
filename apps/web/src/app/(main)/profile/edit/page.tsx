'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/stores/auth'
import { updateProfile, updateUsername } from '@/lib/api/profile'

export default function EditProfilePage() {
  const router = useRouter()
  const profile = useAuthStore((s) => s.profile)
  const setProfile = useAuthStore((s) => s.setProfile)

  const [name, setName] = useState(profile?.name ?? '')
  const [username, setUsername] = useState(profile?.username ?? '')
  const [about, setAbout] = useState(profile?.about ?? '')
  const [serviceCity, setServiceCity] = useState(profile?.serviceCity ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!profile) {
    return <div className="h-40 w-full animate-pulse rounded-2xl bg-zinc-800/60" />
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      if (username && username !== profile.username) {
        await updateUsername(username)
      }
      await updateProfile({ name, about, serviceCity })
      setProfile({ ...profile, name, username, about, serviceCity })
      router.push('/profile')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-sm text-white/60">
        <Link href="/profile" className="inline-flex items-center gap-1 hover:text-white">
          <ChevronLeft size={14} aria-hidden /> Profile
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-white">Edit profile</h1>

      <form onSubmit={handleSave} className="space-y-4">
        <Field label="Display name" id="name">
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            className="w-full rounded-xl bg-white/5 px-4 py-3 text-white outline-none ring-1 ring-white/10 focus:ring-[var(--accent,_#ff4d6d)]"
          />
        </Field>

        <Field label="Username" id="username">
          <div className="flex items-center rounded-xl bg-white/5 ring-1 ring-white/10 focus-within:ring-[var(--accent,_#ff4d6d)]">
            <span className="px-3 text-white/50">@</span>
            <input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              maxLength={30}
              className="w-full bg-transparent py-3 pr-3 text-white outline-none"
            />
          </div>
        </Field>

        <Field label="About" id="about">
          <textarea
            id="about"
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            maxLength={500}
            rows={3}
            className="w-full rounded-xl bg-white/5 px-4 py-3 text-white outline-none ring-1 ring-white/10 focus:ring-[var(--accent,_#ff4d6d)]"
          />
        </Field>

        <Field label="Service city (optional)" id="city">
          <input
            id="city"
            value={serviceCity}
            onChange={(e) => setServiceCity(e.target.value)}
            maxLength={80}
            className="w-full rounded-xl bg-white/5 px-4 py-3 text-white outline-none ring-1 ring-white/10 focus:ring-[var(--accent,_#ff4d6d)]"
          />
        </Field>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--accent,_#ff4d6d)] px-5 py-3 text-sm font-semibold text-black disabled:opacity-60"
        >
          {saving && <Loader2 size={16} className="animate-spin" aria-hidden />}
          Save profile
        </button>
      </form>
    </div>
  )
}

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs uppercase tracking-wide text-white/45">
        {label}
      </label>
      {children}
    </div>
  )
}
