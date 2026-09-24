'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface PrimaryButtonProps {
  children?: React.ReactNode
  variant?: 'filled' | 'outline'
  isLoading?: boolean
  className?: string
  disabled?: boolean
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
}

export function PrimaryButton({
  children,
  variant = 'filled',
  isLoading,
  className,
  disabled,
  onClick,
  type = 'button',
}: PrimaryButtonProps) {
  return (
    <motion.button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={cn(
        'flex h-[50px] w-full items-center justify-center rounded-[14px] font-[family-name:var(--font-instrument)] text-[16px] font-semibold transition-all',
        'disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'filled'
          ? 'bg-[#446de5] text-white hover:bg-[#3a5ed0]'
          : 'bg-white text-[#446de5] shadow-[0_0_4px_rgba(0,0,0,0.15)] hover:bg-gray-50',
        className
      )}
      whileTap={{ scale: 0.98 }}
      whileHover={{ scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {isLoading ? (
        <svg
          className="h-5 w-5 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        children
      )}
    </motion.button>
  )
}
