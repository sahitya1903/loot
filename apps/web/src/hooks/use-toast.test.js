import { describe, it, expect, beforeEach, vi } from 'vitest'
import { reducer } from './use-toast'

function makeToast(id, extra = {}) {
  return { id, title: `Toast ${id}`, open: true, ...extra }
}

function emptyState() {
  return { toasts: [] }
}

describe('toast reducer', () => {
  beforeEach(() => {
    vi.clearAllTimers()
  })

  describe('ADD_TOAST', () => {
    it('adds a toast to an empty state', () => {
      const next = reducer(emptyState(), { type: 'ADD_TOAST', toast: makeToast('1') })
      expect(next.toasts).toHaveLength(1)
      expect(next.toasts[0].id).toBe('1')
    })

    it('prepends newer toasts to the front', () => {
      let state = emptyState()
      state = reducer(state, { type: 'ADD_TOAST', toast: makeToast('1') })
      state = reducer(state, { type: 'ADD_TOAST', toast: makeToast('2') })
      expect(state.toasts[0].id).toBe('2')
      expect(state.toasts[1].id).toBe('1')
    })

    it('enforces a maximum of 5 toasts', () => {
      let state = emptyState()
      for (let i = 1; i <= 7; i++) {
        state = reducer(state, { type: 'ADD_TOAST', toast: makeToast(String(i)) })
      }
      expect(state.toasts).toHaveLength(5)
    })

    it('drops the oldest toast when limit is exceeded', () => {
      let state = emptyState()
      for (let i = 1; i <= 6; i++) {
        state = reducer(state, { type: 'ADD_TOAST', toast: makeToast(String(i)) })
      }
      // toast '1' was added first and should be dropped
      expect(state.toasts.some((t) => t.id === '1')).toBe(false)
    })
  })

  describe('UPDATE_TOAST', () => {
    it('updates the title of a matching toast', () => {
      const state = { toasts: [makeToast('1')] }
      const next = reducer(state, { type: 'UPDATE_TOAST', toast: { id: '1', title: 'Updated' } })
      expect(next.toasts[0].title).toBe('Updated')
    })

    it('does not modify non-matching toasts', () => {
      const state = { toasts: [makeToast('1'), makeToast('2')] }
      const next = reducer(state, { type: 'UPDATE_TOAST', toast: { id: '1', title: 'Updated' } })
      expect(next.toasts[1].title).toBe('Toast 2')
    })

    it('ignores update for unknown id', () => {
      const state = { toasts: [makeToast('1')] }
      const next = reducer(state, { type: 'UPDATE_TOAST', toast: { id: '999', title: 'Ghost' } })
      expect(next.toasts[0].title).toBe('Toast 1')
    })

    it('merges partial updates without losing existing fields', () => {
      const state = { toasts: [makeToast('1', { description: 'original desc' })] }
      const next = reducer(state, { type: 'UPDATE_TOAST', toast: { id: '1', title: 'New Title' } })
      expect(next.toasts[0].description).toBe('original desc')
      expect(next.toasts[0].title).toBe('New Title')
    })
  })

  describe('DISMISS_TOAST', () => {
    it('marks a specific toast as closed', () => {
      const state = { toasts: [makeToast('1'), makeToast('2')] }
      const next = reducer(state, { type: 'DISMISS_TOAST', toastId: '1' })
      expect(next.toasts.find((t) => t.id === '1')?.open).toBe(false)
    })

    it('leaves other toasts open when dismissing one', () => {
      const state = { toasts: [makeToast('1'), makeToast('2')] }
      const next = reducer(state, { type: 'DISMISS_TOAST', toastId: '1' })
      expect(next.toasts.find((t) => t.id === '2')?.open).toBe(true)
    })

    it('marks all toasts as closed when no id is given', () => {
      const state = { toasts: [makeToast('1'), makeToast('2'), makeToast('3')] }
      const next = reducer(state, { type: 'DISMISS_TOAST' })
      expect(next.toasts.every((t) => t.open === false)).toBe(true)
    })
  })

  describe('REMOVE_TOAST', () => {
    it('removes a specific toast by id', () => {
      const state = { toasts: [makeToast('1'), makeToast('2')] }
      const next = reducer(state, { type: 'REMOVE_TOAST', toastId: '1' })
      expect(next.toasts).toHaveLength(1)
      expect(next.toasts[0].id).toBe('2')
    })

    it('clears all toasts when no id is given', () => {
      const state = { toasts: [makeToast('1'), makeToast('2')] }
      const next = reducer(state, { type: 'REMOVE_TOAST' })
      expect(next.toasts).toHaveLength(0)
    })

    it('is a no-op for unknown id', () => {
      const state = { toasts: [makeToast('1')] }
      const next = reducer(state, { type: 'REMOVE_TOAST', toastId: '999' })
      expect(next.toasts).toHaveLength(1)
    })
  })
})
