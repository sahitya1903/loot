'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { FaceLivenessDetector } from '@aws-amplify/ui-react-liveness'
import { ThemeProvider, Loader } from '@aws-amplify/ui-react'
import { Amplify } from 'aws-amplify'
import '@aws-amplify/ui-react/styles.css'
import { callFunction } from '@/lib/firebase/functions'
import awsConfig from '@/lib/aws-config'
import { Camera, AlertTriangle, RefreshCw, Settings } from 'lucide-react'
import { Button } from '@/components/ui'

// Configure Amplify once
let amplifyConfigured = false

interface FaceLivenessProps {
  onSuccess: () => void
  onError: (error: string) => void
  onCancel: () => void
}

type PermissionState = 'checking' | 'prompt' | 'granted' | 'denied' | 'error'

export default function FaceLiveness({ onSuccess, onError, onCancel }: FaceLivenessProps) {
  const [loading, setLoading] = useState<boolean>(true)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [amplifyReady, setAmplifyReady] = useState(false)
  const [permissionState, setPermissionState] = useState<PermissionState>('checking')
  const [permissionError, setPermissionError] = useState<string | null>(null)
  const isHandlingError = useRef(false)

  // Configure Amplify on mount
  useEffect(() => {
    if (!amplifyConfigured) {
      try {
        Amplify.configure(awsConfig)
        amplifyConfigured = true
      } catch (error) {
        console.error('Failed to configure Amplify:', error)
      }
    }
    setAmplifyReady(true)
  }, [])

  // Check camera permission on mount
  useEffect(() => {
    checkCameraPermission()
  }, [])

  const checkCameraPermission = async () => {
    setPermissionState('checking')
    setPermissionError(null)

    try {
      // Check if browser supports mediaDevices
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setPermissionError(
          'Your browser does not support camera access. Please use a modern browser like Chrome, Safari, or Firefox.'
        )
        setPermissionState('error')
        return
      }

      // Check permission status if available (not supported in all browsers)
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const result = await navigator.permissions.query({ name: 'camera' as PermissionName })
          if (result.state === 'granted') {
            setPermissionState('granted')
            return
          } else if (result.state === 'denied') {
            setPermissionState('denied')
            return
          }
        } catch {
          // Permission query not supported for camera, proceed to prompt
        }
      }

      // If we can't query, we need to prompt
      setPermissionState('prompt')
    } catch (error) {
      console.error('Error checking camera permission:', error)
      setPermissionState('prompt')
    }
  }

  const requestCameraPermission = async () => {
    setPermissionState('checking')
    setPermissionError(null)

    try {
      // Double-check mediaDevices API availability
      if (!navigator.mediaDevices?.getUserMedia) {
        // Check if we're on HTTP (not HTTPS)
        if (
          typeof window !== 'undefined' &&
          window.location.protocol === 'http:' &&
          window.location.hostname !== 'localhost'
        ) {
          setPermissionError(
            'Camera access requires a secure connection (HTTPS). Please access this page via HTTPS.'
          )
        } else {
          setPermissionError(
            'Your browser does not support camera access. Please use a modern browser like Chrome, Safari, or Firefox.'
          )
        }
        setPermissionState('error')
        return
      }

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      })

      // Success! Stop the stream immediately (we just needed permission)
      stream.getTracks().forEach((track) => track.stop())

      setPermissionState('granted')
    } catch (error) {
      console.error('Camera permission error:', error)

      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          setPermissionState('denied')
          setPermissionError(
            'Camera access was denied. Please enable camera access in your browser settings.'
          )
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          setPermissionState('error')
          setPermissionError(
            'No camera found on your device. Please connect a camera and try again.'
          )
        } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
          setPermissionState('error')
          setPermissionError(
            'Camera is in use by another application. Please close other apps using the camera and try again.'
          )
        } else if (error.name === 'OverconstrainedError') {
          setPermissionState('error')
          setPermissionError(
            'Camera does not meet requirements. Please try with a different camera.'
          )
        } else if (error.name === 'SecurityError') {
          setPermissionState('error')
          setPermissionError(
            'Camera access is blocked due to security settings. Please ensure you are using HTTPS.'
          )
        } else {
          setPermissionState('error')
          setPermissionError(`Camera error: ${error.message}`)
        }
      } else {
        setPermissionState('error')
        setPermissionError('Failed to access camera. Please try again.')
      }
    }
  }

  const createLivenessSession = useCallback(async () => {
    setLoading(true)
    try {
      // Call Firebase function to create a liveness session
      const result = await callFunction<Record<string, never>, string>(
        'createFaceLivenessSession',
        {}
      )
      if (result && typeof result === 'string') {
        setSessionId(result)
      } else {
        throw new Error('Invalid session response')
      }
    } catch (error) {
      console.error('Failed to create liveness session:', error)
      onError('Failed to create liveness session. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [onError])

  // Create session only after permission is granted
  useEffect(() => {
    if (amplifyReady && permissionState === 'granted') {
      createLivenessSession()
    }
  }, [amplifyReady, permissionState, createLivenessSession])

  const handleAnalysisComplete = async () => {
    setLoading(true)
    try {
      // Call Firebase function to verify the liveness result
      const result = await callFunction<
        Record<string, never>,
        { result: boolean; message: string }
      >('verifyFaceLivenessSession', {})

      if (result.result) {
        onSuccess()
      } else {
        onError(result.message || 'Liveness verification failed')
      }
    } catch (error) {
      console.error('Verification error:', error)
      onError('Failed to verify liveness. Please try again.')
    }
  }

  const handleError = async (livenessError: { state: string; error?: unknown }) => {
    console.error('Liveness detection error:', livenessError)

    // Prevent infinite loops
    if (isHandlingError.current) return
    isHandlingError.current = true

    // Handle camera access error specifically
    if (livenessError.state === 'CAMERA_ACCESS_ERROR') {
      setPermissionState('denied')
      setPermissionError(
        'Camera access was lost. Please check your camera permissions and try again.'
      )
      isHandlingError.current = false
      return
    }

    if (livenessError.state === 'TIMEOUT') {
      onError('Verification timed out. Please try again and follow the on-screen instructions.')
      isHandlingError.current = false
      return
    }

    // Create a new session for retry - sessions are single-use
    setLoading(true)
    await createLivenessSession()
    isHandlingError.current = false
  }

  const handleUserCancel = () => {
    onCancel()
  }

  const openBrowserSettings = () => {
    // Can't programmatically open settings, but we can guide the user
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isAndroid = /Android/.test(navigator.userAgent)

    let instructions = ''
    if (isIOS) {
      instructions = 'Go to Settings > Safari > Camera, then select "Allow".'
    } else if (isAndroid) {
      instructions = 'Tap the lock icon in the address bar, then enable Camera access.'
    } else {
      instructions = "Click the camera icon in your browser's address bar to manage permissions."
    }

    alert(instructions)
  }

  // Permission request UI
  if (permissionState === 'checking') {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center p-8">
        <Loader size="large" />
        <p className="font-instrument mt-4 text-[var(--muted)]">Checking camera access...</p>
      </div>
    )
  }

  if (permissionState === 'prompt') {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 p-6">
        <div className="rounded-full bg-[var(--rust)]/10 p-6">
          <Camera className="h-12 w-12 text-[var(--rust)]" />
        </div>
        <div className="space-y-2 text-center">
          <h3 className="font-instrument text-lg font-semibold text-[var(--foreground)]">
            Camera Access Required
          </h3>
          <p className="font-instrument max-w-[280px] text-sm text-[var(--muted)]">
            We need access to your camera to verify your identity. Your privacy is protected.
          </p>
        </div>
        <div className="flex w-full max-w-[280px] flex-col gap-3">
          <Button onClick={requestCameraPermission} className="w-full">
            <Camera className="mr-2 h-4 w-4" />
            Allow Camera Access
          </Button>
          <Button variant="outline" onClick={onCancel} className="w-full">
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  if (permissionState === 'denied' || permissionState === 'error') {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 p-6">
        <div className="rounded-full bg-[var(--destructive)]/10 p-6">
          <AlertTriangle className="h-12 w-12 text-[var(--destructive)]" />
        </div>
        <div className="space-y-2 text-center">
          <h3 className="font-instrument text-lg font-semibold text-[var(--foreground)]">
            {permissionState === 'denied' ? 'Camera Access Denied' : 'Camera Error'}
          </h3>
          <p className="font-instrument max-w-[280px] text-sm text-[var(--muted)]">
            {permissionError || 'Could not access your camera. Please check your settings.'}
          </p>
        </div>
        <div className="flex w-full max-w-[280px] flex-col gap-3">
          {permissionState === 'denied' && (
            <Button onClick={openBrowserSettings} className="w-full">
              <Settings className="mr-2 h-4 w-4" />
              How to Enable
            </Button>
          )}
          <Button variant="outline" onClick={requestCameraPermission} className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Button variant="ghost" onClick={onCancel} className="w-full">
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  // Loading state while creating session
  if (loading || !sessionId) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center p-8">
        <Loader size="large" />
        <p className="font-instrument mt-4 text-[var(--muted)]">Preparing face verification...</p>
      </div>
    )
  }

  return (
    <ThemeProvider>
      <div className="face-liveness-container">
        <FaceLivenessDetector
          sessionId={sessionId}
          region="ap-south-1"
          onAnalysisComplete={handleAnalysisComplete}
          onError={handleError}
          onUserCancel={handleUserCancel}
        />
      </div>
      <style jsx global>{`
        .face-liveness-container {
          width: 100%;
          max-width: 640px;
          margin: 0 auto;
        }
        .face-liveness-container [data-amplify-liveness-detector] {
          border-radius: var(--radius-lg);
          overflow: hidden;
        }
      `}</style>
    </ThemeProvider>
  )
}
