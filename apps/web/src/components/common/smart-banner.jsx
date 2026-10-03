'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'
import { Button } from '@/components/ui'
import { useIsMobile } from '@/hooks'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

/**
 * Mobile-only "Open in app" banner. Deep-links to the page the user was
 * heading to (e.g. `/loot/abc123`), or to home.
 *
 * @param {object} props
 * @param {string} [props.redirectUrl] path or same-origin URL to open in the app
 */
export function SmartBanner({ redirectUrl }) {
  const isMobile = useIsMobile()
  const [isVisible, setIsVisible] = useState(true)
  const [trackingLink, setTrackingLink] = useState(null)

  const deepLink = useMemo(() => {
    try {
      const url = new URL(redirectUrl || '/home', APP_URL)
      // Only deep-link to our own pages.
      if (url.origin !== new URL(APP_URL).origin) return `${APP_URL}/home`
      return `${APP_URL}${url.pathname}${url.search}`
    } catch {
      return `${APP_URL}/home`
    }
  }, [redirectUrl])

  useEffect(() => {
    import('airbridge-web-sdk-loader').then((module) => {
      module.default.createTrackingLink(
        'mobile_smart_banner',
        {
          campaign: 'web_to_app',
          deeplink_url: deepLink,
          fallback_android: 'store',
          fallback_ios: 'store',
          fallback_desktop: deepLink,
        },
        (link) => {
          if (link?.shortURL) setTrackingLink(link.shortURL)
        },
        (error) => {
          console.log('error', error)
        }
      )
    })
  }, [deepLink])

  if (!isMobile || !isVisible) return null

  const handleOpenApp = () => {
    // Fall back to the plain link if tracking-link generation failed.
    window.location.href = trackingLink || deepLink
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
          <Image src="/images/logo.svg" alt="Loot" fill sizes="40px" className="object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">Loot</p>
          <p className="truncate text-xs text-[var(--muted)]">View fully in the app</p>
        </div>
        <Button size="sm" onClick={handleOpenApp} className="h-8 px-3 text-xs whitespace-nowrap">
          Open App
        </Button>
      </div>
    </div>
  )
}
