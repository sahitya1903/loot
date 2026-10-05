'use client'

import { motion } from 'framer-motion'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/hooks/use-theme'
import { cn } from '@/lib/utils'

// Reads and changes the app theme through ThemeProvider, which persists it
// under the same key the no-flash script in app/layout.jsx reads.
export function ThemeToggle({ className }) {
  const { resolvedTheme: theme, toggleTheme, mounted } = useTheme()

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <button
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)]',
          'text-[var(--ink-muted)]',
          className
        )}
        disabled
      >
        <div className="h-4 w-4" />
      </button>
    )
  }

  return (
    <motion.button
      onClick={toggleTheme}
      className={cn(
        'flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)]',
        'text-[var(--ink-muted)]',
        'transition-colors duration-200',
        'hover:bg-[color-mix(in_srgb,var(--ink)_7%,transparent)] hover:text-[var(--ink)]',
        'focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:outline-none',
        className
      )}
      whileTap={{ scale: 0.95 }}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <motion.div
        initial={false}
        animate={{ rotate: theme === 'dark' ? 180 : 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        {theme === 'light' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </motion.div>
    </motion.button>
  )
}

export default ThemeToggle
