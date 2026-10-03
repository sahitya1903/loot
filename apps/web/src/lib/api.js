// Wires @loot/shared's API client to this app: which API to call and where the
// session tokens live. Imported once for its side effect by components/providers.

import { configureLootClient } from '@loot/shared'
import { useAuthStore } from '@/stores/auth'

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

const SESSION_KEY = 'loot_session'

// localStorage is shared by every tab, so a token refreshed in one tab is seen
// by the others. Storage can be unavailable (SSR, private mode) — treat that
// as signed out.
const tokenStore = {
  get() {
    try {
      const raw = window.localStorage.getItem(SESSION_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  },
  set(tokens) {
    try {
      if (tokens) window.localStorage.setItem(SESSION_KEY, JSON.stringify(tokens))
      else window.localStorage.removeItem(SESSION_KEY)
    } catch {
      // ignore: the session just won't persist
    }
  },
}

configureLootClient({
  baseUrl: API_URL,
  tokenStore,
  onSessionExpired: () => useAuthStore.getState().reset(),
})
