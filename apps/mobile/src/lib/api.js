// Wires @loot/shared's API client to this app: which API to call and where the session
// tokens live (expo-secure-store, never AsyncStorage). Imported once for its side effect.

import { configureLootClient } from '@loot/shared';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * The machine running Metro also runs the API in development, so default to its address:
 * a phone on the same Wi-Fi reaches it by LAN IP, the Android emulator via 10.0.2.2.
 * Set EXPO_PUBLIC_API_URL to override (staging, a tunnel, production).
 */
function defaultApiUrl() {
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  if (host && host !== 'localhost' && host !== '127.0.0.1')
    return `http://${host}:4000`;
  return Platform.OS === 'android'
    ? 'http://10.0.2.2:4000'
    : 'http://localhost:4000';
}

export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL || defaultApiUrl()
).replace(/\/+$/, '');

const SESSION_KEY = 'loot_session';

// SecureStore is async and per-install. A read failure means "signed out", never a crash.
const tokenStore = {
  async get() {
    try {
      const raw = await SecureStore.getItemAsync(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  async set(tokens) {
    try {
      if (tokens)
        await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(tokens));
      else await SecureStore.deleteItemAsync(SESSION_KEY);
    } catch {
      // the session just won't persist
    }
  },
};

/** Set by the auth provider so an expired refresh token signs the user out everywhere. */
const listeners = new Set();
export function onSessionExpired(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

configureLootClient({
  baseUrl: API_URL,
  tokenStore,
  onSessionExpired: () => listeners.forEach((listener) => listener()),
});

/** The current access token, for the Socket.io handshake. */
export async function currentAccessToken() {
  return (await tokenStore.get())?.accessToken ?? null;
}
