import 'server-only'
import { initializeApp, getApps, cert, type AppOptions } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

// You should set these env vars in your Vercel project settings
// or .env.local for local development.
// For service account, we often use specific ENV vars for safety.
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : null

const FIREBASE_ADMIN_APP_NAME = 'loot-backend'

function getFirebaseAdminApp() {
  const existingApp = getApps().find((app) => app.name === FIREBASE_ADMIN_APP_NAME)
  if (existingApp) {
    return existingApp
  }

  const config: AppOptions = {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  }

  if (serviceAccount) {
    config.credential = cert(serviceAccount)
  }

  return initializeApp(config, FIREBASE_ADMIN_APP_NAME)
}

const adminApp = getFirebaseAdminApp()

export const adminAuth = getAuth(adminApp)
export const adminDb = getFirestore(adminApp)
