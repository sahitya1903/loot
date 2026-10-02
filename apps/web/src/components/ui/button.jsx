'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

const Button = forwardRef(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      children,
      asChild: _asChild,
      ...props
    },
    ref
  ) => {
    const baseStyles = `
      inline-flex items-center justify-center gap-2
      font-instrument font-medium
      rounded-[var(--radius-full)]
      transition-all duration-[var(--duration-normal)]
      focus-visible:outline-none focus:outline-none
      disabled:pointer-events-none disabled:opacity-50
    `

    const variants = {
      primary: `
        bg-[var(--ink)]
        text-[var(--ivory)]
        shadow-[0_2px_8px_color-mix(in_srgb,var(--ink)_20%,transparent)]
        hover:bg-[var(--rust)]
        hover:shadow-[0_4px_20px_color-mix(in_srgb,var(--rust)_45%,transparent)]
        active:shadow-none
      `,
      secondary: `
        bg-[color-mix(in_srgb,var(--ink)_8%,transparent)]
        text-[var(--ink)]
        hover:bg-[color-mix(in_srgb,var(--ink)_14%,transparent)]
        hover:shadow-[0_2px_8px_color-mix(in_srgb,var(--ink)_10%,transparent)]
      `,
      outline: `
        border border-[var(--ink-subtle)]
        bg-transparent
        text-[var(--ink)]
        hover:border-[color-mix(in_srgb,var(--ink)_60%,transparent)]
        hover:bg-[color-mix(in_srgb,var(--ink)_5%,transparent)]
        hover:shadow-[0_2px_8px_color-mix(in_srgb,var(--ink)_8%,transparent)]
      `,
      ghost: `
        bg-transparent
        text-[var(--ink)]
        hover:bg-[color-mix(in_srgb,var(--ink)_7%,transparent)]
      `,
      destructive: `
        bg-[var(--destructive)]
        text-[var(--destructive-foreground)]
        shadow-[0_2px_8px_color-mix(in_srgb,var(--destructive)_20%,transparent)]
        hover:bg-[color-mix(in_srgb,var(--destructive)_85%,black)]
        hover:shadow-[0_4px_16px_color-mix(in_srgb,var(--destructive)_40%,transparent)]
      `,
      pill: `
        bg-[var(--ink)]
        text-[var(--ivory)]
        rounded-full
        shadow-[0_2px_8px_color-mix(in_srgb,var(--ink)_20%,transparent)]
        hover:bg-[var(--rust)]
        hover:shadow-[0_4px_20px_color-mix(in_srgb,var(--rust)_45%,transparent)]
      `,
      'pill-outline': `
        bg-transparent
        text-[var(--ink)]
        border border-[var(--ink-subtle)]
        rounded-full
        hover:border-[var(--rust)]
        hover:text-[var(--rust)]
        hover:bg-[color-mix(in_srgb,var(--rust)_6%,transparent)]
        hover:shadow-[0_2px_10px_color-mix(in_srgb,var(--rust)_15%,transparent)]
      `,
    }

    void _asChild
    const sizes = {
      sm: 'h-8 px-3 text-[13px]',
      md: 'h-10 px-5 text-[15px]',
      lg: 'h-12 px-6 text-[16px]',
    }

    return (
      <motion.button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        whileTap={{ scale: 0.97 }}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.1 }}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="h-4 w-4 animate-spin"
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
            <span>Loading...</span>
          </>
        ) : (
          children
        )}
      </motion.button>
    )
  }
)

Button.displayName = 'Button'

export { Button }
export default Button
