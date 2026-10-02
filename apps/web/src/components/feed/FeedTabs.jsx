'use client'

import clsx from 'clsx'

const TABS = [
  { key: 'nearby', label: 'Nearby' },
  { key: 'following', label: 'Following' },
  { key: 'trending', label: 'Trending' },
  { key: 'fresh', label: 'Fresh' },
]

export function FeedTabs({ active, onChange }) {
  return (
    <div
      role="tablist"
      className="sticky top-0 z-10 -mx-4 flex gap-1 overflow-x-auto bg-[var(--bg,_#0c0c0e)]/95 px-4 py-2 backdrop-blur lg:mx-0 lg:px-0"
    >
      {TABS.map((t) => {
        const isActive = active === t.key
        return (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(t.key)}
            className={clsx(
              'shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all',
              isActive
                ? 'bg-white text-black'
                : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
            )}
          >
            {t.label}
          </button>
        )
      })}
    </div>
  )
}
