// Loot API client wiring.
//
// @loot/shared never initializes Firebase itself — web and mobile set Firebase
// up differently (web SDK vs React Native persistence, emulators, env vars).
// Each app calls `configureLootClient` once at startup and hands over lazy
// getters for its own instances.

import { httpsCallable } from 'firebase/functions'

let config = null

export function configureLootClient(next) {
  config = next
}

export function getLootClient() {
  if (!config) {
    throw new Error('@loot/shared: call configureLootClient() before using the API')
  }
  return config
}

/** Call a Loot Cloud Function by name. */
export async function callFunction(functionName, data) {
  const callable = httpsCallable(getLootClient().getFunctions(), functionName)
  try {
    const result = await callable(data)
    return result.data
  } catch (error) {
    console.error(`[Function ${functionName}] Error:`, error)
    throw error
  }
}
