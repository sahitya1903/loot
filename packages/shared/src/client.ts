// Loot API client wiring.
//
// @loot/shared never initializes Firebase itself — web and mobile set Firebase
// up differently (web SDK vs React Native persistence, emulators, env vars).
// Each app calls `configureLootClient` once at startup and hands over lazy
// getters for its own instances.

import { httpsCallable, type Functions } from 'firebase/functions'
import type { Firestore } from 'firebase/firestore'

export interface LootClientConfig {
  /** Functions instance for region asia-south1. */
  getFunctions: () => Functions
  getDb: () => Firestore
  /** uid of the signed-in user, or null when signed out. */
  getCurrentUserId: () => string | null
}

let config: LootClientConfig | null = null

export function configureLootClient(next: LootClientConfig): void {
  config = next
}

export function getLootClient(): LootClientConfig {
  if (!config) {
    throw new Error('@loot/shared: call configureLootClient() before using the API')
  }
  return config
}

/** Call a Loot Cloud Function by name. */
export async function callFunction<TRequest, TResponse>(
  functionName: string,
  data: TRequest
): Promise<TResponse> {
  const callable = httpsCallable<TRequest, TResponse>(getLootClient().getFunctions(), functionName)
  try {
    const result = await callable(data)
    return result.data
  } catch (error) {
    console.error(`[Function ${functionName}] Error:`, error)
    throw error
  }
}
