'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export function Toggle({ checked, onChange, disabled = false, className }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        'relative inline-flex h-[31px] w-[51px] shrink-0 cursor-pointer items-center rounded-full',
        'transition-colors duration-200 ease-in-out',
        'focus:outline-none focus-visible:outline-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-[var(--rust)]' : 'bg-[#e9e9eb] dark:bg-[#555]',
        className
      )}
    >
      <motion.span
        className="pointer-events-none inline-block h-[27px] w-[27px] rounded-full bg-white shadow-md"
        animate={{
          x: checked ? 22 : 2,
        }}
        transition={{
          type: 'spring',
          stiffness: 500,
          damping: 30,
        }}
      />
    </button>
  )
}

export default Toggle
