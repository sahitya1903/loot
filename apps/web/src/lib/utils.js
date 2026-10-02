import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind classes with clsx
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Format date for display
 */
export function formatDateTime(timestamp) {
  if (!timestamp) return ''

  let date
  if (typeof timestamp === 'number') {
    date = new Date(timestamp)
  } else if (typeof timestamp === 'object' && '_seconds' in timestamp) {
    date = new Date(timestamp._seconds * 1000)
  } else {
    return ''
  }

  // Check if date is valid
  if (isNaN(date.getTime())) return ''

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

/**
 * Format relative time (e.g., "2 hours ago")
 * Handles both Firestore timestamp formats: { _seconds, _nanoseconds } and { seconds, nanoseconds }
 */
export function formatRelativeTime(timestamp) {
  if (!timestamp) return ''

  let seconds
  if (typeof timestamp._seconds === 'number') {
    seconds = timestamp._seconds
  } else if (typeof timestamp.seconds === 'number') {
    seconds = timestamp.seconds
  } else {
    return ''
  }

  const date = new Date(seconds * 1000)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString()
}

/**
 * Format timestamp for chat list (matches Flutter's formattedTimestamp)
 * Today: shows time (HH:mm)
 * Yesterday: shows "Yesterday"
 * Older: shows DD/MM/YY
 */
export function formatChatTimestamp(timestamp) {
  if (!timestamp) return ''

  let seconds
  if ('_seconds' in timestamp) {
    seconds = timestamp._seconds
  } else if ('seconds' in timestamp) {
    seconds = timestamp.seconds
  } else {
    return ''
  }

  const date = new Date(seconds * 1000)
  const now = new Date()

  // Check if same day (today)
  if (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  ) {
    // Show time HH:mm
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  }

  // Check if yesterday
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate()
  ) {
    return 'Yesterday'
  }

  // Older: DD/MM/YY
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = (date.getFullYear() % 100).toString().padStart(2, '0')
  return `${day}/${month}/${year}`
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
 * Validate phone number format
 */
export function isValidPhoneNumber(phone) {
  // Basic validation - starts with + and has 10-15 digits
  return /^\+[1-9]\d{9,14}$/.test(phone.replace(/\s/g, ''))
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text, maxLength) {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}
