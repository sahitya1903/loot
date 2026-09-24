'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface NameInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
  label?: string
}

export function NameInput({ error, label, className, disabled, ...props }: NameInputProps) {
  return (
    <div className={cn('w-full space-y-2', className)}>
      {label && (
        <label className="block font-[family-name:var(--font-instrument)] text-[14px] font-medium text-white/74">
          {label}
        </label>
      )}
      <input
        type="text"
        disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={error ? 'name-error' : undefined}
        className={cn(
          'h-[50px] w-full rounded-[14px] bg-white px-4 font-[family-name:var(--font-instrument)] text-[16px] font-medium text-[#2a2a2a] shadow-[0_0_4px_rgba(0,0,0,0.15)] transition-all',
          'placeholder:text-gray-400',
          'focus:ring-2 focus:ring-[#446de5]/50 focus:outline-none',
          error && 'ring-2 ring-red-500',
          disabled && 'cursor-not-allowed opacity-50'
        )}
        {...props}
      />

      {error && (
        <p id="name-error" className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
