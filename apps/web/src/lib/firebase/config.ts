// Firebase configuration
// Replace with your Firebase project config or use environment variables

import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getAuth, Auth } from 'firebase/auth'
import { getFirestore, Firestore } from 'firebase/firestore'
import { getFunctions, Functions, connectFunctionsEmulator } from 'firebase/functions'
import { configureLootClient } from '@loot/shared'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

// Lazy initialization (call these functions only on client side)
let app: FirebaseApp | undefined
let auth: Auth | undefined
let db: Firestore | undefined
let functions: Functions | undefined

function getFirebaseApp(): FirebaseApp {
  if (typeof window === 'undefined') {
    throw new Error('Firebase cannot be initialized on the server')
  }

  if (!app) {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig)
    } else {
      app = getApps()[0]
    }
  }
  return app
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp())
  }
  return auth
}

export function getFirebaseDb(): Firestore {
  if (!db) {
    db = getFirestore(getFirebaseApp())
  }
  return db
}

export function getFirebaseFunctions(): Functions {
  if (!functions) {
    functions = getFunctions(getFirebaseApp(), 'asia-south1')

    // Connect to emulators in development
    if (
      process.env.NODE_ENV === 'development' &&
      process.env.NEXT_PUBLIC_USE_EMULATORS === 'true'
    ) {
      connectFunctionsEmulator(functions, 'localhost', 5001)
    }
  }
  return functions
}

import { getStorage, FirebaseStorage, connectStorageEmulator } from 'firebase/storage'

let storage: FirebaseStorage | undefined

export function getFirebaseStorage(): FirebaseStorage {
  if (!storage) {
    storage = getStorage(getFirebaseApp())

    // Connect to emulators in development
    if (
      process.env.NODE_ENV === 'development' &&
      process.env.NEXT_PUBLIC_USE_EMULATORS === 'true'
    ) {
      connectStorageEmulator(storage, 'localhost', 9199)
    }
  }
  return storage
}

// Hand the lazy getters to @loot/shared so its API client uses this app's
// Firebase instances. Nothing is initialized until the first API call.
configureLootClient({
  getFunctions: getFirebaseFunctions,
  getDb: getFirebaseDb,
  getCurrentUserId: () => getFirebaseAuth().currentUser?.uid ?? null,
})

// Legacy exports for backwards compatibility (will throw on server)
export const firebaseApp =
  typeof window !== 'undefined' ? getFirebaseApp() : (undefined as unknown as FirebaseApp)
export const firebaseAuth =
  typeof window !== 'undefined' ? getFirebaseAuth() : (undefined as unknown as Auth)
export const firebaseDb =
  typeof window !== 'undefined' ? getFirebaseDb() : (undefined as unknown as Firestore)
export const firebaseFunctions =
  typeof window !== 'undefined' ? getFirebaseFunctions() : (undefined as unknown as Functions)
