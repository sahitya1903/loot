import { describe, it, expect } from 'vitest'
import { cn, getInitials, isValidPhoneNumber, truncate } from './utils'

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
