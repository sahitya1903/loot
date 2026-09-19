'use client'

import { useEffect, useState } from 'react'

export function LandingPreloader() {
  const [phase, setPhase] = useState<'init' | 'ps1' | 'ps2' | 'done'>('init')

  useEffect(() => {
    const onLoad = () => {
      setTimeout(() => setPhase('ps1'), 200)
      setTimeout(() => setPhase('ps2'), 1100)
      setTimeout(() => setPhase('done'), 2000)
    }

    if (document.readyState === 'complete') {
      onLoad()
    } else {
      window.addEventListener('load', onLoad)
      return () => window.removeEventListener('load', onLoad)
    }
  }, [])

  if (phase === 'done') return null

  return (
    <div id="lpre" className={phase === 'ps2' ? 'lps1 lps2' : phase === 'ps1' ? 'lps1' : ''}>
      <div id="lpl" />
      <div id="lpr" />
      <div id="lplogo">
        Momento<span>.</span>
      </div>
    </div>
  )
}
