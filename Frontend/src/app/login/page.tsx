'use client'

import { Suspense, useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import {
  signInWithGoogle,
  signInWithApple,
  sendPhoneOtp,
  verifyPhoneOtp,
  sendEmailLoginOtp,
  verifyEmailLoginOtp,
} from '@/lib/firebase/auth'
import { useAuth } from '@/hooks'
import { LoadingScreen, ThemeToggle, LandingCursor, LandingPreloader } from '@/components/ui'
import { SmartBanner } from '@/components/common/smart-banner'
import { LoginPolaroidCollage } from '@/components/login/LoginPolaroidCollage'
// Loot has no invite-key flow — businesses publish loot openly to nearby users.
// The legacy event-invite verification has been removed.

type LoginStep = 'initial' | 'otp' | 'name' | 'email' | 'email_otp'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get('redirect')

  const { isAuthenticated, isInitialized, needsOnboarding } = useAuth()

  const [step, setStep] = useState<LoginStep>('initial')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [countryCode] = useState('+91')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [fullName, setFullName] = useState('')
  const [emailAddress, setEmailAddress] = useState('')
  const [emailOtp, setEmailOtp] = useState(['', '', '', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Loot login has no invite-driven hero artwork; the polaroid collage
  // renders generic art directly. The legacy `invitedEvent`/`invitedEventCoverPhotos`
  // state is kept as a no-op for layout compatibility.
  const invitedEvent: null = null
  const invitedEventCoverPhotos: string[] = []
  const currentSlideIndex = 0

  const otpRefs = useRef<(HTMLInputElement | null)[]>([])
  const emailOtpRefs = useRef<(HTMLInputElement | null)[]>([])

  // Loot has no invite-driven onboarding flow.

  // Redirect if already authenticated
  useEffect(() => {
    if (!isInitialized) return
    if (isAuthenticated) {
      if (needsOnboarding) {
        const nextUrl =
          redirectUrl || (eventId && inviteKey ? `/events/${eventId}?inviteKey=${inviteKey}` : '/')
        router.replace(`/onboarding?redirect=${encodeURIComponent(nextUrl)}`)
      } else if (redirectUrl) {
        router.replace(redirectUrl)
      } else if (eventId && inviteKey) {
        router.replace(`/events/${eventId}?inviteKey=${inviteKey}`)
      } else {
        router.replace('/')
      }
    }
  }, [isAuthenticated, isInitialized, needsOnboarding, router, eventId, inviteKey, redirectUrl])

  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    setIsLoading(true)
    setError('')
    try {
      const user = provider === 'google' ? await signInWithGoogle() : await signInWithApple()
      if (user) {
        const nextUrl =
          redirectUrl || (eventId && inviteKey ? `/events/${eventId}?inviteKey=${inviteKey}` : '/')
        router.push(nextUrl)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendOtp = async () => {
    const fullNumber = `${countryCode}${phoneNumber.replace(/\s/g, '')}`
    setIsLoading(true)
    setError('')
    try {
      const result = await sendPhoneOtp(fullNumber)
      if (result.success) {
        setStep('otp')
      } else {
        setError(result.error || 'Failed to send OTP')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    const otpString = otp.join('')
    const fullNumber = `${countryCode}${phoneNumber.replace(/\s/g, '')}`
    setIsLoading(true)
    setError('')
    try {
      const user = await verifyPhoneOtp(fullNumber, otpString)
      if (user) {
        setStep('name')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid OTP')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value[0]
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    if (value && index < 5) otpRefs.current[index + 1]?.focus()
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleSendEmailOtp = async () => {
    setIsLoading(true)
    setError('')
    try {
      const result = await sendEmailLoginOtp(emailAddress.trim().toLowerCase())
      if (result.success) {
        setStep('email_otp')
      } else {
        setError(result.error || 'Failed to send OTP')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyEmailOtp = async () => {
    const otpString = emailOtp.join('')
    setIsLoading(true)
    setError('')
    try {
      const user = await verifyEmailLoginOtp(emailAddress.trim().toLowerCase(), otpString)
      if (user) {
        setStep('name')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid OTP')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value[0]
    if (!/^\d*$/.test(value)) return
    const newOtp = [...emailOtp]
    newOtp[index] = value
    setEmailOtp(newOtp)
    if (value && index < 5) emailOtpRefs.current[index + 1]?.focus()
  }

  const handleEmailOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !emailOtp[index] && index > 0) {
      emailOtpRefs.current[index - 1]?.focus()
    }
  }

  const handleBack = useCallback(() => {
    setError('')
    if (step === 'otp') {
      setStep('initial')
      setOtp(['', '', '', '', '', ''])
    } else if (step === 'name') {
      setStep('otp')
    } else if (step === 'email_otp') {
      setStep('email')
      setEmailOtp(['', '', '', '', '', ''])
    } else if (step === 'email') {
      setStep('initial')
    }
  }, [step])

  const handleFinish = async () => {
    setIsLoading(true)
    try {
      const nextUrl =
        redirectUrl || (eventId && inviteKey ? `/events/${eventId}?inviteKey=${inviteKey}` : '/')
      router.push(nextUrl)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isInitialized || isAuthenticated) {
    return <LoadingScreen message="Checking authentication..." />
  }

  const isOtpComplete = otp.every((d) => d !== '')

  // Polaroid rotation cycles through slight angles on slide change
  const polRotations = [-3, 2, -1.5, 3, -2]
  const polRot = polRotations[currentSlideIndex % polRotations.length]

  return (
    <div className="landing-page relative flex min-h-screen flex-col bg-[var(--ivory)] lg:flex-row">
      <LandingPreloader />
      <LandingCursor />
      <SmartBanner
        eventId={eventId || undefined}
        inviteKey={inviteKey || undefined}
        redirectUrl={redirectUrl || undefined}
      />

      {/* ── Mobile background slideshow (invited event only) ─────────────── */}
      {invitedEvent && (
        <div className="absolute inset-0 z-0 overflow-hidden lg:hidden">
          {invitedEventCoverPhotos.map((photo, index) => (
            <motion.div
              key={photo}
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{
                opacity: index === currentSlideIndex ? 1 : 0,
                zIndex: index === currentSlideIndex ? 1 : 0,
              }}
              transition={{ opacity: { duration: 2, ease: 'easeInOut' } }}
            >
              <Image
                src={photo}
                alt="Event Cover"
                fill
                sizes="100vw"
                className="object-cover"
                priority
              />
            </motion.div>
          ))}
          <div className="absolute inset-0 z-10 bg-black/55 backdrop-blur-[2px]" />
        </div>
      )}

      {/* ── Left Panel — Desktop only ─────────────────────────────────────── */}
      <div className="login-left hidden lg:relative lg:flex lg:w-1/2 lg:overflow-hidden lg:bg-[var(--ivory)]">
        {invitedEvent ? (
          /* Invited event: oversized polaroid with cover slideshow */
          <div className="relative flex h-full w-full items-center justify-center">
            <motion.div
              className="login-event-pol"
              animate={{ rotate: polRot }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* amber washi tape */}
              <div
                className="l-tape l-tape-solid"
                style={{
                  ['--tape-col' as string]: 'rgba(212,168,67,.78)',
                  position: 'absolute',
                  width: '88px',
                  top: '-10px',
                  left: '32%',
                  transform: 'rotate(-3deg)',
                  zIndex: 10,
                }}
              >
                <div className="l-tape-inner" />
              </div>

              {/* Cover photo slideshow */}
              <div className="login-event-pol-media">
                <AnimatePresence mode="wait">
                  {invitedEventCoverPhotos.length > 0 ? (
                    <motion.div
                      key={currentSlideIndex}
                      className="absolute inset-0"
                      initial={{ opacity: 0, scale: 1.04 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1.2, ease: 'easeInOut' }}
                    >
                      <Image
                        src={invitedEventCoverPhotos[currentSlideIndex]}
                        alt={invitedEvent.name}
                        fill
                        sizes="(min-width: 1024px) 50vw, 100vw"
                        className="object-cover"
                        priority
                      />
                    </motion.div>
                  ) : (
                    /* Placeholder when no cover photos */
                    <div
                      className="absolute inset-0"
                      style={{
                        background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                      }}
                    />
                  )}
                </AnimatePresence>
              </div>

              {/* Event name caption */}
              <span className="login-event-pol-cap">{invitedEvent.name}</span>
            </motion.div>

            {/* "You're invited to" label */}
            <div className="absolute right-0 bottom-14 left-0 text-center">
              <p
                className="font-caveat text-[20px] font-semibold text-[var(--ink)]/70"
                style={{ transform: 'rotate(-1deg)' }}
              >
                You&apos;re invited to
              </p>
              {invitedEvent.description && (
                <p className="font-instrument mx-auto mt-2 line-clamp-2 max-w-[280px] text-[14px] text-[var(--ink)]/50">
                  {invitedEvent.description}
                </p>
              )}
            </div>
          </div>
        ) : (
          /* Normal: polaroid collage + headline overlay */
          <div className="relative h-full w-full overflow-hidden">
            <LoginPolaroidCollage />
            <div className="login-left-fade" />
            <div className="login-left-headline">
              <p
                className="font-caveat mb-2 text-[20px] font-semibold text-[var(--rust)]"
                style={{ transform: 'rotate(-1.5deg)', display: 'block' }}
              >
                capture every moment
              </p>
              <h2 className="font-playfair text-[34px] leading-[1] font-black tracking-[-0.04em] text-[var(--ink)]">
                People. Memories.
                <br />
                Connections.
              </h2>
            </div>
          </div>
        )}
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
          {step !== 'initial' && (
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
            {invitedEvent ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-[24px] w-[24px]">
                      <Image src="/images/logo.png" alt="Momento" width={24} height={24} priority />
                    </div>
                    <span className="font-instrument text-[16px] font-bold text-[var(--ink)]">
                      Momento
                    </span>
                  </div>
                  <ThemeToggle />
                </div>
                <div className="text-center">
                  <p className="font-instrument text-[15px] text-[var(--ink-muted)]">
                    You are invited to
                  </p>
                  <h2 className="font-playfair mt-1 text-[26px] leading-tight font-bold tracking-tight text-[var(--ink)]">
                    {invitedEvent.name}
                  </h2>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-[36px] w-[36px]">
                    <Image src="/images/logo.png" alt="Momento" width={36} height={36} priority />
                  </div>
                  <span className="font-instrument text-[22px] font-bold text-[var(--ink)]">
                    Momento
                  </span>
                </div>
                <ThemeToggle />
              </div>
            )}
          </div>

          {/* Step heading */}
          <div className="mb-6">
            <h1 className="font-playfair text-[28px] font-bold tracking-tight text-[var(--ink)] lg:text-[30px]">
              {step === 'initial' && 'Welcome back'}
              {step === 'otp' && 'Enter OTP'}
              {step === 'email' && 'Sign in with Email'}
              {step === 'email_otp' && 'Enter OTP'}
              {step === 'name' && "What's your name?"}
            </h1>
            <p className="font-instrument mt-1.5 text-[15px] text-[var(--ink-muted)]">
              {step === 'initial' && 'Sign in to continue to Momento'}
              {step === 'otp' && `We sent a code to ${countryCode}${phoneNumber}`}
              {step === 'email' && 'Enter your email to receive a verification code'}
              {step === 'email_otp' && `We sent a code to ${emailAddress}`}
              {step === 'name' && 'Let us know what to call you'}
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
            {step === 'initial' && (
              <motion.div
                key="initial"
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
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                      <path
                        d="M1 1L5 5L9 1"
                        stroke="currentColor"
                        strokeOpacity="0.4"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
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

                <div className="flex items-center gap-4 py-1">
                  <div className="h-px flex-1 bg-[var(--ink-subtle)]" />
                  <span className="font-instrument text-[13px] text-[var(--ink-muted)]">or</span>
                  <div className="h-px flex-1 bg-[var(--ink-subtle)]" />
                </div>

                <button
                  onClick={() => handleSocialLogin('google')}
                  disabled={isLoading}
                  className="login-btn-outline"
                >
                  <GoogleIcon />
                  Continue with Google
                </button>

                <button
                  onClick={() => handleSocialLogin('apple')}
                  disabled={isLoading}
                  className="login-btn-outline"
                >
                  <AppleIcon />
                  Continue with Apple
                </button>

                <button
                  onClick={() => {
                    setError('')
                    setStep('email')
                  }}
                  disabled={isLoading}
                  className="login-btn-outline"
                >
                  <EmailIcon />
                  Continue with Email
                </button>
              </motion.div>
            )}

            {step === 'email' && (
              <motion.div
                key="email"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-3"
              >
                <input
                  type="email"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  placeholder="Email address"
                  disabled={isLoading}
                  className="login-input"
                />

                <button
                  onClick={handleSendEmailOtp}
                  disabled={isLoading || !emailAddress.trim() || !emailAddress.includes('@')}
                  className="login-btn-primary"
                >
                  {isLoading ? <Spinner /> : 'Send OTP'}
                </button>
              </motion.div>
            )}

            {step === 'email_otp' && (
              <motion.div
                key="email_otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div className="flex justify-between gap-2">
                  {emailOtp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        emailOtpRefs.current[index] = el
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleEmailOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleEmailOtpKeyDown(index, e)}
                      className="login-otp-box"
                    />
                  ))}
                </div>

                <button
                  onClick={handleVerifyEmailOtp}
                  disabled={isLoading || !emailOtp.every((d) => d !== '')}
                  className="login-btn-primary"
                >
                  {isLoading ? <Spinner /> : 'Verify OTP'}
                </button>

                <button
                  onClick={handleSendEmailOtp}
                  disabled={isLoading}
                  className="font-instrument w-full text-center text-[14px] text-[var(--rust)] hover:underline"
                  style={{ cursor: 'none', background: 'none', border: 'none' }}
                >
                  Resend OTP
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

            {step === 'name' && (
              <motion.div
                key="name"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  disabled={isLoading}
                  className="login-input"
                />

                <button
                  onClick={handleFinish}
                  disabled={isLoading || fullName.trim().length < 2}
                  className="login-btn-primary"
                >
                  {isLoading ? <Spinner /> : 'Continue'}
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

/* ── Inline icon helpers ──────────────────────────────────────────────────── */

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

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.49h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.92a8.78 8.78 0 0 0 2.68-6.62z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.33-1.58-5.04-3.71H.96v2.33A9 9 0 0 0 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.96 10.71A5.41 5.41 0 0 1 3.68 9c0-.59.1-1.17.28-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.04l3-2.33z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 9 0 9 9 0 0 0 .96 4.96l3 2.33C4.67 5.16 6.66 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  )
}

function EmailIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect
        x="2"
        y="4"
        width="20"
        height="16"
        rx="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M22 4L12 13L2 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg width="18" height="20" viewBox="0 0 16 20" fill="currentColor">
      <path d="M12.5 10.317c-.005-1.852.986-3.098 2.504-4.03-.939-1.367-2.406-2.152-4.254-2.288-1.77-.133-3.693 1.055-4.396 1.055-.737 0-2.479-.984-3.942-.984C.51 4.07-1.5 6.287-1.5 10.453c0 1.23.225 2.5.674 3.81.6 1.73 2.76 5.973 5.02 5.905 1.19-.029 2.03-.86 3.587-.86 1.514 0 2.284.86 3.584.836 2.285-.029 4.225-3.86 4.798-5.593-3.05-1.437-2.963-4.233-2.963-4.234zm-2.77-7.48C10.66 1.623 11.308.11 11.162-1c-1.27.084-2.748.872-3.594 1.947-.758.97-1.423 2.518-1.244 3.997 1.385.105 2.654-.758 3.406-2.107z" />
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
