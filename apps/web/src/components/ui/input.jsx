'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

const Input = forwardRef(({ className, type = 'text', error, ...props }, ref) => {
  return (
    <div className="w-full">
      <input
        type={type}
        ref={ref}
        className={cn(
          'flex h-11 w-full rounded-[var(--radius-lg)]',
          'bg-[color-mix(in_srgb,var(--ink)_4%,var(--ivory))]',
          'px-4 py-3',
          'font-instrument text-[14px] text-[var(--ink)]',
          'placeholder:text-[var(--ink-muted)]/50',
          'border border-[var(--ink-subtle)]',
          'transition-all duration-200',
          'hover:border-[color-mix(in_srgb,var(--ink)_35%,transparent)]',
          'focus:border-[var(--rust)] focus:outline-none',
          'focus:bg-[color-mix(in_srgb,var(--rust)_2%,var(--ivory))]',
          'focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--rust)_10%,transparent)]',
          'disabled:cursor-not-allowed disabled:opacity-50',
          // Date / time picker indicator
          '[&[type=date]]:cursor-pointer [&[type=time]]:cursor-pointer',
          '[&::-webkit-calendar-picker-indicator]:cursor-pointer',
          '[&::-webkit-calendar-picker-indicator]:opacity-40',
          '[&::-webkit-calendar-picker-indicator]:transition-opacity',
          '[&::-webkit-calendar-picker-indicator]:duration-200',
          '[&::-webkit-calendar-picker-indicator]:hover:opacity-90',
          error &&
            'border-[var(--destructive)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--destructive)_12%,transparent)]',
          className
        )}
        {...props}
      />
      {error && (
        <p className="font-instrument mt-1.5 text-[12px] text-[var(--destructive)]">{error}</p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

const Textarea = forwardRef(({ className, error, ...props }, ref) => {
  return (
    <div className="w-full">
      <textarea
        ref={ref}
        className={cn(
          'flex min-h-[100px] w-full rounded-[var(--radius-lg)]',
          'bg-[color-mix(in_srgb,var(--ink)_4%,var(--ivory))]',
          'px-4 py-3',
          'font-instrument text-[14px] text-[var(--ink)]',
          'placeholder:text-[var(--ink-muted)]/50',
          'border border-[var(--ink-subtle)]',
          'transition-all duration-200',
          'hover:border-[color-mix(in_srgb,var(--ink)_35%,transparent)]',
          'focus:border-[var(--rust)] focus:outline-none',
          'focus:bg-[color-mix(in_srgb,var(--rust)_2%,var(--ivory))]',
          'focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--rust)_10%,transparent)]',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'resize-none',
          error && 'border-[var(--destructive)]',
          className
        )}
        {...props}
      />
      {error && (
        <p className="font-instrument mt-1.5 text-[12px] text-[var(--destructive)]">{error}</p>
      )}
    </div>
  )
})

Textarea.displayName = 'Textarea'

export { Input, Textarea }
