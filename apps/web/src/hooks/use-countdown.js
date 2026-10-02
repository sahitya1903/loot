'use client'

import { useEffect, useState } from 'react'
import { countdown } from '@loot/shared/ranking'

/**
 * Tick a countdown for an `expiryAt` timestamp. Throttled to 1Hz.
 *
 * The tier (`normal | warm | urgent | expired`) drives card visuals — see
 * `LootCountdown` and `LootCard`.
 */
export function useCountdown(expiryAt) {
  const [state, setState] = useState(() => countdown(expiryAt))

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
