'use client'

import { cn } from '@/lib/utils'

const variants = {
  default: 'bg-[var(--secondary)] text-[var(--foreground)]',
  primary: 'bg-[var(--ink)] text-[var(--ivory)]',
  secondary: 'bg-[var(--secondary)] text-[var(--secondary-foreground)]',
  success: 'bg-[var(--success)]/20 text-[var(--success)]',
  destructive: 'bg-[var(--destructive)]/20 text-[var(--destructive)]',
  outline: 'border border-[var(--border)] bg-transparent text-[var(--foreground)]',
}

const sizes = {
  sm: 'px-2 py-0.5 text-[11px]',
  md: 'px-2.5 py-1 text-[12px]',
}

export function Badge({ variant = 'default', size = 'md', children, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full',
        'font-instrument font-medium',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  )
}

export default Badge
