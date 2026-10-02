'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Dropdown({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  disabled = false,
  className,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  const selectedOption = options.find((opt) => opt.value === value)

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false)
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'flex h-12 w-full items-center justify-between rounded-[var(--radius-lg)]',
          'bg-[var(--input)] px-4',
          'font-instrument text-[15px]',
          'border border-transparent',
          'transition-colors duration-[var(--duration-normal)]',
          'focus:border-[var(--rust)] focus:outline-none',
          'disabled:cursor-not-allowed disabled:opacity-50',
          isOpen && 'border-[var(--rust)]'
        )}
      >
        <span className={selectedOption ? 'text-[var(--foreground)]' : 'text-[var(--muted)]'}>
          {selectedOption?.label || placeholder}
        </span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-5 w-5 text-[var(--muted)]" />
        </motion.div>
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={cn(
              'absolute top-full right-0 left-0 z-50 mt-1',
              'rounded-[var(--radius-lg)] bg-[var(--card)]',
              'border border-[var(--border)] shadow-lg',
              'overflow-hidden'
            )}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
                className={cn(
                  'flex w-full items-center justify-between px-4 py-3',
                  'font-instrument text-[15px] text-[var(--foreground)]',
                  'transition-colors duration-[var(--duration-fast)]',
                  'hover:bg-[var(--secondary)]',
                  option.value === value && 'bg-[var(--secondary)]'
                )}
              >
                <span>{option.label}</span>
                {option.value === value && <Check className="h-4 w-4 text-[var(--rust)]" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Dropdown
