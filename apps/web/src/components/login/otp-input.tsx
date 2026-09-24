'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface OTPInputProps {
  value: string
  onChange: (value: string) => void
  length?: number
  error?: string
  disabled?: boolean
  className?: string
}

export function OTPInput({
  value,
  onChange,
  length = 6,
  error,
  disabled,
  className,
}: OTPInputProps) {
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([])
  const digits = value.padEnd(length, '').split('').slice(0, length)

  const focusInput = (index: number) => {
    if (index >= 0 && index < length) {
      inputRefs.current[index]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      if (digits[index]) {
        // Clear current digit
        const newValue = value.slice(0, index) + value.slice(index + 1)
        onChange(newValue)
      } else if (index > 0) {
        // Move to previous and clear
        focusInput(index - 1)
        const newValue = value.slice(0, index - 1) + value.slice(index)
        onChange(newValue)
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      focusInput(index - 1)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      focusInput(index + 1)
    }
  }

  const handleInput = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value.replace(/[^0-9]/g, '')

    if (inputValue.length === 0) return

    if (inputValue.length === 1) {
      // Single digit input
      const newValue = value.slice(0, index) + inputValue + value.slice(index + 1)
      onChange(newValue.slice(0, length))
      if (index < length - 1) {
        focusInput(index + 1)
      }
    } else {
      // Paste multiple digits
      const pastedValue = inputValue.slice(0, length - index)
      const newValue = value.slice(0, index) + pastedValue + value.slice(index + pastedValue.length)
      onChange(newValue.slice(0, length))
      focusInput(Math.min(index + pastedValue.length, length - 1))
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData
      .getData('text')
      .replace(/[^0-9]/g, '')
      .slice(0, length)
    onChange(pastedData)
    focusInput(Math.min(pastedData.length, length - 1))
  }

  return (
    <div className={cn('w-full space-y-2', className)}>
      <div className="flex justify-between gap-2">
        {Array.from({ length }).map((_, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el
            }}
            type="text"
            inputMode="numeric"
            maxLength={length}
            value={digits[index] || ''}
            onChange={(e) => handleInput(index, e)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={disabled}
            aria-label={`Digit ${index + 1}`}
            aria-invalid={!!error}
            className={cn(
              'h-[50px] w-full max-w-[50px] rounded-[10px] bg-white text-center font-[family-name:var(--font-instrument)] text-[20px] font-semibold text-[#2a2a2a] shadow-[0_0_4px_rgba(0,0,0,0.15)] transition-all',
              'focus:ring-2 focus:ring-[#446de5]/50 focus:outline-none',
              error && 'ring-2 ring-red-500',
              disabled && 'cursor-not-allowed opacity-50'
            )}
          />
        ))}
      </div>

      {error && (
        <p className="text-center text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
