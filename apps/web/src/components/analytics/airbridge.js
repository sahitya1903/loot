'use client'

import { useEffect } from 'react'

export function AirbridgeAnalytics() {
  useEffect(() => {
    const app = process.env.NEXT_PUBLIC_AIRBRIDGE_APP
    const webToken = process.env.NEXT_PUBLIC_AIRBRIDGE_WEB_TOKEN
    if (typeof window !== 'undefined' && app && webToken) {
      import('airbridge-web-sdk-loader').then((module) => {
        const airbridge = module.default
        airbridge.init({ app, webToken })
      })
    }
  }, [])

  return null
}
