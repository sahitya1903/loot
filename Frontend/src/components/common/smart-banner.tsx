'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'
import { Button } from '@/components/ui'
import { useIsMobile } from '@/hooks'

interface SmartBannerProps {
  eventId?: string
  inviteKey?: string
  redirectUrl?: string
}

export function SmartBanner({
  eventId: propEventId,
  inviteKey: propInviteKey,
  redirectUrl,
}: SmartBannerProps) {
  const isMobile = useIsMobile()
  const [isVisible, setIsVisible] = useState(true)
  const [trackingLink, setTrackingLink] = useState<string | null>(null)

  // Parse eventId and inviteKey from redirectUrl if not provided directly
  const { eventId, inviteKey } = useMemo(() => {
    // If props are provided directly, use them
    if (propEventId) {
      return { eventId: propEventId, inviteKey: propInviteKey }
    }

    // Try to parse from redirectUrl
    if (redirectUrl) {
      try {
        // redirectUrl could be like "/events/abc123?inviteKey=xyz" or full URL
        const url = redirectUrl.startsWith('http')
          ? new URL(redirectUrl)
          : new URL(redirectUrl, 'https://www.momentomemories.com')

        const pathMatch = url.pathname.match(/\/events\/([^/?]+)/)
        const parsedEventId = pathMatch ? pathMatch[1] : undefined
        const parsedInviteKey = url.searchParams.get('inviteKey') || undefined

        return { eventId: parsedEventId, inviteKey: parsedInviteKey }
      } catch {
        // If parsing fails, return undefined
        return { eventId: undefined, inviteKey: undefined }
      }
    }

    return { eventId: undefined, inviteKey: undefined }
  }, [propEventId, propInviteKey, redirectUrl])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('airbridge-web-sdk-loader').then((module) => {
        const airbridge = module.default
        let deepLinkPath = ''
        if (eventId) {
          deepLinkPath += `events/${eventId}`
          if (inviteKey) {
            deepLinkPath += `?inviteKey=${inviteKey}`
          }
        }

        const deepLink = `https://www.momentomemories.com/${deepLinkPath}`
        airbridge.createTrackingLink(
          'mobile_smart_banner',
          {
            campaign: 'web_to_app',
            deeplink_url: deepLink,
            fallback_android: 'store',
            fallback_ios: 'store',
            fallback_desktop: deepLink,
          },
          (trackingLink) => {
            if (trackingLink && trackingLink.shortURL) {
              setTrackingLink(trackingLink.shortURL)
            }
          },
          (error) => {
            console.log('error', error)
          }
        )
      })
    }
  }, [eventId, inviteKey])

  if (!isMobile || !isVisible) return null

  const handleOpenApp = () => {
    if (trackingLink) {
      window.location.href = trackingLink
      return
    }

    // Fallback to manual scheme attempt if link generation failed or incomplete
    let deepLink = 'https://www.momentomemories.com/'
    if (eventId) {
      deepLink += `events/${eventId}`
      if (inviteKey) {
        deepLink += `?inviteKey=${inviteKey}`
      }
    } else {
      deepLink += 'home'
    }

    window.location.href = deepLink
  }

  return (
    <div className="sticky top-0 z-[100] w-full border-b border-[var(--border)] bg-[var(--background)] p-2 shadow-md">
      <div className="flex w-full items-center px-1">
        <button
          onClick={() => setIsVisible(false)}
          className="mr-1 -ml-1 rounded-full p-1 text-[var(--muted)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="relative mr-3 h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-[var(--ink)]">
          {/* Placeholder for app icon */}
          <Image src="/images/logo.png" alt="Momento" fill sizes="40px" className="object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">Momento: Event Sharing</p>
          <p className="truncate text-xs text-[var(--muted)]">View fully in the app</p>
        </div>
        <Button size="sm" onClick={handleOpenApp} className="h-8 px-3 text-xs whitespace-nowrap">
          Open App
        </Button>
      </div>
    </div>
  )
}
