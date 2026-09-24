'use client'

import { useEffect, useState } from 'react'
import { countdown, type CountdownState } from '@/lib/ranking/format'
import type { FirebaseTimestamp } from '@/types'

/**
 * Tick a countdown for an `expiryAt` timestamp. Throttled to 1Hz.
 *
 * The tier (`normal | warm | urgent | expired`) drives card visuals — see
 * `LootCountdown` and `LootCard`.
 */
export function useCountdown(expiryAt: FirebaseTimestamp | number | null | undefined): CountdownState {
  const [state, setState] = useState<CountdownState>(() => countdown(expiryAt))

  useEffect(() => {
    setState(countdown(expiryAt))
    if (!expiryAt) return

    const id = window.setInterval(() => {
      setState((prev) => {
        if (prev.tier === 'expired') {
          window.clearInterval(id)
          return prev
        }
        return countdown(expiryAt)
      })
    }, 1000)
    return () => window.clearInterval(id)
  }, [expiryAt])

  return state
}
