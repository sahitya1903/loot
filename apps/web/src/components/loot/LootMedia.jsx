'use client'

import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'

export function LootMedia({
  url,
  thumbnailUrl,
  mediaType,
  alt,
  autoplayOnVisible = true,
  className,
}) {
  const ref = useRef(null)
  const videoRef = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!autoplayOnVisible || mediaType !== 'video' || !ref.current) return
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) setVisible(e.isIntersecting && e.intersectionRatio > 0.6)
      },
      { threshold: [0, 0.6, 1] }
    )
    obs.observe(ref.current)
    return () => obs.disconnect()
  }, [autoplayOnVisible, mediaType])

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    if (visible) v.play().catch(() => {})
    else v.pause()
  }, [visible])

  if (!url) {
    return <div ref={ref} className={clsx('aspect-[4/5] w-full bg-zinc-900', className)} />
  }

  return (
    <div
      ref={ref}
      className={clsx('relative aspect-[4/5] w-full overflow-hidden bg-zinc-900', className)}
    >
      {mediaType === 'video' ? (
        <video
          ref={videoRef}
          src={url}
          poster={thumbnailUrl ?? undefined}
          muted
          playsInline
          loop
          preload="metadata"
          className="h-full w-full object-cover"
          aria-label={alt}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={alt} className="h-full w-full object-cover" loading="lazy" />
      )}
    </div>
  )
}
