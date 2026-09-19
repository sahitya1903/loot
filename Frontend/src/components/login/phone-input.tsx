'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
  countryCode: string
  onCountryCodeChange: (code: string) => void
  placeholder?: string
  error?: string
  disabled?: boolean
  className?: string
}

const countries = [
  { code: '+1', name: 'US', flag: '🇺🇸' },
  { code: '+44', name: 'UK', flag: '🇬🇧' },
  { code: '+91', name: 'IN', flag: '🇮🇳' },
  { code: '+86', name: 'CN', flag: '🇨🇳' },
  { code: '+81', name: 'JP', flag: '🇯🇵' },
  { code: '+49', name: 'DE', flag: '🇩🇪' },
  { code: '+33', name: 'FR', flag: '🇫🇷' },
]

export function PhoneInput({
  value,
  onChange,
  countryCode,
  onCountryCodeChange,
  placeholder = 'Phone Number',
  error,
  disabled,
  className,
}: PhoneInputProps) {
  const selectedCountry = countries.find((c) => c.code === countryCode) || countries[2]

  return (
    <div className={cn('w-full space-y-2', className)}>
      <div
        className={cn(
          'flex h-[50px] w-full items-center rounded-[14px] bg-white shadow-[0_0_4px_rgba(0,0,0,0.15)] transition-all',
          'focus-within:ring-2 focus-within:ring-[#446de5]/50',
          error && 'ring-2 ring-red-500',
          disabled && 'cursor-not-allowed opacity-50'
        )}
      >
        {/* Country Code Selector */}
        <div className="relative flex h-full items-center border-r border-gray-200 pr-3 pl-4">
          <select
            value={countryCode}
            onChange={(e) => onCountryCodeChange(e.target.value)}
            disabled={disabled}
            className="absolute inset-0 cursor-pointer opacity-0"
            aria-label="Select country code"
          >
            {countries.map((country) => (
              <option key={country.code} value={country.code}>
                {country.flag} {country.code}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2 font-[family-name:var(--font-instrument)] text-[16px] font-medium text-[#2a2a2a]">
            <span>{selectedCountry.flag}</span>
            <span>{selectedCountry.code}</span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-gray-400"
            >
              <path
                d="M3 4.5L6 7.5L9 4.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Phone Number Input */}
        <input
          type="tel"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ''))}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? 'phone-error' : undefined}
          className={cn(
            'h-full flex-1 bg-transparent px-4 font-[family-name:var(--font-instrument)] text-[16px] font-medium text-[#2a2a2a] placeholder:text-gray-400',
            'focus:outline-none',
            'disabled:cursor-not-allowed'
          )}
        />
      </div>

      {error && (
        <p id="phone-error" className="text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
