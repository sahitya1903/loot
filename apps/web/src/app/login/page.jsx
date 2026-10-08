'use client'

import { Suspense, useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { ApiError } from '@loot/shared'
import { sendPhoneOtp, verifyPhoneOtp } from '@/lib/auth'
import { useAuth } from '@/hooks'
import { LoadingScreen, ThemeToggle, LandingCursor, LandingPreloader } from '@/components/ui'
import { LoginPolaroidCollage } from '@/components/login/LoginPolaroidCollage'

// Only follow same-site relative redirects (no `//evil.com` or absolute URLs).
function safeRedirect(url) {
  return url && url.startsWith('/') && !url.startsWith('//') ? url : '/'
}

// The API's messages are written for people; validation errors carry the
// specific field message in `details`.
function errorMessage(err, fallback) {
  if (err instanceof ApiError) return err.details?.[0]?.message ?? err.message
  return fallback
}

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectParam = searchParams.get('redirect')
  const nextUrl = safeRedirect(redirectParam)

  const { isAuthenticated, isInitialized, needsOnboarding } = useAuth()

  const [step, setStep] = useState('phone')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [countryCode] = useState('+91')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const otpRefs = useRef([])
  const fullNumber = `${countryCode}${phoneNumber.replace(/[\s-]/g, '')}`

  // Redirect once signed in (also covers arriving here with a live session).
  useEffect(() => {
    if (!isInitialized || !isAuthenticated) return
    if (needsOnboarding) {
      router.replace(`/onboarding?redirect=${encodeURIComponent(nextUrl)}`)
    } else {
      router.replace(nextUrl)
    }
  }, [isAuthenticated, isInitialized, needsOnboarding, router, nextUrl])

  const handleSendOtp = async () => {
    setIsLoading(true)
    setError('')
    try {
      await sendPhoneOtp(fullNumber)
      setOtp(['', '', '', '', '', ''])
      setStep('otp')
    } catch (err) {
      setError(errorMessage(err, 'Failed to send the code'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    setIsLoading(true)
    setError('')
    try {
      // Signs the user in; the redirect effect takes it from here.
      await verifyPhoneOtp(fullNumber, otp.join(''))
    } catch (err) {
      setError(errorMessage(err, 'Invalid code'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleOtpChange = (index, value) => {
    if (value.length > 1) value = value[0]
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    if (value && index < 5) otpRefs.current[index + 1]?.focus()
  }

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleBack = useCallback(() => {
    setError('')
    setStep('phone')
    setOtp(['', '', '', '', '', ''])
  }, [])

  if (!isInitialized || isAuthenticated) {
    return <LoadingScreen message="Checking authentication..." />
  }

  const isOtpComplete = otp.every((d) => d !== '')

  return (
    <div className="landing-page relative flex min-h-screen flex-col bg-[var(--ivory)] lg:flex-row">
      <LandingPreloader />
      <LandingCursor />

      {/* ── Left Panel — Desktop only ─────────────────────────────────────── */}
      <div className="login-left hidden lg:relative lg:flex lg:w-1/2 lg:overflow-hidden lg:bg-[var(--ivory)]">
        <div className="relative h-full w-full overflow-hidden">
          <LoginPolaroidCollage />
          <div className="login-left-fade" />
          <div className="login-left-headline">
            <p
              className="font-caveat mb-2 text-[20px] font-semibold text-[var(--rust)]"
              style={{ transform: 'rotate(-1.5deg)', display: 'block' }}
            >
              what&apos;s happening near you
            </p>
            <h2 className="font-playfair text-[34px] leading-[1] font-black tracking-[-0.04em] text-[var(--ink)]">
              Drops. Deals.
              <br />
              Right now.
            </h2>
          </div>
        </div>
      </div>

      {/* ── Right Panel — Auth form ───────────────────────────────────────── */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center bg-[var(--ivory)] p-6 lg:w-1/2">
        {/* Theme toggle (desktop) */}
        <div className="absolute top-6 right-6 hidden lg:block">
          <ThemeToggle />
        </div>

        <motion.div
          className="login-card w-full max-w-[420px]"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Back button */}
          {step !== 'phone' && (
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={handleBack}
              className="mb-4 flex items-center gap-2 text-[var(--ink-muted)] transition-colors hover:text-[var(--ink)]"
              style={{ cursor: 'none' }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="font-instrument text-[14px]">Back</span>
            </motion.button>
          )}

          {/* Mobile header */}
          <div className="mb-6 lg:hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-[36px] w-[36px]">
                  <Image src="/images/logo.svg" alt="Loot" width={36} height={36} priority />
                </div>
                <span className="font-instrument text-[22px] font-bold text-[var(--ink)]">
                  Loot
                </span>
              </div>
              <ThemeToggle />
            </div>
          </div>

          {/* Step heading */}
          <div className="mb-6">
            <h1 className="font-playfair text-[28px] font-bold tracking-tight text-[var(--ink)] lg:text-[30px]">
              {step === 'phone' ? 'Welcome back' : 'Enter OTP'}
            </h1>
            <p className="font-instrument mt-1.5 text-[15px] text-[var(--ink-muted)]">
              {step === 'phone'
                ? 'Sign in with your phone number — we send the code on WhatsApp'
                : `We sent a code to ${countryCode} ${phoneNumber}`}
            </p>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-instrument mb-4 rounded-[10px] bg-[var(--rust)]/10 p-3 text-[14px] text-[var(--rust)]"
            >
              {error}
            </motion.div>
          )}

          {/* ── Steps ───────────────────────────────────────────────────────── */}
          <AnimatePresence mode="wait">
            {step === 'phone' && (
              <motion.div
                key="phone"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-3"
              >
                {/* Phone combo input */}
                <div className="login-combo-input px-4">
                  <div className="flex items-center gap-2 border-r border-[var(--ink-subtle)] pr-3">
                    <span className="font-instrument text-[15px] text-[var(--ink)]">
                      🇮🇳 {countryCode}
                    </span>
                  </div>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === 'Enter' && phoneNumber.length >= 8 && handleSendOtp()
                    }
                    placeholder="Phone Number"
                    disabled={isLoading}
                    className="font-instrument flex-1 bg-transparent px-3 text-[15px] text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-none"
                  />
                </div>

                <button
                  onClick={handleSendOtp}
                  disabled={isLoading || phoneNumber.length < 8}
                  className="login-btn-primary"
                >
                  {isLoading ? <Spinner /> : 'Continue with Phone'}
                </button>
              </motion.div>
            )}

            {step === 'otp' && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div className="flex justify-between gap-2">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        otpRefs.current[index] = el
                      }}
                      type="text"
                      inputMode="numeric"
                      autoComplete={index === 0 ? 'one-time-code' : 'off'}
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="login-otp-box"
                    />
                  ))}
                </div>

                <button
                  onClick={handleVerifyOtp}
                  disabled={isLoading || !isOtpComplete}
                  className="login-btn-primary"
                >
                  {isLoading ? <Spinner /> : 'Verify OTP'}
                </button>

                <button
                  onClick={handleSendOtp}
                  disabled={isLoading}
                  className="font-instrument w-full text-center text-[14px] text-[var(--rust)] hover:underline"
                  style={{ cursor: 'none', background: 'none', border: 'none' }}
                >
                  Resend OTP
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <p className="font-instrument mt-5 text-center text-[12px] text-[var(--ink-muted)]">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingScreen message="Loading..." />}>
      <LoginContent />
    </Suspense>
  )
}
