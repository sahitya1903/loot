'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface SocialAuthButtonProps {
  provider: 'google' | 'apple'
  isLoading?: boolean
  className?: string
  disabled?: boolean
  onClick?: () => void
}

export function SocialAuthButton({
  provider,
  isLoading,
  className,
  disabled,
  onClick,
}: SocialAuthButtonProps) {
  const isGoogle = provider === 'google'

  return (
    <motion.button
      type="button"
      disabled={disabled || isLoading}
      onClick={onClick}
      className={cn(
        'flex h-[50px] w-full items-center justify-center gap-3 rounded-[14px] font-[family-name:var(--font-instrument)] text-[16px] font-semibold transition-all',
        'disabled:cursor-not-allowed disabled:opacity-50',
        isGoogle
          ? 'bg-[#2a2a2a] text-white hover:bg-[#3a3a3a]'
          : 'bg-[#2a2a2a] text-white hover:bg-[#3a3a3a]',
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
      ) : isGoogle ? (
        <>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M14.537 6.545H14V6.5H8V9.5H11.768C11.218 11.018 9.756 12.5 8 12.5C5.515 12.5 3.5 10.485 3.5 8C3.5 5.515 5.515 3.5 8 3.5C9.127 3.5 10.153 3.923 10.942 4.616L13.061 2.497C11.668 1.197 9.848 0.5 8 0.5C3.858 0.5 0.5 3.858 0.5 8C0.5 12.142 3.858 15.5 8 15.5C12.142 15.5 15.5 12.142 15.5 8C15.5 7.497 15.445 7.007 15.537 6.545H14.537Z"
              fill="#FFC107"
            />
            <path
              d="M1.422 4.745L3.884 6.56C4.488 5.133 5.844 4.1 7.5 4.1C8.627 4.1 9.653 4.523 10.442 5.216L12.561 3.097C11.168 1.797 9.348 1.1 7.5 1.1C4.818 1.1 2.505 2.597 1.422 4.745Z"
              fill="#FF3D00"
            />
            <path
              d="M8 15.5C9.81 15.5 11.597 14.832 12.979 13.586L10.656 11.629C9.88 12.202 8.945 12.5 8 12.5C6.252 12.5 4.795 11.027 4.238 9.518L1.816 11.416C2.883 13.686 4.91 15.5 8 15.5Z"
              fill="#4CAF50"
            />
            <path
              d="M15.537 6.545H14V6.5H8V9.5H11.768C11.512 10.222 11.058 10.858 10.654 11.63L10.656 11.629L12.979 13.586C12.804 13.745 15.5 11.75 15.5 8C15.5 7.497 15.445 7.007 15.537 6.545Z"
              fill="#1976D2"
            />
          </svg>
          Continue with Google
        </>
      ) : (
        <>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M11.182 8.414C11.175 7.162 11.91 6.24 13.395 5.538C12.581 4.391 11.344 3.762 9.705 3.65C8.157 3.541 6.474 4.551 5.86 4.551C5.209 4.551 3.707 3.69 2.519 3.69C0.084 3.73 -2.5 5.578 -2.5 8.61C-2.5 9.517 -2.339 10.456 -2.018 11.426C-1.59 12.69 -0.023 15.914 1.607 15.861C2.722 15.834 3.517 15.068 4.946 15.068C6.335 15.068 7.073 15.861 8.318 15.861C9.971 15.834 11.375 12.913 11.783 11.645C9.445 10.553 11.182 8.494 11.182 8.414ZM9.145 2.444C10.35 1.039 10.24 -0.237 10.203 -0.7C9.138 -0.637 7.903 0.017 7.196 0.837C6.422 1.712 5.975 2.801 6.075 4.003C7.227 4.089 8.28 3.446 9.145 2.444Z"
              fill="white"
              transform="translate(2.5, 0.7)"
            />
          </svg>
          Continue with Apple
        </>
      )}
    </motion.button>
  )
}
