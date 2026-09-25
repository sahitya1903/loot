// Firebase Auth utilities

import {
  signInWithPopup,
  linkWithPopup,
  unlink,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  signInWithCustomToken,
} from 'firebase/auth'
import { firebaseAuth } from './config'
import { callFunction } from '@loot/shared'
import type {
  SendOtpRequest,
  SendOtpResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
  SendEmailOtpRequest,
  SendEmailOtpResponse,
  VerifyEmailOtpRequest,
  VerifyEmailOtpResponse,
} from '@loot/shared/types'

// Google Sign-In
export async function signInWithGoogle(): Promise<User | null> {
  const provider = new GoogleAuthProvider()
  provider.addScope('email')

  try {
    const result = await signInWithPopup(firebaseAuth, provider)
    return result.user
  } catch (error) {
    console.error('Google sign-in error:', error)
    throw error
  }
}

// Apple Sign-In
export async function signInWithApple(): Promise<User | null> {
  const provider = new OAuthProvider('apple.com')
  provider.addScope('email')
  provider.addScope('name')

  try {
    const result = await signInWithPopup(firebaseAuth, provider)
    return result.user
  } catch (error) {
    console.error('Apple sign-in error:', error)
    throw error
  }
}

// Link Google to existing account
export async function linkWithGoogle(): Promise<User | null> {
  const currentUser = firebaseAuth.currentUser
  if (!currentUser) throw new Error('No user signed in')
  const provider = new GoogleAuthProvider()
  provider.addScope('email')
  const result = await linkWithPopup(currentUser, provider)
  return result.user
}

// Unlink an OAuth provider from the current account (client-side, updates local cache)
export async function unlinkProvider(providerId: 'google.com' | 'apple.com'): Promise<User> {
  const currentUser = firebaseAuth.currentUser
  if (!currentUser) throw new Error('No user signed in')
  return unlink(currentUser, providerId)
}

// Link Apple to existing account
export async function linkWithApple(): Promise<User | null> {
  const currentUser = firebaseAuth.currentUser
  if (!currentUser) throw new Error('No user signed in')
  const provider = new OAuthProvider('apple.com')
  provider.addScope('email')
  provider.addScope('name')
  const result = await linkWithPopup(currentUser, provider)
  return result.user
}

// Phone Sign-In - Step 1: Send OTP via WhatsApp (primary) or Firebase SMS (fallback)
// Track which method was used for verification
let currentOtpMethod: 'firebase' | 'whatsapp' | null = null
let confirmationResultForOtp: ConfirmationResult | null = null

export async function sendPhoneOtp(
  phoneNumber: string
): Promise<{ success: boolean; method: 'firebase' | 'whatsapp'; error?: string }> {
  // Reset state
  currentOtpMethod = null
  confirmationResultForOtp = null

  try {
    // Try WhatsApp OTP first
    const response = await callFunction<SendOtpRequest, SendOtpResponse>('sendWhatsappOtp', {
      phoneNumber,
    })

    if (response.success) {
      currentOtpMethod = 'whatsapp'
      return { success: true, method: 'whatsapp' }
    }

    // WhatsApp returned failure — fall through to Firebase SMS fallback
    throw new Error(response.errorMessage || 'Failed to send OTP')
  } catch (whatsappError) {
    console.log('WhatsApp OTP failed, trying Firebase SMS fallback:', whatsappError)

    // Try Firebase SMS fallback (requires reCAPTCHA)
    try {
      // Initialize invisible reCAPTCHA if not exists
      if (!recaptchaVerifier) {
        // Create a temporary container for reCAPTCHA
        let recaptchaContainer = document.getElementById('recaptcha-container')
        if (!recaptchaContainer) {
          recaptchaContainer = document.createElement('div')
          recaptchaContainer.id = 'recaptcha-container'
          document.body.appendChild(recaptchaContainer)
        }
        recaptchaVerifier = new RecaptchaVerifier(firebaseAuth, 'recaptcha-container', {
          size: 'invisible',
        })
      }

      confirmationResultForOtp = await signInWithPhoneNumber(
        firebaseAuth,
        phoneNumber,
        recaptchaVerifier
      )
      currentOtpMethod = 'firebase'
      return { success: true, method: 'firebase' }
    } catch (firebaseError) {
      console.error('Firebase SMS also failed:', firebaseError)
      // Reset reCAPTCHA on failure
      clearRecaptcha()
      return {
        success: false,
        method: 'firebase',
        error:
          firebaseError instanceof Error
            ? firebaseError.message
            : 'Failed to send OTP via both methods',
      }
    }
  }
}

// Phone Sign-In - Step 2: Verify OTP using the method that was used to send
export async function verifyPhoneOtp(phoneNumber: string, otp: string): Promise<User | null> {
  try {
    if (currentOtpMethod === 'firebase' && confirmationResultForOtp) {
      // Verify using Firebase
      const result = await confirmationResultForOtp.confirm(otp)
      return result.user
    } else if (currentOtpMethod === 'whatsapp') {
      // Verify using WhatsApp custom token
      const response = await callFunction<VerifyOtpRequest, VerifyOtpResponse>(
        'verifyWhatsappOtp',
        {
          phoneNumber,
          otp,
        }
      )

      if (response.success && response.token) {
        const result = await signInWithCustomToken(firebaseAuth, response.token)
        return result.user
      }

      throw new Error(response.errorMessage || 'OTP verification failed')
    } else {
      throw new Error('No OTP method selected. Please request a new OTP.')
    }
  } catch (error) {
    console.error('Verify OTP error:', error)
    throw error
  } finally {
    // Always clean up reCAPTCHA after verification attempt
    clearRecaptcha()
    // Reset OTP state
    currentOtpMethod = null
    confirmationResultForOtp = null
  }
}

// SMS Sign-In fallback (requires reCAPTCHA)
let recaptchaVerifier: RecaptchaVerifier | null = null
let confirmationResult: ConfirmationResult | null = null

// Helper to clear reCAPTCHA verifier and remove badge from DOM
function clearRecaptcha(): void {
  if (recaptchaVerifier) {
    try {
      recaptchaVerifier.clear()
    } catch {
      // Ignore clear errors
    }
    recaptchaVerifier = null
  }
  // Remove the reCAPTCHA container if it exists
  const container = document.getElementById('recaptcha-container')
  if (container) {
    container.remove()
  }
  // Remove the floating reCAPTCHA badge (grecaptcha-badge)
  const badges = document.querySelectorAll('.grecaptcha-badge')
  badges.forEach((badge) => badge.remove())
  // Also clean up any leftover grecaptcha iframes
  const iframes = document.querySelectorAll('iframe[src*="recaptcha"]')
  iframes.forEach((iframe) => iframe.remove())
}

export function initRecaptcha(buttonId: string): RecaptchaVerifier {
  if (!recaptchaVerifier) {
    recaptchaVerifier = new RecaptchaVerifier(firebaseAuth, buttonId, {
      size: 'invisible',
    })
  }
  return recaptchaVerifier
}

export async function sendSmsOtp(phoneNumber: string): Promise<boolean> {
  if (!recaptchaVerifier) {
    throw new Error('reCAPTCHA not initialized')
  }

  try {
    confirmationResult = await signInWithPhoneNumber(firebaseAuth, phoneNumber, recaptchaVerifier)
    return true
  } catch (error) {
    console.error('SMS OTP error:', error)
    throw error
  }
}

export async function verifySmsOtp(code: string): Promise<User | null> {
  if (!confirmationResult) {
    throw new Error('No confirmation result')
  }

  try {
    const result = await confirmationResult.confirm(code)
    return result.user
  } catch (error) {
    console.error('SMS verify error:', error)
    throw error
  }
}

// Email Sign-In - Step 1: Send OTP via SES
export async function sendEmailLoginOtp(
  email: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await callFunction<SendEmailOtpRequest, SendEmailOtpResponse>('sendEmailOtp', {
      email,
    })
    if (response.success) {
      return { success: true }
    }
    return { success: false, error: response.errorMessage || 'Failed to send OTP' }
  } catch (error) {
    console.error('Email OTP send error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send OTP' }
  }
}

// Email Sign-In - Step 2: Verify OTP and sign in
export async function verifyEmailLoginOtp(email: string, otp: string): Promise<User | null> {
  try {
    const response = await callFunction<VerifyEmailOtpRequest, VerifyEmailOtpResponse>(
      'verifyEmailOtp',
      {
        email,
        otp,
      }
    )

    if (response.success && response.token) {
      const result = await signInWithCustomToken(firebaseAuth, response.token)
      return result.user
    }

    throw new Error(response.errorMessage || 'OTP verification failed')
  } catch (error) {
    console.error('Email OTP verify error:', error)
    throw error
  }
}

// Sign Out
export async function signOut(): Promise<void> {
  await firebaseSignOut(firebaseAuth)
}

// Auth State Observer
export function onAuthStateChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(firebaseAuth, callback)
}

// Get current user
export function getCurrentUser(): User | null {
  return firebaseAuth.currentUser
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  return !!firebaseAuth.currentUser
}
