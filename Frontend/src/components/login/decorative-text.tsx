'use client'

import { cn } from '@/lib/utils'

interface DecorativeTextProps {
  words: string[]
  highlightIndex: number
  className?: string
  variant?: 'light' | 'dark' // light = white bg, dark = blue bg
}

export function DecorativeText({
  words,
  highlightIndex,
  className,
  variant = 'dark',
}: DecorativeTextProps) {
  const isLight = variant === 'light'

  return (
    <div
      className={cn(
        'flex flex-col gap-4 font-[family-name:var(--font-instrument)] leading-tight font-semibold lg:gap-6',
        className
      )}
    >
      {words.map((word, index) => (
        <div key={word} className="flex items-center gap-[11px]">
          {index === highlightIndex && (
            <svg
              width="30"
              height="30"
              viewBox="0 0 37 37"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="shrink-0"
              aria-hidden="true"
            >
              <path
                d="M18.5 0L22.9 14.1L37 18.5L22.9 22.9L18.5 37L14.1 22.9L0 18.5L14.1 14.1L18.5 0Z"
                fill={isLight ? '#000000' : '#FFFFFF'}
              />
            </svg>
          )}
          <span
            className={cn(
              index === highlightIndex
                ? isLight
                  ? 'text-black'
                  : 'text-white'
                : isLight
                  ? 'text-black/10'
                  : 'text-white/10'
            )}
          >
            {word}
          </span>
        </div>
      ))}
    </div>
  )
}
