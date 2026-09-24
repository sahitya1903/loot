import { describe, it, expect } from 'vitest'
import {
  cn,
  formatDateTime,
  formatRelativeTime,
  formatChatTimestamp,
  getInitials,
  isValidPhoneNumber,
  truncate,
} from './utils'

describe('cn (className merge)', () => {
  it('merges simple class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('handles conditional classes', () => {
    expect(cn('base', true && 'active', false && 'inactive')).toBe('base active')
  })

  it('merges tailwind classes correctly', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
  })

  it('handles arrays', () => {
    expect(cn(['foo', 'bar'], 'baz')).toBe('foo bar baz')
  })
})

describe('formatDateTime', () => {
  it('returns empty string for null', () => {
    expect(formatDateTime(null)).toBe('')
  })

  it('returns empty string for undefined', () => {
    expect(formatDateTime(undefined)).toBe('')
  })

  it('formats number timestamp correctly', () => {
    const timestamp = new Date('2024-01-15T14:30:00').getTime()
    const result = formatDateTime(timestamp)
    expect(result).toContain('Jan')
    expect(result).toContain('15')
  })

  it('formats Firebase timestamp object correctly', () => {
    const timestamp = { _seconds: 1705326600, _nanoseconds: 0 } // Jan 15, 2024
    const result = formatDateTime(timestamp)
    expect(result).toContain('Jan')
    expect(result).toContain('15')
  })

  it('returns empty string for invalid timestamp', () => {
    expect(formatDateTime(NaN)).toBe('')
  })
})

describe('formatRelativeTime', () => {
  it('formats "Just now" for recent timestamps', () => {
    const now = Math.floor(Date.now() / 1000)
    expect(formatRelativeTime({ _seconds: now, _nanoseconds: 0 })).toBe('Just now')
  })

  it('formats minutes correctly', () => {
    const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 5 * 60
    expect(formatRelativeTime({ _seconds: fiveMinutesAgo, _nanoseconds: 0 })).toBe('5m ago')
  })

  it('formats hours correctly', () => {
    const twoHoursAgo = Math.floor(Date.now() / 1000) - 2 * 60 * 60
    expect(formatRelativeTime({ _seconds: twoHoursAgo, _nanoseconds: 0 })).toBe('2h ago')
  })

  it('formats days correctly', () => {
    const threeDaysAgo = Math.floor(Date.now() / 1000) - 3 * 24 * 60 * 60
    expect(formatRelativeTime({ _seconds: threeDaysAgo, _nanoseconds: 0 })).toBe('3d ago')
  })
})

describe('formatChatTimestamp', () => {
  it('returns empty string for null', () => {
    expect(formatChatTimestamp(null)).toBe('')
  })

  it('returns empty string for undefined', () => {
    expect(formatChatTimestamp(undefined)).toBe('')
  })

  it('formats today as time', () => {
    const now = Math.floor(Date.now() / 1000)
    const result = formatChatTimestamp({ _seconds: now, _nanoseconds: 0 })
    // Should be in HH:mm format
    expect(result).toMatch(/^\d{2}:\d{2}$/)
  })

  it('formats yesterday as "Yesterday"', () => {
    // Create a timestamp for yesterday at noon
    const yesterdayDate = new Date()
    yesterdayDate.setDate(yesterdayDate.getDate() - 1)
    yesterdayDate.setHours(12, 0, 0, 0)
    expect(
      formatChatTimestamp({ _seconds: Math.floor(yesterdayDate.getTime() / 1000), _nanoseconds: 0 })
    ).toBe('Yesterday')
  })

  it('handles both timestamp formats', () => {
    const now = Math.floor(Date.now() / 1000)
    const result1 = formatChatTimestamp({ _seconds: now, _nanoseconds: 0 })
    const result2 = formatChatTimestamp({ seconds: now, nanoseconds: 0 })
    expect(result1).toBe(result2)
  })
})

describe('getInitials', () => {
  it('gets initials from single name', () => {
    expect(getInitials('John')).toBe('J')
  })

  it('gets initials from two names', () => {
    expect(getInitials('John Doe')).toBe('JD')
  })

  it('limits to two characters', () => {
    expect(getInitials('John Michael Doe')).toBe('JM')
  })

  it('handles empty string', () => {
    expect(getInitials('')).toBe('')
  })

  it('converts to uppercase', () => {
    expect(getInitials('john doe')).toBe('JD')
  })
})

describe('isValidPhoneNumber', () => {
  it('validates correct international format', () => {
    expect(isValidPhoneNumber('+14155552671')).toBe(true)
  })

  it('validates Indian phone number', () => {
    expect(isValidPhoneNumber('+919876543210')).toBe(true)
  })

  it('handles spaces in phone number', () => {
    expect(isValidPhoneNumber('+1 415 555 2671')).toBe(true)
  })

  it('rejects phone without +', () => {
    expect(isValidPhoneNumber('14155552671')).toBe(false)
  })

  it('rejects too short phone number', () => {
    expect(isValidPhoneNumber('+123456789')).toBe(false)
  })

  it('rejects too long phone number', () => {
    expect(isValidPhoneNumber('+12345678901234567')).toBe(false)
  })
})

describe('truncate', () => {
  it('returns original text if shorter than max', () => {
    expect(truncate('hello', 10)).toBe('hello')
  })

  it('returns original text if equal to max', () => {
    expect(truncate('hello', 5)).toBe('hello')
  })

  it('truncates with ellipsis', () => {
    expect(truncate('hello world', 8)).toBe('hello...')
  })

  it('handles empty string', () => {
    expect(truncate('', 10)).toBe('')
  })
})
