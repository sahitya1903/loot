import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind classes with clsx
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Get initials from name
 */
export function getInitials(name) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text, maxLength) {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}
